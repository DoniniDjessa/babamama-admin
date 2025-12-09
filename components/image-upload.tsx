"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { optimizeImageForUpload } from "@/lib/utils/image-optimization"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (filesArray.length > remainingSlots) {
      alert(`Vous ne pouvez ajouter que ${remainingSlots} image(s) de plus`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = filesArray.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} n'est pas une image`)
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} est trop volumineux (max 5MB)`)
        }

        // Optimize image before upload
        const optimizedFile = await optimizeImageForUpload(file)

        // Generate unique filename
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.webp`
        const filePath = `products/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("alibucket")
          .upload(filePath, optimizedFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (error) {
          throw error
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("alibucket").getPublicUrl(data.path)

        return publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onImagesChange([...images, ...uploadedUrls])
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">Images ({images.length}/{maxImages})</label>

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-4 text-center transition-colors",
            dragActive
              ? "border-slate-400 bg-slate-50"
              : "border-slate-300 bg-white hover:border-slate-400"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFile(e.target.files)}
            className="hidden"
            disabled={uploading}
          />

          <div className="space-y-2">
            <svg
              className="mx-auto h-8 w-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-xs text-slate-600">
              Glissez-déposez des images ici ou{" "}
              <button
                type="button"
                onClick={openFileDialog}
                className="text-indigo-600 hover:text-indigo-700 underline"
                disabled={uploading}
              >
                cliquez pour sélectionner
              </button>
            </p>
            <p className="text-xs text-slate-400">
              PNG, JPG, WEBP jusqu'à 5MB
            </p>
          </div>

          {uploading && (
            <div className="mt-2">
              <p className="text-xs text-slate-500">Upload en cours...</p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover rounded-md border border-slate-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer l'image"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

