import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import GateAccessService from "../../services/GateAccessService";
import GenderService from "../../services/GenderService";
import { useModalAnimation } from "../../hooks/useModalAnimation";

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    user_id: number;
    role?: "admin" | "resident" | "security_guard" | string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix_name?: string;
    gender?: {
      gender_id: number;
      gender: string;
    };
    birth_date?: string;
    age?: string | number;
    username?: string;
    email?: string;
    contact_number?: string;
    address?: string;
    plate_number?: string;
    car_model?: string;
    car_color?: string;
    profile_picture?: string | null;
    rfid_card_uid?: string | null;
  };
  onLogout: () => void;
}

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

const buildFormFromUser = (user: UserProfileModalProps["user"]): ProfileForm => ({
  first_name: user.first_name ?? "",
  middle_name: user.middle_name ?? "",
  last_name: user.last_name ?? "",
  gender: user.gender?.gender_id ? String(user.gender.gender_id) : "",
  birth_date: user.birth_date ? user.birth_date.slice(0, 10) : "",
  email: user.email ?? "",
  username: user.username ?? "",
  contact_number: user.contact_number ?? "",
  address: user.address ?? "",
  plate_number: user.plate_number ?? "",
  car_model: user.car_model ?? "",
  car_color: user.car_color ?? "",
});

