import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
    { path: "/resident/home", label: "Home", icon: "🏠" },
    { path: "/resident/profile", label: "Profile", icon: "👤" },
    { path: "/resident/logs", label: "Logs", icon: "📋" },
    { path: "/resident/notifications", label: "Alerts", icon: "🔔" },
    { path: "/resident/updates", label: "Updates", icon: "✏️" },
    { path: "/resident/help", label: "Help", icon: "❓" },
];

const ResidentLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20 max-w-lg mx-auto shadow-xl">
            <header className="bg-blue-700 text-white p-4 sticky top-0 z-10">
                <p className="text-xs opacity-80">Green Valley Subdivision</p>
                <h1 className="font-bold text-lg">Gate Access</h1>
                <p className="text-sm opacity-90">{user?.user?.first_name} {user?.user?.last_name}</p>
            </header>
            <main className="p-4">
                <Outlet />
            </main>
            <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-gray-800 border-t flex justify-around py-2 z-10">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center text-xs px-1 ${location.pathname === item.path ? "text-blue-600 font-semibold" : "text-gray-500"}`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>
            <button type="button" onClick={() => logout()} className="fixed top-4 right-4 text-white text-xs bg-blue-800/50 px-2 py-1 rounded">Logout</button>
        </div>
    );
};

export default ResidentLayout;
