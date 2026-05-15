import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { TrafficChart } from "../../interfaces/GateInterface";

const ReportsPage = () => {
    const [period, setPeriod] = useState("daily");
    const [chart, setChart] = useState<TrafficChart | null>(null);

    useEffect(() => {
        GateAccessService.trafficChart(period).then((res) => setChart(res.data));
    }, [period]);

    const downloadCsv = async () => {
        const res = await GateAccessService.exportCsv();
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "gate_logs.csv";
        a.click();
    };

    const downloadPdf = async () => {
        const res = await GateAccessService.exportPdf();
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/html" }));
        window.open(url, "_blank");
    };

    const maxVal = chart ? Math.max(...chart.authorized, ...chart.unauthorized, 1) : 1;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <div className="flex flex-wrap gap-3">
                <button type="button" onClick={downloadCsv} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Export CSV</button>
                <button type="button" onClick={downloadPdf} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Export PDF</button>
                <select className="border rounded-lg px-3 py-2 text-sm ml-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>
            {chart && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
                    <h2 className="font-semibold mb-4 capitalize">Traffic Flow ({chart.period})</h2>
                    <div className="flex items-end gap-2 h-48 overflow-x-auto">
                        {chart.labels.map((label, i) => (
                            <div key={label} className="flex flex-col items-center min-w-[40px] flex-1">
                                <div className="flex gap-1 items-end h-36 w-full justify-center">
                                    <div className="w-3 bg-green-500 rounded-t" style={{ height: `${(chart.authorized[i] / maxVal) * 100}%` }} title={`Auth: ${chart.authorized[i]}`} />
                                    <div className="w-3 bg-red-400 rounded-t" style={{ height: `${(chart.unauthorized[i] / maxVal) * 100}%` }} title={`Unauth: ${chart.unauthorized[i]}`} />
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-sm">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Authorized</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" /> Unauthorized</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
