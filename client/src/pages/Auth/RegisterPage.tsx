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
        <AuthPageLayout>
            <ToastMessage message={message} isFailed={isFailed} isVisible={isVisible} onClose={closeToastMessage} />
            <AuthForm
                message={showToastMessage}
                defaultRegistrationOpen
                loginHeadline="Join the portal"
                loginSubtitle="Open registration below, or sign in if you already have gate access."
            />
        </AuthPageLayout>
    );
};

export default RegisterPage;
