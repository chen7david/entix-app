import React from 'react'
import { useSidebar } from '@web/src/hooks/navigation/sidebar.hook'

export const HamburgerButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  const { toggle } = useSidebar()

  return (
    <button onClick={toggle} {...props}>
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  )
}
