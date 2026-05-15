import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { UpdateRequestItem } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const ResidentUpdatesPage = () => {
    const [requests, setRequests] = useState<UpdateRequestItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GateAccessService.myUpdateRequests(1)
            .then((res) => setRequests(res.data.requests.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner size="md" />;

    return (
        <div className="space-y-3">
            <h2 className="font-semibold">My Update Requests</h2>
            <p className="text-sm text-gray-500">Submit profile changes from the Profile tab. Track approval status here.</p>
            {requests.map((req) => (
                <div key={req.update_request_id} className="p-4 bg-white rounded-xl border">
                    <p className={`text-sm font-medium capitalize ${req.status === "approved" ? "text-green-600" : req.status === "rejected" ? "text-red-600" : "text-amber-600"}`}>{req.status}</p>
                    <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(req.requested_changes, null, 2)}</pre>
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                </div>
            ))}
            {requests.length === 0 && <p className="text-gray-500 text-sm">No update requests yet.</p>}
        </div>
    );
};

export default ResidentUpdatesPage;
