import type { FC, ReactNode } from "react";
import subdivisionBackground from "../../assets/img/subdivision-gate-background.png";

interface AuthPageLayoutProps {
    children: ReactNode;
    welcomeTitle?: string;
    welcomeSubtitle?: string;
}

const AuthPageLayout: FC<AuthPageLayoutProps> = ({
    children,
    welcomeTitle = "Welcome",
    welcomeSubtitle = "Have a great journey ahead...",
}) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Subdivision gate background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                style={{ backgroundImage: `url(${subdivisionBackground})` }}
                aria-hidden
            />

            {/* Dark gradient overlay for text readability */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-emerald-950/50 to-violet-950/65"
                aria-hidden
            />

            <div className="relative z-10 flex min-h-screen flex-col lg:flex-row lg:items-center lg:justify-between px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
                {/* Left — Welcome */}
                <div className="mb-10 lg:mb-0 lg:max-w-lg lg:flex-1">
                    <p className="text-emerald-300/90 text-sm font-semibold uppercase tracking-widest mb-3 drop-shadow">
                        Gate Access System
                    </p>
                    <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                        {welcomeTitle}
                    </h1>
                    <p className="mt-4 text-lg sm:text-xl text-white/85 font-light drop-shadow-md max-w-md">
                        {welcomeSubtitle}
                    </p>
                </div>

                {/* Right — Glass card */}
                <div className="w-full max-w-md lg:flex-shrink-0">
                    <div
                        className="rounded-3xl border border-white/25 p-8 sm:p-10 shadow-2xl shadow-black/40"
                        style={{
                            background: "rgba(15, 23, 42, 0.45)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPageLayout;
