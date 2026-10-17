import type { Exercise, Joint, Pattern, PlannedExercise } from '../types'
import { hash01, isEligible, type SelectionContext } from './select'

// Regra 6: aquecimento de 5 a 8 minutos focado nas articulações do dia e nas lesões informadas.

const PATTERN_JOINTS: Partial<Record<Pattern, Joint[]>> = {
  agachar: ['quadril', 'tornozelo', 'joelho'],
  unilateral: ['quadril', 'tornozelo'],
  dobradica: ['quadril', 'lombar'],
  gluteo: ['quadril'],
  quadriceps_iso: ['joelho'],
  posterior_iso: ['quadril'],
  empurrar_h: ['ombro', 'toracica'],
  empurrar_inc: ['ombro', 'toracica'],
  empurrar_v: ['ombro', 'toracica'],
  puxar_v: ['ombro', 'toracica'],
  puxar_h: ['ombro', 'toracica'],
  peito_iso: ['ombro'],
  ombro_lateral: ['ombro'],
  biceps: ['cotovelo', 'punho'],
  triceps: ['cotovelo'],
}

/** Movimentos dinâmicos (repetições). Os demais são alongamentos sustentados ou liberação com rolo. */
const DYNAMIC = new Set([
  'custom_90_90', 'custom_ankle_wall', 'custom_open_book', 'custom_wall_slide', 'custom_band_dislocate',
  'custom_glute_bridge_march', 'custom_scap_pushup', 'Worlds_Greatest_Stretch', 'Inchworm', 'Cat_Stretch',
  'Standing_Hip_Circles', 'Hip_Circles_prone', 'Groiners', 'Front_Leg_Raises', 'Ankle_Circles', 'Knee_Circles',
  'Arm_Circles', 'Shoulder_Circles', 'Elbows_Back', 'Dynamic_Chest_Stretch', 'Dynamic_Back_Stretch', 'Windmills',
  'Pelvic_Tilt_Into_Bridge', 'Wrist_Circles',
])

const MAX_ITEMS = 4

/** Articulações em ordem de prioridade: primeiro as lesões, depois as mais usadas no dia. */
export function jointsForDay(patterns: readonly Pattern[], injuries: readonly Joint[]): Joint[] {
  const count = new Map<Joint, number>()
  for (const p of patterns) for (const j of PATTERN_JOINTS[p] ?? []) count.set(j, (count.get(j) ?? 0) + 1)
  const byUse = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([j]) => j)
  return [...new Set([...injuries, ...byUse])]
}

function prescribeMobility(e: Exercise): PlannedExercise {
  const base = { exerciseId: e.id, slot: 'mobilidade' as const, priority: 'acessorio' as const, restSec: 0 }
  if (DYNAMIC.has(e.id)) return { ...base, sets: 1, unit: 'reps', repsMin: 8, repsMax: 10 }
  if (e.id.endsWith('-SMR')) return { ...base, sets: 1, unit: 'seg', repsMin: 45, repsMax: 60 }
  return { ...base, sets: 2, unit: 'seg', repsMin: 20, repsMax: 30 }
}

export function planMobility(patterns: readonly Pattern[], injuries: readonly Joint[], ctx: SelectionContext): PlannedExercise[] {
  const pool = ctx.exercises.filter((e) => e.pattern === 'mobilidade' && isEligible(e, ctx))
  const joints = jointsForDay(patterns, injuries)
  const chosen: Exercise[] = []
  const covered = new Set<Joint>()

  for (const joint of joints) {
    if (chosen.length >= MAX_ITEMS) break
    if (covered.has(joint)) continue
    const best = pool
      .filter((e) => e.joints.includes(joint) && !chosen.includes(e))
      .map((e) => ({
        e,
        // Prefere dinâmicos (aquecem melhor) e os que cobrem outras articulações do dia de uma vez.
        s: (DYNAMIC.has(e.id) ? 2 : 0) + e.joints.filter((j) => joints.includes(j) && !covered.has(j)).length + hash01(`${e.id}:${ctx.seed}`),
      }))
      .sort((a, b) => b.s - a.s)[0]?.e
    if (!best) continue
    chosen.push(best)
    best.joints.forEach((j) => covered.add(j))
  }
  return chosen.map(prescribeMobility)
}
