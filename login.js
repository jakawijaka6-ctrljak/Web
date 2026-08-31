const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2] ?? "";
    }
  }
}

loadEnvFile(path.join(__dirname, ".env"));

const EMAIL = process.env.GOOGLE_EMAIL;
const PASSWORD = process.env.GOOGLE_PASSWORD;
const HEADLESS = process.env.HEADLESS !== "false";

if (!EMAIL || !PASSWORD) {
  console.error("Isi GOOGLE_EMAIL dan GOOGLE_PASSWORD di file .env (contoh: .env.example).");
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  await page.goto("https://accounts.google.com/signin/v2/identifier");

  await page.fill('input[type="email"]', EMAIL);
  await page.click("#identifierNext");

  await page.waitForSelector('input[type="password"]', { state: "visible" });
  await page.fill('input[type="password"]', PASSWORD);
  await page.click("#passwordNext");

  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "hasil-login.png" });
  console.log("Selesai. Screenshot disimpan sebagai hasil-login.png");

  await browser.close();
}

main().catch((err) => {
  console.error("Gagal login:", err.message);
  process.exit(1);
});
