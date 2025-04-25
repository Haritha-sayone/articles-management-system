import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

// Mock article data
const ARTICLES = [
  {
    id: '1',
    title: 'Getting Started with React',
    excerpt: 'Learn the basics of React and how to create your first component.',
    date: '2023-05-15',
    author: 'John Doe',
    image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '2',
    title: 'Advanced TypeScript Techniques',
    excerpt: 'Explore advanced TypeScript features to improve your code quality.',
    date: '2023-06-21',
    author: 'Jane Smith',
    image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '3',
    title: 'Building Responsive UIs with Tailwind CSS',
    excerpt: 'Learn how to create beautiful, responsive user interfaces using Tailwind CSS.',
    date: '2023-07-10',
    author: 'Alex Johnson',
    image: 'https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '4',
    title: 'State Management in Modern Web Applications',
    excerpt: 'Compare different state management solutions for React applications.',
    date: '2023-08-05',
    author: 'Sarah Williams',
    image: 'https://images.pexels.com/photos/5483064/pexels-photo-5483064.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
];

const ArticlesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="mt-2 text-gray-600">
            Browse our latest articles on technology and development
          </p>
        </div>

        <div className="space-y-8">
          {ARTICLES.map((article) => (
            <article
              key={article.id}
              className="flex flex-col md:flex-row overflow-hidden bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="md:flex-shrink-0">
                <img
                  className="h-48 w-full object-cover md:w-48"
                  src={article.image}
                  alt={article.title}
                />
              </div>
              <div className="p-6">
                <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 leading-tight">
                  {article.title}
                </h2>
                <p className="mt-2 text-gray-600">{article.excerpt}</p>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">By {article.author}</span>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;