# WA Blast

Platform kirim pesan WhatsApp: user daftar/login, tautkan device WhatsApp, lalu kirim pesan ke nomor dari database yang dikelola admin. Setiap pesan terkirim dikenakan biaya Rp1.200 dari saldo user. Admin mengelola stok nomor (restock), template pesan, dan saldo user lewat dashboard admin.

> Catatan kepatuhan: pastikan nomor tujuan sudah memberi persetujuan (opt-in) sebelum dikirimi pesan otomatis. Mengirim pesan massal tanpa consent melanggar Ketentuan Layanan WhatsApp dan berisiko nomor pengirim diblokir.

## Struktur

- `server/` — Express + TypeScript + Prisma (SQLite) + JWT auth + Baileys (koneksi WhatsApp multi-device)
- `client/` — React + Vite + TypeScript + Tailwind CSS v4

## Menjalankan secara lokal

### Backend

```bash
cd server
cp .env.example .env   # sesuaikan JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run prisma:migrate   # membuat database + menjalankan seed admin
npm run dev               # jalan di http://localhost:4000
```

Akun admin default dibuat dari `ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env` (default: `admin@example.com` / `admin123`).

### Frontend

```bash
cd client
npm install
npm run dev   # jalan di http://localhost:5173, proxy /api ke backend
```

## Alur pemakaian

1. **Admin** login → tab *Database Nomor*: tempel daftar nomor WhatsApp (satu per baris) untuk di-restock, dan tab *Template Pesan* untuk membuat isi pesan.
2. **Admin** → tab *Pengguna*: top up saldo user (nominal Rupiah) secara manual sesuai pembayaran di luar sistem.
3. **User** daftar/login → di dashboard klik *Hubungkan Perangkat*, scan QR yang muncul via WhatsApp di HP (Perangkat Tertaut).
4. Setelah status **Terhubung**, user pilih template dan jumlah pesan, lalu klik *Kirim Blast*. Sistem mengambil nomor dari stok admin, mengirim via WhatsApp, dan memotong saldo Rp1.200 per pesan sukses.
5. Riwayat pengiriman tampil di tabel bawah dashboard user.

## Catatan teknis

- Sesi WhatsApp per user disimpan di `server/wa-sessions/<userId>` (auth state Baileys, tidak di-commit).
- Database SQLite (`server/dev.db`) untuk kemudahan setup lokal; ganti `DATABASE_URL` di `.env` untuk pakai Postgres/MySQL di produksi (perlu ubah provider di `prisma/schema.prisma`).
- Alokasi nomor saat blast menggunakan transaksi Prisma per nomor untuk mengurangi race condition, cukup untuk skala kecil-menengah.
