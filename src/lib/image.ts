// Runs in the browser: shrink a chosen photo and re-encode it as JPEG.
// Re-encoding drops EXIF data, including GPS location.
const MAX_EDGE = 1600

export async function resizePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo (JPEG, PNG or HEIC from your camera roll).')
  if (file.size > 10 * 1024 * 1024) throw new Error('That photo is over 10 MB. Choose a smaller one.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('That photo format isn’t supported on this device. Try a JPEG or PNG.')
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error('Couldn’t process that photo. Try another one.')
  return blob
}
