import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { UpdateRequestItem } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const UpdateRequestsPage = () => {
    const [requests, setRequests] = useState<UpdateRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");

    const load = () => {
        setLoading(true);
        GateAccessService.loadUpdateRequests(1, filter)
            .then((res) => setRequests(res.data.requests.data ?? []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [filter]);

    const review = async (id: number, status: "approved" | "rejected") => {
        await GateAccessService.reviewUpdateRequest(id, { status });
        load();
    };

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Resident Update Requests</h1>
            <select className="border rounded-lg px-3 py-2 text-sm mb-4" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
            {loading ? <Spinner size="md" /> : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.update_request_id} className="p-4 bg-white dark:bg-gray-800 rounded-xl border">
                            <p className="font-medium">{req.resident ? `${req.resident.first_name} ${req.resident.last_name}` : `User #${req.user_id}`}</p>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2 overflow-x-auto">{JSON.stringify(req.requested_changes, null, 2)}</pre>
                            <p className="text-sm text-gray-500 mt-1">Status: {req.status}</p>
                            {req.status === "pending" && (
                                <div className="flex gap-2 mt-3">
                                    <button type="button" onClick={() => review(req.update_request_id, "approved")} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                                    <button type="button" onClick={() => review(req.update_request_id, "rejected")} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {requests.length === 0 && <p className="text-gray-500">No requests found.</p>}
                </div>
            )}
        </div>
    );
};

export default UpdateRequestsPage;
