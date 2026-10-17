import { groupIndexes } from '../engine/session'
import type { SessionPlan } from '../types'

// Etapas do treino ao vivo. Uma supersérie é uma etapa só, com os dois exercícios juntos.

export type Step = { kind: 'mobilidade' } | { kind: 'musculacao'; indexes: number[] } | { kind: 'aerobico' }

export function buildSteps(session: SessionPlan): Step[] {
  return [
    ...(session.mobility.length ? [{ kind: 'mobilidade' } as const] : []),
    ...groupIndexes(session.strength).map((indexes) => ({ kind: 'musculacao', indexes }) as const),
    ...(session.cardio ? [{ kind: 'aerobico' } as const] : []),
  ]
}
