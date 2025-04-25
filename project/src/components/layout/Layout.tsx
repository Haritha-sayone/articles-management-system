import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Check if current route is login, signup, or forgot password
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);
  
  // Only show header and footer for authenticated users or on auth pages
  const showHeaderFooter = isAuthenticated || !isAuthPage;

  return (
    <div className="flex flex-col min-h-screen">
      {showHeaderFooter && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {showHeaderFooter && <Footer />}
    </div>
  );
};

export default Layout;