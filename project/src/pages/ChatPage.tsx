import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { format } from 'date-fns';
import { Send, Wifi, WifiOff, Loader2 } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useAuth } from '../contexts/AuthContext';
// LangChain Embeddings and Google GenAI
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Define the Message type
type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false); // Ensure isSending state exists
  const [aiError, setAiError] = useState<string | null>(null);

  const pineconeApiKey = import.meta.env.VITE_PINECONE_API_KEY;
  const pineconeIndexHost = import.meta.env.VITE_PINECONE_INDEX_HOST;
  const googleApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfToken = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  // ... existing online/offline handling ...
  // ... existing scrollToBottom ...

  // --- RAG Logic using HTTP API ---
  const getAIResponse = useCallback(async (userMessageContent: string) => {
    setAiError(null);
    setIsSending(true); // Set sending state to true at the beginning
    // debugger; // Keep debugger if needed
    try {
      console.log("Starting RAG process via HTTP API for:", userMessageContent);

      // 1. Initialize Embeddings and LLM
      if (!pineconeApiKey || !pineconeIndexHost || !googleApiKey) {
        throw new Error("API Keys or Pinecone Host URL missing.");
      }

      const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: hfToken,
        model: 'sentence-transformers/all-roberta-large-v1' // Ensure this 1024-dim model is used
      });
      // Try the "gemini-1.5-flash-latest" model name
      const llm = new ChatGoogleGenerativeAI({ apiKey: googleApiKey, model: "gemini-1.5-flash-latest" });

      // 2. Embed the user query
      console.log(`Embedding user query using ${embeddings.model}...`);
      const queryVector = await embeddings.embedQuery(userMessageContent);

      // 3. Query Pinecone via HTTP API
      console.log("Querying Pinecone via HTTP API...");
      const queryUrl = `${pineconeIndexHost}/query`;
      const topK = 4; // Number of results to retrieve

      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': pineconeApiKey,
        },
        body: JSON.stringify({
          vector: queryVector,
          topK: topK,
          includeMetadata: true, // Get metadata (like title, excerpt)
          // namespace: "articles" // Optional: Add namespace if used during upsert
        }),
      });

      if (!queryResponse.ok) {
        const errorData = await queryResponse.json();
        console.error("Pinecone HTTP Query Error:", errorData);
        throw new Error(`Pinecone query failed: ${errorData.message || queryResponse.statusText}`);
      }

      const queryResult = await queryResponse.json();
      console.log("Pinecone HTTP Query Result:", queryResult);

      // 4. Format Context from Pinecone Results
      const context = queryResult.matches
        ?.map((match: any, i: number) => {
          // Extract relevant info from metadata
          const title = match.metadata?.title || 'Unknown Title';
          const content = match.metadata?.excerpt || match.metadata?.pageContent || 'No content available'; // Adjust based on upserted metadata
          return `Article Snippet ${i + 1} (Title: ${title}):\n${content}`;
        })
        .join("\n\n") || "No relevant articles found."; // Provide fallback

      console.log("Formatted Context:\n", context);

      // 5. Construct Prompt for LLM
      const prompt = `You are an assistant knowledgeable about technology and development articles.
Answer the user's question based *only* on the following context retrieved from relevant articles.
If the context doesn't contain the answer, say "I couldn't find information about that in the available articles."
Do not make up information. Be concise and helpful.

Context:
${context}

Question:
${userMessageContent}`;

      console.log("Invoking LLM with prompt...");
      // 6. Invoke LLM
      const aiResponse = await llm.invoke(prompt);
      const aiResponseContent = aiResponse.content; // Access content correctly

      console.log("AI Response:", aiResponseContent);

      // 7. Add AI message to state
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai',
        content: typeof aiResponseContent === 'string' ? aiResponseContent : JSON.stringify(aiResponseContent), // Handle potential non-string content
        sender: 'ai',
        timestamp: new Date(),
        status: 'delivered'
      }]);

    } catch (error: any) {
      console.error("Error during RAG process:", error);
      setAiError(`Sorry, I encountered an error trying to find an answer: ${error.message || 'Unknown error'}`);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai-error',
        content: `Error: Could not process the request. ${error.message || ''}`,
        sender: 'ai',
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsSending(false); // Set sending state to false when done (success or error)
    }
  }, [pineconeApiKey, pineconeIndexHost, googleApiKey, hfToken]);

  // Add a new handler for the form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission (page refresh)
    if (!newMessage.trim() || isSending || !isOnline) {
      return; // Don't submit if input is empty, already sending, or offline
    }
    // Add user message to state immediately for better UX
    const userMsg: Message = {
        id: Date.now().toString() + '-user',
        content: newMessage,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending' // Show as sending initially
    };
    setMessages(prev => [...prev, userMsg]);
    getAIResponse(newMessage); // Call the AI response function
    setNewMessage(''); // Clear the input field
  }, [newMessage, isSending, isOnline, getAIResponse]);

  // ... existing return JSX ...
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {/* Connection status */}
      <div className={`
        flex items-center justify-center py-2 text-sm font-medium border-b
        ${isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}
      `}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Connected
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            Offline
          </>
        )}
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                relative
                max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]
                rounded-2xl px-4 py-3
                ${message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                }
              `}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <div className={`
                flex items-center justify-end gap-1.5 mt-1
                text-[11px] leading-none
                ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}
              `}>
                <time>{format(message.timestamp, 'HH:mm')}</time>
                {message.sender === 'user' && (
                  <span className="flex items-center">
                    {message.status === 'sending' && (
                      <span className="text-[10px]">•••</span>
                    )}
                    {message.status === 'sent' && '✓'}
                    {message.status === 'delivered' && '✓✓'}
                    {message.status === 'read' && (
                      <span className="text-blue-200">✓✓</span>
                    )}
                    {message.status === 'error' && '!'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing/Processing indicator */}
        {isSending && messages[messages.length - 1]?.sender === 'user' && ( // Show indicator while waiting for AI
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Error Display */}
        {aiError && (
          <div className="flex justify-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md text-sm" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{aiError}</span>
            </div>
          </div>
        )}


        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 bg-white">
        {/* Use the new handleSubmit function */}
        <form
          onSubmit={handleSubmit}
          className="container mx-auto max-w-4xl px-4 py-3"
        >
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <TextareaAutosize
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isOnline ? "Ask about our articles..." : "You are offline"}
                className="block w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                maxRows={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Trigger form submission programmatically which calls handleSubmit
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                disabled={!isOnline || isSending} // Disable input when offline or sending
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !isOnline} // Disable button too
              className={`
                flex-shrink-0 p-2.5 rounded-lg transition-colors
                ${newMessage.trim() && !isSending && isOnline
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(ChatPage);