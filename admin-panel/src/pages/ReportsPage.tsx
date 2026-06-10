import { NavLink, Route, Routes } from 'react-router-dom'
import AccessLogs from '../components/Reports/AccessLogs'
import IncidentReports from '../components/Reports/IncidentReports'
import SecurityReports from '../components/Reports/SecurityReports'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-violet-600 text-white'
      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
  }`

const ReportsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reports</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Access, security, and incident reporting.</p>
    </div>

    <nav className="flex flex-wrap gap-2">
      <NavLink to="/reports/access" className={tabClass} end>
        Access Logs
      </NavLink>
      <NavLink to="/reports/security" className={tabClass}>
        Security Reports
      </NavLink>
      <NavLink to="/reports/incidents" className={tabClass}>
        Incidents
      </NavLink>
    </nav>

    <Routes>
      <Route index element={<AccessLogs />} />
      <Route path="access" element={<AccessLogs />} />
      <Route path="security" element={<SecurityReports />} />
      <Route path="incidents" element={<IncidentReports />} />
    </Routes>
  </div>
)

export default ReportsPage
