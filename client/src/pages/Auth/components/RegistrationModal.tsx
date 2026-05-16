import { useCallback, useEffect, useRef, useState, type ChangeEvent, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import Spinner from "../../../components/Spinner/Spinner";
import type { AdminRegistrationForm, ResidentRegistrationForm, UserRole } from "./authTypes";
import puebloDePanayLogo from "../../../assets/img/pdp-logo-invert.png";
import loginBackdrop from "../../../assets/img/subdivision-gate-background.png";

type TrailingIconName = "user" | "calendar" | "email" | "phone" | "lock" | "plate";

const FieldTrailingIcon = ({ kind }: { kind?: TrailingIconName }) => {
    if (!kind) return null;
    const c = "mb-1 h-[18px] w-[18px] shrink-0 text-violet-300/60";
    switch (kind) {
        case "user":
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
            );
        case "calendar":
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 3v4M16 3v4M3 11h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
            );
        case "email":
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h16v10H4V7Zm0 0 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case "phone":
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M8 3h3l2 5-2 1a12 12 0 0 0 5 5l1-2 5 2v3c0 1-1 2-2 2h-1C9.5 19 4 13.5 4 6c0-1 1-2 2-2h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case "lock":
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
            );
        case "plate":
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="4" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M7 11h10M7 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
            );
        default:
            return null;
    }
};

interface UnderlineFieldProps {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    trailingIcon?: TrailingIconName;
    leadingSlot?: ReactNode;
}

const UnderlineField = ({
    label, name, type = "text", value, onChange, placeholder, required, error, trailingIcon, leadingSlot,
}: UnderlineFieldProps) => {
    const borderTone = error
        ? "border-red-400"
        : "border-white/20 focus-within:border-violet-400";
    return (
        <div className="mb-7">
            <label htmlFor={name} className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
                {required && <span className="mr-1 text-red-400">*</span>}
                {label}
            </label>
            <div className={`flex items-end gap-2 border-b-2 pb-1 transition-colors ${borderTone}`}>
                {leadingSlot && (
                    <span className="mb-2 shrink-0 select-none text-base leading-none">{leadingSlot}</span>
                )}
                <input
                    id={name} name={name} type={type} value={value} onChange={onChange}
                    placeholder={placeholder} required={required}
                    className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[14.5px] text-white outline-none placeholder:text-white/30"
                />
                <FieldTrailingIcon kind={trailingIcon} />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        </div>
    );
};

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: UserRole;
    adminForm: AdminRegistrationForm;
    setAdminForm: Dispatch<SetStateAction<AdminRegistrationForm>>;
    residentForm: ResidentRegistrationForm;
    setResidentForm: Dispatch<SetStateAction<ResidentRegistrationForm>>;
    genders: { gender_id: number; gender: string }[];
    fieldErrors: Record<string, string[]>;
    loading: boolean;
    onRegister: () => void | Promise<void>;
}

const SubmitAdmissionButton = ({ loading }: { loading: boolean }) => (
    <button
        type="submit"
        disabled={loading}
        className="reg-glass-btn mt-6 flex w-full items-center justify-center gap-2.5 py-4 text-[13.5px] font-semibold uppercase tracking-widest"
    >
        {loading ? (
            <><Spinner size="xs" />Submitting...</>
        ) : (
            <>
                Submit
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M14 4h6v6M10 14 20 4M8 20H6a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </>
        )}
    </button>
);

// Must match the CSS animation durations below
const ANIM_DURATION = 300;

