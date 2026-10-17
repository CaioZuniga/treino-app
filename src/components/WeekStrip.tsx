import { WEEKDAYS } from '../data/labels'
import type { WorkoutLog } from '../types'

/** Data local no formato AAAA-MM-DD (toISOString usaria UTC e trocaria o dia à noite no Brasil). */
export const dayKey = (d: Date) => d.toLocaleDateString('sv-SE')

/** Semana atual de segunda a domingo, marcando os dias com treino registrado. */
export function WeekStrip({ logs, today = new Date() }: { logs: WorkoutLog[]; today?: Date }) {
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const done = new Set(logs.map((l) => l.date.slice(0, 10)))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const isToday = dayKey(d) === dayKey(today)
        const isDone = done.has(dayKey(d))
        const style = isToday
          ? 'border-lime bg-lime text-lime-ink'
          : isDone
            ? 'border-lime/35 bg-card text-muted'
            : 'border-line bg-card text-muted'
        return (
          <div key={dayKey(d)} className={`rounded-[14px] border py-2 text-center text-[11px] ${style}`}>
            {WEEKDAYS[d.getDay()]}
            <b className={`mt-0.5 block text-sm ${isToday ? 'text-lime-ink' : isDone ? 'text-lime' : 'text-fg'}`}>{d.getDate()}</b>
          </div>
        )
      })}
    </div>
  )
}
