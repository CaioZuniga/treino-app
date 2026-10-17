import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Hoje', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/semana', label: 'Semana', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/ambientes', label: 'Ambientes', icon: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6' },
  { to: '/progresso', label: 'Progresso', icon: 'M4 19l5-6 4 3 7-9' },
  { to: '/perfil', label: 'Perfil', icon: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c1-4 4-6 8-6s7 2 8 6' },
]

export function TabBar() {
  return (
    <nav
      className="grid grid-cols-5 px-2"
      style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
    >
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10.5px] font-semibold ${isActive ? 'text-lime' : 'text-dim'}`
          }
        >
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d={t.icon} />
          </svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
