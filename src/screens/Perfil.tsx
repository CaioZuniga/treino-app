import { useEffect, useRef, useState } from 'react'
import { InstallCard } from '../components/InstallCard'
import { ChoiceCards, ChoiceChips, Loading, ScreenHeader, Section, Stepper, Switch, TextField } from '../components/ui'
import { importBackup, type Backup } from '../db/db'
import { backupNow, lastBackupAt } from '../state/backup'
import { CARDIO_OPTIONS, FOCUS_OPTIONS, GOAL_LABELS, INJURY_LABELS, LEVEL_LABELS, SPLIT_HINTS, suggestedSplit } from '../data/labels'
import { SPLIT_LABELS } from '../engine'
import { saveProfile } from '../state/actions'
import { useProfile, useProgram } from '../state/hooks'
import { prefetchProgramImages } from '../state/platform'
import type { Goal, Injury, Level, Profile, Sex, Split } from '../types'

const entries = <K extends string>(labels: Record<K, string>) => (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }))
const MINUTES = ['30', '45', '60', '75', '90']

export function Perfil() {
  const stored = useProfile()
  const [draft, setDraft] = useState<Profile | null>(null)
  const [status, setStatus] = useState('')
  const [deviceStatus, setDeviceStatus] = useState('')
  const program = useProgram()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (stored && !draft) setDraft(stored)
  }, [stored, draft])

  if (!stored || !draft) return <Loading />
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setDraft({ ...draft, [k]: v })
    setStatus('')
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored)

  const save = async () => {
    if (!draft.name.trim()) return setStatus('Escreva seu nome antes de salvar.')
    await saveProfile({ ...draft, name: draft.name.trim() })
    setStatus('Salvo. O treino foi atualizado.')
  }

  const download = async () => {
    const result = await backupNow()
    if (result !== 'cancelado') setDeviceStatus(result === 'compartilhado' ? 'Backup enviado.' : 'Backup salvo em Downloads.')
  }

  const downloadPhotos = async () => {
    if (!program) return
    setDeviceStatus('Baixando fotos…')
    const ok = await prefetchProgramImages(program, (done, total) => setDeviceStatus(`Baixando fotos… ${done} de ${total}`))
    setDeviceStatus(ok ? `${ok} fotos guardadas para usar sem internet.` : 'Não deu para baixar agora. Confira a conexão.')
  }

  const upload = async (file: File) => {
    try {
      await importBackup(JSON.parse(await file.text()) as Backup)
      setDraft(null)
      setDeviceStatus('Backup importado.')
    } catch (e) {
      setDeviceStatus(e instanceof SyntaxError ? 'Esse arquivo não é um JSON válido.' : (e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader eyebrow="Base do motor de regras" title="Seu perfil" />

      <div className="flex flex-col gap-3">
        <TextField id="perfil-nome" label="Nome" value={draft.name} onChange={(v) => set('name', v)} />
        <ChoiceChips label="Sexo" options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }]} value={[draft.sex]} onChange={(v) => set('sex', v[0] as Sex)} />
        <Stepper id="perfil-idade" label="Idade" value={draft.age} onChange={(v) => set('age', v)} min={14} max={90} unit="anos" />
        <Stepper id="perfil-peso" label="Peso" value={draft.weightKg} onChange={(v) => set('weightKg', v)} min={35} max={200} unit="kg" />
        <Stepper id="perfil-altura" label="Altura" value={draft.heightCm} onChange={(v) => set('heightCm', v)} min={130} max={220} unit="cm" />
      </div>

      <Section title="Experiência">
        <ChoiceChips label="Nível" options={entries(LEVEL_LABELS)} value={[draft.level]} onChange={(v) => set('level', v[0] as Level)} />
      </Section>
      <Section title="Dores ou lesões">
        <ChoiceChips label="Lesões" multiple options={entries(INJURY_LABELS)} value={draft.injuries} onChange={(v) => set('injuries', v as Injury[])} />
      </Section>
      <Section title="Objetivo">
        <ChoiceChips label="Objetivo" options={entries(GOAL_LABELS)} value={[draft.goal]} onChange={(v) => set('goal', v[0] as Goal)} />
      </Section>
      <Stepper id="perfil-dias" label="Dias por semana" value={draft.daysPerWeek} onChange={(v) => set('daysPerWeek', v)} min={2} max={6} />
      <Section title="Tempo por treino">
        <ChoiceChips label="Minutos" options={MINUTES.map((m) => ({ value: m, label: `${m} min` }))} value={[String(draft.minutesPerSession)]} onChange={(v) => set('minutesPerSession', Number(v[0]))} />
      </Section>
      <Switch
        id="perfil-superseries"
        label="Superséries nos acessórios"
        hint="Junta os exercícios acessórios em pares, sem descanso entre eles. Encurta o treino e cabe mais exercício no seu tempo."
        checked={!!draft.supersets}
        onChange={(v) => set('supersets', v)}
      />
      <Switch
        id="perfil-periodizacao"
        label="Periodização automática"
        hint="Ciclos de 5 semanas: 4 de progressão e 1 de deload. No fim do ciclo, o app varia os exercícios sozinho."
        checked={draft.periodization !== false}
        onChange={(v) => set('periodization', v)}
      />
      <Section title="Divisão">
        <ChoiceCards
          label="Divisão"
          options={(Object.keys(SPLIT_LABELS) as Split[]).map((s) => ({
            value: s,
            label: SPLIT_LABELS[s],
            hint: SPLIT_HINTS[s],
            badge: s === suggestedSplit(draft.daysPerWeek) ? 'sugerida' : undefined,
          }))}
          value={draft.split}
          onChange={(v) => set('split', v)}
        />
      </Section>
      <Section title="Foco muscular" hint="Até 2.">
        <ChoiceChips label="Foco" multiple options={FOCUS_OPTIONS.map((f) => ({ value: f.id, label: f.label }))} value={draft.focus} onChange={(v) => set('focus', v.slice(-2))} />
      </Section>
      <Section title="Aeróbico preferido">
        <ChoiceChips
          label="Aeróbico"
          multiple
          options={CARDIO_OPTIONS.map((c) => ({ value: c.id, label: c.label }))}
          value={draft.likes.filter((l) => CARDIO_OPTIONS.some((c) => c.id === l))}
          onChange={(v) => set('likes', [...draft.likes.filter((l) => !CARDIO_OPTIONS.some((c) => c.id === l)), ...v])}
        />
      </Section>

      <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 bg-bg/95 px-1 py-3">
        {status && (
          <p role="status" className="text-[13px] text-lime">
            {status}
          </p>
        )}
        <button type="button" className="btn btn-lime" onClick={save} disabled={!dirty}>
          {dirty ? 'Salvar e atualizar treino' : 'Tudo salvo'}
        </button>
      </div>

      <Section title="App no celular" hint="As telas já funcionam sem internet depois da primeira abertura. Baixe as fotos do seu treino para vê-las offline também.">
        <InstallCard />
        <button type="button" className="btn btn-ghost" onClick={downloadPhotos} disabled={!program}>
          Baixar fotos do treino
        </button>
      </Section>

      <Section title="Backup" hint="Seus dados ficam só neste aparelho. Exporte um arquivo para guardar no Drive, no iCloud ou mandar para outro celular.">
        <p className="text-xs text-muted">
          {lastBackupAt() ? `Último backup: ${new Date(lastBackupAt()!).toLocaleDateString('pt-BR')}` : 'Nenhum backup feito ainda.'} O app lembra a cada 2 semanas.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={download}>
            Exportar backup
          </button>
          <button type="button" className="btn btn-ghost flex-1" onClick={() => fileRef.current?.click()}>
            Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
              e.target.value = ''
            }}
          />
        </div>
        {deviceStatus && (
          <p role="status" className="text-[13px] text-lime">
            {deviceStatus}
          </p>
        )}
      </Section>

      <p className="text-xs leading-relaxed text-dim">
        O Treino monta sugestões a partir de regras gerais de musculação. Ele não substitui a orientação de um profissional de educação física
        ou de saúde, principalmente se você tem alguma lesão.
      </p>
    </div>
  )
}
