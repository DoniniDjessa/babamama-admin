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
  // Always compress images to reduce file size and improve upload speed
  // Use more aggressive compression for larger files
  try {
    if (file.size > 2 * 1024 * 1024) {
      // Files larger than 2MB: compress to 1200x1200 with 0.7 quality
      return await compressImage(file, 1200, 1200, 0.7)
    } else if (file.size > 500 * 1024) {
      // Files larger than 500KB: compress to 1000x1000 with 0.75 quality
      return await compressImage(file, 1000, 1000, 0.75)
    } else {
      // Smaller files: compress to 800x800 with 0.8 quality (still optimize for consistency)
      return await compressImage(file, 800, 800, 0.8)
    }
  } catch (error) {
    console.warn("Image compression failed, using original:", error)
    return file
  }
}

