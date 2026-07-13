import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { DashboardOverview, VerifyPlateResponse } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";
import { useAuth } from "../../contexts/AuthContext";
import ResidentsPage from "../Residents/ResidentsPage";
import GateLogsPage from "../GateLogs/GateLogsPage";
import UpdateRequestsPage from "../UpdateRequests/UpdateRequestsPage";
import ReportsPage from "../Reports/ReportsPage";
import { usePlateReader } from "../../hooks/usePlateReader";
import AnprPlateOverlay from "../../components/Camera/AnprPlateOverlay";

type QuickActionKey = "residents" | "gate-logs" | "update-requests" | "reports";
type CameraLocation = "entrance" | "exit";
type CameraHealthStatus = "online" | "offline";

/** Keep the camera URL exactly as configured — only trim and add protocol if missing. */
const sanitizeCameraUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

/** API base URL — must match AxiosInstance config */
const API_BASE = "http://127.0.0.1:8000/api";

/**
 * Build a proxy URL that streams the ESP32-CAM feed through the Laravel backend.
 * This avoids mixed-content (HTTPS → HTTP) blocks and the ESP32-CAM single-client limit.
 * Falls back to the direct URL if the camera URL is empty.
 */
const buildProxyStreamUrl = (location: CameraLocation, directUrl: string): string => {
    const sanitized = sanitizeCameraUrl(directUrl);
    if (!sanitized) return "";
    // Get the auth token from localStorage so the proxy request is authenticated
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({ location });
    if (token) params.append("token", token);
    return `${API_BASE}/gate/camera-stream-proxy?${params.toString()}`;
};

const resolveEntranceStreamUrl = (data: DashboardOverview) => {
    const rawUrl = data.entrance_camera_stream_url || data.camera_stream_url || "rtsp://admin:password@192.168.2.103:554/ch0_0.h264";
    if (rawUrl.toLowerCase().startsWith("rtsp://") || data.entrance_camera_status === "online" || data.camera_status === "online") {
        return `${API_BASE.replace(/\/api$/, "")}/camera_entrance.jpg`;
    }
    return buildProxyStreamUrl("entrance", rawUrl);
};

const resolveExitStreamUrl = (data: DashboardOverview) => {
    if (data.exit_camera_status === "online") {
        return `${API_BASE.replace(/\/api$/, "")}/camera_exit.jpg`;
    }
    return buildProxyStreamUrl("exit", data.exit_camera_stream_url || "http://192.168.2.105:81/stream");
};

const QUICK_ACTIONS: {
    key: QuickActionKey;
    label: string;
    primary?: boolean;
}[] = [
        {
            key: "residents",
            label: "Manage Residents",
            primary: true,
        },
        {
            key: "gate-logs",
            label: "View Gate Logs",
        },
        {
            key: "update-requests",
            label: "Review Requests",
        },
        {
            key: "reports",
            label: "View Reports",
        },
    ];

const DashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeQuickAction, setActiveQuickAction] = useState<QuickActionKey | null>(null);

    const refreshDashboard = useCallback(() => {
        return GateAccessService.dashboardOverview().then((res) => setData(res.data));
    }, []);

    useEffect(() => {
        refreshDashboard().finally(() => setLoading(false));
        const intervalId = setInterval(() => {
            void refreshDashboard();
        }, 4000);
        return () => clearInterval(intervalId);
    }, [refreshDashboard]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePlateVerified = useCallback((_result: VerifyPlateResponse) => {
        void refreshDashboard();
    }, [refreshDashboard]);

    const handleSaveCameraStream = (location: CameraLocation, streamUrl: string) => {
        const savedUrl = sanitizeCameraUrl(streamUrl);
        const payload =
            location === "entrance"
                ? { entrance_camera_stream_url: savedUrl, entrance_camera_status: "online" as const }
                : { exit_camera_stream_url: savedUrl, exit_camera_status: "online" as const };

        return GateAccessService.updateSystemHealth(payload).then(() => {
            if (!data) return;

            if (location === "entrance") {
                setData({
                    ...data,
                    entrance_camera_stream_url: savedUrl,
                    entrance_camera_status: "online",
                    camera_stream_url: savedUrl,
                    camera_status: "online",
                });
                return;
            }

            setData({
                ...data,
                exit_camera_stream_url: savedUrl,
                exit_camera_status: "online",
            });
        });
    };

    const handleCameraStatusChange = (location: CameraLocation, status: CameraHealthStatus) => {
        if (!data) return;

        const currentStatus =
            location === "entrance"
                ? data.entrance_camera_status ?? data.camera_status
                : data.exit_camera_status;

        if (currentStatus === status) return;

        const payload =
            location === "entrance"
                ? { entrance_camera_status: status }
                : { exit_camera_status: status };

        GateAccessService.updateSystemHealth(payload).then(() => {
            setData((prev) => {
                if (!prev) return prev;

                if (location === "entrance") {
                    return {
                        ...prev,
                        entrance_camera_status: status,
                        camera_status: status,
                    };
                }

                return { ...prev, exit_camera_status: status };
            });
        });
    };

    useEffect(() => {
        if (!activeQuickAction) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActiveQuickAction(null);
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [activeQuickAction]);

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    if (!data) return <p className="text-zinc-500">Unable to load dashboard.</p>;

    const displayName = [user?.user?.first_name, user?.user?.last_name].filter(Boolean).join(" ") || "Admin";

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-xl">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Welcome, {displayName}!</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">Gate Security System - Security Guard Dashboard</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Total Residents" value={data.stats.total_residents} />
                <StatCard label="Entries Today" value={data.stats.authorized_entries} />
                <StatCard label="Exits Today" value={data.stats.authorized_exits} />
                <StatCard label="Pending Requests" value={data.stats.pending_update_requests} />
                <StatCard label="Unauthorized Today" value={data.stats.unauthorized_attempts} danger />
            </div>

            <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {QUICK_ACTIONS.map((action) => (
                        <QuickActionButton
                            key={action.key}
                            primary={action.primary}
                            onClick={() => setActiveQuickAction(action.key)}
                        >
                            {action.label}
                        </QuickActionButton>
                    ))}
                </div>
            </section>

            {activeQuickAction && (
                <QuickActionModal
                    action={QUICK_ACTIONS.find((action) => action.key === activeQuickAction) ?? QUICK_ACTIONS[0]}
                    onClose={() => setActiveQuickAction(null)}
                />
            )}

            <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Live Camera Feeds</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                    <CameraFeedPanel
                        location="entrance"
                        label="Entrance Camera"
                        badge="IN"
                        streamUrl={resolveEntranceStreamUrl(data)}
                        directStreamUrl={data.entrance_camera_stream_url || data.camera_stream_url || "rtsp://admin:password@192.168.2.103:554/ch0_0.h264"}
                        cameraStatus={data.entrance_camera_status ?? data.camera_status}
                        onSaveStreamUrl={(url) => handleSaveCameraStream("entrance", url)}
                        onStatusChange={(status) => handleCameraStatusChange("entrance", status)}
                        onPlateVerified={handlePlateVerified}
                        activePlate={data.entrance_active_plate}
                    />
                    <CameraFeedPanel
                        location="exit"
                        label="Exit Camera"
                        badge="OUT"
                        streamUrl={resolveExitStreamUrl(data)}
                        directStreamUrl={data.exit_camera_stream_url || "http://192.168.2.105:81/stream"}
                        cameraStatus={data.exit_camera_status ?? "offline"}
                        onSaveStreamUrl={(url) => handleSaveCameraStream("exit", url)}
                        onStatusChange={(status) => handleCameraStatusChange("exit", status)}
                        onPlateVerified={handlePlateVerified}
                        activePlate={data.exit_active_plate}
                    />
                </div>
            </section>

        </div>
    );
};

