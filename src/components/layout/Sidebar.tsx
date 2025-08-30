import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Building2,
  Users,
  FolderOpen,
  FileText,
  BarChart3,
  Settings,
  Leaf
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: Home, label: 'Overview Dashboard' },
  { path: '/companies', icon: Building2, label: 'Companies' },
  { path: '/labor', icon: Users, label: 'Workforce' },
  { path: '/projects', icon: FolderOpen, label: 'Projects' },
  { path: '/invoices', icon: FileText, label: 'Invoices' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 p-6 hidden lg:block">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">GreenCare</h1>
          <p className="text-sm text-gray-500">Agency Dashboard</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="mt-auto pt-6">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            location.pathname === '/settings'
              ? 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">System Settings</span>
        </Link>
      </div>
    </div>
  );
}