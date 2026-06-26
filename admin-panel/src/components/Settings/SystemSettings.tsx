import { useEffect, useState } from 'react'
import { adminAuthApi } from '../../services/adminApi'
import { useAuth } from '../../hooks/useAuth'
import { AdminPanelCard, AdminPanelHeader } from '../UI/AdminPanelShell'

const SystemSettings = () => {
  const { user } = useAuth()
  const [gateStatus, setGateStatus] = useState<string>('—')
  const [entranceCameraStatus, setEntranceCameraStatus] = useState<string>('—')
  const [exitCameraStatus, setExitCameraStatus] = useState<string>('—')

  useEffect(() => {
    adminAuthApi.dashboardOverview().then((res) => {
      setGateStatus(res.data.gate_status ?? 'unknown')
      setEntranceCameraStatus(res.data.entrance_camera_status ?? res.data.camera_status ?? 'unknown')
      setExitCameraStatus(res.data.exit_camera_status ?? 'unknown')
    })
  }, [])

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        title="System Settings"
        description="Portal and system status overview."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SettingCard label="Signed in as" value={user ? `${user.first_name} ${user.last_name}` : 'N/A'} />
        <SettingCard label="Admin username" value={user?.username ?? 'N/A'} />
        <SettingCard label="Gate status" value={gateStatus} />
        <SettingCard label="Entrance camera" value={entranceCameraStatus} />
        <SettingCard label="Exit camera" value={exitCameraStatus} />
        <SettingCard label="API base URL" value={import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'} />
        <SettingCard label="Portal role" value="Administrator (monitoring)" />
      </div>
    </div>
  )
}

const SettingCard = ({ label, value }: { label: string; value: string }) => (
  <AdminPanelCard className="p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-100">{value}</p>
  </AdminPanelCard>
)

export default SystemSettings
