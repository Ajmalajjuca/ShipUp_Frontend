import React from 'react';
import { ChevronRight } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
        : 'text-gray-600 hover:bg-blue-50'
    }`}
  >
    <span className="mr-3">{icon}</span>
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={18} className="ml-auto" />}
  </button>
);

export default NavItem;