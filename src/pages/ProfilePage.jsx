import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { uploadTransactionPhoto } from '../lib/imageUtils'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  User,
  Mail,
  Key,
  Info,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Camera,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const fileInputRef = useRef(null)

  // Sub-view state: 'main' | 'edit' | 'about'
  const [view, setView] = useState('main')

  // User details state
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  
  // Loading & Message states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load user data from AuthContext
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || 'Pengguna')
      setAvatarUrl(user.user_metadata?.avatar_url || '')
      setEmail(user.email || '')
    }
  }, [user])

  // Set form values when switching to edit view
  const handleEnterEdit = () => {
    setEditName(displayName)
    setPreviewUrl(avatarUrl)
    setPassword('')
    setConfirmPassword('')
    setSelectedFile(null)
    setError('')
    setSuccess('')
    setView('edit')
  }

  // Handle file selection and generate local preview
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 2MB')
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Helper to compress avatar image using canvas (max 300x300, JPEG, 0.8 quality)
  const compressAvatar = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 300
          const MAX_HEIGHT = 300
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Gagal mengompresi gambar'))
            }
          }, 'image/jpeg', 0.8)
        }
        img.src = e.target.result
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  // Handle profile update submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password && password !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok')
      setLoading(false)
      return
    }

    try {
      let finalAvatarUrl = avatarUrl

      // 1. Upload new avatar if selected
      if (selectedFile) {
        const compressedBlob = await compressAvatar(selectedFile)
        finalAvatarUrl = await uploadTransactionPhoto(compressedBlob, user.id)
      }

      // 2. Update Supabase profile database table (full_name)
      if (editName.trim() !== displayName) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ full_name: editName.trim() })
          .eq('id', user.id)
        
        if (dbError) throw dbError
      }

      // 3. Update Auth Metadata
      const updateData = {
        data: {
          full_name: editName.trim(),
          avatar_url: finalAvatarUrl
        }
      }

      // 4. Update password if filled
      if (password) {
        updateData.password = password
      }

      const { error: authError } = await supabase.auth.updateUser(updateData)
      if (authError) throw authError

      // Refresh state values
      setDisplayName(editName.trim())
      setAvatarUrl(finalAvatarUrl)
      setSuccess('Profil Anda berhasil diperbarui!')
      setPassword('')
      setConfirmPassword('')
      setSelectedFile(null)
      
      // Auto return to main view after a short delay
      setTimeout(() => {
        setView('main')
      }, 1500)

    } catch (err) {
      setError(err.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  // Render initials avatar circle
  const renderInitialsAvatar = (sizeClass = "w-24 h-24 text-3xl") => {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-extrabold shadow-md select-none`}>
        {displayName.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="bg-background text-on-background font-sans min-h-screen">
      {/* ====== HEADER ====== */}
      <header className="sticky top-0 z-50 bg-background flex items-center justify-between px-5 h-16 max-w-[448px] mx-auto border-b border-surface-container/30">
        {view === 'main' ? (
          <>
            <div className="w-10" />
            <h1 className="text-xl font-bold tracking-tight text-primary">Profil Saya</h1>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:opacity-80 transition-opacity active:scale-95 text-on-surface"
              aria-label="Ubah Tema"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setView('main')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container/60 transition-colors active:scale-90"
              aria-label="Kembali"
            >
              <ArrowLeft size={20} className="text-on-surface" />
            </button>
            <h1 className="text-lg font-bold text-on-surface">
              {view === 'edit' ? 'Edit Profil' : 'Tentang Aplikasi'}
            </h1>
            <div className="w-10" />
          </>
        )}
      </header>

      {/* ====== MAIN VIEW ====== */}
      {view === 'main' && (
        <main className="max-w-[448px] mx-auto px-5 py-6 pb-28 flex flex-col gap-6 animate-fade-in">
          {/* User Bio Card */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col items-center text-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-md"
                />
              ) : (
                renderInitialsAvatar()
              )}
            </div>
            <div className="min-w-0 w-full">
              <h2 className="text-lg font-extrabold text-on-surface truncate">
                {displayName}
              </h2>
              <p className="text-sm text-on-surface-variant truncate mt-0.5">
                {email}
              </p>
            </div>
          </section>

          {/* Menu Options List */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden divide-y divide-surface-container">
            {/* Edit Profile */}
            <button
              onClick={handleEnterEdit}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface block">
                    Edit Profil
                  </span>
                  <span className="text-[11px] text-on-surface-variant block mt-0.5">
                    Ubah foto, nama lengkap, atau kata sandi
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-outline" />
            </button>

            {/* Tentang Aplikasi */}
            <button
              onClick={() => setView('about')}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                  <Info size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface block">
                    Tentang Aplikasi
                  </span>
                  <span className="text-[11px] text-on-surface-variant block mt-0.5">
                    Informasi fitur, deskripsi, dan versi aplikasi
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-outline" />
            </button>

            {/* Log Out */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-between p-4 hover:bg-error/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
                  <LogOut size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-error block">
                    Keluar Akun
                  </span>
                  <span className="text-[11px] text-error/70 block mt-0.5">
                    Keluar dari sesi masuk aplikasi Anda
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-error/30" />
            </button>
          </section>
        </main>
      )}

      {/* ====== EDIT PROFILE VIEW ====== */}
      {view === 'edit' && (
        <main className="max-w-[448px] mx-auto px-5 py-6 pb-28 animate-fade-in">
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
            {/* Avatar Selector */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md transition-opacity group-hover:opacity-85"
                  />
                ) : (
                  renderInitialsAvatar()
                )}
                <div className="absolute right-0 bottom-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center border-2 border-background shadow-md group-hover:scale-105 transition-transform">
                  <Camera size={16} />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-[11px] text-on-surface-variant font-medium">
                Ketuk lingkaran foto untuk mengubah foto profil
              </span>
            </div>

            {/* Inputs list */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container flex flex-col gap-4 shadow-sm">
              <Input
                label="Nama Lengkap"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nama Anda"
                required
              />

              <hr className="border-surface-container" />

              <Input
                label="Sandi Baru (Kosongkan jika tidak diubah)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />

              <Input
                label="Konfirmasi Sandi Baru"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang sandi baru"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-error/10 text-error text-xs font-semibold flex items-center gap-2 animate-slide-down">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="px-4 py-3 rounded-xl bg-secondary/15 text-secondary text-xs font-semibold flex items-center gap-2 animate-slide-down">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setView('main')}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={loading}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </main>
      )}

      {/* ====== ABOUT APP VIEW ====== */}
      {view === 'about' && (
        <main className="max-w-[448px] mx-auto px-5 py-6 pb-28 flex flex-col gap-5 animate-fade-in">
          {/* Identity Info */}
          <section className="text-center py-4 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4 animate-scale-in">
              <Wallet size={36} className="text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-on-surface">
              DompetKu
            </h2>
            <p className="text-xs text-on-surface-variant font-semibold tracking-wider mt-1 uppercase">
              Versi 1.1.0 (PWA)
            </p>
          </section>

          {/* Description Card */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-sm flex flex-col gap-2">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
              Deskripsi Aplikasi
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              DompetKu adalah aplikasi asisten pencatatan keuangan pribadi modern berbasis Progressive Web App (PWA). Didesain dengan prinsip minimalis, cepat, dan responsif menggunakan panduan Material Design 3. Aplikasi ini membantu Anda memantau seluruh transaksi keuangan, mengontrol anggaran kategori secara cerdas, serta merencanakan masa depan tabungan Anda.
            </p>
          </section>

          {/* Key Features Card */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
              Fitur Utama Aplikasi
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "🎙️", title: "Pencatatan Berbasis Suara", desc: "Ucapkan nominal & kategori transaksi secara alami untuk pencatatan instan." },
                { emoji: "📊", title: "Grafik & Analitik Interaktif", desc: "Donut Chart kategori pengeluaran dan grafik mingguan interaktif." },
                { emoji: "💡", title: "Smart Category Budgeting", desc: "Progress bar otomatis berubah warna saat belanja mendekati batas." },
                { emoji: "💳", title: "Multi-Dompet (Wallets)", desc: "Pisahkan saldo ke cash, bank, atau e-wallet dengan kustom ikon." },
                { emoji: "📸", title: "Bukti Struk & Watermark", desc: "Simpan foto bukti struk lengkap dengan watermark digital ala Strava." },
                { emoji: "⏳", title: "Tagihan & Tabungan Sinking", desc: "Kelola kewajiban bulanan dan target tabungan target secara teratur." }
              ].map((fitur, i) => (
                <div key={i} className="flex gap-3 items-start bg-background/50 p-2.5 rounded-lg border border-surface-container-high/30">
                  <span className="text-base leading-none shrink-0">{fitur.emoji}</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{fitur.title}</h4>
                    <p className="text-[10.5px] text-on-surface-variant leading-normal mt-0.5">{fitur.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action button */}
          <Button
            variant="secondary"
            onClick={() => setView('main')}
            fullWidth
          >
            Kembali ke Profil
          </Button>
        </main>
      )}
    </div>
  )
}
