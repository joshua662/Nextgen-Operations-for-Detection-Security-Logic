import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { guardApi, type GuardUser } from '../../services/guardApi'

type MemberCardProps = {
  user: GuardUser
  qrDataUrl: string
  className?: string
}

type MemberCardModalProps = {
  isOpen: boolean
  user: GuardUser
  onClose: () => void
}

const fullName = (user: GuardUser) =>
  [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')

const roleLabel = (role: string) => (role === 'resident' ? 'Resident' : 'Security Guard')

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const MemberCard = ({ user, qrDataUrl, className = '' }: MemberCardProps) => {
  const isResident = user.role === 'resident'
  const displayName = fullName(user).toUpperCase()

  return (
    <div className={`relative aspect-[1.75/1] w-full max-w-[420px] overflow-hidden rounded-sm border border-white/10 shadow-2xl ${className}`}>
      <div className="absolute inset-0 bg-[#121212]" aria-hidden />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.05) 0 28px, transparent 29px),
            radial-gradient(circle at 52% 18%, rgba(255,255,255,0.04) 0 34px, transparent 35px),
            radial-gradient(circle at 78% 42%, rgba(255,255,255,0.035) 0 30px, transparent 31px),
            radial-gradient(circle at 34% 72%, rgba(255,255,255,0.03) 0 26px, transparent 27px),
            radial-gradient(circle at 68% 78%, rgba(255,255,255,0.04) 0 32px, transparent 33px)
          `,
        }}
        aria-hidden
      />
      <div className="absolute left-0 top-[18%] h-[64%] w-[3px] bg-zinc-500/80" aria-hidden />

      <div className="relative z-10 flex h-full flex-col justify-between p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <p className="truncate text-[18px] font-bold uppercase tracking-[0.08em] text-white sm:text-[20px]">
              {displayName}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
              {roleLabel(user.role)}
            </p>
          </div>
          <div className="shrink-0 rounded-sm border border-white/80 bg-white p-1">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Member QR code" className="h-[72px] w-[72px] object-contain" />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center bg-white text-[10px] text-zinc-500">
                QR
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2 text-[11px] leading-snug text-white/85">
            <CardLine label="Phone" value={user.contact_number} />
            {isResident && <CardLine label="Plate" value={user.plate_number} />}
            <CardLine label="Email" value={user.email} />
          </div>

          <div className="flex shrink-0 items-center gap-2 text-right">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-extrabold text-black">
              G
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Gate</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CardLine = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold text-white/55">
      {label[0]}
    </span>
    <span>
      <span className="sr-only">{label}: </span>
      {value?.trim() || '-'}
    </span>
  </div>
)

const buildPrintDocument = (user: GuardUser, qrDataUrl: string) => {
  const isResident = user.role === 'resident'
  const name = escapeHtml(fullName(user).toUpperCase())
  const role = escapeHtml(roleLabel(user.role).toUpperCase())
  const phone = escapeHtml(user.contact_number?.trim() || '-')
  const email = escapeHtml(user.email?.trim() || '-')
  const plate = escapeHtml(user.plate_number?.trim() || '-')
  const plateRow = isResident
    ? `<div style="display:flex;align-items:flex-start;gap:8px;font-size:9px;color:rgba(255,255,255,0.85);margin-bottom:6px;"><span style="opacity:0.55;">P</span><span>${plate}</span></div>`
    : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Print Member Card</title>
    <style>
      @page { size: 85mm 55mm; margin: 0; }
      html, body { margin:0; padding:0; width:85mm; height:55mm; background:#121212; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .wrap { width:85mm; height:55mm; display:flex; align-items:center; justify-content:center; background:#121212; }
      .card { position:relative; width:85mm; height:55mm; overflow:hidden; box-sizing:border-box; background:#121212; font-family:Arial, Helvetica, sans-serif; }
      .pattern { position:absolute; inset:0; opacity:.7; background-image:radial-gradient(circle at 18% 22%, rgba(255,255,255,.05) 0 28px, transparent 29px),radial-gradient(circle at 52% 18%, rgba(255,255,255,.04) 0 34px, transparent 35px),radial-gradient(circle at 78% 42%, rgba(255,255,255,.035) 0 30px, transparent 31px); }
      .accent { position:absolute; left:0; top:18%; width:3px; height:64%; background:rgba(113,113,122,.8); }
      .content { position:relative; z-index:2; height:100%; box-sizing:border-box; padding:14px 14px 14px 18px; display:flex; flex-direction:column; justify-content:space-between; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="pattern"></div>
        <div class="accent"></div>
        <div class="content">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
            <div style="min-width:0;flex:1;">
              <div style="font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff;line-height:1.2;">${name}</div>
              <div style="margin-top:4px;font-size:8px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.55);">${role}</div>
            </div>
            <div style="border:1px solid rgba(255,255,255,.8);background:#fff;padding:3px;border-radius:2px;">
              <img src="${qrDataUrl}" alt="QR" width="68" height="68" style="display:block;" />
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
            <div>
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:9px;color:rgba(255,255,255,.85);margin-bottom:6px;"><span style="opacity:.55;">T</span><span>${phone}</span></div>
              ${plateRow}
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:9px;color:rgba(255,255,255,.85);"><span style="opacity:.55;">E</span><span>${email}</span></div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:30px;height:30px;border-radius:4px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">G</div>
              <div style="text-align:right;line-height:1.1;"><div style="font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#fff;">Gate</div><div style="font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.7);">Security</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>
      window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 250); };
      window.onafterprint = function () { window.close(); };
    </script>
  </body>
</html>`
}

export const MemberCardModal = ({ isOpen, user, onClose }: MemberCardModalProps) => {
  const [printing, setPrinting] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setQrDataUrl('')
    setQrError('')
    setQrLoading(true)

    guardApi
      .loadMemberCardQr(user.user_id)
      .then((res) => {
        if (!cancelled) setQrDataUrl(res.data.qr_code)
      })
      .catch(() => {
        if (!cancelled) setQrError('Unable to load the QR code. Please check the Python qrcode installation.')
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, user.user_id])

  if (!isOpen) return null

  const handlePrint = () => {
    if (!qrDataUrl) return
    setPrinting(true)
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=620')
    if (!printWindow) {
      window.alert('Pop-up blocked. Please allow pop-ups to print the member card.')
      setPrinting(false)
      return
    }
    printWindow.document.open()
    printWindow.document.write(buildPrintDocument(user, qrDataUrl))
    printWindow.document.close()
    setPrinting(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-white">Member Card</h3>
            <p className="mt-1 text-sm text-zinc-400">Admin preview for {roleLabel(user.role).toLowerCase()} access.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white" aria-label="Close card preview">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-8">
          {qrError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {qrError}
            </div>
          )}
          <div className="flex justify-center">
            <MemberCard user={user} qrDataUrl={qrDataUrl} className="max-w-[480px] shadow-[0_20px_50px_rgba(0,0,0,0.45)]" />
          </div>
          {qrLoading && <p className="mt-4 text-center text-sm text-zinc-400">Generating QR code...</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5">
            Close
          </button>
          <button type="button" onClick={handlePrint} disabled={printing || !qrDataUrl} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" />
            </svg>
            {printing ? 'Preparing...' : 'Print Card'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default MemberCard
