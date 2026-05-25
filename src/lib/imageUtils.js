import { supabase } from './supabase'
import { formatCurrency, formatDate } from './formatters'

/**
 * Compress an image and apply a Strava-style watermark overlay.
 *
 * @param {File} file - The raw image file from input.
 * @param {Object} meta - Watermark metadata.
 * @param {number} meta.amount - Transaction amount (e.g. 50000).
 * @param {string} meta.category - Category name (e.g. "Makan & Minum").
 * @param {string} meta.date - Date string YYYY-MM-DD.
 * @returns {Promise<Blob>} - Compressed JPEG blob with watermark.
 */
export function compressAndWatermark(file, { amount, category, date }) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Gagal memuat gambar'))
      img.onload = () => {
        try {
          const blob = processImage(img, { amount, category, date })
          resolve(blob)
        } catch (err) {
          reject(err)
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Process the loaded image: resize, draw watermark, export as blob.
 */
function processImage(img, { amount, category, date }) {
  const MAX_DIM = 800
  let { width, height } = img

  // Scale down if needed, preserving aspect ratio
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Draw the resized image
  ctx.drawImage(img, 0, 0, width, height)

  // Draw watermark
  drawWatermark(ctx, width, height, { amount, category, date })

  // Export as JPEG blob synchronously via toDataURL → convert to Blob
  const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
  return dataURLtoBlob(dataUrl)
}

/**
 * Draw a Strava-style watermark at the bottom-left corner.
 * - Gradient overlay from transparent to semi-black at the bottom
 * - 3 lines of text: Amount (large), Category (medium), Date (small)
 */
function drawWatermark(ctx, w, h, { amount, category, date }) {
  const padding = Math.round(w * 0.04)
  const gradientHeight = Math.round(h * 0.35)

  // Semi-transparent gradient overlay at bottom
  const gradient = ctx.createLinearGradient(0, h - gradientHeight, 0, h)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.65)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, h - gradientHeight, w, gradientHeight)

  // Text settings
  const baseFontSize = Math.max(14, Math.round(w * 0.045))
  ctx.textBaseline = 'bottom'
  ctx.textAlign = 'left'

  // Line 3 — Date (smallest, bottom)
  const dateText = formatDate(date, 'medium')
  const dateFontSize = Math.round(baseFontSize * 0.75)
  ctx.font = `400 ${dateFontSize}px Inter, system-ui, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 3
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  const dateY = h - padding
  ctx.fillText(dateText, padding, dateY)

  // Line 2 — Category (medium)
  const catFontSize = Math.round(baseFontSize * 0.9)
  ctx.font = `500 ${catFontSize}px Inter, system-ui, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  const catY = dateY - dateFontSize - Math.round(padding * 0.3)
  ctx.fillText(category || '', padding, catY)

  // Line 1 — Amount (largest, boldest)
  const amtFontSize = Math.round(baseFontSize * 1.5)
  ctx.font = `700 ${amtFontSize}px Inter, system-ui, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.shadowBlur = 4
  const amtY = catY - catFontSize - Math.round(padding * 0.3)
  const amountText = formatCurrency(amount)
  ctx.fillText(amountText, padding, amtY)

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

/**
 * Convert a data URL to a Blob.
 */
function dataURLtoBlob(dataUrl) {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)[1]
  const bstr = atob(parts[1])
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Upload a watermarked photo blob to Supabase Storage.
 *
 * @param {Blob} blob - The JPEG blob to upload.
 * @param {string} userId - The authenticated user's ID (used as folder).
 * @returns {Promise<string>} - The public URL of the uploaded photo.
 */
export async function uploadTransactionPhoto(blob, userId) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const filePath = `${userId}/${timestamp}-${random}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('transaction-photos')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Gagal mengupload foto: ${uploadError.message}`)
  }

  const { data } = supabase.storage
    .from('transaction-photos')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Delete a transaction photo from Supabase Storage.
 *
 * @param {string} publicUrl - The public URL of the photo to delete.
 * @returns {Promise<void>}
 */
export async function deleteTransactionPhoto(publicUrl) {
  if (!publicUrl) return

  try {
    // Extract file path from public URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/transaction-photos/{userId}/{filename}
    const marker = '/transaction-photos/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return

    const filePath = publicUrl.substring(idx + marker.length)

    const { error } = await supabase.storage
      .from('transaction-photos')
      .remove([filePath])

    if (error) {
      console.error('Error deleting photo from storage:', error)
    }
  } catch (err) {
    console.error('Error parsing photo URL for deletion:', err)
  }
}

