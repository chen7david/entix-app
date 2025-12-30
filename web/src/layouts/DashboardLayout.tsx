import React from 'react';
import { Outlet } from 'react-router';
import { useAtomValue } from 'jotai';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardTopBar } from '../components/dashboard/DashboardTopBar';
import { sidebarOpenAtom } from '../atoms/layout/sidebarAtom';

export const DashboardLayout: React.FC = () => {
    const sidebarOpen = useAtomValue(sidebarOpenAtom);

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardTopBar />
            <DashboardSidebar />

            <main
                className={`transition-all duration-200 ease-in-out pt-16 min-h-screen ${sidebarOpen ? 'ml-[250px]' : 'ml-[80px]'
                    }`}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
