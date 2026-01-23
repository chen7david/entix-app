import { atom, useAtom } from 'jotai';
import { useAuth } from '../auth/auth.hook';
import { useEffect } from 'react';

const sidebarOpenAtom = atom(false);

export const useSidebar = () => {
    const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            setIsOpen(false);
        }
    }, [isAuthenticated, setIsOpen]);

    const toggle = () => setIsOpen((prev) => !prev);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    return {
        isOpen: isOpen && isAuthenticated,
        toggle,
        open,
        close,
    };
};
