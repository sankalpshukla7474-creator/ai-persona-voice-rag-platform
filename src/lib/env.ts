export const DEFAULT_RESUME_PATH = "C:\\Users\\sanka\\Desktop\\Sankalp_Resume.pdf";
export const DEFAULT_GITHUB_USERNAME = "sankalpshukla7474-creator";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function adminToken() {
  return env("ADMIN_TOKEN", "dev-admin-token-change-me");
}

export function appBaseUrl() {
  return env("APP_BASE_URL", "http://localhost:3000");
}
