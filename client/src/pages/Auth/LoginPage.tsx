import ToastMessage from "../../components/ToastMessage/ToastMessage";
import { useToastMessage } from "../../hooks/useToastMessage";
import AuthPageLayout from "./AuthPageLayout";
import AuthForm from "./components/AuthForm";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
    const { message, isFailed, isVisible, showToastMessage, closeToastMessage } = useToastMessage("", false, false);
    const { user, loading } = useAuth();

    if (!loading && user && !isVisible) {
        return <Navigate to={user.user?.role === "resident" ? "/resident/home" : "/dashboard"} replace />;
    }

    return (
        <AuthPageLayout>
            <ToastMessage message={message} isFailed={isFailed} isVisible={isVisible} onClose={closeToastMessage} />
            <AuthForm message={showToastMessage} />
        </AuthPageLayout>
    );
};

export default LoginPage;
