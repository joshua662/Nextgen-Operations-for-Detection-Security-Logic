import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import IdPrintCard, { type IdPrintCardData } from "./IdPrintCard";

type IdPrintCardModalProps = IdPrintCardData & {
    isOpen: boolean;
    onClose: () => void;
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const buildPrintDocument = (data: IdPrintCardData, qrDataUrl: string) => {
    const isResident = data.role === "resident";
    const phone = escapeHtml(data.contactNumber?.trim() || "—");
    const email = escapeHtml(data.email?.trim() || "—");
    const plateRow = isResident
        ? `<div style="display:flex;align-items:flex-start;gap:8px;font-size:9px;color:rgba(255,255,255,0.85);margin-bottom:6px;">
            <span style="opacity:0.55;">▣</span><span>${escapeHtml(data.plateNumber?.trim() || "—")}</span>
           </div>`
        : "";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
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
        position: relative;
        width: 85mm;
        height: 55mm;
        overflow: hidden;
        background: #121212;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
      }
      .pattern {
        position: absolute;
        inset: 0;
        opacity: 0.7;
        background-image:
          radial-gradient(circle at 18% 22%, rgba(255,255,255,0.05) 0 28px, transparent 29px),
          radial-gradient(circle at 52% 18%, rgba(255,255,255,0.04) 0 34px, transparent 35px),
          radial-gradient(circle at 78% 42%, rgba(255,255,255,0.035) 0 30px, transparent 31px);
      }
      .accent {
        position: absolute;
        left: 0;
        top: 18%;
        width: 3px;
        height: 64%;
        background: rgba(113,113,122,0.8);
      }
      .content {
        position: relative;
        z-index: 2;
        height: 100%;
        box-sizing: border-box;
        padding: 14px 14px 14px 18px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
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
              <div style="font-size:15px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fff;line-height:1.2;">
                ${escapeHtml(data.fullName)}
              </div>
              <div style="margin-top:4px;font-size:8px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);">
                ${escapeHtml(data.roleLabel)}
              </div>
            </div>
            <div style="border:1px solid rgba(255,255,255,0.8);background:#fff;padding:3px;border-radius:2px;">
              <img src="${qrDataUrl}" alt="QR" width="68" height="68" style="display:block;" />
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
            <div>
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:9px;color:rgba(255,255,255,0.85);margin-bottom:6px;">
                <span style="opacity:0.55;">☎</span><span>${phone}</span>
              </div>
              ${plateRow}
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:9px;color:rgba(255,255,255,0.85);">
                <span style="opacity:0.55;">✉</span><span>${email}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:30px;height:30px;border-radius:4px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">G</div>
              <div style="text-align:right;line-height:1.1;">
                <div style="font-size:8px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#fff;">Gate</div>
                <div style="font-size:8px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Security</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>
      window.onload = function () {
        window.focus();
        setTimeout(function () {
          window.print();
        }, 250);
      };
      window.onafterprint = function () { window.close(); };
    </script>
  </body>
</html>`;
};

export const printIdCardData = async (data: IdPrintCardData) => {
    const qrDataUrl = await QRCode.toDataURL(
        JSON.stringify({
            uid: data.userId,
            role: data.role,
            name: data.fullName,
            email: data.email ?? "",
            phone: data.contactNumber ?? "",
            plate: data.plateNumber ?? "",
        }),
        {
            width: 180,
            margin: 0,
            color: { dark: "#111111", light: "#ffffff" },
        },
    );

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=620");
    if (!printWindow) {
        window.alert("Pop-up blocked. Please allow pop-ups to print your ID card.");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintDocument(data, qrDataUrl));
    printWindow.document.close();
};

const IdPrintCardModal = ({
    isOpen,
    onClose,
    userId,
    role,
    fullName,
    roleLabel,
    contactNumber,
    email,
    plateNumber,
}: IdPrintCardModalProps) => {
    const [printing, setPrinting] = useState(false);

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
        if (!isOpen) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handlePrint = async () => {
        setPrinting(true);
        try {
            await printIdCardData(cardData);
        } finally {
            setPrinting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="id-card-modal-title"
        >
            <div
                className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                    <div>
                        <h3 id="id-card-modal-title" className="text-xl font-bold text-white">
                            Member ID Card
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                            Preview your {role === "resident" ? "resident" : "security guard"} access card before printing.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                        aria-label="Close card preview"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex justify-center px-6 py-8">
                    <IdPrintCard
                        {...cardData}
                        cardId="id-print-card-modal-preview"
                        className="max-w-[480px] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                    />
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => void handlePrint()}
                        disabled={printing}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" />
                        </svg>
                        {printing ? "Preparing..." : "Print Now"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default IdPrintCardModal;
