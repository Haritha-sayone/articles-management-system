import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { format, isSameDay } from 'date-fns';
import { Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
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
  feedback?: 'upvoted' | 'downvoted' | null; // Add optional feedback property
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const pineconeApiKey = import.meta.env.VITE_PINECONE_API_KEY;
  const pineconeIndexHost = import.meta.env.VITE_PINECONE_INDEX_HOST;
  const googleApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfToken = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  // --- Load Chat History ---
  useEffect(() => {
    if (user && !isHistoryLoaded) { // Only load if user exists and history hasn't been loaded yet
      const storageKey = `chatHistory_${user.email}`; // Use user email for unique key
      console.log(`Attempting to load chat history from localStorage key: ${storageKey}`);
      try {
        const storedMessages = localStorage.getItem(storageKey);
        if (storedMessages) {
          const parsedMessages: Message[] = JSON.parse(storedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp), // Ensure timestamp is a Date object
          }));
          console.log(`Loaded ${parsedMessages.length} messages from localStorage.`);
          setMessages(parsedMessages);
        } else {
          console.log("No previous chat history found in localStorage.");
          // Optional: Add a default welcome message if no history
          setMessages([{ id: 'welcome', content: 'Hi! How can I help you today?', sender: 'ai', timestamp: new Date()}]);
        }
      } catch (error) {
        console.error("Failed to load or parse chat history from localStorage:", error);
        localStorage.removeItem(storageKey); // Clear corrupted data
      } finally {
        setIsHistoryLoaded(true); // Mark history as loaded (or attempted)
      }
    }
  }, [user, isHistoryLoaded]); // Depend on user and isHistoryLoaded

  // --- Save Chat History ---
  useEffect(() => {
    // Only save if history has been loaded to prevent overwriting loaded history with initial empty state
    // And only save if there are messages and user exists
    if (isHistoryLoaded && messages.length > 0 && user) {
      const storageKey = `chatHistory_${user.email}`;
      console.log(`Saving ${messages.length} messages to localStorage key: ${storageKey}`);
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save chat history to localStorage:", error);
        // Handle potential storage quota errors here if necessary
      }
    }
    // Also save when messages array becomes empty (e.g., user clears chat - if that feature exists)
    else if (isHistoryLoaded && messages.length === 0 && user) {
        const storageKey = `chatHistory_${user.email}`;
        console.log(`Clearing chat history in localStorage for key: ${storageKey}`);
        localStorage.removeItem(storageKey);
    }
  }, [messages, user, isHistoryLoaded]); // Depend on messages, user, and isHistoryLoaded

  // --- RAG Logic using HTTP API ---
  const getAIResponse = useCallback(async (userMessageContent: string, currentMessages: Message[]) => { // Add currentMessages parameter
    setAiError(null);
    setIsSending(true);

    // Get current messages state for history context - PASSED AS ARGUMENT NOW
    // Note: This captures state *before* this async function might fully execute,
    // but it's the simplest way to get recent history. Includes the latest user message.
    // const currentMessages = messages; // REMOVED

    try {
      console.log("Starting RAG process via HTTP API for:", userMessageContent);

      // 1. Initialize Embeddings and LLM
      if (!pineconeApiKey || !pineconeIndexHost || !googleApiKey) {
        throw new Error("API Keys or Pinecone Host URL missing.");
      }

      const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: hfToken,
        model: 'sentence-transformers/all-mpnet-base-v2' // Use this model for 768 dimensions
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

      // 4. Format Context from Pinecone Results (Include Author)
      const context = queryResult.matches
        ?.map((match: any, i: number) => {
          const title = match.metadata?.title || 'Unknown Title';
          const author = match.metadata?.author; // Extract author
          const content = match.metadata?.content || match.metadata?.excerpt || 'No content available';
          // Include author if available
          const authorString = author ? ` (Author: ${author})` : '';
          return `Article Snippet ${i + 1} (Title: ${title}${authorString}):\n${content}`;
        })
        .join("\n\n") || "No relevant articles found."; // Provide fallback

      console.log("Formatted Context:\n", context); // This context will now be more detailed

      // 5. Format Recent Chat History
      const historyWindow = 4; // Number of past messages to include
      const recentHistory = currentMessages // USE ARGUMENT
        .slice(-historyWindow) // Get last N messages
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join("\n");

      console.log("Formatted History:\n", recentHistory);

      // 6. Construct Prompt for LLM (Include History - REVISED INSTRUCTIONS)
      const prompt = `You are an assistant knowledgeable about technology and development articles.
Your goal is to answer the user's question based on the provided Chat History and the Context from relevant articles below.

Instructions:
1.  **Prioritize Chat History for Follow-ups:** If the user's 'Question' is short (e.g., one or two words like "why?", "reasons?", "tell me more") or seems to directly refer to the previous turn, first look at the immediately preceding messages in the 'Chat History' to understand the topic. Answer based on that history if possible.
2.  **Use Context for New Topics or Details:** If the 'Question' introduces a new topic or asks for specific details not covered in the recent 'Chat History', use the retrieved 'Context' primarily.
3.  **Combine History and Context:** If the question relates to the history but requires more detail, use both the 'Chat History' to understand the subject and the 'Context' to find relevant information.
4.  **Base Answers ONLY on Provided Information:** Strictly base your answer *only* on the information found in the 'Chat History' and the 'Context'.
5.  **Handle Missing Information:** If the answer cannot be found in either the 'Chat History' or the 'Context', respond with "I couldn't find information about that in the chat history or the available articles."
6.  **Metadata:** If asked about metadata like an author, look for it in the 'Context' snippets (e.g., "(Author: John Doe)").
7.  **Conciseness:** Be concise and helpful. Do not make up information.

Chat History:
${recentHistory}

Context:
${context}

Question:
${userMessageContent}`; // The user's *latest* question

      console.log("Invoking LLM with prompt...");
      // 7. Invoke LLM
      const aiResponse = await llm.invoke(prompt);
      const aiResponseContent = aiResponse.content; // Access content correctly

      console.log("AI Response:", aiResponseContent);

      // 8. Add AI message to state
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai',
        content: typeof aiResponseContent === 'string' ? aiResponseContent : JSON.stringify(aiResponseContent), // Handle potential non-string content
        sender: 'ai',
        timestamp: new Date(),
      }]);

    } catch (error: any) {
      console.error("Error during RAG process:", error);
      setAiError(`Sorry, I encountered an error trying to find an answer: ${error.message || 'Unknown error'}`);
      // Add AI error message
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai-error',
        content: `Error: Could not process the request. ${error.message || ''}`,
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false); // Set sending state to false when done (success or error)
    }
    // REMOVE `messages` from dependency array
  }, [pineconeApiKey, pineconeIndexHost, googleApiKey, hfToken]); // Removed 'messages'

  // Add a new handler for the form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission (page refresh)
    if (!newMessage.trim() || isSending) {
      return; // Don't submit if input is empty or already sending
    }
    // Add user message to state immediately for better UX
    const userMsg: Message = {
      id: Date.now().toString() + '-user',
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    // Use functional update to get the latest messages state
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, userMsg];
      // Call getAIResponse with the latest messages state
      getAIResponse(newMessage, updatedMessages);
      return updatedMessages; // Return the new state
    });
    // getAIResponse(newMessage); // REMOVED direct call
    setNewMessage(''); // Clear the input field
  }, [newMessage, isSending, getAIResponse]); // Keep dependencies minimal

  // --- Handle Feedback ---
  const handleFeedback = useCallback((messageId: string, feedback: 'upvoted' | 'downvoted') => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback } // Toggle feedback or set new
          : msg
      )
    );
    // Note: The change in `messages` state will trigger the save useEffect
  }, []);


  // --- Scroll to Bottom ---
  useEffect(() => {
    // Scroll to bottom when messages change or when AI starts/stops sending
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Depend on the *number* of messages and the sending state
  }, [messages.length, isSending]); // Trigger scroll only when message count changes or sending state changes

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4"> {/* Adjusted space-y */}
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          // Check if it's the first message or if the date is different from the previous one
          const showDateSeparator = index === 0 || (previousMessage && !isSameDay(message.timestamp, previousMessage.timestamp));

          return (
            <React.Fragment key={message.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex justify-center items-center my-4">
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                    {format(message.timestamp, 'MMMM d, yyyy')}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    relative
                    max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]
                    rounded-2xl px-4 py-3 group
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
                    flex items-center mt-1.5 text-[11px] leading-none
                    ${message.sender === 'user' ? 'text-blue-100 justify-end' : 'text-gray-400 justify-between'}
                  `}>
                    {/* Timestamp */}
                    <time>{format(message.timestamp, 'HH:mm')}</time>

                    {/* Feedback Buttons for AI messages */}
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleFeedback(message.id, 'upvoted')}
                          className={`p-0.5 rounded hover:bg-gray-200 ${message.feedback === 'upvoted' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                          aria-label="Upvote"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'downvoted')}
                          className={`p-0.5 rounded hover:bg-gray-200 ${message.feedback === 'downvoted' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                          aria-label="Downvote"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

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
                placeholder="Ask about our articles..."
                className="block w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                maxRows={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Trigger form submission programmatically which calls handleSubmit
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                disabled={isSending} // Disable input when sending
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || isSending} // Disable button too
              className={`
                flex-shrink-0 p-2.5 rounded-lg transition-colors
                ${newMessage.trim() && !isSending
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