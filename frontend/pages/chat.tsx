import React, { useState, useRef, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { FaRegBuilding, FaTimes } from 'react-icons/fa';
import ChatBox from '../components/Chatbox';
import DocumentSidebar from '../components/DocumentSidebar';

// Define the source structure matching the backend
interface SourceDoc {
  page_content: string;
  metadata: Record<string, any>;
}

// Update ChatApiResponse to include summary_documents
interface ChatApiResponse {
  message: string;
  conversation_id: string;
  created_at: string;
  sources?: SourceDoc[]; 
  summary_documents?: SourceDoc[];
}

// Update Message type
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  sources?: SourceDoc[];
};

export default function Chat() {
  // State variables
  const [summaryDocuments, setSummaryDocuments] = useState<SourceDoc[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [focusedDocumentId, setFocusedDocumentId] = useState<string | null>(null);
  const [focusedDocument, setFocusedDocument] = useState<SourceDoc | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: 'Sveiki atvykę, Projektų Žvalgas asistentas. Kaip galiu jums padėti? \n\nPrisiminkite, aš esu virtualus asistentas, galiu kartais suklysti.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Hard-coded model selection
  const selectedModel = "meta-llama/llama-4-scout-17b-16e-instruct";
  
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

  // Handle document click in sidebar
  const handleDocumentClick = (doc: SourceDoc) => {
    const docName = doc.metadata.Dokumento_pavadinimas || 
                   doc.metadata.dokumento_pavadinimas || 
                   "šį dokumentą";
    setInput(`Papasakok apie: ${docName}`);
    inputRef.current?.focus();
  };

  // Handle focusing on a specific document
  const handleDocumentFocus = (docId: string) => {
    const doc = summaryDocuments.find(doc => 
      (doc.metadata.uuid === docId) || 
      (doc.metadata.id === docId) ||
      (doc.metadata.Dokumento_pavadinimas === docId) ||
      (doc.metadata.dokumento_pavadinimas === docId)
    );
    
    if (doc) {
      setFocusedDocumentId(docId);
      setFocusedDocument(doc);
      
      // Add system message to indicate document focus
      const docName = doc.metadata.Dokumento_pavadinimas || 
                      doc.metadata.dokumento_pavadinimas || 
                      "pasirinktas dokumentas";
                      
      setMessages(prev => [
        ...prev,
        { 
          role: 'system', 
          content: `Aktyvuotas dokumentas: "${docName}"\n\nAtsakymai bus teikiami remiantis tik šiuo dokumentu. Klauskite apie šį projektą.`,
          timestamp: new Date()
        }
      ]);
      
      // Clear the input to encourage asking about the document
      setInput('');
      inputRef.current?.focus();
    }
  };

  // Handle clearing document focus mode
  const clearDocumentFocus = () => {
    setFocusedDocumentId(null);
    setFocusedDocument(null);
    
    setMessages(prev => [
      ...prev,
      { 
        role: 'system', 
        content: 'Dokumentų fokusavimas išjungtas. Atsakymai dabar bus teikiami iš visos duomenų bazės.',
        timestamp: new Date()
      }
    ]);
  };

  // Handle input height adjustment for textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Reset height
    e.target.style.height = 'auto';
    
    // Set new height based on content
    const newHeight = Math.min(e.target.scrollHeight, 80);
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
      // Prepare request data based on whether we're in document focus mode
      const requestData: any = {
        message: input,
        model_name: selectedModel,
        conversation_id: conversationId
      };
      
      // If we have a focused document, add its ID to the request
      if (focusedDocumentId) {
        requestData.document_id = focusedDocumentId;
      }
      
      // Use relative URL instead of absolute URL with hostname
      // If we're in frontend/api structure, update the endpoint path
      const endpoint = focusedDocumentId ? '/api/document' : '/api/chat';
      const response = await axios.post<ChatApiResponse>(endpoint, requestData, {
        timeout: 120000
      });

      console.log("Response received:", response.data);
      console.log("Summary documents:", response.data.summary_documents?.length || 0);

      // --- Safer Timestamp Parsing & State Update ---
      let responseTimestamp = new Date();
      try {
        if (response.data.created_at) {
          responseTimestamp = new Date(response.data.created_at);
          if (isNaN(responseTimestamp.getTime())) {
             console.warn("Invalid date format received:", response.data.created_at);
             responseTimestamp = new Date();
          }
        }
      } catch (dateError) {
         console.error("Error parsing date:", dateError);
      }

      // Add the assistant's message to the state, including sources
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message,
          timestamp: responseTimestamp,
          sources: response.data.sources
        }
      ]);

      // Update summary documents if they exist in the response
      if (response.data.summary_documents && response.data.summary_documents.length > 0) {
        console.log("Updating sidebar with summary documents:", response.data.summary_documents.length);
        setSummaryDocuments(response.data.summary_documents);
      }
      
      // Store conversation ID if it's the first message
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }

    } catch (error) {
      console.error('Error fetching response:', error);

      // Improved error message display
      const errorMessage = error instanceof Error 
        ? `Error: ${error.message}` 
        : `Error: ${String(error)}`;

      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `⚠️ ${errorMessage}`,
          timestamp: new Date()
        }
      ]);

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
    <div className="flex flex-col h-screen bg-[#F5F7FA]">
      <Head>
        <title>Projektų Žvalgas Pagalbininkas</title>
        <meta name="description" content="Gaukite eksperto atsakymus į jūsų klausimus susijusius su viešųjų pirkimų projektais" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Fixed height header */}
      <header className="bg-[#1A3A5E] text-white shadow-md py-3 z-10 h-[60px]">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <Link href="/" className="flex items-center">
            <div className="w-9 h-9 mr-3 bg-white rounded-md flex items-center justify-center text-[#1A3A5E]">
              <FaRegBuilding size={28} className="text-[#1A3A5E]" />
            </div>
            <h1 className="text-xl font-bold">
              <span className="text-[#FFB703]">PROJEKTŲ </span>
              <span className="text-white"> ŽVALGAS</span>
              <span className="text-white ml-2">Pagalbininkas</span>
            </h1>
          </Link>
          <div className="flex items-center mb-4 md:mb-0">
            {/* No model selector, just display the model name */}
            <div className="bg-white rounded px-3 py-1 text-black text-sm">
              <span className="font-medium text-[#1A3A5E]">Llama 4 Scout</span>
            </div>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="ml-2 px-3 py-1 bg-[#2D6A4F] text-white rounded text-sm hover:bg-[#1B4332] transition"
            >
              {showSidebar ? 'Slėpti dokumentus' : 'Rodyti dokumentus'}
            </button>
            <button 
              onClick={async () => {
                try {
                  // Use relative URL for test API call as well
                  const testResponse = await axios.post(`/api/raw-response`, {
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
              className="ml-2 px-3 py-1 bg-[#F4A261] text-[#1A3A5E] font-medium rounded text-sm hover:bg-[#FFB703] transition"
            >
              Testuoti Ryšį
            </button>
          </div>
        </div>
      </header>

      {/* Main content area - exact calculation to match footer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - stretches to footer */}
        {showSidebar && (
          <div className="hidden md:block md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white overflow-hidden">
            <DocumentSidebar 
              documents={summaryDocuments} 
              onDocumentClick={handleDocumentClick}
              onDocumentFocus={handleDocumentFocus}
              expandable={true}
            />
          </div>
        )}
        
        {/* Main content with chat and input */}
        <div className="flex-grow flex flex-col">
          {/* Chat messages area - takes most of the space */}
          <div className="flex-grow overflow-y-auto bg-white mb-1 border border-gray-100">
            <ChatBox messages={messages} />
            <div ref={messagesEndRef} />
          </div>

          {/* Document focus indicator (if active) */}
          {focusedDocumentId && focusedDocument && (
            <div className="px-4 py-2 bg-[#E6F3EC] border-t border-[#B7E0C7]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2D6A4F]">
                    Aktyvuotas specifinis dokumentas
                  </p>
                  <p className="text-xs text-gray-600">
                    {focusedDocument.metadata.Dokumento_pavadinimas || 
                     focusedDocument.metadata.dokumento_pavadinimas || 
                     "Pasirinktas dokumentas"}
                    {focusedDocument.metadata.data_objektas ? ` • ${focusedDocument.metadata.data_objektas}` : ""}
                  </p>
                </div>
                <button 
                  onClick={clearDocumentFocus}
                  className="ml-3 p-1 bg-[#2D6A4F] text-white rounded-full hover:bg-[#1B4332] flex items-center justify-center"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Input area - positioned right above footer */}
          <div className="border-t border-gray-200 pt-2 pb-2 px-4 bg-white">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={focusedDocumentId 
                    ? "Klauskite apie šį specifinį dokumentą..." 
                    : "Klauskite apie projektus, kvietimus, skelbinius ir kitus duomenis..."}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2D6A4F] resize-none min-h-[40px] max-h-[80px] pr-[90px]"
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  type="submit"
                  className="absolute right-2 bottom-2 bg-[#F4A261] text-[#1A3A5E] font-medium px-4 py-1.5 rounded-lg hover:bg-[#FFB703] transition disabled:opacity-50"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? 'Galvoju...' : 'Siųsti'}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">
                Enter - siųsti, Shift+Enter - nauja eilutė
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Separator section */}
      <div className="py-3 bg-gradient-to-r from-[#1A3A5E] via-[#2D6A4F] to-[#1A3A5E]"></div>

      {/* Footer - fixed height */}
      <footer className="bg-[#1A3A5E] text-white py-4">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-center">
          <div className="flex items-center mb-2 md:mb-0">
            <div className="w-6 h-6 mr-2 bg-white rounded-md flex items-center justify-center text-[#1A3A5E]">
              <FaRegBuilding size={18} className="text-[#1A3A5E]" />
            </div>
            <span className="font-medium">
              <span className="text-[#FFB703]">PROJEKTŲ</span>
              <span className="text-white"> ŽVALGAS</span>
            </span>
          </div>
          <div className="text-center md:ml-4 text-sm">
            <p>© {new Date().getFullYear()} Projektų Žvalgas Pagalbininkas — Patogus būdas sužinoti informacija greitai</p>
            <p className="text-xs mt-1 text-gray-300">Suteikia informacija iš statybos konkursu duombazės</p>
          </div>
        </div>
      </footer>
    </div>
  );
}