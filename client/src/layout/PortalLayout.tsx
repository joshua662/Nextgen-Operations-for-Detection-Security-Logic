import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import AppLogo from "./AppLogo";
import UserProfileMenu from "./UserProfileMenu";
import type { NavItem } from "./navConfig";
import { useAuth } from "../contexts/AuthContext";
import UserProfileModal from "../components/Profile/UserProfileModal";
import SignOutConfirmModal from "../components/Auth/SignOutConfirmModal";
import SidebarHoverLabel from "../components/Sidebar/SidebarHoverLabel";
import { usePersistedSidebarCollapsed } from "../hooks/usePersistedSidebarCollapsed";
import puebloShellLogo from "../assets/img/pueblo-shell-logo.png";

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
    const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
    const { isCollapsed, toggleCollapsed } = usePersistedSidebarCollapsed(SIDEBAR_COLLAPSED_STORAGE_KEY);
    const { user, logout } = useAuth();
    const userRole = user?.user?.role;
    const roleTitle = (userRole as string) === 'guard' || (userRole as string) === 'security_guard'
        ? 'SECURITY GUARD'
        : userRole === 'resident'
        ? 'RESIDENT'
        : userRole === 'admin'
        ? 'SYSTEM ADMINISTRATOR'
        : (userRole || 'USER').toUpperCase();

    const userFullName = `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim() || 'User';

    const closeSidebar = () => {
        if (isOpen && window.innerWidth < 1024) toggleSidebar();
    };

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const handleLogoutRequest = () => {
        setProfileModalOpen(false);
        setSignOutConfirmOpen(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await logout();
            setSignOutConfirmOpen(false);
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
                className={`fixed top-0 left-0 z-40 flex h-screen flex-col border-e border-white/5 bg-[#18181b] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 ${isCollapsed ? "w-[76px]" : "w-[260px]"}`}
                aria-label="Sidebar"
            >
                <div className="hidden border-b border-white/5 p-3.5 lg:flex items-center justify-start h-[88px] shrink-0">
                    <SidebarHoverLabel label={`${roleTitle} • ${userFullName}`} isCollapsed={isCollapsed} variant="dark" className="w-full">
                        <button
                            onClick={toggleCollapsed}
                            className={`flex items-center focus:outline-none cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
                                isCollapsed ? "justify-center" : "justify-start"
                            }`}
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <img src={puebloShellLogo} alt="Pueblo de Panay Emblem" className="h-12 w-auto shrink-0 object-contain" />
                            <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                isCollapsed ? "grid-cols-[0fr] opacity-0 ml-0" : "grid-cols-[1fr] opacity-100 ml-3.5"
                            }`}>
                                <div className="overflow-hidden whitespace-nowrap">
                                    <div className="flex flex-col items-center justify-center text-center select-none shrink-0 leading-none">
                                        <span className="inline-block font-serif italic text-white text-[18px] tracking-wide border-b border-white/40 pb-[2px] px-1 leading-none font-semibold text-center">
                                            Pueblo de Panay
                                        </span>
                                        <span className="text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-zinc-400 text-center mt-[3.5px] leading-none">
                                            TOWNSHIP
                                        </span>
                                        <span className="text-[11px] font-serif italic text-zinc-300 tracking-wider text-center mt-[2.5px] leading-none">
                                            Life. Work. Balance.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </SidebarHoverLabel>
                </div>

                <div className={`flex-1 py-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "overflow-visible px-2" : "overflow-y-auto px-4"}`}>
                    <div className="relative overflow-hidden h-6 mb-4">
                        <p className={`absolute left-2 text-[12.5px] font-bold uppercase tracking-widest text-zinc-500 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-left ${
                            isCollapsed ? "opacity-0 scale-90 pointer-events-none translate-x-[-10px]" : "opacity-100 scale-100 translate-x-0"
                        }`}>
                            {portalLabel}
                        </p>
                    </div>
                    <ul className="space-y-1.5">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <SidebarHoverLabel label={item.label} isCollapsed={isCollapsed} variant="dark">
                                    <Link
                                        to={item.path}
                                        onClick={closeSidebar}
                                        className={`flex items-center rounded-[10px] text-[14.5px] font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] px-3.5 py-2.5 ${
                                            isActive(item.path)
                                                ? "bg-[#3c3c3c] text-white shadow-inner font-semibold"
                                                : "text-zinc-300 hover:bg-[#2a2a2a] hover:text-white"
                                        }`}
                                    >
                                        <span className="shrink-0 h-5 w-5 flex items-center justify-center relative">
                                            {item.icon}
                                            {item.badgeCount != null && item.badgeCount > 0 && (
                                                <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#18181b] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                                    isCollapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
                                                }`}>
                                                    {item.badgeCount}
                                                </span>
                                            )}
                                        </span>
                                        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                            isCollapsed ? "grid-cols-[0fr] opacity-0 ml-0" : "grid-cols-[1fr] opacity-100 ml-3.5"
                                        }`}>
                                            <div className="overflow-hidden whitespace-nowrap flex items-center justify-between">
                                                <span>{item.label}</span>
                                                {item.badgeCount != null && item.badgeCount > 0 && (
                                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm ml-2">
                                                        {item.badgeCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </SidebarHoverLabel>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`border-t border-white/5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "overflow-visible p-2 flex justify-center" : "p-4"}`}>
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
                    onLogout={handleLogoutRequest}
                />
            )}

            <SignOutConfirmModal
                isOpen={signOutConfirmOpen}
                onClose={() => setSignOutConfirmOpen(false)}
                onConfirm={handleLogoutConfirm}
            />
        </div>
    );
};

const PortalLayout = (props: PortalLayoutProps) => (
    <SidebarProvider>
        <PortalLayoutContent {...props} />
    </SidebarProvider>
);

export default PortalLayout;
