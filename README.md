# Belajar Otomasi Chromium: Login Google

Script sederhana (satu file: `google-login.js`) pakai [Playwright](https://playwright.dev/) buat belajar cara mengontrol Chromium: buka halaman, isi form, dan klik tombol — dicontohkan lewat alur login Google.

## Cara pakai

1. Install dependency:
   ```
   npm install
   ```
2. Buat file `file.txt` di folder yang sama, isinya satu baris:
   ```
   email@akun-test.com:passwordnya
   ```
3. Jalankan:
   ```
   node google-login.js
   ```
4. Hasilnya berupa screenshot `hasil-login.png` setelah proses login selesai.

## Penting

- **Jangan pakai akun utama/pribadi.** Gunakan akun Google khusus untuk latihan/testing.
- Google mendeteksi browser yang dikontrol otomatis dan bisa memblokir login dengan pesan "This browser or app may not be secure", minta verifikasi 2 langkah, atau captcha. Ini perilaku normal dari sisi Google, bukan bug di script.
- Jangan commit file `file.txt` (sudah masuk `.gitignore`) — jangan pernah menaruh password asli di kode atau di-push ke repo.
- Set `HEADLESS=false` (env var) kalau environment kamu punya display dan mau lihat browsernya jalan secara visual.
