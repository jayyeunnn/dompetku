import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 250)
  }, [onClose])

  // Close on Escape
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
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 modal-overlay ${
          isClosing ? 'opacity-0 transition-opacity duration-200' : ''
        }`}
        onClick={handleClose}
      />

      {/* Content */}
      <div
        className={`
          relative w-full max-w-lg bg-surface
          rounded-t-3xl shadow-modal
          max-h-[90dvh] overflow-y-auto
          modal-content ${isClosing ? 'closing' : ''}
        `}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-surface z-10 rounded-t-3xl">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full hover:bg-background-secondary transition-colors"
            aria-label="Tutup"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-8 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
