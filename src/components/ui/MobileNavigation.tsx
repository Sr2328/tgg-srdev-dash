import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, Users, FolderOpen, FileText, BarChart3 } from 'lucide-react';

const menuItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/companies', icon: Building2, label: 'Companies' },
  { path: '/labor', icon: Users, label: 'Workforce' },
  { path: '/projects', icon: FolderOpen, label: 'Projects' },
  { path: '/invoices', icon: FileText, label: 'Invoices' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function MobileNavigation() {
  const location = useLocation();

  return (
   <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 pb-safe z-50">
  <div className="flex justify-around">
    {menuItems.map((item) => {
      const isActive = location.pathname === item.path;
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all duration-200 ${
            isActive
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
        </Link>
      );
    })}
  </div>
</div>
  );
}