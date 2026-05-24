import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import GateAccessService from "../../services/GateAccessService";
import GenderService from "../../services/GenderService";
import { useAuth } from "../../contexts/AuthContext";

type ProfileForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    gender: string;
    birth_date: string;
    email: string;
    username: string;
    contact_number: string;
    address: string;
    plate_number: string;
    car_model: string;
    car_color: string;
};

const ResidentProfilePage = () => {
    const { user } = useAuth();
    const [genders, setGenders] = useState<{ gender_id: number; gender: string }[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<ProfileForm>({
        first_name: "",
        middle_name: "",
        last_name: "",
        gender: "",
        birth_date: "",
        email: "",
        username: "",
        contact_number: "",
        address: "",
        plate_number: "",
        car_model: "",
        car_color: "",
    });

    useEffect(() => {
        GenderService.loadGenders().then((r) => setGenders(r.data.genders ?? []));
    }, []);

    useEffect(() => {
        const u = user?.user;

        if (!u) return;

        setForm({
            first_name: u.first_name ?? "",
            middle_name: u.middle_name ?? "",
            last_name: u.last_name ?? "",
            gender: String(u.gender?.gender_id ?? ""),
            birth_date: u.birth_date ?? "",
            email: u.email ?? "",
            username: u.username ?? "",
            contact_number: u.contact_number ?? "",
            address: u.address ?? "",
            plate_number: u.plate_number ?? "",
            car_model: u.car_model ?? "",
            car_color: u.car_color ?? "",
        });
    }, [user]);

    const submitRequest = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setMessage("");

        try {
            await GateAccessService.submitUpdateRequest({
                first_name: form.first_name,
                middle_name: form.middle_name,
                last_name: form.last_name,
                gender: form.gender,
                birth_date: form.birth_date,
                contact_number: form.contact_number,
                address: form.address,
                plate_number: form.plate_number,
                car_model: form.car_model,
                car_color: form.car_color,
            });
            setMessage("Profile changes submitted for admin review.");
            setShowEditModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    const displayName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ") || "Resident";
    const initials = `${form.first_name.charAt(0)}${form.last_name.charAt(0)}`.toUpperCase() || "U";

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-6">
            {message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">{message}</p>
                    <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">The admin will review and approve your changes shortly.</p>
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Profile</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">View and manage your personal and vehicle information</p>
            </div>

            <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-700 p-8 shadow-lg dark:from-blue-800 dark:to-cyan-900">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-3xl font-bold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="break-words text-3xl font-bold text-white">{displayName}</h2>
                        <p className="text-lg text-blue-100">Resident Member</p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-300" />
                            <span className="text-sm text-white/90">Active Account</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:bg-zinc-50"
                    >
                        Edit Profile
                    </button>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 lg:col-span-2">
                    <SectionTitle title="Personal Information" tone="blue" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <InfoTile label="First Name" value={form.first_name} />
                        <InfoTile label="Last Name" value={form.last_name} />
                        <InfoTile label="Age" value={user?.user?.age} />
                        <InfoTile label="Contact Number" value={form.contact_number} />
                        <InfoTile label="Address" value={form.address} wide />
                    </div>

                    <div className="my-8 border-t border-zinc-200 pt-8 dark:border-zinc-700">
                        <SectionTitle title="Vehicle Information" tone="violet" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <InfoTile label="Plate Number" value={form.plate_number} highlight />
                            <InfoTile label="Car Model" value={form.car_model} />
                            <InfoTile label="Car Color" value={form.car_color} />
                        </div>
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <SectionTitle title="Account Information" tone="green" />
                    <div className="space-y-4">
                        <InfoTile label="Email" value={form.email} compact />
                        <InfoTile label="Username" value={form.username} compact />
                        <InfoTile label="Account ID" value={user?.user?.user_id ? `#${user.user.user_id}` : "-"} compact />
                        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                            <p className="mb-2 text-xs font-semibold uppercase text-green-600 dark:text-green-400">Access Status</p>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-green-500" />
                                <p className="text-sm font-bold text-green-700 dark:text-green-400">Active</p>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                    >
                        Edit Information
                    </button>
                </aside>
            </div>

            {showEditModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4 py-10">
                        <button
                            type="button"
                            aria-label="Close modal"
                            onClick={() => setShowEditModal(false)}
                            className="fixed inset-0 bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80"
                        />
                        <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-800">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Edit Profile Information</h3>
                                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Changes are submitted for admin approval.</p>
                                </div>
                                <button type="button" onClick={() => setShowEditModal(false)} className="text-2xl leading-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                    x
                                </button>
                            </div>

                            <form onSubmit={submitRequest} className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="First Name" name="first_name" value={form.first_name} onChange={(value) => setForm({ ...form, first_name: value })} required />
                                    <Field label="Middle Name" name="middle_name" value={form.middle_name} onChange={(value) => setForm({ ...form, middle_name: value })} />
                                    <Field label="Last Name" name="last_name" value={form.last_name} onChange={(value) => setForm({ ...form, last_name: value })} required />
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</span>
                                        <select
                                            value={form.gender}
                                            onChange={(event) => setForm({ ...form, gender: event.target.value })}
                                            required
                                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                                        >
                                            <option value="">Select gender</option>
                                            {genders.map((gender) => (
                                                <option key={gender.gender_id} value={gender.gender_id}>{gender.gender}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <Field label="Birth Date" name="birth_date" type="date" value={form.birth_date} onChange={(value) => setForm({ ...form, birth_date: value })} required />
                                    <Field label="Email" name="email" type="email" value={form.email} disabled onChange={() => undefined} />
                                    <Field label="Contact Number" name="contact_number" value={form.contact_number} onChange={(value) => setForm({ ...form, contact_number: value })} required />
                                    <Field label="Plate Number" name="plate_number" value={form.plate_number} onChange={(value) => setForm({ ...form, plate_number: value.toUpperCase() })} required mono />
                                    <Field label="Car Model" name="car_model" value={form.car_model} onChange={(value) => setForm({ ...form, car_model: value })} required />
                                    <Field label="Car Color" name="car_color" value={form.car_color} onChange={(value) => setForm({ ...form, car_color: value })} required />
                                </div>
                                <Field label="Address" name="address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} required textarea />

                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                    <p className="text-sm text-blue-900 dark:text-blue-200">
                                        Your changes will be submitted for admin review and approval. You will receive a notification once processed.
                                    </p>
                                </div>

                                <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700 sm:flex-row sm:justify-end">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                        {submitting ? "Submitting..." : "Submit Changes for Review"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionTitle = ({ title, tone }: { title: string; tone: "blue" | "violet" | "green" }) => {
    const tones = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
        green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    };

    return (
        <div className="mb-6 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${tones[tone]}`} />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
    );
};

const InfoTile = ({ label, value, wide, highlight, compact }: { label: string; value?: ReactNode; wide?: boolean; highlight?: boolean; compact?: boolean }) => (
    <div className={`${wide ? "md:col-span-2" : ""} ${highlight ? "border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20" : "border border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"} rounded-xl p-4`}>
        <p className={`mb-2 text-xs font-semibold uppercase ${highlight ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`}>{label}</p>
        <p className={`${compact ? "text-sm" : highlight ? "font-mono text-2xl" : "text-lg"} break-words font-semibold text-zinc-900 dark:text-zinc-100`}>{value || "-"}</p>
    </div>
);

const Field = ({
    label,
    name,
    value,
    onChange,
    type = "text",
    required,
    disabled,
    textarea,
    mono,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    textarea?: boolean;
    mono?: boolean;
}) => (
    <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}{required ? " *" : ""}</span>
        {textarea ? (
            <textarea
                name={name}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={3}
                required={required}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                disabled={disabled}
                className={`w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:disabled:bg-zinc-900 ${mono ? "font-mono uppercase" : ""}`}
            />
        )}
        {disabled && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Email cannot be changed here.</p>}
    </label>
);

export default ResidentProfilePage;
