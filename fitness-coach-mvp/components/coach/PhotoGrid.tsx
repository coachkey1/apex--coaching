'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ProgressPhoto } from '@/types'
import { X } from 'lucide-react'

interface PhotoGridProps {
  photos: (ProgressPhoto & { url?: string })[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map(photo => (
          photo.url && (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo.url!)}
              className="relative aspect-square rounded-lg overflow-hidden bg-brand-gray"
            >
              <Image
                src={photo.url}
                alt={photo.photo_type}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 capitalize">
                {photo.photo_type}
              </div>
            </button>
          )
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-brand-gray rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative w-full max-w-md aspect-[3/4]">
            <Image
              src={lightbox}
              alt="Progress photo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
