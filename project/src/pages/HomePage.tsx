import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Bot, User } from 'lucide-react'; // Changed Settings to Bot
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {isAuthenticated ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Welcome back, {user?.name || user?.username}!
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              Your personal dashboard is ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/profile"
              className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-center text-gray-900 group-hover:text-blue-600 transition-colors">
                Profile
              </h2>
              <p className="mt-2 text-center text-gray-600">
                Update your personal information and profile picture
              </p>
            </Link>

            <Link
              to="/articles"
              className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-center text-gray-900 group-hover:text-blue-600 transition-colors">
                Articles
              </h2>
              <p className="mt-2 text-center text-gray-600">
                Browse and read the latest articles
              </p>
            </Link>

            <Link
              to="/chat" // Changed link to /chat
              className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Bot className="h-8 w-8 text-blue-600" /> {/* Changed icon to Bot */}
                </div>
              </div>
              <h2 className="text-xl font-semibold text-center text-gray-900 group-hover:text-blue-600 transition-colors">
                AI Assistant {/* Changed title */}
              </h2>
              <p className="mt-2 text-center text-gray-600">
                Chat with our AI assistant for help or insights {/* Changed description */}
              </p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Welcome to ArticleHub
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Your go-to platform for discovering, sharing, and discussing insightful articles.
            Join our community of knowledge seekers today.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/login"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600"
            >
              Create an account <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;