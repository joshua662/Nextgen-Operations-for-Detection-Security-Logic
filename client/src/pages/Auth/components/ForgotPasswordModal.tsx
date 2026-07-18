import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import loginBackdrop from "../../../assets/img/subdivision-gate-background.png";
import puebloDePanayLogo from "../../../assets/img/pdp-logo-invert.png";
import ForgotPasswordSuccessModal from "./ForgotPasswordSuccessModal";
import AuthService from "../../../services/AuthService";
import ToastMessage from "../../../components/ToastMessage/ToastMessage";

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ANIM_DURATION = 300;

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");
    
    // Fallback for errors
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastFailed, setToastFailed] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            setIsAnimatingOut(false);
            setIsMounted(true);
            setEmail("");
        } else if (isMounted) {
            setIsAnimatingOut(true);
            closeTimerRef.current = setTimeout(() => {
                setIsMounted(false);
                setIsAnimatingOut(false);
            }, ANIM_DURATION);
        }
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const enteredEmail = email.toLowerCase();
        
        try {
            await AuthService.forgotPassword(enteredEmail);
            setLoading(false);
            setSubmittedEmail(enteredEmail);
            setSuccessModalVisible(true);
            setEmail("");
        } catch (error: any) {
            setLoading(false);
            // Even on error, we might want to just show success to prevent email enumeration,
            // but if it's a network error we show a toast.
            const errorMsg = error?.response?.data?.message || "An error occurred while sending the request. Please try again.";
            setToastMessage(errorMsg);
            setToastFailed(true);
            setToastVisible(true);
        }
    };

    if (!isMounted) return null;

    const EASING = "cubic-bezier(0.34,1.56,0.64,1)";
    const backdropAnim = isAnimatingOut
        ? `fp-backdrop-out ${ANIM_DURATION}ms ease both`
        : `fp-backdrop-in  ${ANIM_DURATION}ms ease both`;
    const modalAnim = isAnimatingOut
        ? `fp-modal-out ${ANIM_DURATION}ms ${EASING} both`
        : `fp-modal-in  ${ANIM_DURATION}ms ${EASING} both`;

    return createPortal(
        <>
            <ToastMessage
                isVisible={toastVisible}
                message={toastMessage}
                isFailed={toastFailed}
                onClose={() => setToastVisible(false)}
                overlay={false}
            />

            <ForgotPasswordSuccessModal
                isVisible={successModalVisible}
                onClose={() => setSuccessModalVisible(false)}
                email={submittedEmail}
            />

            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                style={{ animation: backdropAnim }}
            >
                {/* Background image */}
                <img
                    src={loginBackdrop}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover scale-105"
                    aria-hidden
                />

                {/* Twilight indigo / purple grading overlay */}
                <div
                    className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-violet-950/35 to-purple-950/45"
                    aria-hidden
                />

                {/* Soft star specks */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
              radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.75), transparent),
              radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 88% 52%, rgba(255,255,255,0.65), transparent),
              radial-gradient(1px 1px at 12% 55%, rgba(255,255,255,0.45), transparent)
            `,
                    }}
                    aria-hidden
                />

                <style>{`
                    @keyframes fp-backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes fp-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
                    @keyframes fp-modal-in {
                        from { opacity: 0; transform: translateY(32px) scale(0.96); }
                        to   { opacity: 1; transform: translateY(0)    scale(1);    }
                    }
                    @keyframes fp-modal-out {
                        from { opacity: 1; transform: translateY(0)    scale(1);    }
                        to   { opacity: 0; transform: translateY(32px) scale(0.96); }
                    }
                    @keyframes fp-shimmer {
                        0%   { background-position: -200% center; }
                        100% { background-position:  200% center; }
                    }
                    @keyframes fp-logo-float {
                        0%, 100% { transform: translateY(0); }
                        50%      { transform: translateY(-8px); }
                    }
                `}</style>

                {/* ── Modal card ── */}
                <div
                    className="relative flex w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-[28px]"
                    style={{
                        animation: modalAnim,
                        background: "linear-gradient(135deg, rgba(20,16,48,0.7) 0%, rgba(14,12,36,0.8) 100%)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        boxShadow: "0 32px 64px rgba(0,0,0,0.55)",
                        backdropFilter: "blur(20px)",
                    }}
                >
                    {/* ══ LEFT PANEL — Branding ══ */}
                    <div
                        className="hidden md:flex flex-col items-center justify-between w-[340px] shrink-0 px-10 py-12 relative overflow-hidden"
                        style={{ background: "linear-gradient(160deg, #0d2e5c 0%, #1e4d8c 45%, #2a6ab5 100%)" }}
                    >
                        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-10"
                            style={{ background: "radial-gradient(circle, #7eb8f7, transparent 70%)" }} />
                        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full opacity-10"
                            style={{ background: "radial-gradient(circle, #a8d4ff, transparent 70%)" }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-5"
                            style={{ background: "radial-gradient(circle, #ffffff, transparent 70%)" }} />

                        <div />

                        <div className="flex flex-col items-center gap-7 z-10">
                            <div style={{ animation: "fp-logo-float 4s ease-in-out infinite" }}>
                                <img
                                    src={puebloDePanayLogo}
                                    alt="Pueblo de Panay Township"
                                    className="w-[260px] h-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
                                />
                            </div>
                            <div className="w-14 h-[2px] rounded-full bg-white/30" />
                            <div className="text-center">
                                <p className="text-white/60 text-[12px] uppercase tracking-[0.2em] font-medium">
                                    Resident Portal
                                </p>
                                <p className="mt-2.5 text-white/80 text-[14px] leading-relaxed text-center">
                                    Your gateway to a smarter, more connected community.
                                </p>
                            </div>
                        </div>

                        <div
                            className="z-10 rounded-full px-5 py-2.5 text-[11px] font-semibold tracking-widest uppercase text-white/70 border border-white/20"
                            style={{
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                                backgroundSize: "200% auto",
                                animation: "fp-shimmer 3s linear infinite",
                            }}
                        >
                            Life. Work. Balance.
                        </div>
                    </div>

                    {/* ══ RIGHT PANEL — Form ══ */}
                    <div
                        className="relative flex-1 overflow-y-auto"
                        style={{
                            scrollbarColor: "rgba(139,92,246,0.3) transparent",
                            background: "linear-gradient(160deg, rgba(20,16,44,0.6) 0%, rgba(14,12,36,0.7) 100%)",
                            borderLeft: "1px solid rgba(139, 92, 246, 0.2)",
                        }}
                    >
                        <div className="relative z-10">
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#1a1638] text-white/50 shadow-sm transition hover:border-white/30 hover:bg-[#252046] hover:text-white"
                                style={{ transition: "transform 0.2s ease, color 0.15s, border-color 0.15s, background 0.15s" }}
                                aria-label="Close"
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(90deg)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>

                            {/* Header */}
                            <div
                                className="border-b border-white/10 px-12 pb-7 pt-11 md:px-14 md:pt-12"
                                style={{ animation: isAnimatingOut ? "none" : "fp-modal-in 0.35s ease 0.15s both" }}
                            >
                                <div className="mb-4 flex items-center gap-3 md:hidden">
                                    <img src={puebloDePanayLogo} alt="Pueblo de Panay Township" className="h-14 w-auto" />
                                </div>
                                <h2 className="text-[30px] font-light tracking-tight text-white">
                                    Forgot Password
                                </h2>
                                <div
                                    className="mt-3.5 h-[3px] max-w-[280px] rounded-sm"
                                    style={{
                                        background: "linear-gradient(90deg, #a78bfa, #7c3aed)",
                                    }}
                                />
                                <p className="mt-5 text-white/60 text-[14px] leading-relaxed max-w-[360px]">
                                    Enter your email so that we can send you a password reset link.
                                </p>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                className="px-12 py-10 md:px-14"
                                style={{ animation: isAnimatingOut ? "none" : "fp-modal-in 0.4s ease 0.2s both" }}
                            >
                                <div className="mb-7">
                                    <label htmlFor="email" className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
                                        <span className="mr-1 text-red-400">*</span>
                                        Email
                                    </label>
                                    <div className="flex items-end gap-2 border-b-2 pb-1 transition-colors border-white/20 focus-within:border-violet-400">
                                        <input
                                            id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="e.g. username@example.com" required
                                            className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[14.5px] text-white outline-none placeholder:text-white/30"
                                        />
                                        <svg className="mb-1 h-[18px] w-[18px] shrink-0 text-violet-300/60" viewBox="0 0 24 24" fill="none" aria-hidden>
                                            <path d="M4 7h16v10H4V7Zm0 0 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-violet-600 py-4 text-[13.5px] font-semibold uppercase tracking-widest text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Sending..." : "Send Email"}
                                    {!loading && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                            <path d="M14 4h6v6M10 14 20 4M8 20H6a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-12 text-[14px] font-medium text-white/50 hover:text-white transition flex items-center gap-1.5"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 18l-6-6 6-6"/>
                                    </svg>
                                    Back to Login
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default ForgotPasswordModal;