const CameraFeedPanel = ({
    location,
    label,
    badge,
    streamUrl,
    directStreamUrl,
    cameraStatus,
    onSaveStreamUrl,
    onStatusChange,
    onPlateVerified,
    activePlate,
}: {
    location: CameraLocation;
    badge: "IN" | "OUT";
    label: string;
    streamUrl?: string;
    directStreamUrl?: string;
    cameraStatus: CameraHealthStatus | string;
    onSaveStreamUrl: (url: string) => Promise<void>;
    onStatusChange: (status: CameraHealthStatus) => void;
    onPlateVerified?: (result: VerifyPlateResponse) => void;
    activePlate?: DashboardOverview["entrance_active_plate"];
}) => {
    const [showConfigureModal, setShowConfigureModal] = useState(false);
    const [streamError, setStreamError] = useState(false);
    const [liveStatus, setLiveStatus] = useState<CameraHealthStatus>(
        cameraStatus === "online" ? "online" : "offline"
    );
    const [cacheBuster, setCacheBuster] = useState(0);
    const lastReportedStatus = useRef<CameraHealthStatus | null>(null);
    const streamImageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLiveStatus(cameraStatus === "online" ? "online" : "offline");
    }, [cameraStatus]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStreamError(false);
        lastReportedStatus.current = null;
        setCacheBuster((prev) => prev + 1);
    }, [streamUrl]);

    useEffect(() => {
        if (liveStatus !== "online" || !streamUrl || !streamUrl.endsWith(".jpg")) return;

        // Dynamic 150ms interval (7 FPS) to refresh the static frame without locking the single-threaded server
        const intervalId = setInterval(() => {
            setCacheBuster((prev) => prev + 1);
        }, 150);

        return () => clearInterval(intervalId);
    }, [liveStatus, streamUrl]);

    const reportStatus = (status: CameraHealthStatus) => {
        setLiveStatus(status);
        if (lastReportedStatus.current !== status) {
            lastReportedStatus.current = status;
            onStatusChange(status);
        }
    };

    const handleStreamLoad = () => {
        setStreamError(false);
        reportStatus("online");
    };

    const handleStreamError = () => {
        setStreamError(true);
        reportStatus("offline");
    };

    const handleRetryStream = () => {
        setStreamError(false);
        setCacheBuster((prev) => prev + 1);
    };

    const badgeClass =
        badge === "IN"
            ? "bg-emerald-600/90 text-white"
            : "bg-orange-600/90 text-white";

    const effectiveStatus = streamUrl && !streamError ? liveStatus : "offline";

    const { status: plateStatus, detectedPlate, lastResult, checkResult } = usePlateReader({
        direction: badge,
        cameraLocation: location,
        streamUrl: streamUrl ?? "",
        streamOnline: effectiveStatus === "online",
        imageRef: streamImageRef,
        onVerified: onPlateVerified,
    });

    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>{badge}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowConfigureModal(true)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Configure
                    </button>
                </div>

                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-zinc-900">
                    {streamUrl && !streamError ? (
                        <img
                            ref={streamImageRef}
                            key={`${location}-${streamUrl}-${cacheBuster}`}
                            src={`${streamUrl}${streamUrl.includes("?") ? "&" : "?"}cb=${cacheBuster}`}
                            alt={label}
                            className="h-full w-full object-cover"
                            onLoad={handleStreamLoad}
                            onError={handleStreamError}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-400">
                            <svg
                                className="h-10 w-10 text-zinc-600 dark:text-zinc-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                            </svg>
                            <p className="mt-2 text-sm font-semibold text-zinc-300">Stream Offline or Failed</p>
                            <p className="mt-1 max-w-xs text-[11px] text-zinc-500">
                                Could not connect to <code>{directStreamUrl || "no URL configured"}</code>.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleRetryStream}
                                    className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700"
                                >
                                    Retry
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfigureModal(true)}
                                    className="rounded bg-blue-600/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-600/20"
                                >
                                    Configure
                                </button>
                            </div>
                        </div>
                    )}
                    <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm">
                        {badge} | {effectiveStatus}
                    </p>

                    {effectiveStatus === "online" && (
                        <AnprPlateOverlay
                            status={activePlate ? activePlate.status : plateStatus}
                            detectedPlate={activePlate ? activePlate.plate_number : detectedPlate}
                            lastResult={activePlate ? {
                                authorized: activePlate.authorized,
                                resident_name: activePlate.resident_name,
                                log: {
                                    plate_number: activePlate.plate_number,
                                    car_model: activePlate.car_model,
                                    car_color: activePlate.car_color,
                                    owner_name: activePlate.resident_name,
                                }
                            } as any : lastResult}
                            checkResult={activePlate ? {
                                registered: activePlate.authorized,
                                plate_number: activePlate.plate_number,
                                resident_name: activePlate.resident_name,
                                car_model: activePlate.car_model,
                                car_color: activePlate.car_color,
                            } : checkResult}
                            streamOnline={effectiveStatus === "online"}
                        />
                    )}
                </div>
            </div>

            <CameraHealthPanel
                label={label}
                status={effectiveStatus}
                streamUrl={streamUrl}
                hasStreamUrl={Boolean(streamUrl)}
            />

            {showConfigureModal && (
                <CameraConfigureModal
                    label={label}
                    badge={badge}
                    location={location}
                    streamUrl={directStreamUrl}
                    onClose={() => setShowConfigureModal(false)}
                    onSave={(url) =>
                        onSaveStreamUrl(url).then(() => {
                            setShowConfigureModal(false);
                            setStreamError(false);
                            lastReportedStatus.current = null;
                            setCacheBuster((prev) => prev + 1);
                            reportStatus("online");
                        })
                    }
                />
            )}
        </div>
    );
};

