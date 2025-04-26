import React, { memo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, UserCircle, LogOut, ChevronDown, X, Menu as MenuIcon, MessageSquare, Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import Avatar from '../ui/Avatar';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    closeMenu();
    logout();
  }, [logout, closeMenu]);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Articles', path: '/articles' },
    { label: 'Saved', path: '/saved-articles', icon: <Bookmark className="h-4 w-4" /> },
    { label: 'Chat', path: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm transition-all">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center font-bold text-xl text-blue-600">
              <BookOpen className="h-6 w-6 mr-2" />
              <span>ArticleHub</span>
            </Link>
            
            {isAuthenticated && (
              <nav className="hidden ml-10 space-x-8 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      text-sm font-medium transition-colors hover:text-blue-600
                      flex items-center gap-2
                      ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-700'}
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* User menu and mobile navigation toggle */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                <Dropdown
                  trigger={
                    <div className="flex items-center cursor-pointer">
                      <Avatar
                        src={user?.avatar}
                        alt={user?.name || user?.username || 'User'}
                        size="sm"
                        className="mr-1"
                      />
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  }
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownItem
                    icon={<UserCircle className="h-4 w-4" />}
                    onClick={closeMenu}
                  >
                    <Link to="/profile" className="w-full text-left">Profile</Link>
                  </DropdownItem>
                  <div className="border-t border-gray-100 my-1"></div>
                  <DropdownItem
                    icon={<LogOut className="h-4 w-4" />}
                    onClick={handleLogout}
                    danger
                  >
                    Logout
                  </DropdownItem>
                </Dropdown>

                {/* Mobile menu button */}
                <button
                  className="ml-4 md:hidden"
                  onClick={toggleMenu}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6 text-gray-500" />
                  ) : (
                    <MenuIcon className="h-6 w-6 text-gray-500" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 pt-2 pb-3">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2
                    ${location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={closeMenu}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default memo(Header);