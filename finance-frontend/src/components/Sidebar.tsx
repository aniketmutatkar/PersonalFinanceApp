import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  PieChart,
  Upload,
  Download,
  DollarSign
} from 'lucide-react';
import { ROUTES } from '../utils/constants';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Transactions', href: ROUTES.TRANSACTIONS, icon: CreditCard },
  { name: 'Monthly Summary', href: ROUTES.MONTHLY, icon: Calendar },
  { name: 'Budget Analysis', href: ROUTES.BUDGET, icon: PieChart },
  { name: 'Upload Files', href: ROUTES.UPLOAD, icon: Upload },
  { name: 'Export Data', href: ROUTES.EXPORT, icon: Download },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col bg-dark-900 border-r border-dark-700">
      {/* Logo/Header */}
      <div className="flex items-center px-6 py-4 border-b border-dark-700">
        <DollarSign className="h-8 w-8 text-primary-500" />
        <span className="ml-3 text-xl font-bold text-white">
          Finance Tracker
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer info */}
      <div className="px-6 py-4 border-t border-dark-700">
        <p className="text-sm text-gray-400">
          Finance Tracker v1.0
        </p>
      </div>
    </div>
  );
};