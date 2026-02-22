import React from 'react';
import { AdminSidebarContent } from './AdminSidebarContent';

export const AdminDesktopSidebar: React.FC = () => {
    return (
        <div className="h-full border-r border-gray-800 bg-[#001529]">
            <AdminSidebarContent />
        </div>
    );
};
