import type { FC, ReactNode } from "react"
import { useAuth } from "../contexts/AuthContext"
import PortalSkeleton from "../components/Skeleton/PortalSkeleton"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
    children: ReactNode
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({children}) => {
    const {user, loading} = useAuth()

    if(loading) {
        return <PortalSkeleton />;
    }

    if(!user) {
        return <Navigate to="/" replace />
    }

  return <>{children}</>
};

export default ProtectedRoute