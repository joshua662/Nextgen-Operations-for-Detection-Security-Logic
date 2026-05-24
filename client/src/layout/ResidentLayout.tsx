import PortalLayout from "./PortalLayout";
import { residentNavItems } from "./navConfig";

const ResidentLayout = () => (
    <PortalLayout
        navItems={residentNavItems}
        homePath="/resident/home"
        portalLabel="Resident Portal"
    />
);

export default ResidentLayout;
