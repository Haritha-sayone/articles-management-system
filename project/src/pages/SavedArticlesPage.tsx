import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Bookmark, Search } from 'lucide-react';
import Input from '../components/ui/Input';

// Mock saved articles data - In a real app, this would come from an API
const SAVED_ARTICLES = [
    {
        id: '1',
        title: 'Getting Started with React',
        excerpt: 'Learn the basics of React and how to create your first component.',
        date: '2024-03-15',
        author: 'John Doe',
        image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        savedAt: '2024-03-16',
    },
    {
        id: '2',
        title: 'Advanced TypeScript Techniques',
        excerpt: 'Explore advanced TypeScript features to improve your code quality.',
        date: '2024-03-10',
        author: 'Jane Smith',
        image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        savedAt: '2024-03-15',
    },
];

const SavedArticlesPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredArticles = SAVED_ARTICLES.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Saved Articles</h1>
                        <p className="mt-2 text-gray-600">
                            Your personal collection of saved articles
                        </p>
                    </div>
                    <div className="w-64">
                        <Input
                            placeholder="Search saved articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={<Search className="h-5 w-5 text-gray-400" />}
                        />
                    </div>
                </div>

                {filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                        <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No saved articles found
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery
                                ? "No articles match your search criteria"
                                : "Articles you save will appear here"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredArticles.map((article) => (
                            <article
                                key={article.id}
                                className="flex flex-col sm:flex-row bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="sm:w-48 sm:flex-shrink-0">
                                    <img
                                        className="h-48 w-full object-cover sm:h-full"
                                        src={article.image}
                                        alt={article.title}
                                    />
                                </div>
                                <div className="flex flex-col flex-grow p-6">
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-600 font-medium">
                                                Saved {format(new Date(article.savedAt), 'MMM d, yyyy')}
                                            </span>
                                            <button
                                                className="text-gray-400 hover:text-gray-500"
                                                aria-label="Remove from saved"
                                            >
                                                <Bookmark className="h-5 w-5 fill-current" />
                                            </button>
                                        </div>
                                        <Link
                                            to={`/articles/${article.id}`}
                                            className="block mt-2 group"
                                        >
                                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {article.title}
                                            </h2>
                                        </Link>
                                        <p className="mt-2 text-gray-600">{article.excerpt}</p>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <span>By {article.author}</span>
                                            <span className="mx-2">·</span>
                                            <time>{format(new Date(article.date), 'MMM d, yyyy')}</time>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedArticlesPage;