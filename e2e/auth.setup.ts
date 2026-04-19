/**
 * Auth setup — runs once before the test suite.
 *
 * Fast path: calls seed-state.mjs directly from Node.js (no browser, no JIT
 * compilation of Next.js Server Actions).  Queries SPARQL directly and writes
 * the Zustand localStorage state to e2e/.auth/state.json.
 *
 * Total time: only as long as the SPARQL queries (~0.5s vs ~30s through Next.js).
 * Subsequent runs reuse the saved file instantly if data hasn't changed.
 */
import { test as setup } from "@playwright/test";
import { readFile, access } from "fs/promises";
import { execFileSync } from "child_process";
import { join } from "path";

const STATE_FILE = "e2e/.auth/state.json";

function stateIsValid(state: Record<string, unknown>): boolean {
  try {
    const origins = state.origins as Array<{ localStorage: Array<{ name: string; value: string }> }>;
    const ls = origins?.[0]?.localStorage ?? [];
    const entry = ls.find((e) => e.name === "moire-endpoints");
    if (!entry) return false;
    const zustand = JSON.parse(entry.value);
    const cache = zustand?.state?.introspectionCache ?? {};
    return Object.values(cache).some(
      (graphs) =>
        Array.isArray(graphs) &&
        graphs.length > 0 &&
        (graphs as Array<{ tripleCount: number }>)[0].tripleCount > 0,
    );
  } catch {
    return false;
  }
}

setup("seed SPARQL state", async () => {
  setup.setTimeout(60_000);

  // Reuse valid existing state — no network requests at all
  try {
    await access(STATE_FILE);
    const raw = await readFile(STATE_FILE, "utf-8");
    if (stateIsValid(JSON.parse(raw))) {
      console.log("  ✓ reusing existing state.json");
      return;
    }
    console.log("  ℹ state.json has no real data — regenerating");
  } catch {
    // file doesn't exist yet
  }

  // Query SPARQL directly from Node.js — bypasses Next.js JIT compilation
  const seedScript = join(process.cwd(), "e2e", "seed-state.mjs");
  execFileSync(process.execPath, [seedScript], {
    stdio: "inherit",
    timeout: 50_000,
    env: { ...process.env },
  });
});
