import { EQUIPMENT, EQUIPMENT_CATEGORIES, type EquipmentCategory } from '../data/equipment'

export function EquipmentChecklist({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const has = new Set(value)
  const toggle = (id: string) => onChange(has.has(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div className="flex flex-col gap-4">
      {(Object.keys(EQUIPMENT_CATEGORIES) as EquipmentCategory[]).map((cat) => (
        <div key={cat} className="flex flex-col gap-2">
          <div className="eyebrow">{EQUIPMENT_CATEGORIES[cat]}</div>
          <div className="grid grid-cols-3 gap-2">
            {EQUIPMENT.filter((e) => e.category === cat).map((e) => {
              const on = has.has(e.id)
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(e.id)}
                  className={`flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center text-xs font-semibold ${
                    on ? 'border-lime/45 bg-lime/10 text-fg' : 'border-line bg-card text-muted'
                  }`}
                >
                  <span className={`font-mono text-[13px] ${on ? 'text-lime' : 'text-dim'}`} aria-hidden="true">
                    {on ? '●' : '○'}
                  </span>
                  {e.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
