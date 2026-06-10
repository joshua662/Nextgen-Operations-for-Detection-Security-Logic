import type { FC, ReactNode } from "react";
import loginBackdrop from "../../assets/img/subdivision-gate-background.png";

interface AuthPageLayoutProps {
    children: ReactNode;
}

/** Lavender-field-inspired fullscreen backdrop + centered glass card (children render inside card). */
const AuthPageLayout: FC<AuthPageLayoutProps> = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <img
                src={loginBackdrop}
                alt=""
                className="absolute inset-0 h-full w-full object-cover scale-105"
                aria-hidden
            />

            {/* Twilight indigo / purple grading */}
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

            <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
                <div
                    className="auth-login-card-animate w-full max-w-[440px] rounded-[28px] border border-white/25 px-10 py-12 shadow-2xl shadow-black/45 sm:px-11 sm:py-12"
                    style={{
                        background: "rgba(30, 27, 75, 0.42)",
                        backdropFilter: "blur(18px)",
                        WebkitBackdropFilter: "blur(18px)",
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthPageLayout;
