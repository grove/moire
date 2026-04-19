/**
 * Moire E2E smoke test — clicks through the full UI flow against localhost:7878/sparql
 * Run with: node scripts/e2e-smoke.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const APP_URL = "http://localhost:3000";
const SPARQL_URL = "http://localhost:7878/sparql";
const SCREENSHOTS_DIR = "/tmp/moire-screenshots";

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: true });
}

(async () => {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    // ── 1. Homepage loads ──────────────────────────────────────────────────────
    console.log("\n[1] Homepage");
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await screenshot(page, "01-homepage");

    await check("page title contains moire", async () => {
      const title = await page.title();
      if (!title.toLowerCase().includes("moire")) throw new Error(`Got: "${title}"`);
    });

    await check("Add Endpoint button visible", async () => {
      await page.waitForSelector('button:has-text("Add Endpoint"), button:has-text("Add your first endpoint")', { timeout: 5000 });
    });

    // ── 2. Connect to endpoint ─────────────────────────────────────────────────
    console.log("\n[2] Connecting to SPARQL endpoint");

    // Open the form — try "Add your first endpoint" first, then header button
    const firstEndpointBtn = page.locator('button:has-text("Add your first endpoint")').first();
    if (await firstEndpointBtn.isVisible().catch(() => false)) {
      await firstEndpointBtn.click();
    } else {
      await page.locator('button:has-text("Add Endpoint")').first().click();
    }
    await page.waitForTimeout(500);
    await screenshot(page, "02-form-open");

    const urlInput = await page.$('#ep-url, input[placeholder*="sparql"], input[placeholder*="example.org"]');
    await check("found SPARQL URL input (#ep-url)", async () => {
      if (!urlInput) throw new Error("URL input #ep-url not found");
    });

    if (urlInput) {
      // Fill label
      const labelInput = await page.$('#ep-label');
      if (labelInput) await labelInput.fill("test");

      await urlInput.fill(SPARQL_URL);
      await screenshot(page, "03-url-entered");

      const connectBtn = await page.$('button:has-text("Connect")');
      await check("Connect button visible", async () => {
        if (!connectBtn) throw new Error("Connect button not found");
      });

      if (connectBtn) {
        await connectBtn.click();
        // Wait for introspection to complete — the endpoint card should appear
        await page.waitForSelector('text=bsbm, text=academic, text=Graphs in', {
          timeout: 30000,
        }).catch(() => {});
        await page.waitForTimeout(2000);
        await screenshot(page, "04-after-connect");

        await check("no Server Components error shown", async () => {
          const body = await page.textContent("body");
          if (body.includes("An error occurred in the Server Components")) {
            throw new Error("Server Components render error detected");
          }
        });

        await check("graphs listed after connect", async () => {
          const body = await page.textContent("body");
          if (!body.includes("bsbm") && !body.includes("academic") && !body.includes("Graphs")) {
            throw new Error(`Graphs not found. Body snippet: "${body.slice(0, 300)}"`);
          }
        });
      }
    }

    // ── 3. Navigate into a graph ───────────────────────────────────────────────
    console.log("\n[3] Navigating into bsbm graph");

    const bsbmLink = page.locator('text=bsbm').first();
    const bsbmVisible = await bsbmLink.isVisible().catch(() => false);
    await check("bsbm graph link visible", async () => {
      if (!bsbmVisible) throw new Error("bsbm link not visible");
    });

    if (bsbmVisible) {
      await bsbmLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, "05-bsbm-graph");

      await check("Types/Classes page shown", async () => {
        const body = await page.textContent("body");
        if (!body.includes("Types") && !body.includes("Class") && !body.includes("Review") && !body.includes("Product")) {
          throw new Error(`No class content found. Body: "${body.slice(0, 300)}"`);
        }
      });

      await check("at least one class visible (Review, Product, etc.)", async () => {
        const body = await page.textContent("body");
        const knownClasses = ["Review", "Product", "Person", "Vendor", "ScholarlyArticle"];
        const found = knownClasses.filter((c) => body.includes(c));
        if (found.length === 0) throw new Error(`No known classes found. Body: "${body.slice(0, 400)}"`);
        console.log(`      found: ${found.join(", ")}`);
      });
    }

    // ── 4. Click a class ──────────────────────────────────────────────────────
    console.log("\n[4] Clicking into a class");

    const classLink = page.locator('text=Review, text=Product').first();
    const classVisible = await classLink.isVisible().catch(() => false);

    if (classVisible) {
      await classLink.click();
      await page.waitForTimeout(3000);
      await screenshot(page, "06-class-entities");

      await check("entity set renders after class click", async () => {
        const body = await page.textContent("body");
        if (body.includes("An error occurred")) throw new Error("Error shown after class click");
      });
    } else {
      console.log("  - skipped (class link not found)");
    }

    // ── 5. Check Relationships link ────────────────────────────────────────────
    console.log("\n[5] Browse Relationships");

    const relLink = page.locator('text=Relationships, text=Browse Relationships').first();
    const relVisible = await relLink.isVisible().catch(() => false);

    if (relVisible) {
      await relLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, "07-relationships");

      await check("relationships page loads", async () => {
        const body = await page.textContent("body");
        if (body.includes("An error occurred")) throw new Error("Error on relationships page");
      });
    } else {
      console.log("  - skipped (relationships link not found)");
    }

    // ── 6. Console errors check ────────────────────────────────────────────────
    console.log("\n[6] Console errors");
    await check("no browser console errors", async () => {
      const relevant = consoleErrors.filter(
        (e) => !e.includes("favicon") && !e.includes("hot-update") && !e.includes("webpack")
      );
      if (relevant.length > 0) {
        throw new Error(`${relevant.length} console error(s):\n    ${relevant.slice(0, 3).join("\n    ")}`);
      }
    });

  } finally {
    await browser.close();
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}/`);
  console.log(`${"─".repeat(50)}`);

  if (failed > 0) process.exit(1);
})();
