import React, { useState, useRef, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import axios from 'axios';
import ModelSelector from '../components/ModelSelector';
import ChatBox from '../components/Chatbox';

// Define the source structure matching the backend
interface SourceDoc {
  page_content: string;
  metadata: Record<string, any>; // Or define more specific metadata types if known
}

// Update ChatApiResponse
interface ChatApiResponse {
  message: string;
  conversation_id: string;
  created_at: string;
  sources?: SourceDoc[]; // Add optional sources array
}

// Update Message type
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  sources?: SourceDoc[]; // Add optional sources array
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: 'Sveiki atvyke, Mano Būstas asistentas. Kaip galiu jums padėti? /n Prisiminkite, aš esu virtualus asistentas, galiu kartais suklysti.',
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

      // Add the assistant's message to the state, including sources
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message, // Access the correct key
          timestamp: responseTimestamp,     // Use the safely parsed timestamp
          sources: response.data.sources     // Store the sources
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
        <title>Mano Būstas Asistentas</title>
        <meta name="description" content="Gaukite eksperto atsakymus į jūsų klausimus susijusius su Mano Būstas paslaugomis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-sm py-3 sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-xl font-bold">
            <span className="text-[#8bc53f]">Mano</span>
            <span className="text-[#1a365d]"> BŪSTELIS</span>
            <span className="text-[#1a365d] ml-2">Pagalbininkas</span>
          </h1>
          <div className="flex items-center mb-4 md:mb-0">
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
              className="ml-2 px-3 py-1 bg-[#e9f3d9] text-[#1a365d] rounded text-sm hover:bg-[#d5eabc] transition"
            >
              Testuoti Ryšį
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
              placeholder="Klauskite apie Mano Būstas duomenis, tokius kaip: kvietimai, skelbimai ir kt."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#8bc53f] resize-none min-h-[50px] max-h-[150px] pr-[90px]"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              className="absolute right-2 bottom-2 bg-[#8bc53f] text-white px-4 py-1.5 rounded-lg hover:bg-[#79af32] transition disabled:opacity-50 font-medium text-sm"
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
          <p>© {new Date().getFullYear()} Mano Būstas Asistentas — Patogus būdas sužinoti informacija greitai</p>
          <p className="text-xs mt-1">Suteikia informacija iš Mano Būstas duomenų</p>
        </div>
      </footer>
    </div>
  );
}