#!/usr/bin/env node
/**
 * Apply provider_usage_daily migration (005).
 * Uses DATABASE_URL or Supabase Management API (SUPABASE_ACCESS_TOKEN).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (key) env[key] = value;
  }
  return env;
}

const env = { ...loadEnvFile(path.join(root, ".env.local")) };
for (const [key, value] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = value;
}

const sql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "005_provider_usage.sql"),
  "utf8",
);

function projectRefFromUrl(url) {
  try {
    const match = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

async function applyViaPg(connectionString) {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Applied 005_provider_usage.sql via DATABASE_URL");
}

async function applyViaManagementApi(token, projectRef) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Management API ${response.status}: ${body.slice(0, 400)}`);
  }
  console.log("Applied 005_provider_usage.sql via Supabase Management API");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    await applyViaPg(databaseUrl);
    return;
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  if (token && projectRef) {
    await applyViaManagementApi(token, projectRef);
    return;
  }

  console.error("Could not apply migration automatically.");
  console.error("Option A: set DATABASE_URL in .env.local and re-run");
  console.error("Option B: set SUPABASE_ACCESS_TOKEN + NEXT_PUBLIC_SUPABASE_URL and re-run");
  console.error("Option C: paste supabase/migrations/005_provider_usage.sql into Supabase SQL Editor");
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
