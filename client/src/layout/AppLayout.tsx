import { useEffect, useState, useMemo } from "react";
import PortalLayout from "./PortalLayout";
import { adminNavItems } from "./navConfig";
import GateAccessService from "../services/GateAccessService";

const AppLayout = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = () => {
            GateAccessService.loadNotifications(1)
                .then((res) => {
                    const items = res.data.notifications.data ?? [];
                    const unread = items.filter((item: any) => !item.is_read).length;
                    setUnreadCount(unread);
                })
                .catch(() => setUnreadCount(0));
        };

        fetchUnread();
        const intervalId = setInterval(fetchUnread, 5000);
        window.addEventListener('notifications_updated', fetchUnread);
        
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('notifications_updated', fetchUnread);
        };
    }, []);

    const navItemsWithBadges = useMemo(() => {
        return adminNavItems.map(item => {
            if (item.label === "Notifications") {
                return { ...item, badgeCount: unreadCount };
            }
            return item;
        });
    }, [unreadCount]);

    return (
        <PortalLayout
            navItems={navItemsWithBadges}
            homePath="/dashboard"
            portalLabel="Platform"
        />
    );
};

export default AppLayout;
