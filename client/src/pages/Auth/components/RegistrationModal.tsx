import { useCallback, useEffect, useState, type ChangeEvent, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import Spinner from "../../../components/Spinner/Spinner";
import type { AdminRegistrationForm, ResidentRegistrationForm, UserRole } from "./authTypes";

type TrailingIconName = "user" | "calendar" | "email" | "phone" | "lock" | "plate";

const FieldTrailingIcon = ({ kind }: { kind?: TrailingIconName }) => {
    if (!kind) return null;
    const c = "mb-1 h-[17px] w-[17px] shrink-0 text-gray-400";
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
        : "border-gray-300 focus-within:border-[#337ab7]";
    return (
        <div className="mb-6">
            <label htmlFor={name} className="mb-2 block text-[13px] font-medium text-gray-500">
                {required && <span className="mr-1 text-red-500">*</span>}
                {label}
            </label>
            <div className={`flex items-end gap-2 border-b-2 pb-1 transition-colors ${borderTone}`}>
                {leadingSlot && (
                    <span className="mb-2 shrink-0 select-none text-base leading-none">{leadingSlot}</span>
                )}
                <input
                    id={name} name={name} type={type} value={value} onChange={onChange}
                    placeholder={placeholder} required={required}
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-gray-900 outline-none placeholder:text-gray-400"
                />
                <FieldTrailingIcon kind={trailingIcon} />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#1e4d8c] py-3.5 text-[13px] font-semibold uppercase tracking-widest text-white transition hover:bg-[#337ab7] disabled:cursor-not-allowed disabled:opacity-55"
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

    if (!isOpen) return null;

    return createPortal(
        /* ── Backdrop ── */
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-[fadeIn_0.2s_ease]"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ animation: "reg-backdrop-in 0.22s ease both" }}
        >
            <style>{`
                @keyframes reg-backdrop-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes reg-modal-in {
                    from { opacity: 0; transform: translateY(28px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)     scale(1);    }
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
            `}</style>
            {/* ── Modal card ── */}
            <div
                className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
                style={{ animation: "reg-modal-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-gray-300 hover:text-gray-700 hover:rotate-90"
                    style={{ transition: "transform 0.2s ease, color 0.15s, border-color 0.15s" }}
                    aria-label="Close"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {/* ── Header ── */}
                <div
                    className="border-b border-gray-100 px-10 pb-6 pt-10 md:px-16 md:pt-11"
                    style={{ animation: "reg-header-in 0.35s ease 0.15s both" }}
                >
                    <h2 className="text-[26px] font-light tracking-tight text-gray-700">
                        Admission Registration
                    </h2>
                    {/* Blue accent bar — animates width in */}
                    <div
                        className="mt-3 h-[3px] max-w-[220px] rounded-sm bg-[#337ab7]"
                        style={{ animation: "reg-bar-in 0.5s cubic-bezier(0.4,0,0.2,1) 0.35s both" }}
                    />
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="px-10 py-8 md:px-16" style={{ animation: "reg-field-in 0.4s ease 0.2s both" }}>

                    {/* ── RESIDENT FIELDS ── */}
                    {role === "resident" && (
                        <>
                            <div className="grid gap-x-14 gap-y-0 md:grid-cols-2">
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
                                {/* Gender radio group */}
                                <div className="mb-6">
                                    <span className="mb-2 block text-[13px] font-medium text-gray-500">
                                        <span className="mr-1 text-red-500">*</span>Gender
                                    </span>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                        {genders.map((g) => (
                                            <label key={g.gender_id} className="flex cursor-pointer items-center gap-2 text-[14px] text-gray-800">
                                                <input
                                                    type="radio" name="reg_gender"
                                                    checked={residentForm.gender === String(g.gender_id)}
                                                    onChange={() => setResidentForm({ ...residentForm, gender: String(g.gender_id) })}
                                                    className="accent-[#337ab7]"
                                                />
                                                {g.gender}
                                            </label>
                                        ))}
                                    </div>
                                    {err("gender") && <p className="mt-1 text-xs text-red-600">{err("gender")}</p>}
                                </div>
                            </div>

                            <UnderlineField
                                label="Middle Name" name="reg_mn" placeholder="Optional"
                                value={residentForm.middle_name}
                                onChange={(e) => setResidentForm({ ...residentForm, middle_name: e.target.value })}
                                trailingIcon="user"
                            />

                            <div className="grid gap-x-14 md:grid-cols-2">
                                <UnderlineField
                                    label="Portal Username" name="reg_user" placeholder="6–12 characters"
                                    value={residentForm.username}
                                    onChange={(e) => setResidentForm({ ...residentForm, username: e.target.value })}
                                    required error={err("username")} trailingIcon="user"
                                />
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

                    {/* ── ADMIN FIELDS ── */}
                    {role === "admin" && (
                        <>
                            <div className="grid gap-x-14 md:grid-cols-2">
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
                                {/* Gender radio group */}
                                <div className="mb-6">
                                    <span className="mb-2 block text-[13px] font-medium text-gray-500">
                                        <span className="mr-1 text-red-500">*</span>Gender
                                    </span>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                        {genders.map((g) => (
                                            <label key={g.gender_id} className="flex cursor-pointer items-center gap-2 text-[14px] text-gray-800">
                                                <input
                                                    type="radio" name="adm_gender"
                                                    checked={adminForm.gender === String(g.gender_id)}
                                                    onChange={() => setAdminForm({ ...adminForm, gender: String(g.gender_id) })}
                                                    className="accent-[#337ab7]"
                                                />
                                                {g.gender}
                                            </label>
                                        ))}
                                    </div>
                                    {err("gender") && <p className="mt-1 text-xs text-red-600">{err("gender")}</p>}
                                </div>
                            </div>

                            <div className="grid gap-x-14 md:grid-cols-2">
                                <UnderlineField
                                    label="Username" name="adm_user" placeholder="6–12 characters"
                                    value={adminForm.username}
                                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                                    required error={err("username")} trailingIcon="user"
                                />
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

                    {/* ── CAPTCHA ── */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <span className="inline-flex min-w-[3.2rem] items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 font-mono text-lg font-semibold text-gray-800 shadow-sm">
                            {captchaA}
                        </span>
                        <span className="text-lg text-gray-400">+</span>
                        <span className="inline-flex min-w-[3.2rem] items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 font-mono text-lg font-semibold text-gray-800 shadow-sm">
                            {captchaB}
                        </span>
                        <span className="text-lg text-gray-400">=</span>
                        <input
                            type="text" inputMode="numeric" value={captchaAnswer}
                            onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(""); }}
                            className="w-16 rounded border border-gray-300 bg-white py-2 text-center font-mono text-lg font-semibold text-gray-800 shadow-sm outline-none focus:border-[#337ab7] focus:ring-1 focus:ring-[#337ab7]"
                            placeholder="?" aria-label="Captcha answer"
                        />
                        <button
                            type="button" onClick={refreshCaptcha}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 shadow-sm transition hover:border-[#337ab7] hover:text-[#337ab7]"
                            aria-label="Refresh captcha"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M4 12a8 8 0 0 1 13.657-5.657M20 12a8 8 0 0 1-13.657 5.657M20 12h4m-4 0v-4M4 12H0m4 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    {captchaError && (
                        <p className="mt-2 text-center text-sm text-red-600">{captchaError}</p>
                    )}

                    <SubmitAdmissionButton loading={loading} />

                    <p className="pt-5 text-center text-[13px] text-gray-500">
                        Already have an account?{" "}
                        <button type="button" className="font-semibold text-[#337ab7] hover:underline" onClick={onClose}>
                            Sign In
                        </button>
                    </p>
                    <p className="pb-3 pt-2 text-center">
                        <button
                            type="button"
                            className="text-[13px] font-medium text-[#337ab7] hover:underline"
                            onClick={(e) => e.preventDefault()}
                        >
                            Click here to watch the Video User Guide
                        </button>
                    </p>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RegistrationModal;