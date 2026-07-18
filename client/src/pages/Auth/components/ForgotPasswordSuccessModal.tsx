import { useEffect, type FC } from "react";
import { createPortal } from "react-dom";
import { useModalAnimation } from "../../../hooks/useModalAnimation";

interface ForgotPasswordSuccessModalProps {
    isVisible: boolean;
    onClose: () => void;
    email: string;
}

const ForgotPasswordSuccessModal: FC<ForgotPasswordSuccessModalProps> = ({ isVisible, onClose, email }) => {
    // Use useModalAnimation to smoothly animate in and out
    const { shouldRender, isAnimatingOut } = useModalAnimation(isVisible, 300);

    useEffect(() => {
        if (!isVisible) return;
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [isVisible, onClose]);

    if (!shouldRender) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6" 
            style={{ pointerEvents: "auto" }} 
            role="presentation" 
        >
            <div 
                className={`fixed inset-0 bg-black/70 backdrop-blur-md ${isAnimatingOut ? 'opacity-0' : 'animate-modal-backdrop-in'}`} 
                aria-hidden 
            />
            <div
                className={`pointer-events-auto relative z-10 w-full max-w-[480px] shrink-0 overflow-hidden rounded-[24px] px-10 py-12 text-center shadow-[0_32px_64px_rgba(0,0,0,0.55)] border border-white/10 ${isAnimatingOut ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
                role="alert"
                style={{ 
                    background: "linear-gradient(135deg, rgba(20,16,48,0.7) 0%, rgba(14,12,36,0.8) 100%)",
                    backdropFilter: "blur(20px)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="relative mx-auto mb-6 flex h-[100px] w-[100px] items-center justify-center">
                    <svg className="h-[60px] w-[80px]" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 14C4 8.47715 8.47715 4 14 4H86C91.5228 4 96 8.47715 96 14V46C96 51.5228 91.5228 56 86 56H14C8.47715 56 4 51.5228 4 46V14Z" stroke="#e4e4e7" strokeWidth="4" strokeLinejoin="round" />
                        <path d="M4 14L45.414 41.7483C48.1633 43.5912 51.8367 43.5912 54.586 41.7483L96 14" stroke="#e4e4e7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="absolute -right-1 -top-1 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-zinc-900 border-[3.5px] border-[#13112a]">
                        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h3 className="mb-4 text-2xl font-bold text-zinc-100 tracking-tight">Credentials Sent!</h3>
                <p className="mx-auto mb-2 text-[14.5px] leading-[1.6] text-zinc-300/80 max-w-[320px]">
                    We have successfully sent your new password to <span className="text-white font-semibold">{email}</span>.
                </p>
                <p className="mx-auto text-[13px] leading-[1.6] text-zinc-400 max-w-[320px] mt-3">
                    Please check your inbox or spam folder for the credentials.
                </p>
            </div>
        </div>,
        document.body
    );
};

export default ForgotPasswordSuccessModal;
