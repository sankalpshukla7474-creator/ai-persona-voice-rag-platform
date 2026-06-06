import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import type { RawDocument } from "../src/lib/chunking";

dotenv.config({ path: ".env.local" });
dotenv.config();

const username = process.env.GITHUB_USERNAME || "sankalpshukla7474-creator";
const portfolioUrl =
  process.env.PORTFOLIO_URL || "https://sankalpshukla7474-creator.github.io/Sankalp_Portfolio/";
const outputPath = path.resolve("data", "public-sources.json");

const sources: Array<RawDocument & { fetchedAt: string }> = [];
const fetchedAt = new Date().toISOString();

const portfolioHtml = await fetchText(portfolioUrl);
const portfolioText = htmlToText(portfolioHtml);
sources.push({
  sourceType: "portfolio",
  sourceLabel: "Sankalp Portfolio",
  sourceUrl: portfolioUrl,
  path: "portfolio-home",
  content: portfolioText,
  fetchedAt
});

const repoNames = await discoverRepos(username);
for (const repo of repoNames) {
  const repoUrl = `https://github.com/${username}/${repo}`;
  const readme = await fetchReadme(username, repo);
  sources.push({
    sourceType: "github",
    sourceLabel: `${username}/${repo}`,
    sourceUrl: repoUrl,
    repo: `${username}/${repo}`,
    path: readme.path,
    content: [
      `Repository: ${username}/${repo}`,
      `URL: ${repoUrl}`,
      readme.content ? `README:\n${readme.content}` : "README was not available from public raw URLs."
    ].join("\n"),
    fetchedAt
  });
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(sources, null, 2), "utf8");
console.log(JSON.stringify({ outputPath, sources: sources.length, repos: repoNames }, null, 2));

async function discoverRepos(owner: string) {
  const html = await fetchText(`https://github.com/${owner}?tab=repositories`);
  const matches = [...html.matchAll(new RegExp(`href="/${owner}/([^"/]+)"`, "g"))].map((match) => match[1]);
  const blocked = new Set([owner]);
  return [...new Set(matches)]
    .filter((name) => !blocked.has(name) && !name.endsWith("/forks"))
    .slice(0, 24);
}

async function fetchReadme(owner: string, repo: string) {
  const branches = ["main", "master"];
  const names = ["README.md", "readme.md", "README.txt"];
  for (const branch of branches) {
    for (const name of names) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${name}`;
      const content = await fetchText(url).catch(() => "");
      if (content.trim()) return { path: name, content: content.trim().slice(0, 8000) };
    }
  }
  return { path: "repo-metadata", content: "" };
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "scaler-ai-persona"
    }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}
