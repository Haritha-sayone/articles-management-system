import React, { useState, useEffect, memo } from 'react'; // Import memo
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { FixedSizeList as List } from 'react-window'; // Import FixedSizeList

// Define Author type (matching db.json and ArticleDetailPage)
interface Author {
  id: number | string; // Allow number or string for ID
  name: string;
  avatar: string;
  bio: string;
}

// Define Article type
interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: Author; // Use the Author interface
  image: string;
  category?: string; // Add category if needed
  tags?: string[]; // Add tags if needed
  readTime?: string; // Add readTime if needed
}

// Component to render a single article row in the virtual list
const ArticleRow = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: Article[] }) => {
  const article = data[index];

  // Apply the style provided by react-window and add padding for spacing
  const rowStyle = {
    ...style,
    paddingTop: '1rem', // Add vertical spacing (half of space-y-8)
    paddingBottom: '1rem', // Add vertical spacing
    paddingLeft: '0.5rem', // Optional horizontal padding
    paddingRight: '0.5rem', // Optional horizontal padding
    boxSizing: 'border-box' as React.CSSProperties['boxSizing'], // Ensure padding is included in height
  };


  return (
    <div style={rowStyle}>
      <article
        key={article.id} // Key is still useful here for React's internal diffing if needed
        className="flex flex-col md:flex-row overflow-hidden bg-white rounded-lg shadow hover:shadow-md transition-shadow h-full" // Ensure article takes full height of the row
      >
        <div className="md:flex-shrink-0">
          <img
            className="h-48 w-full object-cover md:w-48"
            src={article.image}
            alt={article.title}
          />
        </div>
        <div className="p-6 flex-grow flex flex-col justify-between">
          <div>
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
            <p className="mt-2 text-gray-600 line-clamp-3">{article.excerpt}</p> {/* Use line-clamp */}
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                By {article.author.name}
              </span>
            </div>
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
    </div>
  );
});
ArticleRow.displayName = 'ArticleRow';


const ArticlesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assuming json-server runs on port 3001
        const response = await fetch('http://localhost:3001/articles');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Article[] = await response.json();
        setArticles(data);
      } catch (e: any) {
        console.error("Failed to fetch articles:", e);
        setError(e.message || 'Failed to load articles. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchArticles();
    }
  }, [isAuthenticated]); // Re-fetch if authentication status changes (though protected route handles redirect)

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Define estimated item size (adjust based on your actual card height + padding)
  // Image height (h-48 = 12rem = 192px) + padding + text. Let's estimate ~240px + 32px padding = 272px
  const ITEM_SIZE = 272;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}> {/* Adjust height calculation based on header/footer */}
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        <div className="mb-8 flex-shrink-0"> {/* Prevent header from scrolling */}
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="mt-2 text-gray-600">
            Browse our latest articles on technology and development
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading articles...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* List Display */}
        {!isLoading && !error && (
          <div className="flex-grow"> {/* Container for the list to take remaining space */}
            {articles.length > 0 ? (
              <List
                height={window.innerHeight - 250} // Example: Adjust based on actual surrounding element heights
                itemCount={articles.length}
                itemSize={ITEM_SIZE} // Use the estimated item size
                width="100%" // Take full width of the container
                itemData={articles} // Pass articles data to the Row component
              >
                {ArticleRow}
              </List>
            ) : (
              <p className="text-center text-gray-500 py-10">No articles found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with memo if ArticlesPage itself might re-render unnecessarily
export default memo(ArticlesPage);