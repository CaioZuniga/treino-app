import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EquipmentChecklist } from '../components/EquipmentChecklist'
import { ChoiceCards, ChoiceChips, Section, Stepper, TextField } from '../components/ui'
import { ENVIRONMENT_PRESETS } from '../data/equipment'
import {
  CARDIO_OPTIONS,
  FOCUS_OPTIONS,
  GOAL_HINTS,
  GOAL_LABELS,
  INJURY_LABELS,
  LEVEL_HINTS,
  LEVEL_LABELS,
  SPLIT_HINTS,
  suggestedSplit,
} from '../data/labels'
import { SPLIT_LABELS } from '../engine'
import { finishOnboarding, initials } from '../state/actions'
import type { Goal, Injury, Level, Profile, Sex, Split } from '../types'

const STEPS = ['Sobre você', 'Experiência', 'Objetivo e rotina', 'Divisão', 'Preferências', 'Primeiro ambiente']
const MINUTES = ['30', '45', '60', '75', '90'] as const

const entries = <K extends string>(labels: Record<K, string>, hints?: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value], hint: hints?.[value] }))

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('M')
  const [age, setAge] = useState(30)
  const [weightKg, setWeight] = useState(75)
  const [heightCm, setHeight] = useState(172)
  const [level, setLevel] = useState<Level>('iniciante')
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [goal, setGoal] = useState<Goal>('hipertrofia')
  const [daysPerWeek, setDays] = useState(3)
  const [minutes, setMinutes] = useState<(typeof MINUTES)[number]>('60')
  const [split, setSplit] = useState<Split | null>(null)
  const [focus, setFocus] = useState<string[]>([])
  const [likes, setLikes] = useState<string[]>([])
  const [envName, setEnvName] = useState('Academia')
  const [preset, setPreset] = useState(ENVIRONMENT_PRESETS[0].name)
  const [equipment, setEquipment] = useState<string[]>(ENVIRONMENT_PRESETS[0].equipment)

  const chosenSplit = split ?? suggestedSplit(daysPerWeek)
  const last = step === STEPS.length - 1

  const next = async () => {
    if (step === 0 && !name.trim()) return setError('Escreva como quer ser chamado.')
    if (step === 4 && focus.length > 2) return setError('Escolha no máximo 2 focos.')
    if (last && !envName.trim()) return setError('Dê um nome ao ambiente.')
    setError('')
    if (!last) return setStep(step + 1)

    setSaving(true)
    const profile: Profile = {
      id: 'me',
      name: name.trim(),
      age,
      sex,
      weightKg,
      heightCm,
      level,
      injuries,
      goal,
      daysPerWeek,
      minutesPerSession: Number(minutes),
      split: chosenSplit,
      likes,
      dislikes: [],
      focus,
    }
    await finishOnboarding(profile, { name: envName.trim(), icon: initials(envName), equipment })
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col bg-bg">
      <main
        className="flex flex-1 flex-col gap-6 overflow-y-auto py-6"
        style={{
          paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(20px, env(safe-area-inset-right, 0px))',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-lime' : 'bg-card2'}`} />
            ))}
          </div>
          <div className="eyebrow">
            Passo {step + 1} de {STEPS.length}
          </div>
          <h1 className="font-display text-[26px] leading-tight font-bold">{STEPS[step]}</h1>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <TextField
              id="nome"
              label="Como quer ser chamado"
              value={name}
              onChange={(v) => {
                setName(v)
                setError('')
              }}
              placeholder="Caio"
            />
            <Section title="Sexo" hint="Usado para estimar calorias.">
              <ChoiceChips label="Sexo" options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }]} value={[sex]} onChange={(v) => setSex(v[0] as Sex)} />
            </Section>
            <Stepper id="idade" label="Idade" value={age} onChange={setAge} min={14} max={90} unit="anos" />
            <Stepper id="peso" label="Peso" value={weightKg} onChange={setWeight} min={35} max={200} unit="kg" />
            <Stepper id="altura" label="Altura" value={heightCm} onChange={setHeight} min={130} max={220} unit="cm" />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <Section title="Nível de experiência">
              <ChoiceCards label="Nível" options={entries(LEVEL_LABELS, LEVEL_HINTS)} value={level} onChange={setLevel} />
            </Section>
            <Section title="Dores ou lesões" hint="O treino evita os exercícios que forçam essas regiões.">
              <ChoiceChips label="Lesões" multiple options={entries(INJURY_LABELS)} value={injuries} onChange={setInjuries} />
            </Section>
            {injuries.length > 0 && (
              <p className="rounded-2xl border border-cardio/40 bg-cardio/10 p-3.5 text-xs leading-relaxed text-fg">
                O app ajuda a escolher exercícios, mas não substitui a avaliação de um profissional de saúde ou de educação física.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <Section title="Objetivo principal">
              <ChoiceCards label="Objetivo" options={entries(GOAL_LABELS, GOAL_HINTS)} value={goal} onChange={setGoal} />
            </Section>
            <Stepper id="dias" label="Dias por semana" value={daysPerWeek} onChange={setDays} min={2} max={6} />
            <Section title="Tempo por treino">
              <ChoiceChips label="Minutos" options={MINUTES.map((m) => ({ value: m, label: `${m} min` }))} value={[minutes]} onChange={(v) => setMinutes(v[0])} />
            </Section>
          </div>
        )}

        {step === 3 && (
          <Section title="Como dividir os treinos" hint={`Para ${daysPerWeek} dias por semana, sugerimos ${SPLIT_LABELS[suggestedSplit(daysPerWeek)]}.`}>
            <ChoiceCards
              label="Divisão"
              options={(Object.keys(SPLIT_LABELS) as Split[]).map((s) => ({
                value: s,
                label: SPLIT_LABELS[s],
                hint: SPLIT_HINTS[s],
                badge: s === suggestedSplit(daysPerWeek) ? 'sugerida' : undefined,
              }))}
              value={chosenSplit}
              onChange={setSplit}
            />
          </Section>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <Section title="Foco muscular" hint="Até 2. Ganham um exercício extra nos dias da região.">
              <ChoiceChips label="Foco" multiple options={FOCUS_OPTIONS.map((f) => ({ value: f.id, label: f.label }))} value={focus} onChange={setFocus} />
            </Section>
            <Section title="Aeróbico preferido" hint="Usado primeiro quando o ambiente tiver o aparelho.">
              <ChoiceChips label="Aeróbico" multiple options={CARDIO_OPTIONS.map((c) => ({ value: c.id, label: c.label }))} value={likes} onChange={setLikes} />
            </Section>
          </div>
        )}

        {last && (
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-relaxed text-muted">
              Ambiente é o lugar onde você treina. Depois dá para criar outros, como casa ou hotel, e trocar quando quiser.
            </p>
            <TextField id="ambiente" label="Nome do ambiente" value={envName} onChange={setEnvName} placeholder="Academia do prédio" />
            <Section title="Ponto de partida">
              <ChoiceChips
                label="Ponto de partida"
                options={ENVIRONMENT_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
                value={[preset]}
                onChange={(v) => {
                  setPreset(v[0])
                  setEquipment(ENVIRONMENT_PRESETS.find((p) => p.name === v[0])!.equipment)
                }}
              />
            </Section>
            <Section title={`Equipamentos (${equipment.length})`} hint="Marque o que existe neste lugar.">
              <EquipmentChecklist value={equipment} onChange={setEquipment} />
            </Section>
          </div>
        )}
      </main>

      <footer
        className="flex flex-col gap-2 border-t border-line bg-bg px-5 pt-3"
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
      >
        {error && (
          <p role="alert" className="text-[13px] text-cardio">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Voltar
            </button>
          )}
          <button type="button" className="btn btn-lime flex-1" onClick={next} disabled={saving}>
            {last ? (saving ? 'Montando treino…' : 'Gerar meu treino') : 'Continuar'}
          </button>
        </div>
      </footer>
    </div>
  )
}
