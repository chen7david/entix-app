import React from 'react';
import { Button, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, HomeOutlined } from '@ant-design/icons';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router';
import { sidebarOpenAtom } from '../../atoms/layout/sidebarAtom';

const { Title } = Typography;

export const DashboardTopBar: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
    const navigate = useNavigate();

    return (
        <header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between fixed top-0 left-0 right-0 z-20 w-full h-16 shadow-sm">
            <div className="flex items-center gap-4">
                <Button
                    type="text"
                    icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-lg w-10 h-10 flex items-center justify-center"
                />
                <Title level={4} style={{ margin: 0 }}>Entix</Title>
            </div>

            <div>
                <Button
                    type="text"
                    icon={<HomeOutlined />}
                    onClick={() => navigate('/')}
                >
                    Home
                </Button>
            </div>
        </header>
    );
};
