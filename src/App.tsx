import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AnalyzePage from './components/Analyze/AnalyzePage'
import ConfigPage from './components/Config/ConfigPage'
import EnvCheckPage from './components/EnvCheck/EnvCheckPage'
import AboutPage from './components/About'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/analyze" replace />} />
        <Route path="analyze" element={<AnalyzePage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="env-check" element={<EnvCheckPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  )
}

export default App
