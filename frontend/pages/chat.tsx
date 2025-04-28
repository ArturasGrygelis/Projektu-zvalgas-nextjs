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

// Define the expected API response structure for the chat endpoint
interface ChatApiResponse {
  response: string; // Matches the backend ChatResponse model
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'Welcome to Darbo Asistentas! How can I help you with work-related questions?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('default');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    
    try {
      // Specify the expected response type here
      const response = await axios.post<ChatApiResponse>('/api/chat', {
        message: input,
        model: selectedModel // Match the backend ChatRequest model ('model' not 'model_name')
        // system_prompt: "Optional system prompt here" // Add if needed
      });
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response, // Access the 'response' property
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'system', 
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>Chat with Darbo Asistentas</title>
        <meta name="description" content="Get answers to your work-related questions" />
      </Head>

      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Darbo Asistentas</h1>
          <ModelSelector 
            selectedModel={selectedModel} 
            onModelSelect={setSelectedModel} 
          />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col">
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 mb-4 overflow-y-auto max-h-[70vh]">
          <ChatBox messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about work, employment, or career..."
            className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>

      <footer className="bg-white py-4 border-t">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Darbo Asistentas - Your AI Work Guide
        </div>
      </footer>
    </div>
  );
}