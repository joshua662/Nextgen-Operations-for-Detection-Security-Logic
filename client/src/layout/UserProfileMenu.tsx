import { useAuth } from "../contexts/AuthContext";

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
    onViewProfile?: () => void;
    variant?: "sidebar" | "header";
    isCollapsed?: boolean;
};

const UserProfileMenu = ({ onViewProfile, variant = "sidebar", isCollapsed = false }: UserProfileMenuProps) => {
    const { user } = useAuth();

    const initials = getInitials(user?.user?.first_name, user?.user?.last_name);
    const fullName = formatFullName(
        user?.user?.first_name,
        user?.user?.middle_name,
        user?.user?.last_name,
        user?.user?.suffix_name,
    );

    if (variant === "sidebar") {
        if (isCollapsed) {
            return (
                <div className="flex justify-center w-full">
                    <button
                        type="button"
                        onClick={onViewProfile}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-bold text-zinc-900 dark:text-white transition hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer"
                        title={fullName || "My Profile"}
                    >
                        {initials}
                    </button>
                </div>
            );
        }

        return (
            <div className="relative hidden lg:block">
                <button
                    type="button"
                    onClick={onViewProfile}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-start hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Click to view profile"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white">
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
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onViewProfile}
            className="flex rounded-full ring-2 ring-zinc-300 transition hover:ring-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-400/50 dark:ring-zinc-600 cursor-pointer"
            title="Click to view profile"
        >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-white">
                {initials}
            </span>
        </button>
    );
};

export default UserProfileMenu;
