import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Types
interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  groups: string[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface EmployeeHeaderProps {
  isAuthenticated?: boolean;
  user?: User | null;
  onLogout?: () => void;
}

// Constants
const EMPLOYEE_NAVIGATION: NavigationItem[] = [
  { name: 'Дашборд', href: '/dashboard', icon: HomeIcon },
  { name: 'Мои задачи', href: '/my-tasks', icon: ClipboardDocumentListIcon },
];

// Sub-components
const Logo: React.FC = () => (
  <Link to="/dashboard" className="flex items-center space-x-3 group">
    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
      <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
    </div>
    <div className="hidden lg:block">
      <div className="text-xl font-bold text-white">
        Менеджер задач
      </div>
      <div className="text-xs text-indigo-200">
        Панель сотрудника
      </div>
    </div>
  </Link>
);

const UserInfo: React.FC<{ user?: User | null }> = ({ user }) => (
  <div className="hidden lg:flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-2">
    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
      <UserIcon className="w-4 h-4 text-white" />
    </div>
    <div>
      <div className="text-sm font-medium text-white">{user?.first_name || user?.username}</div>
      <div className="text-xs text-indigo-200">Сотрудник</div>
    </div>
  </div>
);

const LogoutButton: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => (
  <button
    onClick={onLogout}
    className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors duration-300"
  >
    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
    <span className="hidden sm:inline">Выйти</span>
  </button>
);

const NavigationLink: React.FC<{
  item: NavigationItem;
  isActive: boolean;
  onClick?: () => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-300 ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-indigo-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      <span>{item.name}</span>
    </Link>
  );
};

export const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({ isAuthenticated, user, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-green-600 shadow-lg border-b border-green-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:ml-12 lg:flex lg:space-x-2">
              {EMPLOYEE_NAVIGATION.map((item) => (
                <NavigationLink
                  key={item.name}
                  item={item}
                  isActive={location.pathname === item.href}
                />
              ))}
            </nav>
          </div>

          {/* User menu and logout button */}
          <div className="flex items-center space-x-6">
            <UserInfo user={user} />
            <LogoutButton onLogout={onLogout} />

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden inline-flex items-center justify-center p-3 rounded-xl text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-strong border-t border-white/20 backdrop-blur-xl animate-slide-in-up">
          <div className="px-6 pt-6 pb-8 space-y-3">
            {EMPLOYEE_NAVIGATION.map((item, index) => (
              <div key={item.name} style={{ animationDelay: `${index * 0.1}s` }}>
                <NavigationLink
                  item={item}
                  isActive={location.pathname === item.href}
                  onClick={closeMobileMenu}
                />
              </div>
            ))}
            <div className="border-t border-white/20 pt-6 mt-6">
              <UserInfo user={user} />
              <div className="mt-4 pt-4 border-t border-white/20">
                <LogoutButton onLogout={onLogout} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
