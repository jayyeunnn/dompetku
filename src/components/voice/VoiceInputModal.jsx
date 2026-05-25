import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, Check, AlertCircle } from 'lucide-react'
import { parseVoiceTransaction } from '../../lib/voiceParser'
import Button from '../ui/Button'

export default function VoiceInputModal({
  isOpen,
  onClose,
  onResult,
  wallets = [],
  categories = []
}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [success, setSuccess] = useState(false)
  const [parsedPreview, setParsedPreview] = useState(null)

  const recognitionRef = useRef(null)
  const [isClosing, setIsClosing] = useState(false)

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false // Auto stop when user stops speaking
    recognition.interimResults = true // Show results in real time
    recognition.lang = 'id-ID' // Indonesian language support

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
      setSuccess(false)
      setTranscript('')
      setParsedPreview(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e)
      setIsListening(false)
      if (e.error === 'not-allowed') {
        setError('Akses mikrofon ditolak. Harap izinkan mikrofon di pengaturan browser Anda.')
      } else if (e.error === 'no-speech') {
        setError('Suara tidak terdeteksi. Silakan coba lagi.')
      } else if (e.error === 'network') {
        setError('Koneksi ke server pengenal suara terganggu (Network Error). Chrome/Edge memerlukan koneksi ke server Google/Microsoft untuk transkripsi. Matikan VPN/Proxy jika aktif, atau coba gunakan browser Edge/Safari.')
      } else {
        setError(`Error: ${e.error}. Silakan coba lagi.`)
      }
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
        } else {
          interimTranscript += result[0].transcript
        }
      }

      const text = (finalTranscript + interimTranscript).trim()
      setTranscript(text)
    }

    recognitionRef.current = recognition
  }, [])

  // Auto-start recording when modal opens
  useEffect(() => {
    if (isOpen && isSupported && recognitionRef.current) {
      // Delay slightly to prevent click event sound or UI transition clashes
      const timer = setTimeout(() => {
        startListening()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isSupported])

  // Stop recording when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopListening()
      setTranscript('')
      setError('')
      setSuccess(false)
      setParsedPreview(null)
    }
  }, [isOpen])

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) return
    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('Start listening error:', err)
    }
  }

  const stopListening = () => {
    if (!isSupported || !recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch (err) {
      // Ignore if already stopped
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    stopListening()
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 250)
  }

  const handleProcess = () => {
    stopListening()
    if (!transcript.trim()) {
      setError('Tidak ada suara yang direkam. Silakan bicara terlebih dahulu.')
      return
    }

    // Process and parse transaction
    const parsed = parseVoiceTransaction(transcript, wallets, categories)
    setParsedPreview(parsed)
    setSuccess(true)

    // Delay calling onResult so the user gets a nice visual success checkmark
    setTimeout(() => {
      onResult(parsed)
      onClose()
    }, 1200)
  }

  // Handle keypress Escape to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // If the browser doesn't finish transcribing but user clicks "Selesai", auto-process whatever we have
  useEffect(() => {
    // If not listening, and we have a transcript but haven't parsed yet, auto-process
    if (!isListening && transcript.trim() && !success && !error && isOpen) {
      // Auto-process on silence/end if transcription was successful
      handleProcess()
    }
  }, [isListening])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      {/* Stylesheet injector for voice-specific animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes voiceRipple {
          0% {
            transform: scale(0.95);
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        @keyframes voiceWave {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .voice-ripple-1 {
          animation: voiceRipple 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .voice-ripple-2 {
          animation: voiceRipple 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 0.6s;
        }
        .voice-ripple-3 {
          animation: voiceRipple 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 1.2s;
        }
        .voice-wave-bar {
          animation: voiceWave 0.7s ease-in-out infinite;
        }
      ` }} />

      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 modal-overlay ${
          isClosing ? 'opacity-0 transition-opacity duration-200' : ''
        }`}
        onClick={handleClose}
      />

      {/* Sheet Container */}
      <div
        className={`
          relative w-full max-w-lg bg-surface
          rounded-t-3xl shadow-modal
          max-h-[85dvh] overflow-y-auto
          modal-content ${isClosing ? 'closing' : ''}
          p-6 pb-8 pb-safe flex flex-col items-center
        `}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-border rounded-full mb-6" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-background-secondary transition-colors"
          aria-label="Tutup"
        >
          <X size={20} className="text-text-secondary" />
        </button>

        <h3 className="text-lg font-bold text-text-primary text-center mb-1">
          Pencatatan Otomatis dengan Suara
        </h3>
        <p className="text-sm text-text-tertiary text-center mb-2 max-w-xs">
          Sebutkan tipe, nominal, dompet, kategori, dan deskripsi transaksi Anda.
        </p>
        <div className="bg-primary/5 border border-primary/10 px-4 py-2.5 rounded-2xl text-center mb-8 max-w-xs leading-relaxed">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5">Contoh:</p>
          <p className="text-xs text-text-secondary italic">
            "Pengeluaran makan siang dua puluh lima ribu rupiah pakai gopay"
          </p>
        </div>

        {/* Microphones Visualizer Area */}
        <div className="relative w-44 h-44 flex items-center justify-center mb-6">
          {success ? (
            /* Success State */
            <div className="w-24 h-24 rounded-full bg-income flex items-center justify-center text-white shadow-lg animate-scale-in">
              <Check size={44} strokeWidth={3} />
            </div>
          ) : !isSupported ? (
            /* Not Supported State */
            <div className="w-24 h-24 rounded-full bg-expense-light text-expense flex items-center justify-center shadow-md">
              <MicOff size={36} />
            </div>
          ) : (
            /* Recording/Idle State */
            <>
              {/* Ripple Rings */}
              {isListening && (
                <>
                  <div className="absolute w-24 h-24 rounded-full bg-primary/20 voice-ripple-1"></div>
                  <div className="absolute w-24 h-24 rounded-full bg-primary/20 voice-ripple-2"></div>
                  <div className="absolute w-24 h-24 rounded-full bg-primary/20 voice-ripple-3"></div>
                </>
              )}

              {/* Central Mic Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`
                  relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300
                  ${isListening ? 'bg-primary scale-105 shadow-primary/30' : 'bg-text-secondary hover:bg-text-primary hover:scale-102'}
                `}
              >
                <Mic size={36} className={isListening ? 'animate-pulse' : ''} />
              </button>
            </>
          )}
        </div>

        {/* Equalizer Sound Waves (Only visible when listening) */}
        {isListening && (
          <div className="flex items-center justify-center gap-1.5 h-6 mb-6">
            <div className="w-1 h-3 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }}></div>
            <div className="w-1 h-5 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.2s', animationDuration: '0.8s' }}></div>
            <div className="w-1 h-2 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }}></div>
            <div className="w-1 h-6 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.4s', animationDuration: '0.7s' }}></div>
            <div className="w-1 h-4 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.5s', animationDuration: '0.6s' }}></div>
            <div className="w-1 h-5 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.6s', animationDuration: '0.9s' }}></div>
            <div className="w-1 h-2 bg-primary rounded-full voice-wave-bar" style={{ animationDelay: '0.7s', animationDuration: '0.4s' }}></div>
          </div>
        )}

        {/* Status Text */}
        <div className="text-center font-medium text-sm mb-4">
          {success ? (
            <span className="text-income flex items-center justify-center gap-1">
              <Check size={16} /> Berhasil dianalisis!
            </span>
          ) : isListening ? (
            <span className="text-primary animate-pulse">Mendengarkan...</span>
          ) : error ? (
            <span className="text-expense flex items-center justify-center gap-1 px-4">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </span>
          ) : !isSupported ? (
            <span className="text-text-secondary">Browser tidak mendukung input suara.</span>
          ) : transcript ? (
            <span className="text-text-secondary">Selesai berbicara. Menghitung...</span>
          ) : (
            <span className="text-text-tertiary">Ketuk mikrofon untuk mulai berbicara.</span>
          )}
        </div>

        {/* Transcript Box */}
        {(transcript || isListening) && (
          <div className="w-full bg-background-secondary rounded-2xl p-4 mb-6 border border-border-light min-h-[80px] max-h-[140px] overflow-y-auto flex items-center justify-center">
            <p className={`text-center text-sm ${transcript ? 'text-text-primary font-medium' : 'text-text-tertiary italic'}`}>
              {transcript || 'Teks ucapan Anda akan muncul di sini...'}
            </p>
          </div>
        )}

        {/* Success Preview */}
        {success && parsedPreview && (
          <div className="w-full bg-primary/5 rounded-2xl p-4 mb-6 border border-primary/20 animate-fade-in flex flex-col gap-2">
            <div className="text-xs font-bold text-primary uppercase tracking-wider">Hasil Deteksi</div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs font-medium text-text-secondary">
              <div>Tipe: <span className="text-text-primary capitalize">{parsedPreview.type === 'expense' ? 'Pengeluaran' : parsedPreview.type === 'income' ? 'Pemasukan' : 'Transfer'}</span></div>
              <div>Nominal: <span className="text-text-primary">Rp{Number(parsedPreview.amount).toLocaleString('id-ID')}</span></div>
              {parsedPreview.walletId && (
                <div>Dompet: <span className="text-text-primary">
                  {wallets.find(w => w.id === parsedPreview.walletId)?.name || 'Ditemukan'}
                </span></div>
              )}
              {parsedPreview.type === 'transfer' && parsedPreview.destWalletId && (
                <div>Tujuan: <span className="text-text-primary">
                  {wallets.find(w => w.id === parsedPreview.destWalletId)?.name || 'Ditemukan'}
                </span></div>
              )}
              {parsedPreview.categoryId && parsedPreview.type !== 'transfer' && (
                <div>Kategori: <span className="text-text-primary">
                  {categories.find(c => c.id === parsedPreview.categoryId)?.name || 'Ditemukan'}
                </span></div>
              )}
              {parsedPreview.description && (
                <div className="col-span-2">Catatan: <span className="text-text-primary italic">"{parsedPreview.description}"</span></div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex gap-3 mt-auto">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={success}
          >
            Batal
          </Button>

          {isSupported && (
            <Button
              variant="primary"
              fullWidth
              disabled={!transcript.trim() || success}
              onClick={handleProcess}
            >
              Selesai
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
