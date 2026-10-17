import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { shareWorkout } from '../state/shareImage'
import { Loading, ScreenHeader } from '../components/ui'
import { exerciseName } from '../data/catalog'
import { bestLoad, formatVolume, personalRecords, volumeKg } from '../engine/history'
import { useLog, useLogs, useProgram } from '../state/hooks'

const kg = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

export function Resumo() {
  const id = Number(useParams().id)
  const log = useLog(id)
  const logs = useLogs()
  const program = useProgram()
  const [sharing, setSharing] = useState('')
  if (log === undefined || !logs || program === undefined) return <Loading />
  if (log === null) return <ScreenHeader back title="Treino não encontrado" />

  const previous = logs.filter((l) => l.id !== log.id && l.date < log.date)
  const records = personalRecords(log, previous)
  const done = log.sets.filter((s) => s.done)
  const exercises = [...new Set(log.sets.map((s) => s.exerciseId))]
  const next = program?.sessions.length ? program.sessions[logs.length % program.sessions.length] : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="card relative flex flex-col items-center gap-2 overflow-hidden border-lime-edge bg-[linear-gradient(160deg,var(--color-lime-deep)_0%,var(--color-card)_70%)] py-8 text-center">
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,255,61,.3), transparent 70%)' }}
          aria-hidden="true"
        />
        <span className="relative grid h-14 w-14 animate-[pop_.5s_ease-out] place-items-center rounded-full bg-lime text-2xl font-extrabold text-lime-ink shadow-[0_0_32px_rgba(200,255,61,.5)]">
          ✓
        </span>
        <div className="eyebrow relative mt-2">Treino concluído</div>
        <h1 className="relative font-display text-[26px] leading-tight font-bold">{log.sessionTitle}</h1>
        <p className="relative text-xs text-muted">
          {new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat value={`${log.durationMin} min`} label="duração" />
        <Stat value={formatVolume(volumeKg(log))} label="volume levantado" />
        <Stat value={`${done.length}/${log.sets.length}`} label="séries feitas" />
        <Stat value={`~${log.kcal}`} label="kcal estimadas" />
      </div>

      {records.length > 0 && (
        <div className="card flex flex-col gap-2">
          <h2 className="font-display text-[15px] font-medium">Recordes novos</h2>
          {records.map((r) => (
            <div key={r.exerciseId} className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
              <span>{exerciseName(r.exerciseId)}</span>
              <span className="font-mono text-lime">
                {kg(r.previousKg)} → {kg(r.loadKg)} kg
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card flex flex-col gap-1">
        <h2 className="mb-1 font-display text-[15px] font-medium">O que você fez</h2>
        {exercises.map((id) => {
          const sets = log.sets.filter((s) => s.exerciseId === id && s.done)
          const best = bestLoad(sets)
          return (
            <div key={id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
              <span className={sets.length ? '' : 'text-dim'}>{exerciseName(id)}</span>
              <span className="shrink-0 font-mono text-xs text-muted">
                {sets.length ? `${sets.length} × ${best ? `${kg(best)} kg` : 'peso do corpo'}` : 'pulado'}
              </span>
            </div>
          )
        })}
        {log.cardioMinutes > 0 && (
          <div className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>Aeróbico</span>
            <span className="font-mono text-xs text-cardio">{log.cardioMinutes} min</span>
          </div>
        )}
      </div>

      {next && (
        <p className="text-center text-xs text-muted">
          Próximo: Treino {next.key} · {next.title}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost flex-1"
          disabled={sharing === 'gerando'}
          onClick={async () => {
            setSharing('gerando')
            try {
              const r = await shareWorkout(log, previous)
              setSharing(r === 'baixado' ? 'Imagem salva.' : '')
            } catch {
              setSharing('Não deu para gerar a imagem.')
            }
          }}
        >
          {sharing === 'gerando' ? 'Gerando…' : 'Compartilhar'}
        </button>
        <Link to="/" className="btn btn-lime flex-1">
          Concluir
        </Link>
      </div>
      {sharing && sharing !== 'gerando' && (
        <p role="status" className="text-center text-xs text-muted">
          {sharing}
        </p>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-card p-3.5">
      <b className="block font-display text-[21px] font-medium tabular-nums">{value}</b>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  )
}
