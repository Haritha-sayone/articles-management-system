import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';

const ProfilePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 sm:p-8">
            <ProfileForm />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="p-6 sm:p-8">
            <PasswordChangeForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;