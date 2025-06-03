// src/components/layout/Navigation.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Target, 
  Upload,
  DollarSign 
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/monthly', icon: Calendar, label: 'Monthly' },
  { to: '/budget', icon: Target, label: 'Budget' },
  { to: '/upload', icon: Upload, label: 'Upload' },
];

export default function Navigation() {
  return (
    <nav className="w-64 bg-gray-800 border-r border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <DollarSign className="h-8 w-8 text-green-500" />
          <h1 className="text-xl font-bold text-white">Finance Tracker</h1>
        </div>
        
        <ul className="space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}