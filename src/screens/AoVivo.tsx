import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { prescriptionText } from '../components/ExerciseRow'
import { formatClock, RingTimer, useTick, type Countdown } from '../components/Timer'
import { Dot, Loading } from '../components/ui'
import { exerciseName } from '../data/catalog'
import type { LoadSuggestion } from '../engine'
import { liveElapsedMs } from '../engine/history'
import { discardLive, finishLive, pauseLive, resumeLive, startLive, suggestionsFor, updateLive } from '../state/actions'
import { haptic, unlockAudio } from '../state/platform'
import { useLive } from '../state/hooks'
import type { LiveSet, LiveWorkout } from '../types'

type Step = { kind: 'mobilidade' } | { kind: 'musculacao'; index: number } | { kind: 'aerobico' }

const PRIORITY_LABEL = { principal: 'Principal', secundario: 'Secundário', acessorio: 'Acessório' } as const

function suggestionText(s: LoadSuggestion | undefined): string {
  if (!s || s.reason === 'sem_historico') return 'Primeira vez: comece com uma carga em que você faria 2 repetições a mais.'
  const kg = String(s.loadKg).replace('.', ',')
  if (s.reason === 'subir') return `Você fechou a faixa da última vez: suba para ${kg} kg.`
  if (s.reason === 'deload') return `Duas sessões abaixo da faixa: alivie para ${kg} kg e reconstrua.`
  return `Mantenha ${kg} kg até fechar todas as séries no topo da faixa.`
}

export function AoVivo() {
  const { key = '' } = useParams()
  const navigate = useNavigate()
  const live = useLive()
  // Começa no máximo um treino por abertura da tela: ao finalizar ou descartar, o registro some do banco
  // e a tela não deve criar outro antes de navegar.
  const started = useRef(false)

  useEffect(() => {
    if (live === null && !started.current) {
      started.current = true
      startLive(key)
    }
  }, [live, key])

  if (live === undefined || live === null) return <Loading />

  if (live.sessionKey !== key) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col justify-center gap-4">
          <h1 className="font-display text-2xl font-bold">Você tem um treino em andamento</h1>
          <p className="text-sm text-muted">
            O treino {live.session.title} começou às {new Date(live.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} e ainda não foi finalizado.
          </p>
          <button type="button" className="btn btn-lime" onClick={() => navigate(`/aovivo/${live.sessionKey}`, { replace: true })}>
            Continuar {live.session.title}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await discardLive()
            }}
          >
            Descartar e começar o novo
          </button>
        </div>
      </Shell>
    )
  }

  return <LiveSession live={live} />
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto flex h-full max-w-[480px] flex-col gap-5 overflow-y-auto bg-bg py-5"
      style={{
        paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(20px, env(safe-area-inset-right, 0px))',
        paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {children}
    </div>
  )
}

