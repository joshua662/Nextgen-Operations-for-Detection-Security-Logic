import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

export type IdPrintCardData = {
    userId: number;
    role: string;
    fullName: string;
    roleLabel: string;
    contactNumber?: string;
    email?: string;
    plateNumber?: string;
};

type IdPrintCardProps = IdPrintCardData & {
    cardId?: string;
    className?: string;
};

const buildQrPayload = (data: IdPrintCardData) =>
    JSON.stringify({
        uid: data.userId,
        role: data.role,
        name: data.fullName,
        email: data.email ?? "",
        phone: data.contactNumber ?? "",
        plate: data.plateNumber ?? "",
    });

const ContactRow = ({
    icon,
    label,
    value,
}: {
    icon: "phone" | "email" | "plate";
    label: string;
    value?: string;
}) => {
    const display = value?.trim() || "—";

    return (
        <div className="flex items-start gap-2.5 text-[11px] leading-snug text-white/85">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-white/55">
                {icon === "phone" && (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                        <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M10 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                )}
                {icon === "email" && (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M4 7h16v10H4V7Zm0 0 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {icon === "plate" && (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                        <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M7 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                )}
            </span>
            <span>
                <span className="sr-only">{label}: </span>
                {display}
            </span>
        </div>
    );
};

export const IdPrintCard = ({
    userId,
    role,
    fullName,
    roleLabel,
    contactNumber,
    email,
    plateNumber,
    cardId = "id-print-card",
    className = "",
}: IdPrintCardProps) => {
    const [qrDataUrl, setQrDataUrl] = useState("");

    const cardData = useMemo(
        () => ({
            userId,
            role,
            fullName,
            roleLabel,
            contactNumber,
            email,
            plateNumber,
        }),
        [userId, role, fullName, roleLabel, contactNumber, email, plateNumber],
    );

    useEffect(() => {
        let cancelled = false;
        QRCode.toDataURL(buildQrPayload(cardData), {
            width: 132,
            margin: 0,
            color: { dark: "#111111", light: "#ffffff" },
        })
            .then((url) => {
                if (!cancelled) setQrDataUrl(url);
            })
            .catch(() => {
                if (!cancelled) setQrDataUrl("");
            });

        return () => {
            cancelled = true;
        };
    }, [cardData]);

    const isResident = role === "resident";

    return (
        <div
            id={cardId}
            className={`id-print-card relative aspect-[1.75/1] w-full max-w-[420px] overflow-hidden rounded-sm border border-white/10 shadow-2xl ${className}`}
        >
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
                            {fullName}
                        </p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
                            {roleLabel}
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
                    <div className="space-y-2">
                        <ContactRow icon="phone" label="Phone" value={contactNumber} />
                        {isResident && <ContactRow icon="plate" label="Plate number" value={plateNumber} />}
                        <ContactRow icon="email" label="Email" value={email} />
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
    );
};

export const printIdCard = (cardElementId = "id-print-card") => {
    const card = document.getElementById(cardElementId);
    if (!card) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=620");
    if (!printWindow) return;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ID Card</title>
            <style>
              @page { size: 85mm 55mm; margin: 0; }
              html, body {
                margin: 0;
                padding: 0;
                width: 85mm;
                height: 55mm;
                background: #121212;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .wrap {
                width: 85mm;
                height: 55mm;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #121212;
              }
              .card {
                width: 85mm;
                height: 55mm;
                transform: scale(1);
                transform-origin: center;
              }
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="card">${card.outerHTML}</div>
            </div>
            <script>
              window.onload = function () {
                window.focus();
                window.print();
                window.onafterprint = function () { window.close(); };
              };
            </script>
          </body>
        </html>
      `);
    printWindow.document.close();
};

export default IdPrintCard;
