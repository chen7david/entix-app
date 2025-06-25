import React from 'react';
import { MenuOutlined } from '@ant-design/icons';

interface HamburgerButtonProps {
  onClick: () => void;
  isVisible?: boolean;
}

/**
 * Custom hamburger button component with Tailwind CSS styling
 * Always positioned at top-left with highest z-index and solid appearance
 */
export const HamburgerButton: React.FC<HamburgerButtonProps> = ({ onClick, isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-[99999] w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 99999,
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: 'var(--ant-color-bg-container)',
        border: '1px solid var(--ant-color-border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ant-color-text)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
      tabIndex={0}
      aria-label="Open menu"
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <MenuOutlined
        style={{
          fontSize: '18px',
          color: 'var(--ant-color-text)',
        }}
      />
    </button>
  );
};
