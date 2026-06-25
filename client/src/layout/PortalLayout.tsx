import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import AppLogo from "./AppLogo";
import UserProfileMenu from "./UserProfileMenu";
import type { NavItem } from "./navConfig";
import { useAuth } from "../contexts/AuthContext";
import UserProfileModal from "../components/Profile/UserProfileModal";

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
    const [isCollapsed, setIsCollapsed] = useState(false);
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
        <div className="min-h-screen bg-white dark:bg-zinc-800">
            {/* Mobile header */}
            <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 lg:hidden dark:border-zinc-700 dark:bg-zinc-900">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
                className={`fixed top-0 left-0 z-40 flex h-screen flex-col border-e border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 ${isCollapsed ? "w-[76px]" : "w-[260px]"}`}
                aria-label="Sidebar"
            >
                <div className="hidden border-b border-zinc-200 dark:border-zinc-700 p-4 lg:flex items-center h-[76px] shrink-0">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`flex items-center focus:outline-none cursor-pointer transition-all ${
                            isCollapsed ? "justify-center w-full" : "gap-2"
                        }`}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-sm font-bold text-white dark:text-zinc-900 shadow-md">
                            G
                        </div>
                        {!isCollapsed && (
                            <span className="truncate font-semibold leading-tight text-zinc-900 dark:text-zinc-100 text-start animate-fade-in">
                                Gate Security
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    {!isCollapsed ? (
                        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {portalLabel}
                        </p>
                    ) : (
                        <div className="border-b border-zinc-200 dark:border-zinc-700 my-3 mx-2 animate-fade-in" />
                    )}
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={closeSidebar}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`flex items-center transition-all duration-200 ${
                                        isCollapsed ? "justify-center px-0 py-2.5" : "gap-3.5 px-3.5 py-2.5"
                                    } rounded-xl text-[14px] font-medium ${
                                        isActive(item.path)
                                            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white font-semibold"
                                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    <span className="shrink-0 h-5 w-5 flex items-center justify-center">
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && <span>{item.label}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`border-t border-zinc-200 dark:border-zinc-700 ${isCollapsed ? "p-2 flex justify-center" : "p-3"}`}>
                    <UserProfileMenu
                        variant="sidebar"
                        isCollapsed={isCollapsed}
                        onViewProfile={() => setProfileModalOpen(true)}
                    />
                </div>
            </aside>

            {/* Main content */}
            <main className={`min-h-screen pt-14 lg:pt-0 transition-all duration-300 ${isCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
                <div className="flex h-full w-full flex-1 flex-col gap-4 p-4 lg:p-8">
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
