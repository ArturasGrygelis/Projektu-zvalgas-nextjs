import React, { useState, useRef, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import axios from 'axios';
import ModelSelector from '../components/ModelSelector';
import ChatBox from '../components/Chatbox';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
};

// --- 1. Correct the API Response Interface ---
interface ChatApiResponse {
  message: string; // Correct key
  conversation_id: string;
  created_at: string; // It's likely a string initially
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: 'Welcome to Darbo Asistentas! How can I help you with work-related questions in Lithuania?',
      timestamp: new Date()
    }


    
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("meta-llama/llama-4-maverick-17b-128e-instruct");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus the input field when the page loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle input height adjustment for textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Reset height
    e.target.style.height = 'auto';
    
    // Set new height based on content
    const newHeight = Math.min(e.target.scrollHeight, 150);
    e.target.style.height = `${newHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post<ChatApiResponse>(`${apiUrl}/api/chat`, {
        message: input,
        model_name: selectedModel
      }, {
        // Increase the timeout (e.g., to 90 seconds or 120 seconds)
        timeout: 120000 // 90 seconds (90,000 milliseconds)
        // timeout: 120000 // 120 seconds (120,000 milliseconds)
      });

      console.log("Response received:", response.data);

      // --- 2. Safer Timestamp Parsing & State Update ---
      let responseTimestamp = new Date(); // Default to now
      try {
        // Attempt to parse the timestamp from the response
        if (response.data.created_at) {
          responseTimestamp = new Date(response.data.created_at);
          // Check if parsing resulted in a valid date
          if (isNaN(responseTimestamp.getTime())) {
             console.warn("Invalid date format received:", response.data.created_at);
             responseTimestamp = new Date(); // Fallback to now if invalid
          }
        }
      } catch (dateError) {
         console.error("Error parsing date:", dateError);
         // Keep the default 'now' timestamp if parsing fails
      }

      // Add the assistant's message to the state
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message, // Access the correct key
          timestamp: responseTimestamp     // Use the safely parsed timestamp
        }
      ]);
      // --- End of Changes ---

      setInput(''); // Clear input field

    } catch (error) {
      console.error('Error fetching response:', error);

      // --- 3. Improved Error Message Display ---
      const errorMessage = axios.isAxiosError(error)
        ? `Error: ${error.response?.data?.detail || error.message}`
        : `Error: ${error instanceof Error ? error.message : String(error)}`;

      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `⚠️ ${errorMessage}`, // Show more specific error
          timestamp: new Date()
        }
      ]);
      // --- End of Changes ---

    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle pressing Enter to submit (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Head>
        <title>Darbo Asistentas | Lithuanian Work Law Assistant</title>
        <meta name="description" content="Get expert answers to your questions about Lithuanian labor law and employment regulations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-sm py-3 sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-xl font-bold text-brown-700">Darbo Asistentas</h1>
          <div className="flex items-center mb-4">
            <ModelSelector 
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />
            <button 
              onClick={async () => {
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  const testResponse = await axios.post(`${apiUrl}/api/raw-response`, {
                    message: "Test message",
                    model_name: selectedModel
                  });
                  console.log("Test response:", testResponse.data);
                  alert(`Test successful! Response: ${JSON.stringify(testResponse.data)}`);
                } catch (error) {
                  console.error("Test failed:", error);
                  alert(`Test failed: ${error}`);
                }
              }}
              className="ml-2 px-3 py-1 bg-blue-100 rounded text-sm"
            >
              Test Connection
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 md:px-6 py-6 flex flex-col max-w-5xl">
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 overflow-y-auto h-[calc(100vh-260px)]">
          <ChatBox messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Lithuanian labor law, employment rights, or work regulations..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brown-500 resize-none min-h-[50px] max-h-[150px] pr-[90px]"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              className="absolute right-2 bottom-2 bg-brown-600 text-white px-4 py-1.5 rounded-lg hover:bg-brown-700 transition disabled:opacity-50 font-medium text-sm"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Thinking...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-right mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </main>

      <footer className="bg-white py-4 border-t mt-auto">
        <div className="container mx-auto px-4 md:px-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Darbo Asistentas — Your Lithuanian Labor Law Assistant</p>
          <p className="text-xs mt-1">Provides information about Lithuanian labor law and employment regulations</p>
        </div>
      </footer>
    </div>
  );
}