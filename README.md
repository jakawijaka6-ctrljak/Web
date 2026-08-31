# Belajar Otomasi Chromium: Login Google

Script sederhana pakai [Playwright](https://playwright.dev/) buat belajar cara mengontrol Chromium: buka halaman, isi form, dan klik tombol — dicontohkan lewat alur login Google.

## Cara pakai

1. Install dependency:
   ```
   npm install
   ```
2. Salin `.env.example` jadi `.env`, lalu isi email & password akun **test**:
   ```
   cp .env.example .env
   ```
3. Jalankan:
   ```
   npm run login
   ```
4. Hasilnya berupa screenshot `hasil-login.png` setelah proses login selesai.

## Penting

- **Jangan pakai akun utama/pribadi.** Gunakan akun Google khusus untuk latihan/testing.
- Google mendeteksi browser yang dikontrol otomatis dan bisa memblokir login dengan pesan "This browser or app may not be secure", minta verifikasi 2 langkah, atau captcha. Ini perilaku normal dari sisi Google, bukan bug di script.
- Jangan commit file `.env` (sudah masuk `.gitignore`) — jangan pernah menaruh password asli di kode.
- Set `HEADLESS=false` di `.env` kalau environment kamu punya display dan mau lihat browsernya jalan secara visual.
