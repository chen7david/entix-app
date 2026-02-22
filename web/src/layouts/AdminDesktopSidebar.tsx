import React from 'react';
import { AdminSidebarContent } from './AdminSidebarContent';
import { DesktopDrawer } from '@web/src/components/navigation/Sidebar/DesktopDrawer';

export const AdminDesktopSidebar: React.FC = () => {
    return (
        <DesktopDrawer size={240}>
            <AdminSidebarContent />
        </DesktopDrawer>
    );
};
