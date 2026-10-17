import type { SessionPlan } from '../types'
import type { LoadSuggestion } from './progression'
import { blockMinutes } from './session'

// Regra 10: periodização em ciclos de 5 semanas.
// Semanas 1–4: progressão normal. Semana 5: deload (cerca de 40% menos séries e cargas 10% mais leves).
// Depois da semana 5, o app gera uma nova combinação de exercícios e começa outro ciclo.

export const CYCLE_WEEKS = 5
export const DELOAD_WEEK = 5
const DAY = 24 * 60 * 60 * 1000

export interface CycleInfo {
  /** Semana atual do ciclo, de 1 a 5 (6 ou mais = ciclo terminou). */
  week: number
  deload: boolean
  expired: boolean
}

export function cycleInfo(cycleStart: string, now = new Date()): CycleInfo {
  const days = Math.floor((now.getTime() - new Date(cycleStart).getTime()) / DAY)
  const week = Math.max(1, Math.floor(days / 7) + 1)
  return { week, deload: week === DELOAD_WEEK, expired: week > CYCLE_WEEKS }
}

/** Versão de deload da sessão: menos séries em cada exercício; repetições e descanso iguais. */
export function deloadSession(session: SessionPlan): SessionPlan {
  const strength = session.strength.map((x) => ({ ...x, sets: Math.max(1, Math.round(x.sets * 0.6)) }))
  const saved = blockMinutes(session.strength) - blockMinutes(strength)
  const ratio = session.estimatedMinutes ? (session.estimatedMinutes - saved) / session.estimatedMinutes : 1
  return { ...session, strength, estimatedMinutes: session.estimatedMinutes - saved, kcal: Math.round(session.kcal * ratio) }
}

/** Na semana de deload, a carga sugerida fica 10% mais leve. */
export function deloadSuggestion(s: LoadSuggestion): LoadSuggestion {
  if (!s.loadKg) return s
  return { reason: 'semana_deload', loadKg: Math.round(s.loadKg * 0.9 * 2) / 2 }
}
