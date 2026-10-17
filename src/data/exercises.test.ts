import { describe, expect, it } from 'vitest'
import type { Exercise, Pattern } from '../types'
import { fitsEnvironment, isSafeFor } from '../engine/equipment'
import { ENVIRONMENT_PRESETS } from './equipment'
import data from './exercises.json'

const exercises = data as Exercise[]

// Vagas que todo treino de corpo inteiro precisa conseguir preencher em qualquer ambiente.
const ESSENTIAL: Pattern[] = ['empurrar_h', 'empurrar_v', 'puxar_v', 'puxar_h', 'agachar', 'dobradica', 'unilateral', 'gluteo', 'core_estab']

const optionsFor = (pattern: Pattern, equipment: string[]) => {
  const available = new Set(equipment)
  return exercises.filter((e) => e.pattern === pattern && fitsEnvironment(e, available))
}

describe('banco de exercícios', () => {
  it('todo exercício tem nome, instruções e músculo principal', () => {
    for (const e of exercises) {
      expect(e.name, e.id).toBeTruthy()
      expect(e.instructions.length, e.id).toBeGreaterThanOrEqual(e.pattern === 'mobilidade' ? 1 : 2)
      expect(e.primaryMuscles.length, e.id).toBeGreaterThan(0)
    }
  })

  it('exercícios da fonte têm as duas fotos para a animação', () => {
    for (const e of exercises.filter((x) => !x.id.startsWith('custom_'))) {
      expect(e.images.length, e.id).toBeGreaterThanOrEqual(2)
    }
  })

  it.each(ENVIRONMENT_PRESETS)('$name preenche as vagas essenciais', (preset) => {
    // "Só peso corporal" não tem como puxar na vertical sem barra fixa ou elástico; o motor troca por puxar_h.
    const essential = preset.equipment.length <= 1 ? ESSENTIAL.filter((p) => p !== 'puxar_v') : ESSENTIAL
    for (const pattern of essential) {
      expect(optionsFor(pattern, preset.equipment).length, `${preset.name} / ${pattern}`).toBeGreaterThan(0)
    }
  })

  it('há aquecimento de mobilidade para cada articulação', () => {
    for (const joint of ['quadril', 'tornozelo', 'joelho', 'ombro', 'toracica', 'lombar', 'punho', 'cervical'] as const) {
      const n = exercises.filter((e) => e.pattern === 'mobilidade' && e.joints.includes(joint)).length
      expect(n, joint).toBeGreaterThanOrEqual(2)
    }
  })

  it('quem tem lesão lombar ainda tem opção de agachar e de dobradiça na academia', () => {
    const gym = ENVIRONMENT_PRESETS[0].equipment
    for (const pattern of ['agachar', 'dobradica'] as const) {
      const safe = optionsFor(pattern, gym).filter((e) => isSafeFor(e, ['lombar']))
      expect(safe.length, pattern).toBeGreaterThan(0)
    }
  })
})

describe('fitsEnvironment', () => {
  const ex = (equipment: string[][]) => ({ equipment }) as Exercise

  it('aceita exercício sem equipamento', () => {
    expect(fitsEnvironment(ex([]), new Set())).toBe(true)
  })

  it('exige todos os itens de uma alternativa', () => {
    const supino = ex([['barra', 'anilhas', 'banco']])
    expect(fitsEnvironment(supino, new Set(['barra', 'banco']))).toBe(false)
    expect(fitsEnvironment(supino, new Set(['barra', 'anilhas', 'banco']))).toBe(true)
  })

  it('basta uma das alternativas', () => {
    const goblet = ex([['kettlebell'], ['halteres']])
    expect(fitsEnvironment(goblet, new Set(['halteres']))).toBe(true)
  })
})
