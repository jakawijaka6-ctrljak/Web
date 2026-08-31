// Belajar otomasi Chromium: login Google (Playwright)
// Install dulu: npm i playwright
// Siapkan file.txt di folder yang sama, isinya satu baris: email:password
// Jalankan: node google-login.js

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const credsFile = path.join(__dirname, "file.txt");
if (!fs.existsSync(credsFile)) {
  console.error("File file.txt tidak ditemukan. Isi dengan format email:password");
  process.exit(1);
}

const line = fs.readFileSync(credsFile, "utf8").trim().split("\n")[0];
const sep = line.indexOf(":");
if (sep === -1) {
  console.error("Format file.txt salah. Harus email:password");
  process.exit(1);
}

const EMAIL = line.slice(0, sep).trim();
const PASSWORD = line.slice(sep + 1).trim();
const HEADLESS = process.env.HEADLESS !== "false";

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  await page.goto("https://accounts.google.com/signin/v2/identifier");
  await page.waitForLoadState("domcontentloaded");
  console.log("URL setelah load:", page.url());
  console.log("Judul halaman:", await page.title());
  await page.screenshot({ path: "debug-sebelum-isi-email.png" });

  await page.waitForSelector("#identifierId", { state: "visible" });
  await page.fill("#identifierId", EMAIL);
  await page.click("#identifierNext");

  await page.waitForLoadState("domcontentloaded");
  console.log("URL setelah klik Next:", page.url());
  console.log("Judul halaman:", await page.title());
  await page.screenshot({ path: "debug-setelah-klik-next.png" });

  const passwordInput = page.locator('input[type="password"], input[name="Passwd"]').first();
  await passwordInput.waitFor({ state: "visible" });
  await passwordInput.fill(PASSWORD);
  await page.click("#passwordNext");

  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "hasil-login.png" });
  console.log("Selesai. Screenshot disimpan sebagai hasil-login.png");

  await browser.close();
}

main().catch(async (err) => {
  console.error("Gagal login:", err.message);
  process.exit(1);
});
