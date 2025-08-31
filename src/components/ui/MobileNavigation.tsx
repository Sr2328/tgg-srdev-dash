import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Users, 
  FolderOpen, 
  FileText, 
  BarChart3, 
  Settings,
  MoreVertical,
  X
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/companies', icon: Building2, label: 'Companies' },
  { path: '/labor', icon: Users, label: 'Labor' },
  { path: '/projects', icon: FolderOpen, label: 'Projects' },
  { path: '/invoices', icon: FileText, label: 'Invoices' }
];

const moreMenuItems = [
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export default function MobileNavigation() {
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Overlay for more menu */}
      {showMoreMenu && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* More Menu */}
      <div className={`lg:hidden fixed bottom-16 right-0 bg-white border-l border-t border-gray-200 rounded-tl-xl shadow-lg w-48 z-50 transform transition-transform duration-200 ${
        showMoreMenu ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">More Options</span>
            <button 
              onClick={() => setShowMoreMenu(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="py-2">
          {moreMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMoreMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50"
          >
            <MoreVertical className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}