const UserProfileModal: FC<UserProfileModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  const { shouldRender, isAnimatingOut } = useModalAnimation(isOpen);
  const { refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [editForm, setEditForm] = useState<ProfileForm>(() => buildFormFromUser(user));
  const [genders, setGenders] = useState<{ gender_id: number; gender: string }[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setSaveError("");
      setConfirmSaveOpen(false);
      setStatusModal(null);
      setFieldErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    setEditForm(buildFormFromUser(user));
  }, [user]);

  useEffect(() => {
    if (!isOpen || !isEditing || user.role !== "resident") return;
    GenderService.loadGenders()
      .then((res) => setGenders(res.data?.genders ?? []))
      .catch(() => setGenders([]));
  }, [isOpen, isEditing, user.role]);

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";

  const fullName = useMemo(() => {
    let name = `${user.first_name} ${user.last_name}`;
    if (user.middle_name) {
      name = `${user.first_name} ${user.middle_name.charAt(0)}. ${user.last_name}`;
    }
    if (user.suffix_name) {
      name += ` ${user.suffix_name}`;
    }
    return name;
  }, [user]);

  const isResident = user.role === "resident";
  const roleDisplay = isResident ? "Resident" : "Security Guard";

  if (!shouldRender) return null;

  const handleCancelEdit = () => {
    setEditForm(buildFormFromUser(user));
    setFieldErrors({});
    setSaveError("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setConfirmSaveOpen(false);
    setFieldErrors({});

    const payload: Record<string, unknown> = isResident
      ? {
          ...editForm,
          middle_name: editForm.middle_name.trim() || undefined,
          plate_number: editForm.plate_number.trim().toUpperCase(),
        }
      : {
          first_name: editForm.first_name.trim(),
          middle_name: editForm.middle_name.trim() || undefined,
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim(),
          contact_number: editForm.contact_number.trim(),
        };

    try {
      await GateAccessService.updateProfile(payload);
      await refreshUser();
      setIsEditing(false);
      setStatusModal({
        type: "success",
        title: "Profile Updated",
        message: "Your profile changes were saved successfully.",
      });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
      const message = err.response?.data?.message ?? "Failed to update profile.";
      setSaveError(message);
      setStatusModal({
        type: "error",
        title: "Unable to Save",
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: string) => fieldErrors[key]?.[0];

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500 focus:bg-black/50 transition-colors";

  return (
    <>
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`} onClick={onClose}>
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-md ${isAnimatingOut ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`} />
        <div
          className={`relative w-full max-w-[1100px] max-h-[95vh] overflow-y-auto rounded-xl bg-[#1e1e24]/75 backdrop-blur-xl border border-white/10 shadow-2xl scrollbar-thin scrollbar-thumb-zinc-700 ${isAnimatingOut ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 lg:p-8 text-white">
            <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">My Profile</h2>
                <p className="mt-1 text-sm text-gray-400">View and manage your personal and account information</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-[#2a2a2a] hover:text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {saveError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {saveError}
              </div>
            )}

            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#173e8e] to-[#0d536c] p-5 sm:p-6 shadow-md">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex h-14 w-14 sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 overflow-hidden shadow-inner">
                  {user.profile_picture && user.profile_picture.length > 0 ? (
                    <img src={user.profile_picture} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold tracking-wide text-white">{userInitials}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">{fullName}</h3>
                  <p className="text-xs sm:text-sm font-medium text-blue-100 capitalize">{roleDisplay} Member</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-green-300">
                    <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                    Active Account
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full rounded-lg border border-blue-100/60 bg-white/15 px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow transition hover:bg-white/25 sm:w-auto"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-full rounded-lg border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow transition hover:bg-white/20 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSaveOpen(true)}
                      disabled={saving}
                      className="w-full rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow transition hover:bg-blue-400 disabled:opacity-60 sm:w-auto"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
                <button onClick={onLogout} className="w-full rounded-lg border border-red-400/50 bg-red-500/20 px-6 py-2.5 text-sm font-bold tracking-wide text-red-100 shadow transition hover:bg-red-500/30 sm:w-auto">
                  Sign Out
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-6 w-6 rounded-md bg-[#2d3a56] flex items-center justify-center">
                      <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-[17px] font-bold text-white">Personal Information</h4>
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoField label="First Name" value={user.first_name} />
                      <InfoField label="Last Name" value={user.last_name} />
                      <InfoField label="Age" value={String(user.age ?? "—")} />
                      <InfoField label="Contact Number" value={user.contact_number} />
                      <div className="col-span-1 sm:col-span-2">
                        <InfoField label="Address" value={user.address} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <EditField label="First Name" error={fieldError("first_name")}>
                        <input className={inputClass} value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                      </EditField>
                      <EditField label="Last Name" error={fieldError("last_name")}>
                        <input className={inputClass} value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                      </EditField>
                      {!isResident && (
                        <EditField label="Middle Name" error={fieldError("middle_name")} className="sm:col-span-2">
                          <input className={inputClass} value={editForm.middle_name} onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })} />
                        </EditField>
                      )}
                      {isResident && (
                        <>
                          <EditField label="Middle Name" error={fieldError("middle_name")}>
                            <input className={inputClass} value={editForm.middle_name} onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })} />
                          </EditField>
                          <EditField label="Date of Birth" error={fieldError("birth_date")}>
                            <input type="date" className={inputClass} value={editForm.birth_date} onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })} />
                          </EditField>
                          <EditField label="Gender" error={fieldError("gender")}>
                            <select className={inputClass} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                              <option value="">Select gender</option>
                              {genders.map((g) => (
                                <option key={g.gender_id} value={g.gender_id}>{g.gender}</option>
                              ))}
                            </select>
                          </EditField>
                        </>
                      )}
                      <EditField label="Contact Number" error={fieldError("contact_number")}>
                        <input className={inputClass} value={editForm.contact_number} onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })} />
                      </EditField>
                      {isResident && (
                        <div className="col-span-1 sm:col-span-2">
                          <EditField label="Address" error={fieldError("address")}>
                            <input className={inputClass} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                          </EditField>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isResident && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-[#3f2a4f] flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1M18 16a3 3 0 01-3-3V8.586a1 1 0 01.293-.707l2.828-2.828A1 1 0 0118.828 5H21a1 1 0 011 1v10a1 1 0 01-1 1h-1" />
                        </svg>
                      </div>
                      <h4 className="text-[17px] font-bold text-white">Vehicle Information</h4>
                    </div>

                    {!isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Plate Number" value={user.plate_number} highlight />
                        <InfoField label="Car Model" value={user.car_model} />
                        <div className="col-span-1 sm:col-span-2">
                          <InfoField label="Car Color" value={user.car_color} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditField label="Plate Number" error={fieldError("plate_number")}>
                          <input className={inputClass} value={editForm.plate_number} onChange={(e) => setEditForm({ ...editForm, plate_number: e.target.value.toUpperCase() })} />
                        </EditField>
                        <EditField label="Car Model" error={fieldError("car_model")}>
                          <input className={inputClass} value={editForm.car_model} onChange={(e) => setEditForm({ ...editForm, car_model: e.target.value })} />
                        </EditField>
                        <div className="col-span-1 sm:col-span-2">
                          <EditField label="Car Color" error={fieldError("car_color")}>
                            <input className={inputClass} value={editForm.car_color} onChange={(e) => setEditForm({ ...editForm, car_color: e.target.value })} />
                          </EditField>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="h-fit rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-md bg-[#243e30] flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="text-[17px] font-bold text-white">Account Information</h4>
                </div>

                {!isEditing ? (
                  <div className="flex flex-col gap-4">
                    <InfoField label="Email" value={user.email} compact />
                    <InfoField label="Username" value={user.username ? `@${user.username}` : undefined} compact />
                    <InfoField label="Account ID" value={`#${user.user_id}`} compact />
                    {isResident && (
                      <InfoField label="RFID UID" value={user.rfid_card_uid} compact />
                    )}
                    <div className="rounded-lg border border-green-900/60 bg-[#16271e] p-5 shadow-inner">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#4ade80]">Access Status</p>
                      <div className="mt-2.5 flex items-center gap-2.5 text-[15px] font-bold text-[#4ade80]">
                        <span className="h-3 w-3 rounded-full bg-[#4ade80]"></span>
                        Active
                      </div>
                    </div>
                  </div>
                ) : isResident ? (
                  <div className="flex flex-col gap-4">
                    <EditField label="Email" error={fieldError("email")}>
                      <input className={inputClass} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </EditField>
                    <EditField label="Username" error={fieldError("username")}>
                      <input className={inputClass} value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                    </EditField>
                    <InfoField label="Account ID" value={`#${user.user_id}`} compact />
                    <InfoField label="RFID UID" value={user.rfid_card_uid} compact />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <EditField label="Email" error={fieldError("email")}>
                      <input className={inputClass} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </EditField>
                    <InfoField label="Account ID" value={`#${user.user_id}`} compact />
                    <div className="rounded-lg border border-green-900/60 bg-[#16271e] p-5 shadow-inner">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#4ade80]">Access Status</p>
                      <div className="mt-2.5 flex items-center gap-2.5 text-[15px] font-bold text-[#4ade80]">
                        <span className="h-3 w-3 rounded-full bg-[#4ade80]"></span>
                        Active
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileActionModal
        isOpen={confirmSaveOpen}
        tone="confirm"
        title="Save Profile Changes?"
        message="Please confirm that you want to save the changes to your profile."
        confirmLabel={saving ? "Saving..." : "Save Changes"}
        onConfirm={() => void handleSave()}
        onClose={() => setConfirmSaveOpen(false)}
        disabled={saving}
      />

      <ProfileActionModal
        isOpen={Boolean(statusModal)}
        tone={statusModal?.type ?? "success"}
        title={statusModal?.title ?? ""}
        message={statusModal?.message ?? ""}
        confirmLabel="OK"
        onConfirm={() => setStatusModal(null)}
        onClose={() => setStatusModal(null)}
      />
    </>
  );
};

const InfoField = ({
  label,
  value,
  compact,
  highlight,
}: {
  label: string;
  value?: string | null;
  compact?: boolean;
  highlight?: boolean;
}) => (
  <div className={`rounded-lg border p-4 ${highlight ? "border-blue-500/30 bg-blue-500/10" : "border-white/5 bg-black/25"}`}>
    <p className={`text-[11px] font-bold uppercase tracking-widest ${highlight ? "text-blue-400" : "text-gray-500"}`}>{label}</p>
    <p className={`mt-1.5 ${compact ? "text-[14px] font-medium" : "text-[15px] font-bold"} text-gray-100`}>{value || "—"}</p>
  </div>
);

const EditField = ({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={className}>
    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

const ProfileActionModal = ({
  isOpen,
  tone,
  title,
  message,
  confirmLabel,
  disabled,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  tone: "confirm" | "success" | "error";
  title: string;
  message: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const { shouldRender, isAnimatingOut } = useModalAnimation(isOpen);
  if (!shouldRender) return null;

  const toneClass = tone === "error"
    ? "border-red-500/30 bg-red-500/10 text-red-200"
    : tone === "success"
      ? "border-green-500/30 bg-green-500/10 text-green-200"
      : "border-blue-500/30 bg-blue-500/10 text-blue-200";
  const buttonClass = tone === "error"
    ? "bg-red-600 hover:bg-red-500"
    : tone === "success"
      ? "bg-green-600 hover:bg-green-500"
      : "bg-blue-600 hover:bg-blue-500";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button type="button" aria-label="Close modal" onClick={onClose} className={`absolute inset-0 bg-black/80 backdrop-blur-md ${isAnimatingOut ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`} />
      <div className={`relative w-full max-w-md rounded-xl border border-white/10 bg-[#1e1e24]/90 p-6 text-white shadow-2xl backdrop-blur-xl ${isAnimatingOut ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}>
        <div className={`mb-4 rounded-lg border px-4 py-3 ${toneClass}`}>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {tone === "confirm" && (
            <button
              type="button"
              onClick={onClose}
              disabled={disabled}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${buttonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
