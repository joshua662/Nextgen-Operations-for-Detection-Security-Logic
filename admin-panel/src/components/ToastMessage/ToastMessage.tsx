import { useEffect, type FC } from "react";
import { createPortal } from "react-dom";

interface ToastMessageProps {
  message: string;
  title?: string;
  isFailed?: boolean;
  isVisible: boolean;
  onClose: () => void;
  /** Auto-close delay in milliseconds. Default 3000. Set 0 to disable. */
  autoCloseMs?: number;
  /** Larger card for modals / prominent confirmations. */
  size?: "default" | "large";
  /** Full-screen dimmed overlay — use on login/auth so toast is separate from the form card. */
  overlay?: boolean;
  /** Override the bottom action button label. */
  actionLabel?: string;
}

const SuccessIcon = ({ large }: { large?: boolean }) => (
  <svg width={large ? 40 : 36} height={large ? 40 : 36} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M6 12.5 10 16.5 18 8"
      stroke="#1a1a1a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = ({ large }: { large?: boolean }) => (
  <svg width={large ? 40 : 36} height={large ? 40 : 36} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 8l8 8M16 8l-8 8" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const DecorativeBubbles = ({ tone }: { tone: "success" | "error" }) => {
  const fill = tone === "success" ? "#b8e986" : "#f5a8a8";
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
      width="200"
      height="120"
      viewBox="0 0 200 120"
      aria-hidden
    >
      <circle cx="48" cy="42" r="14" fill={fill} opacity="0.45" />
      <circle cx="152" cy="36" r="10" fill={fill} opacity="0.35" />
      <circle cx="118" cy="58" r="18" fill={fill} opacity="0.3" />
      <circle cx="72" cy="68" r="8" fill={fill} opacity="0.5" />
      <circle cx="168" cy="64" r="6" fill={fill} opacity="0.4" />
    </svg>
  );
};

const ToastMessage: FC<ToastMessageProps> = ({
  message,
  title,
  isFailed = false,
  isVisible,
  onClose,
  autoCloseMs = 3000,
  size = "default",
  overlay = false,
  actionLabel,
}) => {
  const isLarge = size === "large";
  const tone = isFailed ? "error" : "success";

  const palette = isFailed
    ? {
        iconBg: "#f5b0b0",
        buttonBg: "#f08a8a",
        buttonHover: "#e86f6f",
        buttonShadow: "0 12px 28px rgba(240, 138, 138, 0.45)",
        wave: "rgba(245, 168, 168, 0.22)",
        defaultTitle: "Something went wrong",
        defaultAction: "Try again",
      }
    : {
        iconBg: "#c8eb7b",
        buttonBg: "#b8e986",
        buttonHover: "#a8dc6e",
        buttonShadow: "0 12px 28px rgba(184, 233, 134, 0.5)",
        wave: "rgba(200, 235, 123, 0.28)",
        defaultTitle: "Success",
        defaultAction: "Ok",
      };

  const heading = title ?? palette.defaultTitle;
  const buttonText = actionLabel ?? palette.defaultAction;

  useEffect(() => {
    if (!isVisible || autoCloseMs <= 0) return;
    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isVisible, onClose, autoCloseMs]);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
      style={{ pointerEvents: overlay ? "auto" : "none" }}
      role="presentation"
      onClick={overlay ? onClose : undefined}
    >
      {overlay && (
        <div
          className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
          aria-hidden
          style={{ animation: "toast-backdrop-in 0.25s ease both" }}
        />
      )}

      <div
        className={`pointer-events-auto relative z-10 shrink-0 overflow-hidden rounded-[32px] bg-white text-center shadow-[0_28px_56px_rgba(15,23,42,0.28)] ${
          isLarge ? "w-[min(520px,calc(100vw-2rem))] px-12 pb-12 pt-10" : "w-[min(440px,calc(100vw-2rem))] px-10 pb-10 pt-9"
        }`}
        role="alert"
        style={{
          animation: "toast-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes toast-backdrop-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes toast-pop-in {
            from { opacity: 0; transform: scale(0.88) translateY(12px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Soft wave header */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[110px] overflow-hidden rounded-t-[28px]"
          aria-hidden
        >
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 400 80"
            preserveAspectRatio="none"
            style={{ height: 80 }}
          >
            <path
              d="M0,48 C80,8 120,72 200,40 C280,8 320,64 400,32 L400,0 L0,0 Z"
              fill={palette.wave}
            />
          </svg>
        </div>

        <DecorativeBubbles tone={tone} />

        {/* Icon */}
        <div className="relative z-10 mx-auto mb-6 flex justify-center pt-2">
          <div
            className={`flex items-center justify-center rounded-full shadow-sm ${
              isLarge ? "h-[88px] w-[88px]" : "h-20 w-20"
            }`}
            style={{ backgroundColor: palette.iconBg }}
          >
            {isFailed ? <ErrorIcon large={isLarge} /> : <SuccessIcon large={isLarge} />}
          </div>
        </div>

        <h4
          className={`relative z-10 font-bold tracking-tight text-slate-800 ${
            isLarge ? "text-2xl" : "text-xl"
          }`}
        >
          {heading}
        </h4>

        <p
          className={`relative z-10 mx-auto mt-3 leading-relaxed text-slate-500 ${
            isLarge ? "max-w-[380px] text-lg" : "max-w-[340px] text-base"
          }`}
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`relative z-10 mt-8 w-full rounded-full font-semibold text-white transition hover:brightness-95 active:scale-[0.98] ${
            isLarge ? "py-4 text-lg" : "py-3.5 text-base"
          }`}
          style={{
            backgroundColor: palette.buttonBg,
            boxShadow: palette.buttonShadow,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = palette.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = palette.buttonBg;
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ToastMessage;
