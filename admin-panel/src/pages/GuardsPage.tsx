import { Route, Routes } from 'react-router-dom'
import GuardsList from '../components/SecurityGuards/GuardsList'
import GuardActivityLogs from '../components/SecurityGuards/GuardActivityLogs'

const GuardsPage = () => (
  <Routes>
    <Route index element={<GuardsList />} />
    <Route path="activity/logs" element={<GuardActivityLogs />} />
  </Routes>
)

export default GuardsPage
