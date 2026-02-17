import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AnalyzePage from './components/Analyze/AnalyzePage'
import ConfigPage from './components/Config/ConfigPage'
import EnvCheckPage from './components/EnvCheck/EnvCheckPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/analyze" replace />} />
        <Route path="analyze" element={<AnalyzePage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="env-check" element={<EnvCheckPage />} />
      </Route>
    </Routes>
  )
}

export default App
