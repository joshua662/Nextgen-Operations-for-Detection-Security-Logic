import type { CheckPlateResponse, VerifyPlateResponse } from "../../interfaces/GateInterface";
import type { PlateReaderStatus } from "../../hooks/usePlateReader";
import { formatPlateDisplay } from "../../utils/plateOcr";

type AnprPlateOverlayProps = {
    status: PlateReaderStatus;
    detectedPlate: string;
    lastResult: VerifyPlateResponse | null;
    checkResult: CheckPlateResponse | null;
    streamOnline: boolean;
};

const PLATE_BOX = { left: 22, top: 58, width: 56, height: 16 };
const ACCENT_GREEN = "#00ff41";
const ACCENT_RED = "#ef4444";
const ACCENT_IDLE = "rgba(0,255,65,0.45)";

const AnprPlateOverlay = ({
    status,
    detectedPlate,
    lastResult,
    checkResult,
    streamOnline,
}: AnprPlateOverlayProps) => {
    if (!streamOnline) return null;

    const isScanning = status === "scanning" || status === "verifying";
    const log = lastResult?.log;

    const plate = checkResult?.plate_number
        ? formatPlateDisplay(checkResult.plate_number)
        : lastResult
          ? formatPlateDisplay(log!.plate_number)
          : detectedPlate
            ? formatPlateDisplay(detectedPlate)
            : "";

    if (!plate && !isScanning) return null;

    const registered = plate ? (checkResult?.registered ?? lastResult?.authorized) : undefined;

    const accent =
        registered === false
            ? ACCENT_RED
            : registered === true
              ? ACCENT_GREEN
              : isScanning
                ? "#eab308"
                : ACCENT_IDLE;

    const model = checkResult?.car_model || log?.car_model || "—";
    const color = checkResult?.car_color || log?.car_color || "—";
    const owner = checkResult?.resident_name || lastResult?.resident_name || log?.owner_name;

    const statusLabel = isScanning
        ? status === "verifying"
            ? "Verifying..."
            : "Reading plate..."
        : plate
          ? registered
              ? "Registered"
              : "Not Registered"
          : "No Plate Detected";

    const boxRight = PLATE_BOX.left + PLATE_BOX.width;
    const boxCenterY = PLATE_BOX.top + PLATE_BOX.height / 2;

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                className="absolute border-2"
                style={{
                    left: `${PLATE_BOX.left}%`,
                    top: `${PLATE_BOX.top}%`,
                    width: `${PLATE_BOX.width}%`,
                    height: `${PLATE_BOX.height}%`,
                    borderColor: accent,
                    boxShadow:
                        registered !== undefined
                            ? registered
                                ? "0 0 8px rgba(0,255,65,0.5)"
                                : "0 0 8px rgba(239,68,68,0.5)"
                            : "0 0 6px rgba(234,179,8,0.4)",
                    animation: isScanning ? "anpr-pulse 1.2s ease-in-out infinite" : undefined,
                }}
            >
                {/* Laser scan line effect */}
                {isScanning && !plate && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-yellow-400 shadow-[0_0_8px_#eab308]"
                        style={{
                            animation: "scan-laser 2s linear infinite",
                        }}
                    />
                )}
            </div>

            <PlateCornerBrackets accent={accent} />

            {plate && (
                <>
                    <svg className="absolute inset-0 h-full w-full" aria-hidden>
                        <line
                            x1={`${boxRight}%`}
                            y1={`${boxCenterY}%`}
                            x2="72%"
                            y2="32%"
                            stroke={accent}
                            strokeWidth="2"
                        />
                    </svg>

                    <div
                        className="absolute right-[4%] top-[18%] min-w-[148px] max-w-[55%] border-2 bg-black/92 px-3 py-2.5 font-mono text-[11px] leading-relaxed shadow-lg sm:text-xs"
                        style={{ borderColor: accent, color: accent }}
                    >
                        <p className="font-bold tracking-wide">
                            {plate}
                            <span className="font-normal opacity-80"> (PH)</span>
                        </p>
                        <p className="mt-1 opacity-90">
                            Model: <span className="text-white">{model}</span>
                        </p>
                        <p className="opacity-90">
                            Color: <span className="text-white">{color}</span>
                        </p>
                        {owner && (
                            <p className="opacity-90">
                                Owner: <span className="text-white">{owner}</span>
                            </p>
                        )}
                        <p className="mt-1.5 font-bold uppercase tracking-wider">
                            Status:{" "}
                            <span
                                className={
                                    isScanning
                                        ? "text-yellow-300"
                                        : registered === true
                                          ? "text-[#00ff41]"
                                          : registered === false
                                            ? "text-red-400"
                                            : "text-zinc-400"
                                }
                            >
                                {statusLabel}
                            </span>
                        </p>
                    </div>
                </>
            )}

            <style>{`
                @keyframes anpr-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }
                @keyframes scan-laser {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
            `}</style>
        </div>
    );
};

const PlateCornerBrackets = ({ accent }: { accent: string }) => {
    const { left, top, width, height } = PLATE_BOX;
    const right = left + width;
    const bottom = top + height;
    const size = 2.5;

    const corners = [
        { x: left, y: top, dx: size, dy: 0, dx2: 0, dy2: size },
        { x: right, y: top, dx: -size, dy: 0, dx2: 0, dy2: size },
        { x: left, y: bottom, dx: size, dy: 0, dx2: 0, dy2: -size },
        { x: right, y: bottom, dx: -size, dy: 0, dx2: 0, dy2: -size },
    ];

    return (
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {corners.map((c, i) => (
                <g key={i} stroke={accent} strokeWidth="3" fill="none">
                    <line x1={`${c.x}%`} y1={`${c.y}%`} x2={`${c.x + c.dx}%`} y2={`${c.y + c.dy}%`} />
                    <line x1={`${c.x}%`} y1={`${c.y}%`} x2={`${c.x + c.dx2}%`} y2={`${c.y + c.dy2}%`} />
                </g>
            ))}
        </svg>
    );
};

export default AnprPlateOverlay;
