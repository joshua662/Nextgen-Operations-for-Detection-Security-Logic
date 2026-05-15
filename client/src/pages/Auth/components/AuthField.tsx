import type { ChangeEvent, FC, ReactNode } from "react";

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
}) => {
    const hasError = Boolean(errors?.length);
    const inputClass =
        "w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-violet-200/50 outline-none transition focus:border-violet-300/50 focus:bg-white/15 focus:ring-2 focus:ring-violet-400/30 [color-scheme:dark]";

    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-2 block text-sm font-medium text-violet-100/90">
                {label}
                {required && <span className="text-pink-300 ml-0.5">*</span>}
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
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoFocus={autoFocus}
                    className={`${inputClass} ${hasError ? "border-red-400/60 focus:ring-red-400/30" : ""}`}
                />
            )}
            {hasError && (
                <p className="mt-1.5 text-xs text-pink-300">{errors?.[0]}</p>
            )}
        </div>
    );
};

export default AuthField;
