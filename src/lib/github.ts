import { Octokit } from "@octokit/rest";
import { DEFAULT_GITHUB_USERNAME, env } from "@/lib/env";
import type { RawDocument } from "@/lib/chunking";

const MAX_REPOS = 12;
const TEXT_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".json",
  ".yml",
  ".yaml",
  ".sql"
]);

export async function collectGithubDocuments(username = env("GITHUB_USERNAME", DEFAULT_GITHUB_USERNAME)) {
  const octokit = new Octokit({
    auth: env("GITHUB_TOKEN") || undefined
  });

  const repos = await octokit.paginate(octokit.repos.listForUser, {
    username,
    sort: "updated",
    per_page: 50
  });

  const docs: RawDocument[] = [];
  for (const repo of repos
    .filter((item) => !item.fork)
    .sort((a, b) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? ""))
    .slice(0, MAX_REPOS)) {
    const repoName = repo.full_name;
    docs.push({
      sourceType: "github",
      sourceLabel: repoName,
      sourceUrl: repo.html_url,
      repo: repoName,
      path: "repo-metadata",
      content: [
        `Repository: ${repo.full_name}`,
        `Description: ${repo.description ?? "No description"}`,
        `Language: ${repo.language ?? "Unknown"}`,
        `Stars: ${repo.stargazers_count}`,
        `Updated: ${repo.updated_at}`,
        `URL: ${repo.html_url}`
      ].join("\n")
    });

    if (!repo.default_branch) continue;
    await addReadme(octokit, repo.owner.login, repo.name, repo.default_branch, docs);
    await addRecentCommits(octokit, repo.owner.login, repo.name, docs);
    await addSelectedFiles(octokit, repo.owner.login, repo.name, repo.default_branch, docs);
  }

  return docs;
}

async function addReadme(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  docs: RawDocument[]
) {
  try {
    const readme = await octokit.repos.getReadme({ owner, repo, ref });
    const content = Buffer.from(readme.data.content, "base64").toString("utf8");
    docs.push({
      sourceType: "github",
      sourceLabel: `${owner}/${repo} README`,
      sourceUrl: readme.data.html_url,
      repo: `${owner}/${repo}`,
      path: readme.data.path,
      content
    });
  } catch {
    // README is optional.
  }
}

async function addRecentCommits(octokit: Octokit, owner: string, repo: string, docs: RawDocument[]) {
  try {
    const commits = await octokit.repos.listCommits({ owner, repo, per_page: 10 });
    docs.push({
      sourceType: "github",
      sourceLabel: `${owner}/${repo} commits`,
      sourceUrl: `https://github.com/${owner}/${repo}/commits`,
      repo: `${owner}/${repo}`,
      path: "recent-commits",
      content: commits.data
        .map((commit) => `${commit.sha.slice(0, 7)} ${commit.commit.author?.date}: ${commit.commit.message}`)
        .join("\n")
    });
  } catch {
    // Commit history is best-effort.
  }
}

async function addSelectedFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  docs: RawDocument[]
) {
  try {
    const tree = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: ref,
      recursive: "true"
    });
    const files = tree.data.tree
      .filter((item) => item.type === "blob" && item.path && shouldInclude(item.path, Number(item.size ?? 0)))
      .slice(0, 20);

    for (const file of files) {
      if (!file.path) continue;
      try {
        const blob = await octokit.git.getBlob({
          owner,
          repo,
          file_sha: String(file.sha)
        });
        const content = Buffer.from(blob.data.content, "base64").toString("utf8");
        docs.push({
          sourceType: "github",
          sourceLabel: `${owner}/${repo}/${file.path}`,
          sourceUrl: `https://github.com/${owner}/${repo}/blob/${ref}/${file.path}`,
          repo: `${owner}/${repo}`,
          path: file.path,
          commitSha: String(file.sha),
          content
        });
      } catch {
        // Individual source files are best-effort.
      }
    }
  } catch {
    // Trees may be unavailable for empty/private repos.
  }
}

function shouldInclude(path: string, size: number) {
  if (size > 120_000) return false;
  if (path.includes("node_modules/") || path.includes(".next/") || path.includes("dist/")) return false;
  const lower = path.toLowerCase();
  return [...TEXT_EXTENSIONS].some((ext) => lower.endsWith(ext));
}
