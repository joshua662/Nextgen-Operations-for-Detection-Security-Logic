import { useEffect, useState, type FormEvent } from "react";
import FloatingLabelInput from "../../components/Input/FloatingLabelInput";
import FloatingLabelSelect from "../../components/Select/FloatingLabelSelect";
import SubmitButton from "../../components/Button/SubmitButton";
import GenderService from "../../services/GenderService";
import GateAccessService from "../../services/GateAccessService";
import { useAuth } from "../../contexts/AuthContext";

const ResidentProfilePage = () => {
    const { user } = useAuth();
    const [genders, setGenders] = useState<{ gender_id: number; gender: string }[]>([]);
    const [form, setForm] = useState({
        first_name: "", middle_name: "", last_name: "", gender: "", birth_date: "",
        contact_number: "", address: "", plate_number: "", car_model: "", car_color: "",
    });
    const [message, setMessage] = useState("");
    const [mode, setMode] = useState<"view" | "request">("view");

    useEffect(() => {
        GenderService.loadGenders().then((r) => setGenders(r.data.genders ?? []));
        const u = user?.user;
        if (u) {
            setForm({
                first_name: u.first_name, middle_name: u.middle_name ?? "", last_name: u.last_name,
                gender: String(u.gender?.gender_id ?? ""), birth_date: u.birth_date ?? "",
                contact_number: u.contact_number ?? "", address: u.address ?? "",
                plate_number: u.plate_number ?? "", car_model: u.car_model ?? "", car_color: u.car_color ?? "",
            });
        }
    }, [user]);

    const handleDirectSave = async (e: FormEvent) => {
        e.preventDefault();
        await GateAccessService.updateProfile({ ...form, gender: form.gender });
        setMessage("Profile updated.");
    };

    const handleRequest = async (e: FormEvent) => {
        e.preventDefault();
        await GateAccessService.submitUpdateRequest({ ...form, gender: form.gender });
        setMessage("Update request sent to admin for approval.");
        setMode("view");
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button type="button" onClick={() => setMode("view")} className={`flex-1 py-2 rounded-lg text-sm ${mode === "view" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Edit Profile</button>
                <button type="button" onClick={() => setMode("request")} className={`flex-1 py-2 rounded-lg text-sm ${mode === "request" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Request Update</button>
            </div>
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <form onSubmit={mode === "view" ? handleDirectSave : handleRequest} className="space-y-3 bg-white dark:bg-gray-800 rounded-xl p-4 border">
                <FloatingLabelInput type="text" label="First Name" name="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                <FloatingLabelInput type="text" label="Middle Name" name="middle_name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                <FloatingLabelInput type="text" label="Last Name" name="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                <FloatingLabelSelect label="Gender" name="gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                    <option value="">Select</option>
                    {genders.map((g) => <option key={g.gender_id} value={g.gender_id}>{g.gender}</option>)}
                </FloatingLabelSelect>
                <FloatingLabelInput label="Age (via Birthdate)" name="birth_date" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
                <FloatingLabelInput type="text" label="Contact Number" name="contact_number" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} required />
                <FloatingLabelInput type="text" label="Address" name="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                <FloatingLabelInput type="text" label="Plate Number" name="plate_number" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} required />
                <FloatingLabelInput type="text" label="Car Model" name="car_model" value={form.car_model} onChange={(e) => setForm({ ...form, car_model: e.target.value })} required />
                <FloatingLabelInput type="text" label="Car Color" name="car_color" value={form.car_color} onChange={(e) => setForm({ ...form, car_color: e.target.value })} required />
                <SubmitButton label={mode === "view" ? "Save Profile" : "Submit for Approval"} />
            </form>
        </div>
    );
};

export default ResidentProfilePage;
