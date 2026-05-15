import ToastMessage from "../../components/ToastMessage/ToastMessage";
import { useToastMessage } from "../../hooks/useToastMessage";
import AuthPageLayout from "./AuthPageLayout";
import AuthForm from "./components/AuthForm";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const RegisterPage = () => {
    const { message, isFailed, isVisible, showToastMessage, closeToastMessage } = useToastMessage("", false, false);
    const { user, loading } = useAuth();

    if (!loading && user && !isVisible) {
        return <Navigate to={user.user?.role === "resident" ? "/resident/home" : "/dashboard"} replace />;
    }

    return (
        <AuthPageLayout welcomeTitle="Join Us" welcomeSubtitle="Create your gate access account today.">
            <ToastMessage message={message} isFailed={isFailed} isVisible={isVisible} onClose={closeToastMessage} />
            <AuthForm message={showToastMessage} defaultMode="register" />
        </AuthPageLayout>
    );
};

export default RegisterPage;
