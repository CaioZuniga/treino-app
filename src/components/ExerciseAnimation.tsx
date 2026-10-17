import { useEffect, useState } from 'react'
import { imageUrl } from '../data/catalog'

const FRAME_MS = 900

/** Alterna a foto de início e a de fim do movimento, como uma animação de dois quadros. */
export function ExerciseAnimation({ images, name }: { images: string[]; name: string }) {
  const [frame, setFrame] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setFrame((f) => (f + 1) % images.length), FRAME_MS)
    return () => clearInterval(t)
  }, [images.length])

  if (images.length === 0 || failed) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-[20px] border border-line bg-card2 px-6 text-center text-sm text-muted">
        {failed ? 'Não deu para carregar as fotos. Confira a conexão.' : 'Este exercício ainda não tem fotos. Siga o passo a passo abaixo.'}
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-[#f2f2ee]">
      {images.map((src, i) => (
        <img
          key={src}
          src={imageUrl(src)}
          alt={i === 0 ? `${name}: posição inicial` : `${name}: posição final`}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-150"
          style={{ opacity: i === frame ? 1 : 0 }}
        />
      ))}
      <span className="absolute right-2.5 bottom-2 font-mono text-[10px] text-[#666]">free-exercise-db</span>
    </div>
  )
}
