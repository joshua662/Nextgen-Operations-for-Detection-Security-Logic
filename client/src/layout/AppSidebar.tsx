import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";

const AppSidebar = () => {
    const { isOpen, toggleSidebar } = useSidebar();
    const location = useLocation();

    const sidebarItems = [
        { path: '/dashboard', text: 'Dashboard' },
        { path: '/residents', text: 'Residents' },
        { path: '/gate-logs', text: 'Gate Logs' },
        { path: '/reports', text: 'Reports' },
        { path: '/notifications', text: 'Notifications' },
        { path: '/update-requests', text: 'Update Requests' },
        { path: '/users', text: 'Staff Users' },
        { path: '/genders', text: 'Genders' },
    ];

    return (
        <>
            {!isOpen && (
                <div className="fixed inset-0 z-30 blur-lg sm:hidden" onClick={toggleSidebar} />
            )}
            <aside
                id="logo-sidebar"
                className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform 
                    ${isOpen ? "-translate-x-full" : "translate-x-0"}
                bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700`}
                aria-label="Sidebar"
            >
                <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
                    <p className="px-2 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Gate Security</p>
                    <ul className="space-y-1 font-medium">
                        {sidebarItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center p-2 rounded-lg group ${
                                        location.pathname === item.path
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <span className="ms-3">{item.text}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default AppSidebar;
