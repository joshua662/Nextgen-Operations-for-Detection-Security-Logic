import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import AuthField from "./AuthField";
import SubmitButton from "../Button/SubmitButton";
import { useAuth } from "../../hooks/useAuth";
import { adminAuthApi } from "../../services/adminApi";
import RegistrationModal, { type RegistrationForm } from "./RegistrationModal";
import ToastMessage from "../ToastMessage/ToastMessage";
import AuthPageLayout from "./AuthPageLayout";
import { validateLoginForm } from "../../utils/validateForm";

const logoSrc = "/assets/pdp-logo-invert.png";

const emptyForm = (): RegistrationForm => ({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    email: "",
});

const AdminLogin = () => {
    const { user, loading, login, register } = useAuth();
    const [justLoggedIn, setJustLoggedIn] = useState(false);

    const [registrationOpen, setRegistrationOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [genders, setGenders] = useState<{ gender_id: number; gender: string }[]>([]);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [form, setForm] = useState(emptyForm());
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const [captchaA, setCaptchaA] = useState(0);
    const [captchaB, setCaptchaB] = useState(0);
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [captchaError, setCaptchaError] = useState("");

    const [toast, setToast] = useState({ visible: false, message: "", failed: false });

    const showToast = (message: string, failed: boolean) =>
        setToast({ visible: true, message, failed });

    const closeToast = () => setToast((t) => ({ ...t, visible: false }));

    const refreshCaptcha = useCallback(() => {
        setCaptchaA(Math.floor(Math.random() * 90) + 10);
        setCaptchaB(Math.floor(Math.random() * 9) + 1);
        setCaptchaAnswer("");
        setCaptchaError("");
    }, []);

    useEffect(() => {
        if (!registrationOpen) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshCaptcha();
        adminAuthApi
            .loadGenders()
            .then((res) => setGenders(res.data?.genders ?? []))
            .catch(() => showToast("Could not load gender options.", true));
    }, [registrationOpen, refreshCaptcha]);

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const errors = validateLoginForm(username, password);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setLoginLoading(true);
        setFieldErrors({});

        try {
            setJustLoggedIn(true);
            await login(username.trim(), password);
            showToast("Login successful. Welcome back!", false);
            setTimeout(() => {
                window.location.href = "/";
            }, 800);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            showToast(err.response?.data?.message ?? err.message ?? "Invalid credentials.", true);
            setJustLoggedIn(false);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async () => {
        setRegisterLoading(true);
        setFieldErrors({});

        try {
            const res = await register({
                first_name: form.first_name.trim(),
                middle_name: form.middle_name.trim() || undefined,
                last_name: form.last_name.trim(),
                gender: form.gender,
                birth_date: form.birth_date,
                email: form.email.trim(),
            });
            setForm(emptyForm());
            showToast((res as { data?: { message?: string } })?.data?.message ?? "Registration complete. Credentials were sent to the registered email.", false);
        } catch (error) {
            const err = error as {
                response?: { data?: { message?: string; errors?: Record<string, string[]> } };
            };
            if (err.response?.data?.errors) {
                setFieldErrors(err.response.data.errors);
            }
            showToast(err.response?.data?.message ?? "Registration failed.", true);
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleRegistrationClose = () => {
        setRegistrationOpen(false);
    };

    if (!loading && user && !justLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return (
        <AuthPageLayout>
            <ToastMessage
                isVisible={toast.visible}
                message={toast.message}
                isFailed={toast.failed}
                onClose={closeToast}
                overlay
                size="large"
            />

            <div className="mb-8 flex flex-col items-center text-center">
                <img src={logoSrc} alt="Pueblo de Panay" className="max-h-28 w-auto object-contain drop-shadow-md" />
                <h2 className="mt-4 text-[1.65rem] font-semibold tracking-tight text-white">Admin Portal</h2>
                <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-violet-200/88">
                    Sign in to monitor security guard login and logout activity.
                </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="max-h-[46vh] overflow-y-auto pr-0.5 scrollbar-thin">
                <AuthField
                    label="Username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    errors={fieldErrors.username}
                    required
                    autoFocus
                />
                <AuthField
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    errors={fieldErrors.password}
                    required
                    passwordToggle
                />

                <div className="mb-6 mt-2 flex items-center justify-between gap-3">
                    <label className="flex cursor-pointer select-none items-center gap-2.5">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-white/35 bg-white/15 text-violet-500 accent-violet-500 focus:ring-violet-400/40 focus:ring-offset-0"
                        />
                        <span className="text-sm text-violet-100/95">Remember me</span>
                    </label>
                    <button
                        type="button"
                        className="text-xs font-medium text-violet-200/95 underline-offset-4 hover:text-white hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>

                <SubmitButton
                    className="w-full rounded-full border-0 py-3.5 text-sm font-semibold shadow-lg shadow-black/25"
                    newClassName="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold tracking-wide text-slate-900 shadow-lg shadow-black/20 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    label="Log In"
                    loading={loginLoading}
                    loadingLabel="Signing in..."
                />
            </form>

            <p className="mt-8 text-center text-sm text-violet-200/90">
                Need an admin account?{" "}
                <button
                    type="button"
                    className="font-semibold text-white underline underline-offset-[3px] transition hover:text-violet-100"
                    onClick={() => setRegistrationOpen(true)}
                >
                    Registration
                </button>
            </p>

            <RegistrationModal
                isOpen={registrationOpen}
                onClose={handleRegistrationClose}
                form={form}
                setForm={setForm}
                genders={genders}
                fieldErrors={fieldErrors}
                loading={registerLoading}
                onRegister={handleRegister}
                captchaA={captchaA}
                captchaB={captchaB}
                captchaAnswer={captchaAnswer}
                setCaptchaAnswer={setCaptchaAnswer}
                captchaError={captchaError}
                refreshCaptcha={refreshCaptcha}
                setCaptchaError={setCaptchaError}
            />
        </AuthPageLayout>
    );
};

export default AdminLogin;
