import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-white py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center md:flex-row md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600 flex items-center">
                ArticleHub
              </Link>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              &copy; {currentYear} ArticleHub. All rights reserved.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center justify-center md:justify-end">
              <p className="text-sm text-gray-500 flex items-center">
                Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> by ArticleHub Team
              </p>
            </div>
            <div className="mt-2 flex space-x-6 justify-center md:justify-end">
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </Link>
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
              <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);