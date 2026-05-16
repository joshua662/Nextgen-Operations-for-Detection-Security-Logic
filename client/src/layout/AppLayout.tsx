import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { SidebarProvider } from "../contexts/SidebarContext";
import { HeaderProvider } from "../contexts/HeaderContext";

const LayoutContent = () => {
    return (
        <><div>
            <AppSidebar />
        </div>
            <div>
                <AppHeader />
            </div>
            <div className="pt-20 pl-0 sm:pl-64 min-h-screen">
                <Outlet />
            </div>
        </>
    )
}

const AppLayout = () => {
    return (
        <><HeaderProvider>
            <SidebarProvider>
                <LayoutContent />
            </SidebarProvider>
        </HeaderProvider>
        </>
    )
}

export default AppLayout;