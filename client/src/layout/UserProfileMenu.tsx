import { useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";

const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "U";
};

const formatFullName = (
    firstName?: string,
    middleName?: string | null,
    lastName?: string,
    suffixName?: string | null,
) => {
    if (!lastName && !firstName) return "";
    let name = `${lastName ?? ""}, ${firstName ?? ""}`.trim();
    if (middleName) name += ` ${middleName.charAt(0)}.`;
    if (suffixName) name += ` ${suffixName}`;
    return name.replace(/^,\s*/, "").replace(/,\s*$/, "");
};

type UserProfileMenuProps = {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    variant?: "sidebar" | "header";
};

const UserProfileMenu = ({ isOpen, onToggle, onClose, variant = "sidebar" }: UserProfileMenuProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const initials = getInitials(user?.user?.first_name, user?.user?.last_name);
    const fullName = formatFullName(
        user?.user?.first_name,
        user?.user?.middle_name,
        user?.user?.last_name,
        user?.user?.suffix_name,
    );

    const handleLogout = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await logout();
            onClose();
            navigate("/");
        } catch (error) {
            console.error("Unexpected server error during logout:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "sidebar") {
        return (
            <div className="relative hidden lg:block">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-start hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-expanded={isOpen}
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-sm font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-white">
                        {initials}
                    </span>
                    <span className="grid min-w-0 flex-1 text-sm leading-tight">
                        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{fullName || "User"}</span>
                        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.user?.email ?? user?.user?.username}</span>
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
                        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                            <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
                                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{fullName}</p>
                                <p className="truncate text-xs text-zinc-500">{user?.user?.email ?? user?.user?.username}</p>
                            </div>
                            <form onSubmit={handleLogout} className="p-1">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-900/20"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {isLoading ? "Signing out…" : "Log Out"}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={onToggle}
                className="flex rounded-full ring-2 ring-zinc-300 transition hover:ring-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-400/50 dark:ring-zinc-600"
                aria-expanded={isOpen}
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-white">
                    {initials}
                </span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => !isLoading && onClose()}
                showCloseButton
                className="w-full max-w-[min(100%,300px)] overflow-hidden rounded-2xl border border-zinc-200 shadow-xl dark:border-zinc-700"
                backdropClassName="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
                bodyClassName="px-6 pb-8 pt-10"
            >
                <div className="text-center">
                    <h2 className="mb-6 text-left text-lg font-bold text-zinc-900 dark:text-zinc-100">Profile</h2>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-900 dark:bg-zinc-700 dark:text-white">
                        {initials}
                    </div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{fullName}</p>
                    {user && (
                        <p className="mt-2 text-sm text-zinc-500">@{user.user.username}</p>
                    )}
                    <div className="mx-auto mt-8 max-w-[220px] border-t border-zinc-200 pt-6 dark:border-zinc-700">
                        <form onSubmit={handleLogout}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? "Signing out…" : "Sign Out"}
                            </button>
                        </form>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default UserProfileMenu;
