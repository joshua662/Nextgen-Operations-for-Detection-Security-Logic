import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthField from "./AuthField";
import SubmitButton from "../../../components/Button/SubmitButton";
import { useAuth } from "../../../contexts/AuthContext";
import GenderService from "../../../services/GenderService";

type UserRole = "admin" | "resident";
type AuthMode = "login" | "register";

interface AuthFormProps {
    message: (message: string, isFailed: boolean) => void;
    defaultMode?: AuthMode;
    defaultRole?: UserRole;
}

const emptyResidentForm = () => ({
    first_name: "", middle_name: "", last_name: "", gender: "", birth_date: "",
    contact_number: "", address: "", plate_number: "", car_model: "", car_color: "",
});

const emptyAdminForm = () => ({
    first_name: "", middle_name: "", last_name: "", gender: "", birth_date: "",
    username: "", password: "", password_confirmation: "",
});

const pillBtn = (active: boolean) =>
    `flex-1 py-2 text-xs font-semibold uppercase tracking-wide rounded-xl transition-all ${
        active
            ? "bg-white/20 text-white shadow-inner border border-white/25"
            : "text-violet-200/70 hover:text-white hover:bg-white/5"
    }`;

const AuthForm = ({ message, defaultMode = "login", defaultRole = "admin" }: AuthFormProps) => {
    const [role, setRole] = useState<UserRole>(defaultRole);
    const [mode, setMode] = useState<AuthMode>(defaultMode);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
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
        setMode(defaultMode);
    }, [defaultMode]);

    useEffect(() => {
        if (mode === "register") {
            GenderService.loadPublicGenders().then((r) => setGenders(r.data.genders ?? []));
        }
    }, [mode, role]);

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
        } else {
            message("Something went wrong. Please try again.", true);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({});

        try {
            if (role === "admin" && mode === "login") {
                await login(username, password);
                message("Login successful.", false);
                setTimeout(() => navigate("/dashboard"), 800);
            } else if (role === "admin" && mode === "register") {
                await adminRegister(adminForm);
                message("Admin account created.", false);
                setTimeout(() => navigate("/dashboard"), 800);
            } else if (role === "resident" && mode === "login") {
                await residentLogin(plateNumber, contactNumber);
                message("Login successful.", false);
                setTimeout(() => navigate("/resident/home"), 800);
            } else {
                await residentRegister({ ...residentForm, gender: residentForm.gender });
                message("Registration successful.", false);
                setTimeout(() => navigate("/resident/home"), 800);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === "login";

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold text-white mb-1 text-center lg:text-left">
                {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-sm text-violet-200/70 mb-6 text-center lg:text-left">
                Gate Access System
            </p>

            <div className="flex rounded-2xl bg-black/20 p-1 mb-4 border border-white/10">
                <button type="button" onClick={() => { setRole("admin"); setFieldErrors({}); }} className={pillBtn(role === "admin")}>
                    Admin
                </button>
                <button type="button" onClick={() => { setRole("resident"); setFieldErrors({}); }} className={pillBtn(role === "resident")}>
                    Resident
                </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[52vh] overflow-y-auto pr-1 scrollbar-thin">
                {role === "admin" && isLogin && (
                    <>
                        <AuthField label="Username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} errors={fieldErrors.username} required autoFocus />
                        <AuthField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} errors={fieldErrors.password} required />
                    </>
                )}

                {role === "admin" && !isLogin && (
                    <>
                        <AuthField label="First Name" name="first_name" value={adminForm.first_name} onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })} errors={fieldErrors.first_name} required />
                        <AuthField label="Middle Name" name="middle_name" value={adminForm.middle_name} onChange={(e) => setAdminForm({ ...adminForm, middle_name: e.target.value })} />
                        <AuthField label="Last Name" name="last_name" value={adminForm.last_name} onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })} errors={fieldErrors.last_name} required />
                        <AuthField label="Gender" name="gender" value={adminForm.gender} onChange={(e) => setAdminForm({ ...adminForm, gender: e.target.value })} errors={fieldErrors.gender} required>
                            <option value="">Select gender</option>
                            {genders.map((g) => <option key={g.gender_id} value={g.gender_id} className="bg-violet-900">{g.gender}</option>)}
                        </AuthField>
                        <AuthField label="Birth Date" name="birth_date" type="date" value={adminForm.birth_date} onChange={(e) => setAdminForm({ ...adminForm, birth_date: e.target.value })} errors={fieldErrors.birth_date} required />
                        <AuthField label="Username" name="username" value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} errors={fieldErrors.username} required />
                        <AuthField label="Password" name="password" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} errors={fieldErrors.password} required />
                        <AuthField label="Confirm Password" name="password_confirmation" type="password" value={adminForm.password_confirmation} onChange={(e) => setAdminForm({ ...adminForm, password_confirmation: e.target.value })} errors={fieldErrors.password_confirmation} required />
                    </>
                )}

                {role === "resident" && isLogin && (
                    <>
                        <AuthField label="Plate Number" name="plate_number" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} errors={fieldErrors.plate_number} required autoFocus />
                        <AuthField label="Contact Number" name="contact_number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} errors={fieldErrors.contact_number} required />
                    </>
                )}

                {role === "resident" && !isLogin && (
                    <>
                        <AuthField label="First Name" name="first_name" value={residentForm.first_name} onChange={(e) => setResidentForm({ ...residentForm, first_name: e.target.value })} errors={fieldErrors.first_name} required />
                        <AuthField label="Middle Name" name="middle_name" value={residentForm.middle_name} onChange={(e) => setResidentForm({ ...residentForm, middle_name: e.target.value })} />
                        <AuthField label="Last Name" name="last_name" value={residentForm.last_name} onChange={(e) => setResidentForm({ ...residentForm, last_name: e.target.value })} errors={fieldErrors.last_name} required />
                        <AuthField label="Gender" name="gender" value={residentForm.gender} onChange={(e) => setResidentForm({ ...residentForm, gender: e.target.value })} errors={fieldErrors.gender} required>
                            <option value="">Select gender</option>
                            {genders.map((g) => <option key={g.gender_id} value={g.gender_id} className="bg-violet-900">{g.gender}</option>)}
                        </AuthField>
                        <AuthField label="Birthdate" name="birth_date" type="date" value={residentForm.birth_date} onChange={(e) => setResidentForm({ ...residentForm, birth_date: e.target.value })} errors={fieldErrors.birth_date} required />
                        <AuthField label="Contact Number" name="contact_number" value={residentForm.contact_number} onChange={(e) => setResidentForm({ ...residentForm, contact_number: e.target.value })} errors={fieldErrors.contact_number} required />
                        <AuthField label="Address" name="address" value={residentForm.address} onChange={(e) => setResidentForm({ ...residentForm, address: e.target.value })} errors={fieldErrors.address} required />
                        <AuthField label="Plate Number" name="plate_number" value={residentForm.plate_number} onChange={(e) => setResidentForm({ ...residentForm, plate_number: e.target.value })} errors={fieldErrors.plate_number} required />
                        <AuthField label="Car Model" name="car_model" value={residentForm.car_model} onChange={(e) => setResidentForm({ ...residentForm, car_model: e.target.value })} errors={fieldErrors.car_model} required />
                        <AuthField label="Car Color" name="car_color" value={residentForm.car_color} onChange={(e) => setResidentForm({ ...residentForm, car_color: e.target.value })} errors={fieldErrors.car_color} required />
                    </>
                )}

                {isLogin && (
                    <label className="flex items-center gap-2.5 mb-6 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 text-violet-500 focus:ring-violet-400/50 focus:ring-offset-0"
                        />
                        <span className="text-sm text-violet-100/90">Remember me</span>
                    </label>
                )}

                <SubmitButton
                    className="w-full !rounded-full !py-3.5 !text-sm !font-bold !uppercase !tracking-widest !shadow-lg !shadow-violet-900/40 !border-0"
                    newClassName="inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold uppercase tracking-widest text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-600 hover:from-violet-400 hover:via-fuchsia-400 hover:to-violet-500 transition-all shadow-lg shadow-violet-900/50"
                    label={isLogin ? "Sign In" : "Create Account"}
                    loading={loading}
                    loadingLabel={isLogin ? "Signing in..." : "Creating account..."}
                />
            </form>

            <p className="text-center text-sm text-violet-100/80 mt-6">
                {isLogin ? (
                    <>
                        Don&apos;t have an account?{" "}
                        <Link to="/register" className="text-white font-semibold underline underline-offset-2 hover:text-violet-200">
                            Sign Up
                        </Link>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <Link to="/login" className="text-white font-semibold underline underline-offset-2 hover:text-violet-200">
                            Sign In
                        </Link>
                    </>
                )}
            </p>

            {isLogin && (
                <p className="text-center mt-4">
                    <button type="button" className="text-xs text-violet-200/50 hover:text-violet-100 transition-colors">
                        Forgot Password
                    </button>
                </p>
            )}
        </div>
    );
};

export default AuthForm;
