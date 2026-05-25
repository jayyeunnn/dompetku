import { useState } from 'react'
import { Wallet, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isRegister) {
        const { error: signUpError } = await signUp(email, password, fullName)
        if (signUpError) throw signUpError
        setSuccess('Akun berhasil dibuat! Silakan cek email untuk verifikasi.')
      } else {
        const { error: signInError } = await signIn(email, password)
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center animate-slide-up">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <Wallet size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary">
          DompetKu
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Pencatat Keuangan Pribadi
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-card animate-scale-in"
      >
        <h2 className="text-lg font-bold text-text-primary mb-5">
          {isRegister ? 'Buat Akun' : 'Masuk'}
        </h2>

        <div className="flex flex-col gap-4">
          {isRegister && (
            <Input
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama kamu"
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 bottom-3 p-1 rounded-lg hover:bg-background-secondary transition-colors"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-text-tertiary" />
              ) : (
                <Eye size={18} className="text-text-tertiary" />
              )}
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-expense-light text-expense-dark text-sm font-medium animate-slide-down">
              {error}
            </div>
          )}

          {success && (
            <div className="px-4 py-3 rounded-xl bg-income-light text-income-dark text-sm font-medium animate-slide-down">
              {success}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={loading}
          >
            {isRegister ? 'Daftar' : 'Masuk'}
          </Button>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
              setSuccess('')
            }}
            className="text-sm text-primary font-medium hover:text-primary-dark transition-colors"
          >
            {isRegister
              ? 'Sudah punya akun? Masuk'
              : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <p className="mt-8 text-xs text-text-tertiary">
        © 2026 Gian Akhiru Ramadhan
      </p>
    </div>
  )
}
