import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ResidentLayout from "../layout/ResidentLayout";
import EditGenderPage from "../pages/Gender/EditGenderPage";
import GenderMainPage from "../pages/Gender/GenderMainPage";
import DeleteGenderPage from "../pages/Gender/DeleteGenderPage";
import UserMainPage from "../pages/User/UserMainPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ResidentLoginPage from "../pages/Resident/Auth/ResidentLoginPage";
import ResidentRegisterPage from "../pages/Resident/Auth/ResidentRegisterPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ResidentsPage from "../pages/Residents/ResidentsPage";
import GateLogsPage from "../pages/GateLogs/GateLogsPage";
import ActivityLogsPage from "../pages/ActivityLogs/ActivityLogsPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import NotificationsPage from "../pages/Notifications/NotificationsPage";
import UpdateRequestsPage from "../pages/UpdateRequests/UpdateRequestsPage";
import ResidentHomePage from "../pages/Resident/ResidentHomePage";
import ResidentProfilePage from "../pages/Resident/ResidentProfilePage";
import ResidentLogsPage from "../pages/Resident/ResidentLogsPage";
import ResidentNotificationsPage from "../pages/Resident/ResidentNotificationsPage";
import ResidentUpdatesPage from "../pages/Resident/ResidentUpdatesPage";
import ResidentHelpPage from "../pages/Resident/ResidentHelpPage";
import { AuthProvider } from "../contexts/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

const AppRoutes = () => {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/resident/login" element={<ResidentLoginPage />} />
                <Route path="/resident/register" element={<ResidentRegisterPage />} />

                <Route
                    element={
                        <ProtectedRoute>
                            <RoleProtectedRoute role="admin">
                                <AppLayout />
                            </RoleProtectedRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/residents" element={<ResidentsPage />} />
                    <Route path="/gate-logs" element={<GateLogsPage />} />
                    <Route path="/activity-logs" element={<ActivityLogsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/update-requests" element={<UpdateRequestsPage />} />
                    <Route path="/genders" element={<GenderMainPage />} />
                    <Route path="/gender/edit/:gender_id" element={<EditGenderPage />} />
                    <Route path="/gender/delete/:gender_id" element={<DeleteGenderPage />} />
                    <Route path="/users" element={<UserMainPage />} />
                </Route>

                <Route
                    element={
                        <ProtectedRoute>
                            <RoleProtectedRoute role="resident">
                                <ResidentLayout />
                            </RoleProtectedRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route path="/resident/home" element={<ResidentHomePage />} />
                    <Route path="/resident/profile" element={<ResidentProfilePage />} />
                    <Route path="/resident/logs" element={<ResidentLogsPage />} />
                    <Route path="/resident/notifications" element={<ResidentNotificationsPage />} />
                    <Route path="/resident/updates" element={<ResidentUpdatesPage />} />
                    <Route path="/resident/help" element={<ResidentHelpPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
};

export default AppRoutes;