function LiveSession({ live }: { live: LiveWorkout }) {
  const navigate = useNavigate()
  const session = live.session
  const steps: Step[] = [
    ...(session.mobility.length ? [{ kind: 'mobilidade' } as const] : []),
    ...session.strength.map((_, index) => ({ kind: 'musculacao', index }) as const),
    ...(session.cardio ? [{ kind: 'aerobico' } as const] : []),
  ]
  const stepIndex = Math.min(live.step, steps.length - 1)
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const [sets, setSets] = useState<LiveSet[][]>(live.sets)
  const [rest, setRest] = useState<Countdown | null>(null)
  const [suggestions, setSuggestions] = useState<LoadSuggestion[]>([])
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null)
  const now = useTick(true, 1000)

  useEffect(() => {
    suggestionsFor(session.key).then(setSuggestions)
  }, [session.key])

  // Mantém a tela ligada durante o treino, quando o aparelho permite.
  useEffect(() => {
    let lock: WakeLockSentinel | undefined
    navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => {
      lock?.release().catch(() => {})
    }
  }, [])

  const saveSets = (next: LiveSet[][]) => {
    setSets(next)
    updateLive({ sets: next })
  }
  const goTo = (i: number) => {
    setRest(null)
    updateLive({ step: i })
  }

  const finish = async () => {
    const id = await finishLive()
    navigate(id ? `/resumo/${id}` : '/', { replace: true })
  }
  const anyDone = sets.some((ex) => ex.some((s) => s.done))
  const paused = !!live.pausedAt

  // Minimizar: volta para onde a pessoa estava no app (ou para Hoje). O treino continua salvo e a barra
  // de treino em andamento aparece em todas as telas.
  const minimize = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }
  const togglePause = () => {
    if (paused) resumeLive()
    else {
      setRest(null)
      pauseLive()
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={minimize} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-card2 py-2 pr-3.5 pl-2.5 text-xs font-bold">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
          Minimizar
        </button>
        <span className={`font-mono text-xs tabular-nums ${paused ? 'text-cardio' : 'text-muted'}`}>
          {paused ? 'Pausado · ' : ''}
          {formatClock(liveElapsedMs(live, now) / 1000)}
        </span>
        <button
          type="button"
          onClick={togglePause}
          aria-pressed={paused}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border py-2 pr-3.5 pl-2.5 text-xs font-bold ${paused ? 'border-lime bg-lime text-lime-ink' : 'border-line bg-card2'}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
          </svg>
          {paused ? 'Continuar' : 'Pausar'}
        </button>
      </div>

      {paused && (
        <div className="card flex flex-col gap-3 border-cardio/40">
          <h2 className="font-display text-lg font-bold">Treino pausado</h2>
          <p className="text-sm text-muted">O relógio parou e tudo o que você anotou está salvo. Pode minimizar e usar o resto do app.</p>
          <button type="button" className="btn btn-lime" onClick={togglePause}>
            Continuar treino
          </button>
        </div>
      )}

      <div className="flex gap-1" aria-hidden="true">
        {steps.map((s, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < stepIndex ? 'bg-lime/60' : i === stepIndex ? (s.kind === 'mobilidade' ? 'bg-mob' : s.kind === 'aerobico' ? 'bg-cardio' : 'bg-lime') : 'bg-card2'}`}
          />
        ))}
      </div>

      <div key={stepIndex} className="screen-enter flex flex-col gap-5">
      {step.kind === 'mobilidade' && (
        <section className="flex flex-col gap-3">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Dot color="mob" /> Aquecimento
            </div>
            <h1 className="mt-1.5 font-display text-[26px] leading-tight font-bold">Mobilidade</h1>
          </div>
          {session.mobility.map((m) => {
            const done = live.mobilityDone.includes(m.exerciseId)
            return (
              <button
                key={m.exerciseId}
                type="button"
                aria-pressed={done}
                onClick={() =>
                  updateLive({ mobilityDone: done ? live.mobilityDone.filter((x) => x !== m.exerciseId) : [...live.mobilityDone, m.exerciseId] })
                }
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left ${done ? 'border-mob/50 bg-mob/10' : 'border-line bg-card'}`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-sm font-extrabold ${done ? 'border-mob bg-mob text-bg' : 'border-line text-transparent'}`}>
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{exerciseName(m.exerciseId)}</span>
                  <span className="font-mono text-xs text-muted">{prescriptionText(m)}</span>
                </span>
              </button>
            )
          })}
        </section>
      )}

      {step.kind === 'musculacao' && (
        <StrengthStep
          key={step.index}
          index={step.index}
          total={session.strength.length}
          live={live}
          sets={sets[step.index] ?? []}
          suggestion={suggestions[step.index]}
          rest={rest}
          onRest={setRest}
          onChange={(exSets) => saveSets(sets.map((x, i) => (i === step.index ? exSets : x)))}
        />
      )}

      {step.kind === 'aerobico' && session.cardio && <CardioStep live={live} />}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {confirm === 'finish' && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm">{anyDone ? 'Finalizar e salvar o treino?' : 'Nenhuma série foi marcada. Finalizar mesmo assim?'}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setConfirm(null)}>
                Voltar
              </button>
              <button type="button" className="btn btn-lime flex-1" onClick={finish}>
                Finalizar
              </button>
            </div>
          </div>
        )}
        {confirm === 'discard' && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm">Descartar este treino? Nada será salvo no histórico.</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setConfirm(null)}>
                Manter
              </button>
              <button
                type="button"
                className="btn flex-1 border border-cardio/50 bg-cardio/15 text-cardio"
                onClick={async () => {
                  await discardLive()
                  navigate(`/treino/${session.key}`, { replace: true })
                }}
              >
                Descartar
              </button>
            </div>
          </div>
        )}
        {!confirm && (
          <>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button type="button" className="btn btn-ghost" onClick={() => goTo(stepIndex - 1)} aria-label="Etapa anterior">
                  ‹
                </button>
              )}
              {isLast ? (
                <button type="button" className="btn btn-lime flex-1" onClick={() => setConfirm('finish')}>
                  Finalizar treino
                </button>
              ) : (
                <button type="button" className="btn btn-lime flex-1" onClick={() => goTo(stepIndex + 1)}>
                  {nextLabel(steps[stepIndex + 1])}
                </button>
              )}
            </div>
            <div className="flex justify-between text-xs">
              <button type="button" className="cursor-pointer text-dim" onClick={() => setConfirm('discard')}>
                Descartar treino
              </button>
              {!isLast && (
                <button type="button" className="cursor-pointer text-muted" onClick={() => setConfirm('finish')}>
                  Finalizar agora
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}

function nextLabel(next: Step): string {
  if (next.kind === 'aerobico') return 'Ir para o aeróbico'
  if (next.kind === 'musculacao' && next.index === 0) return 'Começar musculação'
  return 'Próximo exercício'
}

function StrengthStep({
  index,
  total,
  live,
  sets,
  suggestion,
  rest,
  onRest,
  onChange,
}: {
  index: number
  total: number
  live: LiveWorkout
  sets: LiveSet[]
  suggestion?: LoadSuggestion
  rest: Countdown | null
  onRest: (c: Countdown | null) => void
  onChange: (sets: LiveSet[]) => void
}) {
  const plan = live.session.strength[index]
  const nextOpen = sets.findIndex((s) => !s.done)

  const update = (i: number, patch: Partial<LiveSet>) => onChange(sets.map((s, k) => (k === i ? { ...s, ...patch } : s)))
  const toggleDone = (i: number) => {
    const done = !sets[i].done
    unlockAudio()
    if (done) haptic()
    // Ao concluir uma série, a carga passa para a próxima (se ela ainda estiver vazia) e o descanso começa.
    const next = sets.map((s, k) => {
      if (k === i) return { ...s, done, reps: s.reps || (done ? String(plan.repsMax) : s.reps) }
      if (done && k === i + 1 && !s.loadKg) return { ...s, loadKg: sets[i].loadKg }
      return s
    })
    onChange(next)
    if (done && plan.restSec > 0) onRest({ endsAt: Date.now() + plan.restSec * 1000, total: plan.restSec })
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <div className="eyebrow">
          {PRIORITY_LABEL[plan.priority]} · exercício {index + 1} de {total}
        </div>
        <Link to={`/exercicio/${plan.exerciseId}`} className="mt-1.5 block font-display text-[26px] leading-tight font-bold text-balance">
          {exerciseName(plan.exerciseId)} <span className="text-base text-dim">›</span>
        </Link>
        <p className="mt-1.5 font-mono text-xs text-muted">{prescriptionText(plan)}</p>
      </div>

      <p className="rounded-2xl border border-lime/25 bg-lime/[0.07] p-3 text-xs leading-relaxed text-fg">{suggestionText(suggestion)}</p>

      {rest && (
        <RingTimer
          countdown={rest}
          label={nextOpen >= 0 ? `próxima: série ${nextOpen + 1}` : 'próximo exercício'}
          onAdjust={(d) => onRest({ endsAt: rest.endsAt + d * 1000, total: Math.max(rest.total, (rest.endsAt + d * 1000 - Date.now()) / 1000) })}
          onSkip={() => onRest(null)}
        />
      )}

      <div className="card">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
          <span className="text-[11px] tracking-[0.08em] text-muted uppercase">Série</span>
          <span className="text-[11px] tracking-[0.08em] text-muted uppercase">{plan.unit === 'seg' ? 'kg (opc.)' : 'kg'}</span>
          <span className="text-[11px] tracking-[0.08em] text-muted uppercase">{plan.unit === 'seg' ? 'seg' : 'reps'}</span>
          <span />
          {sets.map((s, i) => (
            <SetRow key={i} index={i} set={s} placeholder={String(plan.repsMax)} onChange={(p) => update(i, p)} onToggle={() => toggleDone(i)} />
          ))}
        </div>
        <button type="button" className="mt-3 cursor-pointer text-xs font-semibold text-muted" onClick={() => onChange([...sets, { loadKg: sets.at(-1)?.loadKg ?? '', reps: '', done: false }])}>
          + série extra
        </button>
      </div>
    </section>
  )
}

function SetRow({
  index,
  set,
  placeholder,
  onChange,
  onToggle,
}: {
  index: number
  set: LiveSet
  placeholder: string
  onChange: (p: Partial<LiveSet>) => void
  onToggle: () => void
}) {
  const field = 'w-full rounded-[10px] border border-line bg-card2 p-2.5 text-center font-mono text-base text-fg placeholder:text-dim'
  return (
    <>
      <span className="text-center font-mono text-muted">{index + 1}</span>
      <input
        id={`kg-${index}`}
        inputMode="decimal"
        aria-label={`Carga da série ${index + 1}`}
        value={set.loadKg}
        placeholder="0"
        onChange={(e) => onChange({ loadKg: e.target.value.replace(/[^\d.,]/g, '') })}
        className={field}
      />
      <input
        id={`reps-${index}`}
        inputMode="numeric"
        aria-label={`Repetições da série ${index + 1}`}
        value={set.reps}
        placeholder={placeholder}
        onChange={(e) => onChange({ reps: e.target.value.replace(/\D/g, '') })}
        className={field}
      />
      <button
        type="button"
        aria-pressed={set.done}
        aria-label={`Concluir série ${index + 1}`}
        onClick={onToggle}
        className={`grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border font-extrabold ${set.done ? 'border-lime bg-lime text-lime-ink' : 'border-line bg-card2 text-dim'}`}
      >
        ✓
      </button>
    </>
  )
}

function CardioStep({ live }: { live: LiveWorkout }) {
  const cardio = live.session.cardio!
  const [timer, setTimer] = useState<Countdown | null>(null)
  return (
    <section className="flex flex-col gap-4">
      <div>
        <div className="eyebrow flex items-center gap-1.5">
          <Dot color="cardio" /> Aeróbico · {cardio.minutes} min
        </div>
        <h1 className="mt-1.5 font-display text-[26px] leading-tight font-bold">{cardio.exerciseIds.map(exerciseName).join(' · ')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{cardio.description}</p>
      </div>
      {timer ? (
        <RingTimer countdown={timer} label="aeróbico" onAdjust={(d) => setTimer({ ...timer, endsAt: timer.endsAt + d * 1000 })} onSkip={() => setTimer(null)} onEnd={() => updateLive({ cardioDone: true })} />
      ) : (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            unlockAudio()
            setTimer({ endsAt: Date.now() + cardio.minutes * 60000, total: cardio.minutes * 60 })
          }}
        >
          Iniciar cronômetro de {cardio.minutes} min
        </button>
      )}
      <button
        type="button"
        aria-pressed={live.cardioDone}
        onClick={() => updateLive({ cardioDone: !live.cardioDone })}
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-bold ${live.cardioDone ? 'border-cardio/50 bg-cardio/10' : 'border-line bg-card'}`}
      >
        <span className={`grid h-7 w-7 place-items-center rounded-lg border ${live.cardioDone ? 'border-cardio bg-cardio text-bg' : 'border-line text-transparent'}`}>✓</span>
        Aeróbico feito
      </button>
    </section>
  )
}
