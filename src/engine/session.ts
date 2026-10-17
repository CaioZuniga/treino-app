import type { PlannedExercise } from '../types'

// Regra 4 (estimativa): cada série conta o tempo de execução (cerca de 3 s por repetição) mais o descanso.

const SECONDS_PER_REP = 3
/** Tempo para trocar de aparelho, ajustar carga e se posicionar. */
export const TRANSITION_SEC = 60
/** Dentro de uma supersérie: só o tempo de ir de um exercício para o outro. */
const SUPERSET_SWITCH_SEC = 15

function workSeconds(ex: PlannedExercise): number {
  const avg = (ex.repsMin + ex.repsMax) / 2
  return ex.unit === 'seg' ? avg : avg * SECONDS_PER_REP
}

export function exerciseSeconds(ex: PlannedExercise): number {
  // O descanso depois da última série não conta: a pessoa já vai para o próximo exercício.
  return ex.sets * workSeconds(ex) + (ex.sets - 1) * ex.restSec
}

export function estimateStrengthMinutes(exercises: PlannedExercise[]): number {
  return Math.round(exercises.reduce((total, ex) => total + exerciseSeconds(ex), 0) / 60)
}

/** Agrupa exercícios consecutivos da mesma supersérie; os demais ficam sozinhos. Devolve os índices. */
export function groupIndexes(exercises: readonly PlannedExercise[]): number[][] {
  const out: number[][] = []
  exercises.forEach((ex, i) => {
    const last = out.at(-1)
    if (ex.group && last && exercises[last[0]].group === ex.group) last.push(i)
    else out.push([i])
  })
  return out
}

/** Supersérie: as séries se alternam e o descanso só acontece depois de cada rodada. */
function supersetSeconds(items: PlannedExercise[]): number {
  const rounds = Math.max(...items.map((x) => x.sets))
  const work = items.reduce((t, x) => t + x.sets * workSeconds(x), 0)
  const rest = Math.max(...items.map((x) => x.restSec))
  return work + rounds * (items.length - 1) * SUPERSET_SWITCH_SEC + (rounds - 1) * rest
}

/** Duração do bloco inteiro, incluindo a troca entre exercícios. */
export function blockMinutes(exercises: PlannedExercise[], transitionSec = TRANSITION_SEC): number {
  const seconds = groupIndexes(exercises).reduce((total, idx) => {
    const items = idx.map((i) => exercises[i])
    return total + (items.length > 1 ? supersetSeconds(items) : exerciseSeconds(items[0])) + transitionSec
  }, 0)
  return Math.round(seconds / 60)
}

/**
 * Junta os acessórios em pares de supersérie, na ordem em que aparecem (A1+A2, B1+B2…).
 * Core fica de fora: costuma ser feito no fim, sozinho.
 */
export function pairAccessories(exercises: PlannedExercise[]): PlannedExercise[] {
  const out = exercises.map((x) => ({ ...x }))
  const candidates = out.map((x, i) => ({ x, i })).filter(({ x }) => x.priority === 'acessorio' && !x.slot.startsWith('core') && !x.group)
  let n = 0
  for (let k = 0; k + 1 < candidates.length; k += 2) {
    const a = candidates[k]
    const b = candidates[k + 1]
    if (b.i !== a.i + 1) {
      // Só junta vizinhos; se houver algo no meio, o segundo sobe para ficar logo depois do primeiro.
      const [moved] = out.splice(b.i, 1)
      out.splice(a.i + 1, 0, moved)
      candidates.forEach((c) => {
        if (c.i > a.i && c.i < b.i) c.i += 1
      })
      b.i = a.i + 1
    }
    const id = `S${++n}`
    out[a.i].group = id
    out[b.i].group = id
  }
  return out
}

/** Tira a marca de supersérie de quem ficou sozinho (ex.: o par foi cortado por tempo). */
export function cleanGroups(exercises: PlannedExercise[]): PlannedExercise[] {
  const sizes = new Map<string, number>()
  for (const idx of groupIndexes(exercises)) {
    const g = exercises[idx[0]].group
    if (g) sizes.set(g, Math.max(sizes.get(g) ?? 0, idx.length))
  }
  return exercises.map((x) => {
    if (!x.group || (sizes.get(x.group) ?? 0) > 1) return x
    const { group: _drop, ...rest } = x
    return rest
  })
}
