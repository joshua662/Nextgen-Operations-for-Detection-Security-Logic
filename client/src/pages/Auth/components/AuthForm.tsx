import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthField from "./AuthField";
import SubmitButton from "../../../components/Button/SubmitButton";
import { useAuth } from "../../../contexts/AuthContext";
import GenderService from "../../../services/GenderService";
import RegistrationModal from "./RegistrationModal";
import { emptyAdminForm, emptyResidentForm, type UserRole } from "./authTypes";

interface AuthFormProps {
    message: (message: string, isFailed: boolean) => void;
    defaultRole?: UserRole;
    /** When true (e.g. `/register` route), open the registration modal on mount. */
    defaultRegistrationOpen?: boolean;
    loginHeadline?: string;
    loginSubtitle?: string;
}


const SparkleGlyph = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden>
        <path
            d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3.2" fill="currentColor" opacity="0.35" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
);

const AuthForm = ({
    message,
    defaultRole = "admin",
    defaultRegistrationOpen = false,
    loginHeadline = "Welcome back!",
    loginSubtitle = "Sign in to reach your gate dashboard and stay on top of access activity.",
}: AuthFormProps) => {
    const [role, setRole] = useState<UserRole>(defaultRole);
    const [registrationOpen, setRegistrationOpen] = useState(defaultRegistrationOpen);
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [usePlateLogin, setUsePlateLogin] = useState(false);
    const [genders, setGenders] = useState<{ gender_id: number; gender: string }[]>([]);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [plateNumber, setPlateNumber] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [adminForm, setAdminForm] = useState(emptyAdminForm);
    const [residentForm, setResidentForm] = useState(emptyResidentForm);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const { login, adminRegister, residentLogin, residentRegister } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (defaultRegistrationOpen) {
            setRegistrationOpen(true);
        }
    }, [defaultRegistrationOpen]);

    useEffect(() => {
        if (!registrationOpen) return;
        let cancelled = false;
        GenderService.loadPublicGenders()
            .then((r) => {
                if (!cancelled) {
                    const list = r.data?.genders;
                    setGenders(Array.isArray(list) ? list : []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setGenders([]);
                    message("Could not load gender options. Check your API URL and network connection.", true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [registrationOpen, message]);

    const handleApiError = (error: unknown) => {
        const err = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
        if (err.response?.status === 422 && err.response.data?.errors) {
            setFieldErrors(err.response.data.errors);
            const firstKey = Object.keys(err.response.data.errors)[0];
            const firstMsg = firstKey ? err.response.data.errors[firstKey]?.[0] : null;
            message(firstMsg || "Please check the highlighted fields.", true);
        } else if (err.response?.status === 401) {
            setFieldErrors({});
            message(err.response.data?.message || "Invalid credentials.", true);
        } else if (err.response?.data?.message && typeof err.response.data.message === "string") {
            message(err.response.data.message, true);
        } else {
            message("Something went wrong. Please try again.", true);
        }
    };

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setFieldErrors({});

        try {
            if (role === "admin") {
                await login(username, password);
                message("Login successful.", false);
                setTimeout(() => navigate("/dashboard"), 800);
            } else if (usePlateLogin) {
                await residentLogin({ plate_number: plateNumber, contact_number: contactNumber });
                message("Login successful.", false);
                setTimeout(() => navigate("/resident/home"), 800);
            } else {
                await residentLogin({ username, password });
                message("Login successful.", false);
                setTimeout(() => navigate("/resident/home"), 800);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async () => {
        setRegisterLoading(true);
        setFieldErrors({});
        try {
            if (role === "admin") {
                const payload: Record<string, unknown> = { ...adminForm, gender: adminForm.gender };
                if (!String(payload.email ?? "").trim()) {
                    delete payload.email;
                }
                await adminRegister(payload);
                message("Admin account created.", false);
                setAdminForm(emptyAdminForm());
                setRegistrationOpen(false);
                setTimeout(() => navigate("/dashboard"), 800);
            } else {
                await residentRegister({
                    ...residentForm,
                    gender: residentForm.gender,
                    plate_number: residentForm.plate_number.trim().replace(/\s+/g, " ").toUpperCase(),
                });
                message("Registration successful.", false);
                setResidentForm(emptyResidentForm());
                setRegistrationOpen(false);
                setTimeout(() => navigate("/resident/home"), 800);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setRegisterLoading(false);
        }
    };

    const openRegistration = () => {
        setRegistrationOpen(true);
        setFieldErrors({});
    };

    return (
        <div className="w-full">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
                    <SparkleGlyph />
                </div>
                <h2 className="text-[1.65rem] font-semibold tracking-tight text-white">{loginHeadline}</h2>
                <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-violet-200/88">{loginSubtitle}</p>
            </div>


            <form onSubmit={handleLoginSubmit} className="max-h-[46vh] overflow-y-auto pr-0.5 scrollbar-thin">
                {role === "admin" && (
                    <>
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
                    </>
                )}

                {role === "resident" && (
                    <>
                        {!usePlateLogin ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <AuthField
                                    label="Plate Number"
                                    name="plate_number"
                                    value={plateNumber}
                                    onChange={(e) => setPlateNumber(e.target.value)}
                                    errors={fieldErrors.plate_number}
                                    required
                                    autoFocus
                                />
                                <AuthField
                                    label="Contact Number"
                                    name="contact_number"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    errors={fieldErrors.contact_number}
                                    required
                                />
                            </>
                        )}
                        <p className="mb-1 text-center text-[11px] leading-snug text-violet-200/80">
                            <button
                                type="button"
                                className="underline underline-offset-2 hover:text-white"
                                onClick={() => {
                                    setUsePlateLogin(!usePlateLogin);
                                    setFieldErrors({});
                                }}
                            >
                                {usePlateLogin
                                    ? "Sign in with username & password instead"
                                    : "Sign in with plate number & contact instead"}
                            </button>
                        </p>
                    </>
                )}

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
                Don&apos;t have an account?{" "}
                <button
                    type="button"
                    className="font-semibold text-white underline underline-offset-[3px] transition hover:text-violet-100"
                    onClick={openRegistration}
                >
                    Registration
                </button>
            </p>

            <RegistrationModal
                isOpen={registrationOpen}
                onClose={() => setRegistrationOpen(false)}
                role={role}
                adminForm={adminForm}
                setAdminForm={setAdminForm}
                residentForm={residentForm}
                setResidentForm={setResidentForm}
                genders={genders}
                fieldErrors={fieldErrors}
                loading={registerLoading}
                onRegister={handleRegister}
            />
        </div>
    );
};

export default AuthForm;
