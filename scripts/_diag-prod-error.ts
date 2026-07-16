import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`);
  });

  console.log("=== GET /login (non authentifié) ===");
  await page.goto("https://prospectscan.cyou/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  console.log("Titre page:", await page.title());
  console.log("Erreurs jusqu'ici:", JSON.stringify(errors, null, 2));

  await page.fill('input[type="email"]', "test-e2e-prod@prospectscanner.local");
  await page.fill('input[type="password"]', "TestE2EProd123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log("\n=== Après login, URL:", page.url());
  console.log("Erreurs après login:", JSON.stringify(errors, null, 2));
  await page.screenshot({ path: "C:/Users/Mat/AppData/Local/Temp/claude/C--Users-Mat/e953d8fa-c49b-4b10-8f92-485992611954/scratchpad/screenshots/prod-01-after-login.png", fullPage: true });

  console.log("\n=== Navigation /prospects ===");
  await page.goto("https://prospectscan.cyou/prospects", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  console.log("Erreurs après /prospects:", JSON.stringify(errors, null, 2));
  await page.screenshot({ path: "C:/Users/Mat/AppData/Local/Temp/claude/C--Users-Mat/e953d8fa-c49b-4b10-8f92-485992611954/scratchpad/screenshots/prod-02-prospects.png", fullPage: true });

  await browser.close();
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e);
  process.exit(1);
});
