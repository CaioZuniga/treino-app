// Monta src/data/exercises.json a partir de:
//   - data/curadoria.txt      (seleção, nomes, padrões, equipamentos, lesões)
//   - data/instrucoes-pt.json (instruções traduzidas)
//   - free-exercise-db        (músculos, nível, mecânica, fotos), baixado no commit fixado abaixo
// Uso: npm run build:exercises
// Falha (exit 1) se algo na curadoria não bater com o catálogo ou com a fonte.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EQUIPMENT } from '../src/data/equipment.ts'

export const FEDB_COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
const FEDB_URL = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${FEDB_COMMIT}/dist/exercises.json`

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cacheFile = join(root, 'data', '.cache', `fedb-${FEDB_COMMIT.slice(0, 7)}.json`)

const PATTERNS = new Set([
  'empurrar_h', 'empurrar_inc', 'empurrar_v', 'puxar_v', 'puxar_h', 'peito_iso', 'ombro_lateral', 'ombro_frontal',
  'ombro_posterior', 'trapezio', 'biceps', 'triceps', 'antebraco', 'agachar', 'unilateral', 'quadriceps_iso', 'dobradica',
  'posterior_iso', 'gluteo', 'abdutor', 'adutor', 'panturrilha', 'lombar', 'core_estab', 'core_flexao', 'core_rot',
  'condicionamento', 'cardio', 'mobilidade',
])
const INJURIES = new Set(['joelho', 'lombar', 'ombro', 'punho', 'cotovelo', 'quadril', 'tornozelo', 'cervical'])
const JOINTS = new Set(['quadril', 'tornozelo', 'joelho', 'ombro', 'toracica', 'lombar', 'punho', 'cotovelo', 'cervical'])
const EQUIPMENT_IDS = new Set(EQUIPMENT.map((e) => e.id))

const MUSCLES: Record<string, string> = {
  abdominals: 'abdomen', adductors: 'adutores', abductors: 'abdutores', forearms: 'antebraco', biceps: 'biceps',
  lats: 'dorsal', glutes: 'gluteos', 'lower back': 'lombar', 'middle back': 'meio_costas', shoulders: 'ombros',
  calves: 'panturrilha', chest: 'peito', neck: 'pescoco', hamstrings: 'posterior', quadriceps: 'quadriceps',
  traps: 'trapezio', triceps: 'triceps',
}
const LEVELS: Record<string, string> = { beginner: 'iniciante', intermediate: 'intermediario', expert: 'avancado' }
const MECHANICS: Record<string, string> = { compound: 'composto', isolation: 'isolado' }

/** Músculos dos exercícios custom_ (que não existem na fonte). */
const CUSTOM: Record<string, { primary: string[]; secondary: string[]; level: string; mechanic: string | null }> = {
  custom_band_pulldown: { primary: ['dorsal'], secondary: ['biceps'], level: 'iniciante', mechanic: 'composto' },
  custom_band_row: { primary: ['meio_costas'], secondary: ['dorsal', 'biceps'], level: 'iniciante', mechanic: 'composto' },
  custom_table_row: { primary: ['meio_costas'], secondary: ['dorsal', 'biceps'], level: 'iniciante', mechanic: 'composto' },
  custom_sl_rdl_bw: { primary: ['posterior'], secondary: ['gluteos', 'lombar'], level: 'iniciante', mechanic: 'composto' },
  custom_pike_pushup: { primary: ['ombros'], secondary: ['triceps'], level: 'intermediario', mechanic: 'composto' },
  custom_band_curl: { primary: ['biceps'], secondary: [], level: 'iniciante', mechanic: 'isolado' },
  custom_calf_raise: { primary: ['panturrilha'], secondary: [], level: 'iniciante', mechanic: 'isolado' },
  custom_jumping_jack: { primary: ['quadriceps'], secondary: ['panturrilha', 'ombros'], level: 'iniciante', mechanic: 'composto' },
  custom_burpee: { primary: ['quadriceps'], secondary: ['peito', 'ombros', 'abdomen'], level: 'intermediario', mechanic: 'composto' },
  custom_high_knees: { primary: ['quadriceps'], secondary: ['panturrilha', 'abdomen'], level: 'iniciante', mechanic: 'composto' },
  custom_shadow_boxing: { primary: ['ombros'], secondary: ['abdomen'], level: 'iniciante', mechanic: 'composto' },
  custom_90_90: { primary: ['gluteos'], secondary: ['adutores'], level: 'iniciante', mechanic: null },
  custom_ankle_wall: { primary: ['panturrilha'], secondary: [], level: 'iniciante', mechanic: null },
  custom_open_book: { primary: ['meio_costas'], secondary: ['peito'], level: 'iniciante', mechanic: null },
  custom_wall_slide: { primary: ['ombros'], secondary: ['trapezio'], level: 'iniciante', mechanic: null },
  custom_band_dislocate: { primary: ['ombros'], secondary: ['peito'], level: 'iniciante', mechanic: null },
  custom_deep_squat_hold: { primary: ['quadriceps'], secondary: ['gluteos', 'adutores'], level: 'iniciante', mechanic: null },
  custom_glute_bridge_march: { primary: ['gluteos'], secondary: ['abdomen', 'posterior'], level: 'iniciante', mechanic: null },
  custom_scap_pushup: { primary: ['ombros'], secondary: ['peito'], level: 'iniciante', mechanic: null },
}

interface FedbExercise {
  id: string
  level: string
  mechanic: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  images: string[]
}

async function loadFedb(): Promise<Map<string, FedbExercise>> {
  if (!existsSync(cacheFile)) {
    const res = await fetch(FEDB_URL)
    if (!res.ok) throw new Error(`Não consegui baixar o free-exercise-db (${res.status})`)
    mkdirSync(dirname(cacheFile), { recursive: true })
    writeFileSync(cacheFile, await res.text())
  }
  const list: FedbExercise[] = JSON.parse(readFileSync(cacheFile, 'utf8'))
  return new Map(list.map((e) => [e.id, e]))
}

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

async function main() {
  const fedb = await loadFedb()
  const instructions: Record<string, string[]> = JSON.parse(
    readFileSync(join(root, 'data', 'instrucoes-pt.json'), 'utf8'),
  )
  const lines = readFileSync(join(root, 'data', 'curadoria.txt'), 'utf8').split(/\r?\n/)
  const errors: string[] = []
  const seen = new Set<string>()
  const out = []

  for (const [i, raw] of lines.entries()) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const where = `curadoria.txt:${i + 1}`
    const cols = line.split('|')
    if (cols.length !== 6) {
      errors.push(`${where}: esperava 6 colunas, achei ${cols.length}`)
      continue
    }
    const [id, name, pattern, equip, injuries, joints] = cols.map((c) => c.trim())

    if (seen.has(id)) errors.push(`${where}: id repetido ${id}`)
    seen.add(id)
    if (!PATTERNS.has(pattern)) errors.push(`${where}: padrão desconhecido "${pattern}"`)

    const equipment = equip === '-' ? [] : equip.split('/').map((opt) => opt.split('+').map((x) => x.trim()))
    for (const item of equipment.flat()) {
      if (!EQUIPMENT_IDS.has(item)) errors.push(`${where}: equipamento fora do catálogo "${item}"`)
    }
    const contraindications = list(injuries)
    for (const inj of contraindications) if (!INJURIES.has(inj)) errors.push(`${where}: lesão desconhecida "${inj}"`)
    const jointList = list(joints)
    for (const j of jointList) if (!JOINTS.has(j)) errors.push(`${where}: articulação desconhecida "${j}"`)
    if (pattern === 'mobilidade' && jointList.length === 0) errors.push(`${where}: mobilidade sem articulações`)

    const steps = instructions[id]
    if (!steps?.length) errors.push(`${where}: sem instruções em data/instrucoes-pt.json (${id})`)

    let meta
    if (id.startsWith('custom_')) {
      const c = CUSTOM[id]
      if (!c) {
        errors.push(`${where}: ${id} precisa de músculos em CUSTOM`)
        continue
      }
      meta = { primaryMuscles: c.primary, secondaryMuscles: c.secondary, level: c.level, mechanic: c.mechanic, images: [] }
    } else {
      const src = fedb.get(id)
      if (!src) {
        errors.push(`${where}: ${id} não existe no free-exercise-db`)
        continue
      }
      meta = {
        primaryMuscles: src.primaryMuscles.map((m) => MUSCLES[m]),
        secondaryMuscles: src.secondaryMuscles.map((m) => MUSCLES[m]),
        level: LEVELS[src.level],
        mechanic: src.mechanic ? MECHANICS[src.mechanic] : null,
        images: src.images,
      }
    }

    out.push({ id, name, pattern, equipment, contraindications, joints: jointList, ...meta, instructions: steps ?? [] })
  }

  const extra = Object.keys(instructions).filter((id) => !seen.has(id))
  if (extra.length) errors.push(`instrucoes-pt.json tem ids fora da curadoria: ${extra.join(', ')}`)

  if (errors.length) {
    console.error(errors.join('\n'))
    console.error(`\n${errors.length} problema(s). Nada foi gravado.`)
    process.exit(1)
  }

  writeFileSync(join(root, 'src', 'data', 'exercises.json'), JSON.stringify(out, null, 1) + '\n')
  const byPattern: Record<string, number> = {}
  for (const e of out) byPattern[e.pattern] = (byPattern[e.pattern] ?? 0) + 1
  console.log(`${out.length} exercícios gravados em src/data/exercises.json`)
  console.log(Object.entries(byPattern).map(([p, n]) => `${p}: ${n}`).join(' · '))
}

main()
