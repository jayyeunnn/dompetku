# DompetKu - Personal Finance Tracker

DompetKu adalah aplikasi pencatatan keuangan pribadi modern berbasis web yang didesain untuk membantu Anda melacak pemasukan, pengeluaran, dan tabungan target dengan mudah. Aplikasi ini dibuat dengan antarmuka yang responsif, minimalis, dan mengusung gaya desain Material Design 3 (MD3).

## 🚀 Fitur Utama

- **Dashboard Keuangan:** Ringkasan total saldo, pemasukan, dan pengeluaran bulan ini.
- **Manajemen Multi-Dompet (Wallets):** Pisahkan uang Anda ke berbagai dompet seperti Cash, Rekening BCA, e-Wallet, dll.
- **Pencatatan Transaksi:** Catat pemasukan, pengeluaran, dan transfer antar dompet dengan mudah.
- **Tabungan Target (Sinking Funds):** Buat target tabungan (misal: Beli PC, Liburan) dan alokasikan dana langsung dari saldo bebas Anda.
- **Autentikasi Aman:** Sistem pendaftaran dan login yang terintegrasi (mendukung fitur OTP / konfirmasi email).
- **Akses Cepat (Progressive Web App):** Bisa diinstal di layar utama HP Anda sebagai aplikasi PWA.

## 💻 Teknologi yang Digunakan

- **Frontend:** React.js (menggunakan Vite)
- **Styling:** Tailwind CSS (dengan custom utility bergaya Material Design 3)
- **Backend & Database:** Supabase (PostgreSQL, Authentication)
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
