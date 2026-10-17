import { exerciseName } from '../data/catalog'
import { bestLoad, formatVolume, personalRecords, volumeKg } from '../engine/history'
import type { WorkoutLog } from '../types'
import { shareOrDownload } from './platform'

// Cartão do treino concluído em 1080×1350 (formato retrato do Instagram), no visual do app.

const W = 1080
const H = 1350
const PAD = 84
const C = {
  bg: '#0d0f12',
  card: '#15181d',
  line: '#262b33',
  fg: '#eef1f4',
  muted: '#8b939e',
  dim: '#5b636e',
  lime: '#c8ff3d',
  limeInk: '#1a2400',
  cardio: '#ff7a3d',
}
const DISPLAY = '"Unbounded", "Arial Black", sans-serif'
const BODY = '"Manrope", system-ui, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'

const kg = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Quebra o texto em linhas que cabem na largura; corta com reticências depois de `maxLines`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last}…`
    return kept
  }
  return lines
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

async function ensureFonts() {
  await Promise.all(
    ['700 80px Unbounded', '500 60px Unbounded', '400 30px Manrope', '700 30px Manrope', '500 30px "JetBrains Mono"'].map((f) =>
      document.fonts.load(f).catch(() => []),
    ),
  )
}

export async function renderWorkoutCard(log: WorkoutLog, previous: WorkoutLog[]): Promise<Blob> {
  await ensureFonts()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fundo com brilho verde no canto, como o cartão do treino no app.
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W - 120, 120, 0, W - 120, 120, 620)
  glow.addColorStop(0, 'rgba(200,255,61,0.30)')
  glow.addColorStop(1, 'rgba(200,255,61,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  let y = PAD + 30
  ctx.fillStyle = C.muted
  ctx.font = `700 28px ${BODY}`
  ctx.letterSpacing = '6px'
  ctx.fillText('TREINO CONCLUÍDO', PAD, y)
  ctx.letterSpacing = '0px'

  // Selo de concluído.
  ctx.fillStyle = C.lime
  ctx.beginPath()
  ctx.arc(W - PAD - 44, y - 12, 44, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = C.limeInk
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(W - PAD - 64, y - 12)
  ctx.lineTo(W - PAD - 50, y + 4)
  ctx.lineTo(W - PAD - 22, y - 30)
  ctx.stroke()

  y += 100
  ctx.fillStyle = C.fg
  ctx.font = `700 78px ${DISPLAY}`
  for (const line of wrap(ctx, log.sessionTitle, W - PAD * 2 - 40, 2)) {
    ctx.fillText(line, PAD, y)
    y += 92
  }
  ctx.fillStyle = C.muted
  ctx.font = `400 32px ${BODY}`
  ctx.fillText(new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }), PAD, y - 20)
  y += 40

  // Estatísticas 2×2.
  const done = log.sets.filter((s) => s.done)
  const stats = [
    [`${log.durationMin} min`, 'duração'],
    [formatVolume(volumeKg(log)), 'volume levantado'],
    [String(done.length), 'séries feitas'],
    [`~${log.kcal}`, 'kcal estimadas'],
  ]
  const gap = 24
  const tileW = (W - PAD * 2 - gap) / 2
  const tileH = 170
  stats.forEach(([value, label], i) => {
    const x = PAD + (i % 2) * (tileW + gap)
    const ty = y + Math.floor(i / 2) * (tileH + gap)
    roundRect(ctx, x, ty, tileW, tileH, 32)
    ctx.fillStyle = C.card
    ctx.fill()
    ctx.strokeStyle = C.line
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = C.fg
    ctx.font = `500 58px ${DISPLAY}`
    ctx.fillText(fitText(ctx, value, tileW - 64), x + 32, ty + 86)
    ctx.fillStyle = C.muted
    ctx.font = `400 28px ${BODY}`
    ctx.fillText(label, x + 32, ty + 134)
  })
  y += tileH * 2 + gap + 74

  // Recordes ou, sem recordes, os exercícios principais do dia.
  const records = personalRecords(log, previous)
  const rows: [string, string, string][] = records.length
    ? records.slice(0, 4).map((r) => [exerciseName(r.exerciseId), `${kg(r.previousKg)} → ${kg(r.loadKg)} kg`, C.lime])
    : [...new Set(done.map((s) => s.exerciseId))].slice(0, 5).map((id) => {
        const sets = done.filter((s) => s.exerciseId === id)
        const best = bestLoad(sets)
        return [exerciseName(id), `${sets.length} × ${best ? `${kg(best)} kg` : 'peso do corpo'}`, C.muted]
      })
  if (log.cardioMinutes > 0 && !records.length && rows.length < 5) rows.push(['Aeróbico', `${log.cardioMinutes} min`, C.cardio])

  ctx.fillStyle = records.length ? C.lime : C.muted
  ctx.font = `700 26px ${BODY}`
  ctx.letterSpacing = '5px'
  ctx.fillText(records.length ? 'RECORDES NOVOS' : 'O QUE EU FIZ', PAD, y)
  ctx.letterSpacing = '0px'
  y += 30
  for (const [name, value, color] of rows) {
    y += 70
    ctx.font = `500 30px ${MONO}`
    const valueW = ctx.measureText(value).width
    ctx.fillStyle = color
    ctx.fillText(value, W - PAD - valueW, y)
    ctx.fillStyle = C.fg
    ctx.font = `400 34px ${BODY}`
    ctx.fillText(fitText(ctx, name, W - PAD * 2 - valueW - 32), PAD, y)
    ctx.strokeStyle = C.line
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(PAD, y + 26)
    ctx.lineTo(W - PAD, y + 26)
    ctx.stroke()
  }

  // Rodapé com a marca do app.
  const fy = H - PAD + 6
  ctx.strokeStyle = C.lime
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const [x1, y1, x2, y2] of [
    [PAD + 6, fy - 26, PAD + 6, fy - 2],
    [PAD + 18, fy - 34, PAD + 18, fy + 6],
    [PAD + 18, fy - 14, PAD + 58, fy - 14],
    [PAD + 58, fy - 34, PAD + 58, fy + 6],
    [PAD + 70, fy - 26, PAD + 70, fy - 2],
  ]) {
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.stroke()
  ctx.fillStyle = C.fg
  ctx.font = `700 34px ${DISPLAY}`
  ctx.fillText('Treino', PAD + 96, fy)
  ctx.fillStyle = C.dim
  ctx.font = `500 24px ${MONO}`
  const url = 'caiozuniga.github.io/treino-app'
  ctx.fillText(url, W - PAD - ctx.measureText(url).width, fy)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não deu para gerar a imagem.'))), 'image/png'))
}

export async function shareWorkout(log: WorkoutLog, previous: WorkoutLog[]) {
  const blob = await renderWorkoutCard(log, previous)
  const file = new File([blob], `treino-${log.date.slice(0, 10)}.png`, { type: 'image/png' })
  return shareOrDownload(file)
}
