import { useEffect, useRef, type ReactNode } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { Loading } from './components/ui'
import { AmbienteEditor, Ambientes } from './screens/Ambientes'
import { AoVivo } from './screens/AoVivo'
import { Exercicio } from './screens/Exercicio'
import { Hoje } from './screens/Hoje'
import { Instalar } from './screens/Instalar'
import { Onboarding } from './screens/Onboarding'
import { Perfil } from './screens/Perfil'
import { Progresso } from './screens/Progresso'
import { Resumo } from './screens/Resumo'
import { Semana } from './screens/Semana'
import { Treino } from './screens/Treino'
import { useProfile } from './state/hooks'
import { shouldOfferInstallFirst } from './state/platform'

// HashRouter: o GitHub Pages não reescreve rotas, então as URLs ficam como /treino-app/#/ambientes.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/instalar" element={<Instalar />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/aovivo/:key" element={<RequireProfile><AoVivo /></RequireProfile>} />
        <Route element={<TabsLayout />}>
          <Route path="/" element={<Hoje />} />
          <Route path="/semana" element={<Semana />} />
          <Route path="/treino/:key" element={<Treino />} />
          <Route path="/exercicio/:id" element={<Exercicio />} />
          <Route path="/ambientes" element={<Ambientes />} />
          <Route path="/ambientes/:id" element={<AmbienteEditor />} />
          <Route path="/progresso" element={<Progresso />} />
          <Route path="/resumo/:id" element={<Resumo />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

function TabsLayout() {
  const profile = useProfile()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // A rolagem fica no <main>; cada tela nova começa do topo.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [pathname])
  if (profile === undefined) return <Loading />
  // Primeira visita: no navegador do celular, instala antes do cadastro.
  if (profile === null) return <Navigate to={shouldOfferInstallFirst() ? '/instalar' : '/onboarding'} replace />
  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col bg-bg">
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto py-6"
        style={{
          paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(20px, env(safe-area-inset-right, 0px))',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div key={pathname} className="screen-enter">
          <Outlet />
        </div>
      </main>
      <TabBar />
    </div>
  )
}

function RequireProfile({ children }: { children: ReactNode }) {
  const profile = useProfile()
  if (profile === undefined) return <Loading />
  if (profile === null) return <Navigate to="/onboarding" replace />
  return children
}
