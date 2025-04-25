import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ThumbsUp, MessageSquare, Share2, Bookmark, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

// Define detailed Article type
interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  date: string;
  readTime?: string; // Make optional if not always present
  author: Author | string; // Allow author to be object or string
  tags: string[];
  likes: number;
  comments: number;
  image: string;
  excerpt?: string; // Add excerpt if needed for related articles
}

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]); // State for related articles
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticleData = async () => {
      if (!id) {
        setError("Article ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setRelatedArticles([]); // Reset related articles on new fetch

      try {
        // Fetch current article and all articles concurrently
        const [articleResponse, allArticlesResponse] = await Promise.all([
          fetch(`http://localhost:3001/articles/${id}`),
          fetch(`http://localhost:3001/articles`)
        ]);

        // Handle current article response
        if (!articleResponse.ok) {
          if (articleResponse.status === 404) {
            throw new Error('Article not found.');
          }
          throw new Error(`HTTP error fetching article! status: ${articleResponse.status}`);
        }
        const currentArticleData: Article = await articleResponse.json();
        setArticle(currentArticleData);

        // Handle all articles response
        if (!allArticlesResponse.ok) {
          console.error(`HTTP error fetching all articles! status: ${allArticlesResponse.status}`);
          // Don't throw an error here, related articles are secondary
        } else {
          const allArticlesData: Article[] = await allArticlesResponse.json();

          // Filter related articles (run this logic after setting the current article)
          if (currentArticleData && currentArticleData.tags) {
            const related = allArticlesData
              .filter(otherArticle =>
                otherArticle.id !== currentArticleData.id && // Exclude current article
                otherArticle.tags.some(tag => currentArticleData.tags.includes(tag)) // Check for shared tags
              )
              .slice(0, 2); // Limit to 2 related articles
            setRelatedArticles(related);
          }
        }

      } catch (e: any) {
        console.error("Failed to fetch article data:", e);
        setError(e.message || 'Failed to load article.');
        setArticle(null); // Ensure article is null on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleData();
  }, [id]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <Link to="/articles" className="mt-2 text-sm text-red-700 hover:text-red-600 font-medium">
                Go back to articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where article is not found after fetch
  if (!isLoading && !article) {
    // This case is now primarily handled by the error state, but keep as fallback
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p className="text-gray-600">Article not found.</p>
        <Link to="/articles" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          Back to Articles
        </Link>
      </div>
    );
  }

  // Ensure article is available before rendering main content
  if (!article) return null; // Or return a minimal loading/error state

  // Ensure author is an object for rendering details
  const authorDetails = typeof article.author === 'object' ? article.author : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link
            to="/articles"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Link>

          {/* Article header */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-64 sm:h-80 md:h-96 object-cover" // Adjusted height
            />

            <div className="p-6 sm:p-8">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>

              {/* Article meta */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center">
                  {authorDetails && (
                    <Avatar
                      src={authorDetails.avatar}
                      alt={authorDetails.name}
                      size="md"
                      className="mr-4"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {authorDetails ? authorDetails.name : (typeof article.author === 'string' ? article.author : '') /* Fallback if author is string */}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 flex-wrap">
                      <time>{format(new Date(article.date), 'MMM d, yyyy')}</time>
                      {article.readTime && (
                        <>
                          <span className="mx-2">·</span>
                          <span>{article.readTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  icon={<Bookmark className="h-4 w-4" />}
                  className="flex-shrink-0" // Prevent button shrinking on small screens
                >
                  Save
                </Button>
              </div>

              {/* Article content - Render simple paragraphs for now */}
              {/* TODO: Implement proper Markdown rendering */}
              <div className="prose prose-blue max-w-none">
                {article.content.split('\n\n').map((paragraph, index) => ( // Split by double newline for paragraphs
                  paragraph.trim() && <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>

              {/* Article actions */}
              <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    icon={<ThumbsUp className="h-4 w-4" />}
                  >
                    {article.likes}
                  </Button>
                  <Button
                    variant="outline"
                    icon={<MessageSquare className="h-4 w-4" />}
                  >
                    {article.comments}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  icon={<Share2 className="h-4 w-4" />}
                >
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Author bio */}
          {authorDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About the Author</h2>
              <div className="flex items-start">
                <Avatar
                  src={authorDetails.avatar}
                  alt={authorDetails.name}
                  size="lg"
                  className="mr-4"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{authorDetails.name}</h3>
                  <p className="mt-1 text-gray-600">{authorDetails.bio}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Follow
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && ( // Only show section if related articles exist
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.map(related => { // Use the state variable
                  const relatedAuthorName = typeof related.author === 'object' ? related.author.name : related.author;
                  return (
                    <Link
                      key={related.id}
                      to={`/articles/${related.id}`} // Link to the correct related article ID
                      className="group block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {related.title}
                        </h3>
                        {related.excerpt && ( // Display excerpt if available
                           <p className="mt-1 text-sm text-gray-600 line-clamp-2">{related.excerpt}</p>
                        )}
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <span>{relatedAuthorName}</span>
                          <span className="mx-2">·</span>
                          <time>{format(new Date(related.date), 'MMM d, yyyy')}</time>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;