const RegistrationModal = ({
    isOpen, onClose, role,
    adminForm, setAdminForm,
    residentForm, setResidentForm,
    genders, fieldErrors, loading, onRegister,
}: RegistrationModalProps) => {
    const [captchaA, setCaptchaA] = useState(0);
    const [captchaB, setCaptchaB] = useState(0);
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [captchaError, setCaptchaError] = useState("");

    const [isMounted, setIsMounted] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            setIsAnimatingOut(false);
            setIsMounted(true);
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
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshCaptcha = useCallback(() => {
        setCaptchaA(Math.floor(Math.random() * 90) + 10);
        setCaptchaB(Math.floor(Math.random() * 9) + 1);
        setCaptchaAnswer("");
        setCaptchaError("");
    }, []);

    useEffect(() => {
        if (isOpen) refreshCaptcha();
    }, [isOpen, refreshCaptcha]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const expected = captchaA + captchaB;
        const got = parseInt(captchaAnswer.trim(), 10);
        if (Number.isNaN(got) || got !== expected) {
            setCaptchaError("Please solve the verification correctly.");
            return;
        }
        setCaptchaError("");
        void onRegister();
    };

    const err = (key: string) => fieldErrors[key]?.[0];

    if (!isMounted) return null;

    const EASING = "cubic-bezier(0.34,1.56,0.64,1)";
    const backdropAnim = isAnimatingOut
        ? `reg-backdrop-out ${ANIM_DURATION}ms ease both`
        : `reg-backdrop-in  ${ANIM_DURATION}ms ease both`;
    const modalAnim = isAnimatingOut
        ? `reg-modal-out ${ANIM_DURATION}ms ${EASING} both`
        : `reg-modal-in  ${ANIM_DURATION}ms ${EASING} both`;

    return createPortal(
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
            {/* SVG filter for liquid glass distortion — right panel only */}
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
                <defs>
                    <filter id="reg-glass-distortion" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.006" numOctaves="2" seed="92" result="noise" />
                        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                        <feDisplacementMap in="SourceGraphic" in2="blurred" scale="45" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>

            <style>{`
                /* ── Keyframe animations ── */
                @keyframes reg-backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes reg-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
                @keyframes reg-modal-in {
                    from { opacity: 0; transform: translateY(32px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
                @keyframes reg-modal-out {
                    from { opacity: 1; transform: translateY(0)    scale(1);    }
                    to   { opacity: 0; transform: translateY(32px) scale(0.96); }
                }
                @keyframes reg-header-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes reg-bar-in {
                    from { width: 0; }
                    to   { width: 38%; }
                }
                @keyframes reg-field-in {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes reg-logo-float {
                    0%, 100% { transform: translateY(0px);  }
                    50%      { transform: translateY(-8px); }
                }
                @keyframes reg-shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }

                /* ── Date picker icon fix for dark bg ── */
                .reg-dark-form input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1) opacity(0.4);
                }
                .reg-dark-form input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    filter: invert(1) opacity(0.8);
                }

                /* ══════════════════════════════════════
                   COMPLETE LIQUID GLASS IMPLEMENTATION
                   Applied to the right panel (.reg-liquid-glass-panel)
                   Mirrors .liquid-glass-card exactly from reference code
                   ══════════════════════════════════════ */

                /* 1. Outer wrapper — isolation + outer glow */
                .reg-liquid-glass-panel {
                    position: relative;
                    isolation: isolate;
                    box-shadow: 0px 0px 21px -8px rgba(255, 255, 255, 0.3);
                    cursor: default;
                }

                /* 2. ::before — Tint and inner shadow layer */
                .reg-liquid-glass-panel::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    box-shadow: inset 0 0 6px -3px rgba(255, 255, 255, 0.7);
                    background-color: rgba(255, 255, 255, 0);
                    pointer-events: none;
                }

                /* 3. ::after — Backdrop blur and distortion layer */
                .reg-liquid-glass-panel::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    filter: url(#reg-glass-distortion);
                    -webkit-filter: url(#reg-glass-distortion);
                    isolation: isolate;
                    pointer-events: none;
                }

                /* 4. Card content — sits above pseudo-layers, mirrors .card-content */
                .reg-liquid-glass-panel .reg-glass-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    height: 100%;
                    color: white;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }

                /* 5. Glass button — mirrors .glass-button */
                .reg-glass-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    border-radius: 9999px;
                    font-weight: 600;
                    cursor: pointer;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }
                .reg-glass-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .reg-glass-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
                }
                .reg-glass-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
            `}</style>

            {/* ── Modal card ── */}
            <div
                className="relative flex w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[28px]"
                style={{
                    animation: modalAnim,
                    background: "linear-gradient(135deg, rgba(20,16,48,0.88) 0%, rgba(14,12,36,0.92) 100%)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 32px 64px rgba(0,0,0,0.55)",
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
                        <div style={{ animation: "reg-logo-float 4s ease-in-out infinite" }}>
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
                            animation: "reg-shimmer 3s linear infinite",
                        }}
                    >
                        Life. Work. Balance.
                    </div>
                </div>

                {/* ══ RIGHT PANEL — Form (Complete Liquid Glass) ══ */}
                <div
                    className="flex-1 overflow-y-auto reg-dark-form reg-liquid-glass-panel backdrop-blur-xl"
                    style={{
                        scrollbarColor: "rgba(139,92,246,0.3) transparent",
                        background: "linear-gradient(135deg, rgba(20, 16, 48, 0.65) 0%, rgba(14, 12, 36, 0.70) 100%)",
                        backdropFilter: "blur(12px)",
                        borderLeft: "1px solid rgba(139, 92, 246, 0.15)",
                    }}
                >
                    {/* reg-glass-content: z-index:10 + text-shadow, mirrors .card-content */}
                    <div className="reg-glass-content">
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/50 shadow-sm backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20 hover:text-white"
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
                        style={{ animation: isAnimatingOut ? "none" : "reg-header-in 0.35s ease 0.15s both" }}
                    >
                        {/* Mobile logo */}
                        <div className="mb-4 flex items-center gap-3 md:hidden">
                            <img src={puebloDePanayLogo} alt="Pueblo de Panay Township" className="h-14 w-auto" />
                        </div>
                        <h2 className="text-[30px] font-light tracking-tight text-white">
                            Admission Registration
                        </h2>
                        <div
                            className="mt-3.5 h-[3px] max-w-[280px] rounded-sm"
                            style={{
                                background: "linear-gradient(90deg, #a78bfa, #7c3aed)",
                                animation: isAnimatingOut ? "none" : "reg-bar-in 0.5s cubic-bezier(0.4,0,0.2,1) 0.35s both",
                            }}
                        />
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="px-12 py-10 md:px-14"
                        style={{ animation: isAnimatingOut ? "none" : "reg-field-in 0.4s ease 0.2s both" }}
                    >
                        {/* RESIDENT FIELDS */}
                        {role === "resident" && (
                            <>
                                <div className="grid gap-x-16 gap-y-0 md:grid-cols-2">
                                    <UnderlineField
                                        label="First Name" name="reg_fn" placeholder="e.g. Juan"
                                        value={residentForm.first_name}
                                        onChange={(e) => setResidentForm({ ...residentForm, first_name: e.target.value })}
                                        required error={err("first_name")} trailingIcon="user"
                                    />
                                    <UnderlineField
                                        label="Last Name" name="reg_ln" placeholder="e.g. Dela Cruz"
                                        value={residentForm.last_name}
                                        onChange={(e) => setResidentForm({ ...residentForm, last_name: e.target.value })}
                                        required error={err("last_name")} trailingIcon="user"
                                    />
                                    <UnderlineField
                                        label="Date of Birth (DD/MM/YYYY)" name="reg_dob" type="date"
                                        value={residentForm.birth_date}
                                        onChange={(e) => setResidentForm({ ...residentForm, birth_date: e.target.value })}
                                        required error={err("birth_date")} trailingIcon="calendar"
                                    />
                                    <UnderlineField
                                        label="Email" name="reg_email" type="email" placeholder="e.g. juan@email.com"
                                        value={residentForm.email}
                                        onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                                        required error={err("email")} trailingIcon="email"
                                    />
                                    <UnderlineField
                                        label="Mobile No." name="reg_mobile" placeholder="e.g. 09171234567"
                                        value={residentForm.contact_number}
                                        onChange={(e) => setResidentForm({ ...residentForm, contact_number: e.target.value })}
                                        required error={err("contact_number")} trailingIcon="phone"
                                        leadingSlot={<span title="Philippines">🇵🇭</span>}
                                    />
                                    <div className="mb-7">
                                        <span className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
                                            <span className="mr-1 text-red-400">*</span>Gender
                                        </span>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                            {genders.map((g) => (
                                                <label key={g.gender_id} className="flex cursor-pointer items-center gap-2 text-[14.5px] text-violet-100/90">
                                                    <input
                                                        type="radio" name="reg_gender"
                                                        checked={residentForm.gender === String(g.gender_id)}
                                                        onChange={() => setResidentForm({ ...residentForm, gender: String(g.gender_id) })}
                                                        className="accent-violet-400"
                                                    />
                                                    {g.gender}
                                                </label>
                                            ))}
                                        </div>
                                        {err("gender") && <p className="mt-1.5 text-xs text-red-400">{err("gender")}</p>}
                                    </div>
                                </div>

                                <UnderlineField
                                    label="Middle Name" name="reg_mn" placeholder="Optional"
                                    value={residentForm.middle_name}
                                    onChange={(e) => setResidentForm({ ...residentForm, middle_name: e.target.value })}
                                    trailingIcon="user"
                                />

                                <div className="grid gap-x-16 md:grid-cols-2">
                                    <div className="mb-7">
                                        <span className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
                                            <span className="mr-1 text-red-400">*</span>Role
                                        </span>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                            {["Admin", "Resident"].map((r) => (
                                                <label key={r} className="flex cursor-pointer items-center gap-2 text-[14.5px] text-violet-100/90">
                                                    <input
                                                        type="radio" name="reg_role"
                                                        checked={residentForm.role === r}
                                                        onChange={() => setResidentForm({ ...residentForm, role: r })}
                                                        className="accent-violet-400"
                                                    />
                                                    {r}
                                                </label>
                                            ))}
                                        </div>
                                        {err("role") && <p className="mt-1.5 text-xs text-red-400">{err("role")}</p>}
                                    </div>
                                    <UnderlineField
                                        label="Plate Number" name="reg_plate" placeholder="e.g. ABC 1234"
                                        value={residentForm.plate_number}
                                        onChange={(e) => setResidentForm({ ...residentForm, plate_number: e.target.value })}
                                        required error={err("plate_number")} trailingIcon="plate"
                                    />
                                    <UnderlineField
                                        label="Password" name="reg_pw" type="password"
                                        value={residentForm.password}
                                        onChange={(e) => setResidentForm({ ...residentForm, password: e.target.value })}
                                        required error={err("password")} trailingIcon="lock"
                                    />
                                    <UnderlineField
                                        label="Confirm Password" name="reg_pwc" type="password"
                                        value={residentForm.password_confirmation}
                                        onChange={(e) => setResidentForm({ ...residentForm, password_confirmation: e.target.value })}
                                        required error={err("password_confirmation")} trailingIcon="lock"
                                    />
                                    <UnderlineField
                                        label="Car Model" name="reg_car" placeholder="e.g. Toyota Vios"
                                        value={residentForm.car_model}
                                        onChange={(e) => setResidentForm({ ...residentForm, car_model: e.target.value })}
                                        required error={err("car_model")} trailingIcon="plate"
                                    />
                                    <UnderlineField
                                        label="Car Color" name="reg_color" placeholder="e.g. White"
                                        value={residentForm.car_color}
                                        onChange={(e) => setResidentForm({ ...residentForm, car_color: e.target.value })}
                                        required error={err("car_color")} trailingIcon="plate"
                                    />
                                </div>

                                <UnderlineField
                                    label="Address" name="reg_addr" placeholder="Block / Lot / Street"
                                    value={residentForm.address}
                                    onChange={(e) => setResidentForm({ ...residentForm, address: e.target.value })}
                                    required error={err("address")} trailingIcon="user"
                                />
                            </>
                        )}

                        {/* ADMIN FIELDS */}
                        {role === "admin" && (
                            <>
                                <div className="grid gap-x-16 md:grid-cols-2">
                                    <UnderlineField
                                        label="First Name" name="adm_fn" placeholder="e.g. Juan"
                                        value={adminForm.first_name}
                                        onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })}
                                        required error={err("first_name")} trailingIcon="user"
                                    />
                                    <UnderlineField
                                        label="Last Name" name="adm_ln" placeholder="e.g. Santos"
                                        value={adminForm.last_name}
                                        onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })}
                                        required error={err("last_name")} trailingIcon="user"
                                    />
                                    <UnderlineField
                                        label="Middle Name" name="adm_mn" placeholder="Optional"
                                        value={adminForm.middle_name}
                                        onChange={(e) => setAdminForm({ ...adminForm, middle_name: e.target.value })}
                                        trailingIcon="user"
                                    />
                                    <UnderlineField
                                        label="Date of Birth (DD/MM/YYYY)" name="adm_dob" type="date"
                                        value={adminForm.birth_date}
                                        onChange={(e) => setAdminForm({ ...adminForm, birth_date: e.target.value })}
                                        required error={err("birth_date")} trailingIcon="calendar"
                                    />
                                    <UnderlineField
                                        label="Email (optional)" name="adm_email" type="email" placeholder="you@example.com"
                                        value={adminForm.email}
                                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                        error={err("email")} trailingIcon="email"
                                    />
                                    <div className="mb-7">
                                        <span className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
                                            <span className="mr-1 text-red-400">*</span>Gender
                                        </span>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                            {genders.map((g) => (
                                                <label key={g.gender_id} className="flex cursor-pointer items-center gap-2 text-[14.5px] text-violet-100/90">
                                                    <input
                                                        type="radio" name="adm_gender"
                                                        checked={adminForm.gender === String(g.gender_id)}
                                                        onChange={() => setAdminForm({ ...adminForm, gender: String(g.gender_id) })}
                                                        className="accent-violet-400"
                                                    />
                                                    {g.gender}
                                                </label>
                                            ))}
                                        </div>
                                        {err("gender") && <p className="mt-1.5 text-xs text-red-400">{err("gender")}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-x-16 md:grid-cols-2">
                                    <div className="mb-7">
                                        <span className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
                                            <span className="mr-1 text-red-400">*</span>Role
                                        </span>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                            {["Admin", "Resident"].map((r) => (
                                                <label key={r} className="flex cursor-pointer items-center gap-2 text-[14.5px] text-violet-100/90">
                                                    <input
                                                        type="radio" name="adm_role"
                                                        checked={adminForm.role === r}
                                                        onChange={() => setAdminForm({ ...adminForm, role: r })}
                                                        className="accent-violet-400"
                                                    />
                                                    {r}
                                                </label>
                                            ))}
                                        </div>
                                        {err("role") && <p className="mt-1.5 text-xs text-red-400">{err("role")}</p>}
                                    </div>
                                    <div className="hidden md:block" aria-hidden />
                                    <UnderlineField
                                        label="Password" name="adm_pw" type="password"
                                        value={adminForm.password}
                                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                                        required error={err("password")} trailingIcon="lock"
                                    />
                                    <UnderlineField
                                        label="Confirm Password" name="adm_pwc" type="password"
                                        value={adminForm.password_confirmation}
                                        onChange={(e) => setAdminForm({ ...adminForm, password_confirmation: e.target.value })}
                                        required error={err("password_confirmation")} trailingIcon="lock"
                                    />
                                </div>
                            </>
                        )}

                        {/* CAPTCHA */}
                        <div className="mt-7 flex items-center justify-center gap-3">
                            <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded border border-white/20 bg-white/10 px-4 py-2.5 font-mono text-xl font-semibold text-white shadow-sm">
                                {captchaA}
                            </span>
                            <span className="text-xl text-violet-300/60">+</span>
                            <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded border border-white/20 bg-white/10 px-4 py-2.5 font-mono text-xl font-semibold text-white shadow-sm">
                                {captchaB}
                            </span>
                            <span className="text-xl text-violet-300/60">=</span>
                            <input
                                type="text" inputMode="numeric" value={captchaAnswer}
                                onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(""); }}
                                className="w-18 rounded border border-white/20 bg-white/10 py-2.5 text-center font-mono text-xl font-semibold text-white shadow-sm outline-none placeholder:text-white/30 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/40"
                                placeholder="?" aria-label="Captcha answer"
                            />
                            <button
                                type="button" onClick={refreshCaptcha}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/50 shadow-sm transition hover:border-violet-400/50 hover:bg-white/15 hover:text-violet-300"
                                aria-label="Refresh captcha"
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M4 12a8 8 0 0 1 13.657-5.657M20 12a8 8 0 0 1-13.657 5.657M20 12h4m-4 0v-4M4 12H0m4 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        {captchaError && (
                            <p className="mt-2.5 text-center text-sm text-red-400">{captchaError}</p>
                        )}

                        <SubmitAdmissionButton loading={loading} />

                        <p className="pt-6 text-center text-[13.5px] text-violet-200/80">
                            Already have an account?{" "}
                            <button type="button" className="font-semibold text-white underline underline-offset-[3px] transition hover:text-violet-100" onClick={onClose}>
                                Sign In
                            </button>
                        </p>
                        <p className="pb-4 pt-2 text-center">
                            <button
                                type="button"
                                className="text-[13.5px] font-medium text-violet-300/80 hover:text-white hover:underline"
                                onClick={(e) => e.preventDefault()}
                            >
                                Click here to watch the Video User Guide
                            </button>
                        </p>
                    </form>
                    </div>{/* end reg-glass-content */}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RegistrationModal;