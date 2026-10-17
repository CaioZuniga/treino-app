import { useParams } from 'react-router-dom'
import { ExerciseAnimation } from '../components/ExerciseAnimation'
import { ScreenHeader } from '../components/ui'
import { EXERCISE_BY_ID, EXERCISES } from '../data/catalog'
import { EQUIPMENT } from '../data/equipment'
import { INJURY_LABELS, LEVEL_LABELS, MUSCLE_LABELS } from '../data/labels'
import { alternatives } from '../engine'
import { useEnvironment, useProfile } from '../state/hooks'

const EQUIPMENT_NAME = new Map(EQUIPMENT.map((e) => [e.id, e.name]))

export function Exercicio() {
  const { id = '' } = useParams()
  const profile = useProfile()
  const env = useEnvironment(profile?.activeEnvironmentId)
  const ex = EXERCISE_BY_ID.get(id)
  if (!ex) return <ScreenHeader back title="Exercício não encontrado" />

  const equipmentText =
    ex.equipment.length === 0 ? 'Sem equipamento' : ex.equipment.map((opt) => opt.map((i) => EQUIPMENT_NAME.get(i) ?? i).join(' + ')).join(' ou ')
  const alts =
    profile && env
      ? alternatives(ex.id, ex.pattern, 'secundario', { profile, available: new Set(env.equipment), exercises: EXERCISES, seed: 1 }).slice(0, 4)
      : []

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader back title="" />
      <ExerciseAnimation images={ex.images} name={ex.name} />
      <div>
        <div className="eyebrow">
          {ex.mechanic === 'composto' ? 'Composto' : ex.mechanic === 'isolado' ? 'Isolado' : 'Mobilidade'} · {LEVEL_LABELS[ex.level]}
        </div>
        <h1 className="mt-1.5 font-display text-[26px] leading-tight font-bold text-balance">{ex.name}</h1>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ex.primaryMuscles.map((m) => (
          <span key={m} className="chip chip-on">
            {MUSCLE_LABELS[m]}
          </span>
        ))}
        {ex.secondaryMuscles.map((m) => (
          <span key={m} className="chip">
            {MUSCLE_LABELS[m]}
          </span>
        ))}
      </div>

      <div className="card flex flex-col gap-3">
        <h2 className="font-display text-[15px] font-medium">Execução</h2>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {ex.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="font-mono text-lime">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Equipamento</span>
          <span className="text-right">{equipmentText}</span>
        </div>
        {ex.contraindications.length > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Cuidado com</span>
            <span className="text-right text-cardio">{ex.contraindications.map((c) => INJURY_LABELS[c]).join(', ')}</span>
          </div>
        )}
      </div>

      {alts.length > 0 && (
        <div className="card flex flex-col gap-1.5">
          <h2 className="font-display text-[15px] font-medium">Alternativas no seu ambiente</h2>
          <p className="text-sm leading-relaxed text-muted">{alts.map((a) => a.name).join(' · ')}</p>
        </div>
      )}
    </div>
  )
}
