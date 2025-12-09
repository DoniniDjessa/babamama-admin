/**
 * Client-side image optimization utilities
 * Optimizes images before upload to reduce bandwidth
 */

export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"))
              return
            }

            // Convert to WebP if supported, otherwise keep original format
            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
            const compressedFile = new File([blob], fileName, {
              type: "image/webp",
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          "image/webp",
          quality
        )
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export async function optimizeImageForUpload(file: File): Promise<File> {
  // Only compress if file is larger than 500KB
  if (file.size > 500 * 1024) {
    try {
      return await compressImage(file, 800, 800, 0.8)
    } catch (error) {
      console.warn("Image compression failed, using original:", error)
      return file
    }
  }
  return file
}

