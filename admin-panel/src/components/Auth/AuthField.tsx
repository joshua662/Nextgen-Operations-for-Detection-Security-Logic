import { useState, type ChangeEvent, type FC, type ReactNode } from "react";

const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/85" aria-hidden>
        <path
            d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
            fill="currentColor"
            opacity="0.9"
        />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/85" aria-hidden>
        <path
            d="M3 3l18 18M9.88 9.88a3 3 0 0 0 4.24 4.24M10.73 5.08C11.15 5.03 11.57 5 12 5c7 0 10 7 10 7a21.23 21.23 0 0 1-3.49 4.36M6.11 6.11C4.14 7.55 2.5 10 2.5 10s3 7 10 7c1.07 0 2.05-.17 2.95-.49"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface AuthFieldProps {
    label: string;
    name: string;
    type?: string;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    required?: boolean;
    autoFocus?: boolean;
    errors?: string[];
    children?: ReactNode;
    /** Eye toggle for password fields */
    passwordToggle?: boolean;
}

const AuthField: FC<AuthFieldProps> = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    required,
    autoFocus,
    errors,
    children,
    passwordToggle,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = Boolean(errors?.length);
    const isPassword = type === "password";
    const inputType = isPassword && passwordToggle && showPassword ? "text" : type;

    const inputClass =
        "w-full rounded-xl border border-violet-200/28 bg-indigo-950/45 px-4 py-3.5 text-sm text-white placeholder:text-violet-200/45 outline-none transition focus:border-violet-200/55 focus:bg-indigo-950/58 focus:ring-2 focus:ring-violet-400/22 [color-scheme:dark]";

    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-2 block text-xs font-medium tracking-wide text-violet-200/95">
                {label}
                {required && <span className="ml-0.5 text-pink-300">*</span>}
            </label>
            {children ? (
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`${inputClass} appearance-none cursor-pointer`}
                >
                    {children}
                </select>
            ) : isPassword && passwordToggle ? (
                <div className="relative">
                    <input
                        id={name}
                        name={name}
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        required={required}
                        autoFocus={autoFocus}
                        className={`${inputClass} pr-12 ${hasError ? "border-red-400/55 focus:ring-red-400/25" : ""}`}
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 text-white/80 outline-none transition hover:bg-white/10 hover:text-white"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoFocus={autoFocus}
                    className={`${inputClass} ${hasError ? "border-red-400/55 focus:ring-red-400/25" : ""}`}
                />
            )}
            {hasError && <p className="mt-1.5 text-xs text-pink-300">{errors?.[0]}</p>}
        </div>
    );
};

export default AuthField;
