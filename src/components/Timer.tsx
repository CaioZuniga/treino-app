import { useEffect, useRef, useState } from 'react'

const RADIUS = 96
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** Re-renderiza a cada `ms` enquanto `active`. */
export function useTick(active: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [active, ms])
  return now
}

/** Aviso de fim de descanso: vibração e um bipe curto (o navegador só toca som depois de um toque na tela). */
export function alertEnd() {
  try {
    navigator.vibrate?.([200, 100, 200])
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // Sem áudio ou vibração disponíveis: o anel parado já mostra que acabou.
  }
}

export interface Countdown {
  endsAt: number
  total: number
}

/** Anel de contagem regressiva no estilo do mockup. */
export function RingTimer({
  countdown,
  label,
  onAdjust,
  onSkip,
  onEnd,
}: {
  countdown: Countdown
  label: string
  onAdjust: (deltaSec: number) => void
  onSkip: () => void
  onEnd?: () => void
}) {
  const now = useTick(true)
  const left = Math.max(0, (countdown.endsAt - now) / 1000)
  const ended = useRef(false)

  useEffect(() => {
    ended.current = false
  }, [countdown.endsAt])

  useEffect(() => {
    if (left <= 0 && !ended.current) {
      ended.current = true
      alertEnd()
      onEnd?.()
    }
  }, [left, onEnd])

  const progress = countdown.total > 0 ? left / countdown.total : 0
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid place-items-center">
        <svg width="210" height="210" viewBox="0 0 220 220" aria-hidden="true">
          <circle cx="110" cy="110" r={RADIUS} stroke="var(--color-card2)" strokeWidth="12" fill="none" />
          <circle
            cx="110"
            cy="110"
            r={RADIUS}
            stroke="var(--color-lime)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform="rotate(-90 110 110)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(200,255,61,.6))', transition: 'stroke-dashoffset .25s linear' }}
          />
        </svg>
        <div className="absolute text-center" role="timer" aria-live="off">
          <b className="block font-display text-[44px] font-medium tabular-nums">{formatClock(left)}</b>
          <span className="text-xs text-muted">{left > 0 ? label : 'Bora!'}</span>
        </div>
      </div>
      <div className="flex w-full gap-2">
        <button type="button" className="btn btn-ghost flex-1 py-3" onClick={() => onAdjust(-15)}>
          −15 s
        </button>
        <button type="button" className="btn btn-ghost flex-1 py-3" onClick={onSkip}>
          Pular
        </button>
        <button type="button" className="btn btn-ghost flex-1 py-3" onClick={() => onAdjust(15)}>
          +15 s
        </button>
      </div>
    </div>
  )
}