const CameraHealthPanel = ({
    label,
    status,
    streamUrl,
    hasStreamUrl,
}: {
    label: string;
    status: CameraHealthStatus;
    streamUrl?: string;
    hasStreamUrl: boolean;
}) => {
    const isOnline = status === "online";

    return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {label} — System Health
                </h4>
                <StatusBadge status={status} />
            </div>
            <div className="space-y-2.5">
                <HealthRow
                    label="Camera Status"
                    status={status}
                    indicator={isOnline ? "success" : "danger"}
                />
                <HealthRow
                    label="Stream Connection"
                    status={hasStreamUrl ? (isOnline ? "connected" : "disconnected") : "not configured"}
                    indicator={hasStreamUrl ? (isOnline ? "success" : "danger") : "neutral"}
                />
            </div>
        </div>
    );
};

const CameraConfigureModal = ({
    label,
    badge,
    location,
    streamUrl,
    onClose,
    onSave,
}: {
    label: string;
    badge: "IN" | "OUT";
    location: CameraLocation;
    streamUrl?: string;
    onClose: () => void;
    onSave: (url: string) => Promise<void>;
}) => {
    const defaultUrl = location === "exit" ? "http://192.168.2.105:81/stream" : "rtsp://admin:password@192.168.2.103:554/ch0_0.h264";

    // Determine the raw stream URL to show in input (empty by default, unless they saved one)
    const [streamUrlInput, setStreamUrlInput] = useState(streamUrl || "");
    const [saving, setSaving] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const handleSave = () => {
        const trimmed = streamUrlInput.trim();
        if (!trimmed) {
            setError("Stream URL is required.");
            return;
        }

        setSaving(true);
        setError("");
        onSave(trimmed)
            .catch(() => setError(`Failed to update ${label.toLowerCase()} stream URL.`))
            .finally(() => setSaving(false));
    };

    const handleTestConnection = async () => {
        const trimmed = streamUrlInput.trim();
        if (!trimmed) {
            setError("Stream URL is required.");
            return;
        }

        setTestingConnection(true);
        setConnectionResult(null);
        setError("");

        try {
            const res = await GateAccessService.testConnection(trimmed);
            if (res.data.online) {
                setConnectionResult({
                    success: true,
                    message: "Connection Successful! The ESP32-CAM is online and reachable.",
                });
            } else {
                setConnectionResult({
                    success: false,
                    message: res.data.message || "Connection Failed. Camera is offline or unreachable.",
                });
            }
        } catch (err) {
            setConnectionResult({
                success: false,
                message: "Connection Failed. Server error or network issue.",
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const badgeClass =
        badge === "IN"
            ? "bg-emerald-600 text-white"
            : "bg-orange-600 text-white";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-configure-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 id="camera-configure-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Configure {label}
                            </h2>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>{badge}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Set the ESP32-CAM MJPEG stream URL for the {location} gate camera.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                        aria-label="Close configure modal"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            ESP32-CAM MJPEG Stream URL
                        </label>
                        <input
                            type="text"
                            value={streamUrlInput}
                            onChange={(e) => {
                                setStreamUrlInput(e.target.value);
                                setError("");
                            }}
                            placeholder={defaultUrl}
                            className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        {error && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
                        )}
                        {window.location.protocol === "https:" && streamUrlInput.startsWith("http://") && (
                            <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                                Mixed content warning: browsers block insecure HTTP streams on HTTPS pages.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || saving}
                        className="rounded-md border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 disabled:opacity-60"
                    >
                        {testingConnection ? "Testing..." : "Test Connection"}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || testingConnection}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {connectionResult && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setConnectionResult(null)}>
                    <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-800" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            {connectionResult.success ? (
                                <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                {connectionResult.success ? "Connection Succeeded" : "Connection Failed"}
                            </h3>
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                {connectionResult.message}
                            </p>
                            <button
                                type="button"
                                onClick={() => setConnectionResult(null)}
                                className={`mt-5 w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition ${connectionResult.success
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: CameraHealthStatus }) => {
    const isOnline = status === "online";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${isOnline
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
                aria-hidden
            />
            {status}
        </span>
    );
};

const StatCard = ({ label, value, danger }: { label: string; value: number; danger?: boolean }) => (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</h3>
        <p className={`mt-2 text-3xl font-bold ${danger ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    </div>
);

const QuickActionModal = ({ action, onClose }: { action: (typeof QUICK_ACTIONS)[number]; onClose: () => void }) => (
    <div
        className="fixed inset-0 z-50 bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-action-title"
        onClick={onClose}
    >
        <div
            className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
            onClick={(event) => event.stopPropagation()}
        >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
                <div>
                    <h2 id="quick-action-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{action.label}</h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                    aria-label="Close popup"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-5 dark:bg-zinc-800">
                <QuickActionContent actionKey={action.key} />
            </div>
        </div>
    </div>
);

const QuickActionContent = ({ actionKey }: { actionKey: QuickActionKey }) => {
    if (actionKey === "residents") return <ResidentsPage />;
    if (actionKey === "gate-logs") return <GateLogsPage />;
    if (actionKey === "update-requests") return <UpdateRequestsPage />;
    return <ReportsPage />;
};

const QuickActionButton = ({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition ${primary
            ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            : "border border-zinc-300 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700"
            }`}
    >
        {children}
    </button>
);

const HealthRow = ({
    label,
    status,
    indicator = "neutral",
}: {
    label: string;
    status: string;
    indicator?: "success" | "danger" | "neutral";
}) => {
    const dotClass =
        indicator === "success"
            ? "bg-emerald-500"
            : indicator === "danger"
                ? "bg-red-500"
                : "bg-zinc-400";

    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
            <span className="inline-flex items-center gap-1.5 font-medium capitalize text-zinc-900 dark:text-zinc-100">
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
                {status}
            </span>
        </div>
    );
};

export default DashboardPage;
