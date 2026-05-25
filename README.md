# DompetKu - Personal Finance Tracker

DompetKu adalah aplikasi pencatatan keuangan pribadi modern berbasis web yang didesain untuk membantu Anda melacak pemasukan, pengeluaran, dan tabungan target dengan mudah. Aplikasi ini dibuat dengan antarmuka yang responsif, minimalis, dan mengusung gaya desain Material Design 3 (MD3).

## 🚀 Fitur Utama

- **Dashboard Analitik & Laporan Interaktif:** Analisis rasio pengeluaran bulanan, grafik distribusi pengeluaran per kategori (Donut Chart interaktif), dan grafik tren pengeluaran mingguan (Bar Chart) lengkap dengan tooltip interaktif.
- **Smart Budgeting (Anggaran Kategori):** Tetapkan batas anggaran bulanan per kategori pengeluaran dengan visualisasi progress bar berwarna dinamis (Biru <80%, Kuning 80-99%, Merah >=100%) dan peringatan sisa/lebih dana.
- **Manajemen Multi-Dompet Bervariasi:** Buat dompet baru dengan pilihan ikon yang bervariasi (Dompet, Cash, Kartu, E-Wallet, Tabungan, Koin, Brankas, Bisnis, Investasi, Kripto, Emas, Hadiah) serta warna kustom.
- **Pencatatan Transaksi:** Catat pemasukan, pengeluaran, dan transfer antar dompet dengan mudah.
- **Pencatatan Otomatis dengan Suara (Voice Input):** Catat transaksi super cepat dengan mengucapkan kalimat alami bahasa Indonesia (misal: *"beli kopi dua puluh ribu pakai gopay"*), sistem akan otomatis mendeteksi nominal, kategori, dompet, dan membuat catatannya.
- **Manajemen Transaksi Tingkat Lanjut:** Edit dan hapus transaksi dengan perhitungan saldo (net-delta) yang sangat akurat.
- **Unggah Bukti Struk/Foto:** Lampirkan foto bukti transaksi lengkap dengan kompresi sisi klien (HTML5 Canvas) dan **Watermark** (ala Strava).
- **Galeri Transaksi:** Lihat daftar transaksi Anda dalam mode list konvensional atau mode **Grid Galeri** yang menarik.
- **Tabungan Target (Sinking Funds):** Buat target tabungan (misal: Beli PC, Liburan) dan alokasikan dana langsung dari saldo bebas Anda.
- **Pelacak Tagihan Berulang (Recurring Bills):** Kelola tagihan bulanan (listrik, internet, dll) dengan sistem reset otomatis setiap bulan dan sekali klik untuk memotong saldo dompet.
- **Autentikasi Aman:** Sistem pendaftaran dan login yang terintegrasi (mendukung fitur OTP / konfirmasi email).
- **Akses Cepat (Progressive Web App):** Bisa diinstal di layar utama HP Anda sebagai aplikasi PWA.
- **Dark Mode:** Dukungan tema gelap (Dark Mode) untuk kenyamanan mata.

## 💻 Teknologi yang Digunakan

- **Frontend:** React.js (menggunakan Vite)
- **Styling:** Tailwind CSS (dengan custom utility bergaya Material Design 3)
- **Backend & Database:** Supabase (PostgreSQL, Authentication, **Storage**)
- **Ikon:** Google Material Symbols & Lucide React
- **Deployment:** Vercel

## ⚙️ Cara Menjalankan Secara Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi DompetKu di komputer Anda:

### 1. Kloning Repositori
```bash
git clone https://github.com/username/dompetku.git
cd dompetku
```

### 2. Install Dependensi
Pastikan Anda sudah menginstal Node.js, lalu jalankan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di direktori utama proyek, lalu masukkan URL dan Anon Key dari Supabase Anda:
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```
*(Catatan: Anda perlu membuat proyek di [Supabase](https://supabase.com/) dan menyiapkan tabel database yang dibutuhkan).*

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser Anda dan kunjungi `http://localhost:5173/` untuk melihat aplikasi.

---
**Dibuat oleh Gian Akhiru Ramadhan © 2026**
