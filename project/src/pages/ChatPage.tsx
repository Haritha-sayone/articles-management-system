import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Paperclip, Smile, Wifi, WifiOff } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useAuth } from '../contexts/AuthContext';

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
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock AI response
  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = [
      "I understand what you're saying. Could you tell me more?",
      "That's interesting! Let me help you with that.",
      "I appreciate your perspective. Here's what I think...",
      "Thanks for sharing. Have you considered...",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: randomResponse,
      sender: 'ai',
      timestamp: new Date(),
      status: 'delivered'
    }]);
    
    setIsTyping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    try {
      // Update message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' } 
            : msg
        )
      );
      
      // Get AI response
      await simulateAIResponse(userMessage.content);
      
      // Update message status to delivered
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' } 
            : msg
        )
      );
    } catch (error) {
      // Handle error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' } 
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

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
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 bg-white">
        <form 
          onSubmit={handleSubmit}
          className="container mx-auto max-w-4xl px-4 py-3"
        >
          <div className="flex items-end gap-3">
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Add attachment"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <div className="flex-1 min-w-0">
              <TextareaAutosize
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="block w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                maxRows={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className={`
                flex-shrink-0 p-2.5 rounded-lg transition-colors
                ${newMessage.trim() && !isSending
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;