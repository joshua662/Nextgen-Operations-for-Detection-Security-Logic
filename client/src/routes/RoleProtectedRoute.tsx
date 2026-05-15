import type { FC, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "../components/Spinner/Spinner";

interface RoleProtectedRouteProps {
    children: ReactNode;
    role: "admin" | "resident";
}

const RoleProtectedRoute: FC<RoleProtectedRouteProps> = ({ children, role }) => {
    const { user, loading, isAdmin, isResident } = useAuth();

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;
    if (role === "admin" && !isAdmin) return <Navigate to="/resident/home" replace />;
    if (role === "resident" && !isResident) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
};

export default RoleProtectedRoute;
