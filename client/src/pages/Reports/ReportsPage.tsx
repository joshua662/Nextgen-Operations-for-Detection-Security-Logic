import { useEffect, useMemo, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { TrafficChart } from "../../interfaces/GateInterface";

const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
};

const getFillPath = (points: { x: number; y: number }[], height: number) => {
    const linePath = getBezierPath(points);
    if (!linePath) return "";
    return `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
};

const ReportsSkeleton = () => (
    <div className="animate-pulse space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800 space-y-4">
            <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-56 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-end justify-between p-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex justify-center gap-1.5 h-32 items-end">
                            <div className="w-4 rounded bg-zinc-200 dark:bg-zinc-700 h-24" />
                            <div className="w-4 rounded bg-zinc-200 dark:bg-zinc-700 h-12" />
                        </div>
                        <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4 rounded bg-zinc-50 p-3 dark:bg-zinc-900">
                        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                        <div className="flex gap-4">
                            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

const ReportsPage = () => {
    const [period, setPeriod] = useState("daily");
    const [chart, setChart] = useState<TrafficChart | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const itemsPerPage = 5;

    useEffect(() => {
        GateAccessService.trafficChart(period)
            .then((res) => {
                setChart(res.data);
                setCurrentPage(0);
            })
            .finally(() => setLoading(false));
    }, [period]);

    const stats = useMemo(() => {
        const authorized = chart?.authorized.reduce((sum, value) => sum + value, 0) ?? 0;
        const unauthorized = chart?.unauthorized.reduce((sum, value) => sum + value, 0) ?? 0;

        return {
            total: authorized + unauthorized,
            authorized,
            unauthorized,
        };
    }, [chart]);

    const downloadCsv = async () => {
        const res = await GateAccessService.exportCsv();
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "gate_logs.csv";
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadPdf = async () => {
        const res = await GateAccessService.exportPdf();
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/html" }));
        window.open(url, "_blank");
    };

    const maxVal = chart ? Math.max(...chart.authorized, ...chart.unauthorized, 1) : 1;

    const startIdx = currentPage * itemsPerPage;
    const paginatedLabels = chart ? chart.labels.slice(startIdx, startIdx + itemsPerPage) : [];
    const paginatedAuthorized = chart ? chart.authorized.slice(startIdx, startIdx + itemsPerPage) : [];
    const paginatedUnauthorized = chart ? chart.unauthorized.slice(startIdx, startIdx + itemsPerPage) : [];
    const totalPages = chart ? Math.ceil(chart.labels.length / itemsPerPage) : 0;

    const chartPoints = useMemo(() => {
        if (paginatedLabels.length === 0) return { auth: [], unauth: [] };
        const n = paginatedLabels.length;
        
        return {
            auth: paginatedLabels.map((_, i) => ({
                x: n > 1 ? 40 + (i / (n - 1)) * 520 : 300,
                y: 160 - ((paginatedAuthorized[i] ?? 0) / maxVal) * 120,
            })),
            unauth: paginatedLabels.map((_, i) => ({
                x: n > 1 ? 40 + (i / (n - 1)) * 520 : 300,
                y: 160 - ((paginatedUnauthorized[i] ?? 0) / maxVal) * 120,
            })),
        };
    }, [paginatedLabels, paginatedAuthorized, paginatedUnauthorized, maxVal]);

    const activeIdx = hoveredIdx !== null ? hoveredIdx : (paginatedLabels.length > 0 ? paginatedLabels.length - 1 : 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reports & Analytics</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">View gate traffic statistics and export logs</p>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={downloadCsv} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">Export CSV</button>
                    <button type="button" onClick={downloadPdf} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700">Export PDF</button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Date Range Filter</span>
                <div className="inline-flex rounded-full border border-zinc-200/80 bg-zinc-100/50 p-1 dark:border-zinc-700/60 dark:bg-zinc-900/50 w-fit">
                    {[
                        { value: 'daily', label: 'Days' },
                        { value: 'weekly', label: 'Weeks' },
                        { value: 'monthly', label: 'Year' },
                    ].map((tab) => {
                        const isActive = period === tab.value;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => {
                                    setLoading(true);
                                    setPeriod(tab.value);
                                }}
                                className={`rounded-full px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? 'bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-950'
                                        : 'text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Stat label="Total Entries" value={stats.total} />
                <Stat label="Authorized" value={stats.authorized} tone="green" />
                <Stat label="Unauthorized" value={stats.unauthorized} tone="red" />
            </div>

            {loading ? <ReportsSkeleton /> : chart && (() => {
                const activeX = chartPoints.auth[activeIdx]?.x ?? 300;
                const activeAuthY = chartPoints.auth[activeIdx]?.y ?? 160;
                const activeUnauthY = chartPoints.unauth[activeIdx]?.y ?? 160;
                const authPath = chartPoints.auth.length > 0 ? getBezierPath(chartPoints.auth) : "";
                const authFillPath = chartPoints.auth.length > 0 ? getFillPath(chartPoints.auth, 160) : "";
                const unauthPath = chartPoints.unauth.length > 0 ? getBezierPath(chartPoints.unauth) : "";
                const unauthFillPath = chartPoints.unauth.length > 0 ? getFillPath(chartPoints.unauth, 160) : "";

                return (
                    <section className="rounded-2xl border border-white/5 bg-[#18181b] p-6 shadow-xl">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {period === 'daily' ? 'Daily Statistics' : period === 'weekly' ? 'Weekly Statistics' : 'Monthly Statistics'}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Authorized and unauthorized vehicle entry trends.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-extrabold text-white tracking-tight">
                                    {stats.total.toLocaleString()}
                                </span>
                                <p className="text-[11px] font-bold text-[#C5A073] uppercase tracking-wider mt-0.5">
                                    Total Entries
                                </p>
                            </div>
                        </div>

                        {/* Line Chart Grid */}
                        <div className="mb-6 relative rounded-xl bg-[#121212]/40 border border-white/5 p-4 overflow-hidden">
                            <svg viewBox="0 0 600 200" className="w-full overflow-visible">
                                <defs>
                                    <linearGradient id="authLineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="authAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                                    </linearGradient>

                                    <linearGradient id="unauthLineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#dc2626" />
                                    </linearGradient>
                                    <linearGradient id="unauthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.00" />
                                    </linearGradient>
                                </defs>

                                {/* Horizontal Grid lines */}
                                <line x1={40} y1={40} x2={560} y2={40} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                                <line x1={40} y1={100} x2={560} y2={100} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                                <line x1={40} y1={160} x2={560} y2={160} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

                                {/* Filled Areas */}
                                {authFillPath && <path d={authFillPath} fill="url(#authAreaGrad)" />}
                                {unauthFillPath && <path d={unauthFillPath} fill="url(#unauthAreaGrad)" />}

                                {/* Path Lines */}
                                {authPath && (
                                    <path
                                        d={authPath}
                                        fill="none"
                                        stroke="url(#authLineGrad)"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                )}
                                {unauthPath && (
                                    <path
                                        d={unauthPath}
                                        fill="none"
                                        stroke="url(#unauthLineGrad)"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                )}

                                {/* Vertical active indicator line */}
                                {paginatedLabels.length > 0 && (
                                    <line
                                        x1={activeX}
                                        y1={20}
                                        x2={activeX}
                                        y2={160}
                                        stroke="#C5A073"
                                        strokeWidth={1}
                                        strokeDasharray="3 3"
                                        opacity="0.6"
                                    />
                                )}

                                {/* Highlighted Dots */}
                                {paginatedLabels.length > 0 && (
                                    <>
                                        <circle
                                            cx={activeX}
                                            cy={activeAuthY}
                                            r={6}
                                            fill="#10b981"
                                            stroke="#18181b"
                                            strokeWidth={2}
                                        />
                                        <circle
                                            cx={activeX}
                                            cy={activeUnauthY}
                                            r={6}
                                            fill="#ef4444"
                                            stroke="#18181b"
                                            strokeWidth={2}
                                        />
                                    </>
                                )}

                                {/* Tooltip bubble */}
                                {paginatedLabels.length > 0 && (
                                    <g transform={`translate(${activeX}, 30)`}>
                                        <rect
                                            x={-75}
                                            y={-18}
                                            width={150}
                                            height={26}
                                            rx={13}
                                            fill="#000000"
                                            stroke="rgba(255, 255, 255, 0.15)"
                                            strokeWidth={1}
                                        />
                                        <text
                                            x={0}
                                            y={-1}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            className="text-[10px] font-bold tracking-wide"
                                        >
                                            Auth: {paginatedAuthorized[activeIdx]} | Unauth: {paginatedUnauthorized[activeIdx]}
                                        </text>
                                    </g>
                                )}

                                {/* X-Axis Labels */}
                                {paginatedLabels.map((label, i) => {
                                    const pt = chartPoints.auth[i];
                                    if (!pt) return null;
                                    const isActive = activeIdx === i;
                                    return (
                                        <text
                                            key={label}
                                            x={pt.x}
                                            y={185}
                                            textAnchor="middle"
                                            className={`text-[11px] transition-colors font-semibold ${
                                                isActive ? "fill-[#C5A073] font-bold" : "fill-zinc-400"
                                            }`}
                                        >
                                            {label}
                                        </text>
                                    );
                                })}

                                {/* Hover detection zones */}
                                {chartPoints.auth.map((pt, i) => (
                                    <rect
                                        key={i}
                                        x={pt.x - 25}
                                        y={0}
                                        width={50}
                                        height={180}
                                        fill="transparent"
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredIdx(i)}
                                    />
                                ))}
                            </svg>
                        </div>
                        <div className="space-y-2">
                            {paginatedLabels.length > 0 ? paginatedLabels.map((label, index) => {
                                const authorized = paginatedAuthorized[index] ?? 0;
                                const unauthorized = paginatedUnauthorized[index] ?? 0;

                                return (
                                    <div key={label} className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-900 p-3">
                                        <span className="font-semibold text-white">{label}</span>
                                        <div className="flex gap-4 text-sm text-zinc-300">
                                            <span>Total: {authorized + unauthorized}</span>
                                            <span className="text-green-400">Authorized: {authorized}</span>
                                            <span className="text-red-400">Unauthorized: {unauthorized}</span>
                                        </div>
                                    </div>
                                );
                            }) : <p className="py-4 text-center text-zinc-500">No data available for selected period</p>}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                <span className="text-xs text-zinc-500">
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={currentPage === 0}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="rounded-lg border border-white/5 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages - 1}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className="rounded-lg border border-white/5 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                );
            })()}
        </div>
    );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" }) => (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</h3>
        <p className={`mt-2 text-3xl font-bold ${tone === "green" ? "text-green-600 dark:text-green-400" : tone === "red" ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    </div>
);

export default ReportsPage;
