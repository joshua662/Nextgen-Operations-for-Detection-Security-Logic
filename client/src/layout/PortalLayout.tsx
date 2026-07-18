import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import AppLogo from "./AppLogo";
import UserProfileMenu from "./UserProfileMenu";
import type { NavItem } from "./navConfig";
import { useAuth } from "../contexts/AuthContext";
import UserProfileModal from "../components/Profile/UserProfileModal";
import SidebarHoverLabel from "../components/Sidebar/SidebarHoverLabel";
import { usePersistedSidebarCollapsed } from "../hooks/usePersistedSidebarCollapsed";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "gate-client-sidebar-collapsed";

type PortalLayoutProps = {
    navItems: NavItem[];
    homePath: string;
    portalLabel: string;
};

const PortalLayoutContent = ({ navItems, homePath, portalLabel }: PortalLayoutProps) => {
    const { isOpen, toggleSidebar } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const { isCollapsed, toggleCollapsed } = usePersistedSidebarCollapsed(SIDEBAR_COLLAPSED_STORAGE_KEY);
    const { user, logout } = useAuth();

    const closeSidebar = () => {
        if (isOpen && window.innerWidth < 1024) toggleSidebar();
    };

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const handleLogout = async () => {
        setProfileModalOpen(false);
        try {
            await logout();
            navigate("/");
        } catch (error) {
            console.error("Unexpected server error during logout:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-zinc-150">
            {/* Mobile header */}
            <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/5 bg-[#18181b] px-4 lg:hidden">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="rounded-lg p-2 text-zinc-200 hover:bg-[#2a2a2a]"
                    aria-label="Open sidebar"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path strokeLinecap="round" d="M5 7h14M5 12h14M5 17h10" />
                    </svg>
                </button>
                <AppLogo homePath={homePath} />
                <UserProfileMenu
                    variant="header"
                    onViewProfile={() => setProfileModalOpen(true)}
                />
            </header>

            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={toggleSidebar}
                    aria-hidden
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 flex h-screen flex-col border-e border-white/5 bg-[#18181b] transition-all duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 ${isCollapsed ? "w-[76px] overflow-visible" : "w-[260px]"}`}
                aria-label="Sidebar"
            >
                <div className="hidden border-b border-white/5 p-4 lg:flex items-center h-[76px] shrink-0">
                    <SidebarHoverLabel label="Gate Security" isCollapsed={isCollapsed} className="w-full">
                        <button
                            onClick={toggleCollapsed}
                            className={`flex items-center focus:outline-none cursor-pointer transition-all duration-300 ease-in-out ${
                                isCollapsed ? "justify-center w-full gap-0" : "gap-2"
                            }`}
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-black shadow-md">
                                G
                            </div>
                            <span className={`truncate font-bold leading-tight text-white text-start transition-all duration-300 ease-in-out origin-left ${
                                isCollapsed ? "w-0 opacity-0 scale-90 pointer-events-none ml-0" : "w-auto opacity-100 scale-100 ml-2"
                            }`}>
                                Gate Security
                            </span>
                        </button>
                    </SidebarHoverLabel>
                </div>

                <div className={`flex-1 py-4 transition-all duration-300 ${isCollapsed ? "overflow-visible px-2" : "overflow-y-auto px-3"}`}>
                    <div className="relative overflow-hidden h-6 mb-3">
                        <p className={`absolute left-2 text-xs font-bold uppercase tracking-wide text-zinc-500 transition-all duration-300 ease-in-out origin-left ${
                            isCollapsed ? "opacity-0 scale-90 pointer-events-none translate-x-[-10px]" : "opacity-100 scale-100 translate-x-0"
                        }`}>
                            {portalLabel}
                        </p>
                        <div className={`absolute inset-x-2 bottom-2 border-b border-white/5 transition-all duration-300 ease-in-out ${
                            isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                        }`} />
                    </div>
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <SidebarHoverLabel label={item.label} isCollapsed={isCollapsed}>
                                    <Link
                                        to={item.path}
                                        onClick={closeSidebar}
                                        className={`flex items-center rounded-xl text-[14px] font-medium transition-all duration-300 ease-in-out ${
                                            isCollapsed ? "px-3.5 py-2.5 gap-0" : "px-3.5 py-2.5 gap-3.5"
                                        } ${
                                            isActive(item.path)
                                                ? "bg-[#3c3c3c] text-white shadow-inner font-semibold"
                                                : "text-zinc-300 hover:bg-[#2a2a2a] hover:text-white"
                                        }`}
                                    >
                                        <span className="shrink-0 h-5 w-5 flex items-center justify-center relative">
                                            {item.icon}
                                            {item.badgeCount != null && item.badgeCount > 0 && (
                                                <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#18181b] transition-all duration-300 ease-in-out ${
                                                    isCollapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
                                                }`}>
                                                    {item.badgeCount}
                                                </span>
                                            )}
                                        </span>
                                        <div className={`flex items-center justify-between w-full transition-all duration-300 ease-in-out origin-left truncate ${
                                            isCollapsed ? "w-0 opacity-0 scale-90 pointer-events-none" : "w-auto opacity-100 scale-100"
                                        }`}>
                                            <span>{item.label}</span>
                                            {item.badgeCount != null && item.badgeCount > 0 && (
                                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm ml-2">
                                                    {item.badgeCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </SidebarHoverLabel>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`border-t border-white/5 ${isCollapsed ? "overflow-visible p-2 flex justify-center" : "p-3"}`}>
                    <UserProfileMenu
                        variant="sidebar"
                        isCollapsed={isCollapsed}
                        onViewProfile={() => setProfileModalOpen(true)}
                    />
                </div>
            </aside>

            {/* Main content */}
            <main className={`min-h-screen bg-[#121212] pt-14 lg:pt-0 transition-all duration-300 ${isCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
                <div key={location.pathname} className="flex h-full w-full flex-1 flex-col gap-4 p-4 lg:p-8 text-zinc-150 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>


            {user && (
                <UserProfileModal
                    isOpen={profileModalOpen}
                    onClose={() => setProfileModalOpen(false)}
                    user={user.user}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
};

const PortalLayout = (props: PortalLayoutProps) => (
    <SidebarProvider>
        <PortalLayoutContent {...props} />
    </SidebarProvider>
);

export default PortalLayout;
