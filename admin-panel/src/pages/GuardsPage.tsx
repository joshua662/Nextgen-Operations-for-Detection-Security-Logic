import { Route, Routes } from 'react-router-dom'
import GuardDetails from '../components/SecurityGuards/GuardDetails'
import GuardsList from '../components/SecurityGuards/GuardsList'
import GuardActivityLogs from '../components/SecurityGuards/GuardActivityLogs'

const GuardsPage = () => (
  <Routes>
    <Route index element={<GuardsList />} />
    <Route path=":id" element={<GuardDetails />} />
    <Route path="activity/logs" element={<GuardActivityLogs />} />
  </Routes>
)

export default GuardsPage
