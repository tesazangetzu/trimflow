"use client"

import { useCallback, useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToastManager } from "@/components/ui/toast"
import * as landingService from "@/services/landing.service"

/** Alineado con backend/src/modules/images/constants/image-policy.ts */
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const RATIO_TOLERANCE = 0.1 // ±10%
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const

export type ImageTarget = "logo" | "hero"

interface TargetPolicy {
  ratio: number
  maxWidth: number
  maxHeight: number
}

/** Alineado con IMAGE_TARGET_POLICIES del backend. */
const TARGET_POLICIES: Record<ImageTarget, TargetPolicy> = {
  logo: { ratio: 1, maxWidth: 512, maxHeight: 512 },
  hero: { ratio: 16 / 9, maxWidth: 1920, maxHeight: 1080 },
}

interface ImageDropzoneProps {
  target: ImageTarget
  value: string | null
  onChange: (url: string | null) => void
  guide: string
  previewClassName?: string
}

export function ImageDropzone({ target, value, onChange, guide, previewClassName }: ImageDropzoneProps) {
  const { add } = useToastManager()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const policy = TARGET_POLICIES[target]

  const validateAndUpload = useCallback(
    async (file: File) => {
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        add({
          title: "Formato no permitido",
          description: "Solo se aceptan imágenes PNG, JPG o WebP.",
          type: "error",
        })
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        add({
          title: "Archivo demasiado grande",
          description: "El tamaño máximo es 10 MB.",
          type: "error",
        })
        return
      }

      // Validar dimensiones y proporción en cliente antes de subir.
      const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          URL.revokeObjectURL(url)
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(null)
        }
        img.src = url
      })

      if (!dimensions) {
        add({
          title: "Imagen inválida",
          description: "No se pudo leer la imagen. Intenta con otro archivo.",
          type: "error",
        })
        return
      }

      const deviation = Math.abs(dimensions.width / dimensions.height - policy.ratio) / policy.ratio
      if (deviation > RATIO_TOLERANCE) {
        add({
          title: "Proporción incorrecta",
          description: `La imagen debe ser ${guide}. Recibido: ${dimensions.width}×${dimensions.height}px.`,
          type: "error",
        })
        return
      }
      if (dimensions.width > policy.maxWidth || dimensions.height > policy.maxHeight) {
        add({
          title: "Dimensiones excedidas",
          description: `El máximo permitido es ${policy.maxWidth}×${policy.maxHeight}px. Recibido: ${dimensions.width}×${dimensions.height}px.`,
          type: "error",
        })
        return
      }

      setUploading(true)
      try {
        const res = await landingService.uploadBrandingImage(target, file)
        onChange(res.url)
        add({
          title: "Imagen subida",
          description: "La imagen se actualizó correctamente.",
          type: "success",
        })
      } catch {
        add({
          title: "Error al subir",
          description: "No se pudo subir la imagen. Inténtalo de nuevo.",
          type: "error",
        })
      } finally {
        setUploading(false)
      }
    },
    [add, guide, onChange, policy, target],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // permite re-seleccionar el mismo archivo
    if (file) void validateAndUpload(file)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) void validateAndUpload(file)
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Subir imagen: ${target}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {uploading ? "Subiendo…" : "Arrastra una imagen o haz clic para buscar"}
        </p>
        <p className="text-xs text-muted-foreground">{guide}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onInputChange}
          disabled={uploading}
        />
      </div>

      {value && (
        <div className="flex items-center gap-3 rounded-md border p-2">
          <img
            src={value}
            alt={`Vista previa de ${target}`}
            className={previewClassName ?? "h-12 w-12 rounded object-contain"}
          />
          <div className="flex-1 truncate text-xs text-muted-foreground">{value}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
          >
            <Trash2 className="size-4" />
            Quitar
          </Button>
        </div>
      )}
    </div>
  )
}
