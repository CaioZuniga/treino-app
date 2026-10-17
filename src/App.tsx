import { HashRouter, Route, Routes } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { Ambientes, Hoje, Perfil, Progresso, Semana } from './screens/screens'

// HashRouter: o GitHub Pages não reescreve rotas, então as URLs ficam como /treino-app/#/ambientes.
export default function App() {
  return (
    <HashRouter>
      <div className="mx-auto flex h-full max-w-[480px] flex-col bg-bg">
        <main
          className="flex-1 overflow-y-auto py-6"
          style={{
            paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(20px, env(safe-area-inset-right, 0px))',
            paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          }}
        >
          <Routes>
            <Route path="/" element={<Hoje />} />
            <Route path="/semana" element={<Semana />} />
            <Route path="/ambientes" element={<Ambientes />} />
            <Route path="/progresso" element={<Progresso />} />
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </HashRouter>
  )
}
