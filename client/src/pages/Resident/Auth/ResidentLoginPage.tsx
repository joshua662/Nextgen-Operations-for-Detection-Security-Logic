import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import FloatingLabelInput from "../../../components/Input/FloatingLabelInput";
import SubmitButton from "../../../components/Button/SubmitButton";
import { useAuth } from "../../../contexts/AuthContext";

const ResidentLoginPage = () => {
    const [plate, setPlate] = useState("");
    const [contact, setContact] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { residentLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await residentLogin(plate, contact);
            navigate("/resident/home");
        } catch {
            setError("Invalid plate number or contact number.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Resident Login</h1>
                <p className="text-sm text-gray-500 mb-6">Plate Number + Contact Number</p>
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FloatingLabelInput type="text" label="Plate Number" name="plate" value={plate} onChange={(e) => setPlate(e.target.value)} required />
                    <FloatingLabelInput type="text" label="Contact Number" name="contact" value={contact} onChange={(e) => setContact(e.target.value)} required />
                    <SubmitButton className="w-full" label="Sign In" loading={loading} loadingLabel="Signing in..." />
                </form>
                <p className="text-center text-sm mt-4 text-gray-600">
                    New resident? <Link to="/resident/register" className="text-blue-600 font-medium">Register</Link>
                </p>
                <p className="text-center text-sm mt-2">
                    <Link to="/" className="text-gray-500">Admin login</Link>
                </p>
            </div>
        </div>
    );
};

export default ResidentLoginPage;
