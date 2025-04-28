import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
// LangChain Embeddings and Document
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Document } from "@langchain/core/documents";

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
  // Add full content if available and desired for embedding
  // content?: string;
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
  const [isProcessing, setIsProcessing] = useState(false); // Renamed from isEmbedding

  useEffect(() => {
    // --- Helper function for Pinecone HTTP Upsert ---
    const upsertToPineconeHttp = async (vectors: any[]) => {
      const apiKey = import.meta.env.VITE_PINECONE_API_KEY;
      const indexHost = import.meta.env.VITE_PINECONE_INDEX_HOST; // e.g., "articles-index-xxxxxxx.svc.us-west1-gcp.pinecone.io"

      if (!apiKey || !indexHost) {
        throw new Error("Pinecone API Key or Index Host URL is missing in environment variables.");
      }

      const url = `${indexHost}/vectors/upsert`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({
          vectors: vectors,
          // namespace: "articles" // Optional: Add namespace if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Pinecone HTTP Upsert Error:", errorData);
        throw new Error(`Pinecone upsert failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log("Pinecone HTTP Upsert Result:", result);
      return result;
    };
    // --- End Helper Function ---


    const fetchAndProcessArticles = async () => {
      setIsLoading(true);
      setIsProcessing(false);
      setError(null);
      try {
        // 1. Fetch Articles
        const response = await fetch('http://localhost:3001/articles');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: Article[] = await response.json();
        setArticles(data);

        // 2. Embed and Store via Pinecone HTTP API (only if not already done)
        const embeddingDoneFlag = localStorage.getItem('articlesEmbeddedHttp');
        if (!embeddingDoneFlag && data.length > 0) {
          setIsProcessing(true);
          console.log("Starting embedding and Pinecone HTTP upsert process...");

          const hfToken = import.meta.env.VITE_HUGGINGFACE_API_KEY;
          if (!import.meta.env.VITE_PINECONE_API_KEY || !import.meta.env.VITE_PINECONE_INDEX_HOST) {
             throw new Error("Pinecone API Key or Index Host URL missing.");
          }

          // Initialize Embedding Model (Specify model with 1024 dimensions)
          const embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: hfToken,
            model: 'sentence-transformers/all-roberta-large-v1' // Ensure this 1024-dim model is used
          });

          // Prepare Documents (remains the same)
          const documents = data.map(article => new Document({
            pageContent: `${article.title}\n${article.excerpt}`,
            metadata: {
              // Pinecone metadata values must be string, number, boolean, or array of strings
              id: article.id,
              title: article.title,
              date: article.date,
              author: article.author.name,
              excerpt: article.excerpt, // Include excerpt for potential display later
            },
          }));

          // Generate Embeddings (using LangChain helper)
          console.log(`Generating embeddings for ${documents.length} documents using ${embeddings.model}...`);
          const vectorValues = await embeddings.embedDocuments(documents.map(doc => doc.pageContent));

          // Prepare vectors for Pinecone HTTP API
          const vectorsToUpsert = documents.map((doc, index) => ({
            id: doc.metadata.id as string, // Ensure ID is string
            values: vectorValues[index],
            metadata: doc.metadata,
          }));

          // Upsert via HTTP API
          console.log(`Upserting ${vectorsToUpsert.length} vectors via Pinecone HTTP API...`);
          await upsertToPineconeHttp(vectorsToUpsert);

          console.log("Embedding and Pinecone HTTP upsert complete.");
          localStorage.setItem('articlesEmbeddedHttp', 'true'); // Set flag
          setIsProcessing(false);
        } else if (embeddingDoneFlag) {
            console.log("Embeddings already processed via HTTP (based on flag). Skipping.");
        }

      } catch (e: any) {
        console.error("Failed to fetch or process articles:", e);
        setError(e.message || 'Failed to load or process articles.');
        setIsProcessing(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchAndProcessArticles();
    }
  }, [isAuthenticated]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Define estimated item size (adjust based on your actual card height + padding)
  // Image height (h-48 = 12rem = 192px) + padding + text. Let's estimate ~240px + 32px padding = 272px
  const ITEM_SIZE = 272;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        <div className="mb-8 flex-shrink-0"> {/* Prevent header from scrolling */}
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="mt-2 text-gray-600">
            Browse our latest articles on technology and development
          </p>
        </div>

        {/* Loading State */}
        {(isLoading || isProcessing) && ( // Show loader during fetch or processing
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">
              {isLoading ? 'Loading articles...' : 'Processing articles for search...'}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !isProcessing && ( // Don't show fetch error if processing is happening or succeeded
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
        {!isLoading && !error && !isProcessing && ( // Only show list when not loading, no error, and not processing
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

export default memo(ArticlesPage);