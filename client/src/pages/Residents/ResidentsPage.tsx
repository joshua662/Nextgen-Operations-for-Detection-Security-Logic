import { useCallback, useEffect, useState, type FormEvent } from "react";
import GateAccessService from "../../services/GateAccessService";
import GenderService from "../../services/GenderService";
import type { ResidentRow } from "../../interfaces/GateInterface";
import FloatingLabelInput from "../../components/Input/FloatingLabelInput";
import FloatingLabelSelect from "../../components/Select/FloatingLabelSelect";
import SubmitButton from "../../components/Button/SubmitButton";
import Spinner from "../../components/Spinner/Spinner";
import Modal from "../../components/Modal";

const emptyForm = () => ({
    first_name: "", middle_name: "", last_name: "", gender: "", birth_date: "",
    contact_number: "", address: "", plate_number: "", car_model: "", car_color: "",
});

const ResidentsPage = () => {
    const [residents, setResidents] = useState<ResidentRow[]>([]);
    const [genders, setGenders] = useState<{ gender_id: number; gender: string }[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ResidentRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [message, setMessage] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GateAccessService.loadResidents(1, search);
            setResidents(res.data.residents.data ?? []);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { void load(); }, [load]);
    useEffect(() => {
        GenderService.loadGenders().then((r) => setGenders(r.data.genders ?? []));
    }, []);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        const payload = { ...form, gender: form.gender };
        if (editing) {
            await GateAccessService.updateResident(editing.user_id, payload);
            setMessage("Resident updated.");
        } else {
            await GateAccessService.storeResident(payload);
            setMessage("Resident added.");
        }
        setModalOpen(false);
        void load();
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Residents Management</h1>
                <button type="button" onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Resident</button>
            </div>
            {message && <p className="mb-4 text-green-600 text-sm">{message}</p>}
            <FloatingLabelInput type="text" label="Search plate or name" value={search} onChange={(e) => setSearch(e.target.value)} name="search" />
            {loading ? <Spinner size="md" /> : (
                <div className="mt-4 overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                            <th className="p-3 text-left">Name</th><th>Plate</th><th>Contact</th><th>Car</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {residents.map((r) => (
                                <tr key={r.user_id} className="border-t">
                                    <td className="p-3">{r.last_name}, {r.first_name}</td>
                                    <td className="p-3 font-mono">{r.plate_number}</td>
                                    <td className="p-3">{r.contact_number}</td>
                                    <td className="p-3">{r.car_model} ({r.car_color})</td>
                                    <td className="p-3 space-x-2">
                                        <button type="button" className="text-blue-600" onClick={() => { setEditing(r); setForm({ first_name: r.first_name, middle_name: r.middle_name ?? "", last_name: r.last_name, gender: String(r.gender?.gender_id ?? ""), birth_date: r.birth_date ?? "", contact_number: r.contact_number ?? "", address: r.address ?? "", plate_number: r.plate_number ?? "", car_model: r.car_model ?? "", car_color: r.car_color ?? "" }); setModalOpen(true); }}>Edit</button>
                                        <button type="button" className="text-red-600" onClick={async () => { if (confirm("Delete?")) { await GateAccessService.destroyResident(r.user_id); void load(); } }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} showCloseButton>
                <h2 className="text-lg font-semibold mb-4 px-4 pt-2">{editing ? "Edit Resident" : "Add Resident"}</h2>
                <form onSubmit={handleSave} className="space-y-3 px-4 pb-4">
                    <FloatingLabelInput type="text" label="First Name" name="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                    <FloatingLabelInput type="text" label="Middle Name" name="middle_name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                    <FloatingLabelInput type="text" label="Last Name" name="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                    <FloatingLabelSelect label="Gender" name="gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                        <option value="">Select</option>
                        {genders.map((g) => <option key={g.gender_id} value={g.gender_id}>{g.gender}</option>)}
                    </FloatingLabelSelect>
                    <FloatingLabelInput label="Birthdate" name="birth_date" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
                    <FloatingLabelInput type="text" label="Contact Number" name="contact_number" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} required />
                    <FloatingLabelInput type="text" label="Address" name="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                    <FloatingLabelInput type="text" label="Plate Number" name="plate_number" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} required />
                    <FloatingLabelInput type="text" label="Car Model" name="car_model" value={form.car_model} onChange={(e) => setForm({ ...form, car_model: e.target.value })} required />
                    <FloatingLabelInput type="text" label="Car Color" name="car_color" value={form.car_color} onChange={(e) => setForm({ ...form, car_color: e.target.value })} required />
                    <SubmitButton label="Save" />
                </form>
            </Modal>
        </div>
    );
};

export default ResidentsPage;
