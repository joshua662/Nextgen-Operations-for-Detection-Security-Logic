import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import AppLogo from "./AppLogo";
import UserProfileMenu from "./UserProfileMenu";
import type { NavItem } from "./navConfig";

type PortalLayoutProps = {
    navItems: NavItem[];
    homePath: string;
    portalLabel: string;
};

const PortalLayoutContent = ({ navItems, homePath, portalLabel }: PortalLayoutProps) => {
    const { isOpen, toggleSidebar } = useSidebar();
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const closeSidebar = () => {
        if (isOpen && window.innerWidth < 1024) toggleSidebar();
    };

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

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
                    isOpen={userMenuOpen}
                    onToggle={() => setUserMenuOpen((v) => !v)}
                    onClose={() => setUserMenuOpen(false)}
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
                className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-e border-zinc-200 bg-zinc-50 transition-transform dark:border-zinc-700 dark:bg-zinc-900 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0`}
                aria-label="Sidebar"
            >
                <div className="hidden border-b border-zinc-200 p-4 lg:block dark:border-zinc-700">
                    <AppLogo homePath={homePath} />
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {portalLabel}
                    </p>
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={closeSidebar}
                                    className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition ${
                                        isActive(item.path)
                                            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
                    <UserProfileMenu
                        variant="sidebar"
                        isOpen={userMenuOpen}
                        onToggle={() => setUserMenuOpen((v) => !v)}
                        onClose={() => setUserMenuOpen(false)}
                    />
                </div>
            </aside>

            {/* Main content */}
            <main className="min-h-screen pt-14 lg:ml-64 lg:pt-0">
                <div className="flex h-full w-full flex-1 flex-col gap-4 p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const PortalLayout = (props: PortalLayoutProps) => (
    <SidebarProvider>
        <PortalLayoutContent {...props} />
    </SidebarProvider>
);

export default PortalLayout;
