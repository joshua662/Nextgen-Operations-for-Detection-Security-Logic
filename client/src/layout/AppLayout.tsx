import PortalLayout from "./PortalLayout";
import { adminNavItems } from "./navConfig";

const AppLayout = () => (
    <PortalLayout
        navItems={adminNavItems}
        homePath="/dashboard"
        portalLabel="Platform"
    />
);

export default AppLayout;
