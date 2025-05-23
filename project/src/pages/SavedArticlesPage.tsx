import React, { useState, useEffect, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { FixedSizeList as List } from 'react-window'; // Import FixedSizeList

// Define Author and Article types (matching db.json and other pages)
interface Author {
    id: number | string; // Allow number or string for ID
    name: string;
    avatar: string;
    bio: string;
}

interface Article {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    image: string;
    author: Author;
    category?: string; // Add category
    tags?: string[]; // Add tags
    readTime?: string; // Add readTime
    content?: string; // Add content if needed, though not displayed here
}

// Component to render a single saved article row
const SavedArticleRow = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: { articles: Article[], handleUnsave: (id: string) => void } }) => {
    const article = data.articles[index];
    const { handleUnsave } = data;

    // Apply the style provided by react-window and add padding
    const rowStyle = {
        ...style,
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
        boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
    };

    return (
        <div style={rowStyle}>
            <article
                key={article.id}
                className="relative group flex flex-col md:flex-row overflow-hidden bg-white rounded-lg shadow hover:shadow-md transition-shadow h-full"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleUnsave(article.id)}
                    aria-label="Remove from saved"
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
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
                        <p className="mt-2 text-gray-600 line-clamp-2">{article.excerpt}</p>
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
                            Read article →
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
});
SavedArticleRow.displayName = 'SavedArticleRow';


const SavedArticlesPage: React.FC = () => {
    const { user, unsaveArticle } = useAuth();
    const [savedArticlesDetails, setSavedArticlesDetails] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const savedArticlesString = JSON.stringify(user?.savedArticles || []);

    useEffect(() => {
        const fetchAndFilterSavedArticles = async () => {
            console.log("SavedArticlesPage: useEffect triggered.");
            console.log("SavedArticlesPage: User:", user);
            console.log("SavedArticlesPage: Saved Article IDs:", user?.savedArticles);

            if (!user?.id || !user.savedArticles || user.savedArticles.length === 0) {
                console.log("SavedArticlesPage: No user or no saved articles, clearing state.");
                setSavedArticlesDetails([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const savedIds = user.savedArticles;
                if (savedIds.length === 0) {
                    console.log("SavedArticlesPage: Saved IDs array is empty, skipping fetch.");
                    setSavedArticlesDetails([]);
                    setIsLoading(false);
                    return;
                }

                // 1. Fetch ALL articles
                const fetchUrl = `http://localhost:3001/articles`; // Fetch all
                console.log("SavedArticlesPage: Fetching URL:", fetchUrl);

                const response = await fetch(fetchUrl);
                console.log("SavedArticlesPage: Fetch response status:", response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const allArticles: Article[] = await response.json();
                console.log("SavedArticlesPage: Fetched all articles:", allArticles);

                // 2. Filter client-side
                const filteredArticles = allArticles.filter(article =>
                    savedIds.includes(article.id)
                );
                console.log("SavedArticlesPage: Filtered saved articles:", filteredArticles);

                setSavedArticlesDetails(filteredArticles); // Set the filtered results

            } catch (e: any) {
                console.error("Failed to fetch or filter saved articles details:", e);
                setError(e.message || 'Failed to load saved articles.');
                setSavedArticlesDetails([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) {
            fetchAndFilterSavedArticles(); // Call the renamed function
        } else {
            console.log("SavedArticlesPage: User ID not available, clearing state.");
            setIsLoading(false);
            setSavedArticlesDetails([]);
        }

    }, [user?.id, savedArticlesString]);

    const handleUnsave = useCallback(async (articleId: string) => {
        // Optimistic UI update
        const originalArticles = [...savedArticlesDetails];
        setSavedArticlesDetails(prev => prev.filter(article => article.id !== articleId));

        try {
            await unsaveArticle(articleId);
            toast.success('Article removed successfully.');
        } catch (err: any) {
            console.error("Unsave error:", err);
            toast.error(err.message || 'Could not remove article.');
            // Rollback optimistic update
            setSavedArticlesDetails(originalArticles);
        }
    }, [unsaveArticle, savedArticlesDetails]);

    // Define estimated item size (same as ArticlesPage)
    const ITEM_SIZE = 272;

    // Pass articles and handler to itemData
    const itemData = { articles: savedArticlesDetails, handleUnsave };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}> {/* Adjust height */}
            <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
                <div className="mb-8 flex-shrink-0"> {/* Prevent header from scrolling */}
                    <h1 className="text-3xl font-bold text-gray-900">Saved Articles</h1>
                    <p className="mt-2 text-gray-600">
                        Your collection of saved articles for future reading.
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-gray-600">Loading...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex justify-center items-center py-10">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <span className="ml-3 text-gray-600">{error}</span>
                    </div>
                )}

                {/* List Display */}
                {!isLoading && !error && (
                    <div className="flex-grow"> {/* Container for the list */}
                        {savedArticlesDetails.length > 0 ? (
                            <List
                                height={window.innerHeight - 250} // Example: Adjust height
                                itemCount={savedArticlesDetails.length}
                                itemSize={ITEM_SIZE}
                                width="100%"
                                itemData={itemData} // Pass combined data
                            >
                                {SavedArticleRow}
                            </List>
                        ) : (
                            <p className="text-center text-gray-500 py-10">You haven't saved any articles yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(SavedArticlesPage);