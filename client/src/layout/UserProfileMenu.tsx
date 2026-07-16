import { useAuth } from "../contexts/AuthContext";
import SidebarHoverLabel from "../components/Sidebar/SidebarHoverLabel";

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
        return (
            <div className="relative hidden lg:block w-full">
                <SidebarHoverLabel label={fullName || "My Profile"} isCollapsed={isCollapsed} className={isCollapsed ? "w-full flex justify-center" : "w-full"}>
                    <button
                        type="button"
                        onClick={onViewProfile}
                        className={`flex items-center transition-all duration-300 ease-in-out hover:bg-[#2a2a2a] cursor-pointer w-full rounded-lg ${
                            isCollapsed ? "p-1 gap-0" : "p-2 gap-3"
                        }`}
                        title="Click to view profile"
                        aria-label={fullName || "My Profile"}
                    >
                        <span className={`flex shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-semibold text-white transition-all duration-300 ease-in-out ${
                            isCollapsed ? "h-10 w-10" : "h-8 w-8"
                        }`}>
                            {initials}
                        </span>
                        <div className={`flex flex-1 items-center justify-between min-w-0 transition-all duration-300 ease-in-out origin-left truncate ${
                            isCollapsed ? "w-0 opacity-0 scale-90 pointer-events-none" : "w-auto opacity-100 scale-100"
                        }`}>
                            <span className="grid min-w-0 flex-1 text-sm leading-tight text-left">
                                <span className="truncate font-semibold text-white">{fullName || "User"}</span>
                                <span className="truncate text-xs text-zinc-400">{user?.user?.email ?? user?.user?.username}</span>
                            </span>
                            <svg className="h-4 w-4 shrink-0 text-zinc-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                        </div>
                    </button>
                </SidebarHoverLabel>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onViewProfile}
            className="flex rounded-full ring-2 ring-[#C5A073]/30 transition hover:ring-[#C5A073]/50 focus:outline-none focus:ring-4 focus:ring-[#C5A073]/20 cursor-pointer"
            title="Click to view profile"
        >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                {initials}
            </span>
        </button>
    );
};

export default UserProfileMenu;
