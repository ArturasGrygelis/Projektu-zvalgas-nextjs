import React, { useState, useRef, useEffect } from 'react';
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

// Add type for direct document workflow response
interface DirectDocumentResponse {
  document: SourceDoc;
  workflow_id?: string;
  message?: string;
  success?: boolean;
}

// Add type for recent projects API response
interface RecentProjectsResponse {
  projects: Array<{
    id: string;
    title: string;
    summary?: string;
    location?: string;
    deadline?: string;
    Dokumento_failas?: string;
    file_name?: string;
    Dokumento_pavadinimas?: string;
  }>;
}

// Update Message type
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  sources?: SourceDoc[];
};

export default function Chat() {
  // API base URL from environment variable or default for backend requests
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // State variables
  const [summaryDocuments, setSummaryDocuments] = useState<SourceDoc[]>([]);
  const [recentProjects, setRecentProjects] = useState<SourceDoc[]>([]);
  const [allDocuments, setAllDocuments] = useState<SourceDoc[]>([]);
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

  // Fetch recent projects on mount
  useEffect(() => {
    fetchRecentProjects();
  }, []);
  
  // Update allDocuments when either summaryDocuments or recentProjects change
  useEffect(() => {
    if (summaryDocuments && summaryDocuments.length > 0) {
      // Mark these as coming from query results
      const markedSummaryDocs = summaryDocuments.map(doc => ({
        ...doc,
        metadata: { 
          ...doc.metadata, 
          _source: "query_results" 
        } as Record<string, any>
      }));
      
      // Combine summary docs with recent projects, avoiding duplicates
      setAllDocuments([
        ...markedSummaryDocs,
        ...recentProjects.filter(recentDoc => 
          !markedSummaryDocs.some(queryDoc => 
            queryDoc.metadata?.uuid === recentDoc.metadata?.uuid
          )
        )
      ]);
    } else {
      setAllDocuments(recentProjects);
    }
  }, [summaryDocuments, recentProjects]);

  // Helper function to extract document title from page content
  const extractTitleFromContent = (content: string): string | null => {
    if (!content || content.trim().length === 0) return null;
    
    // Look for common patterns in Lithuanian documents
    const patterns = [
      /(?:KVIETIMAS|Kvietimas)\s+(?:pateikti\s+)?(?:pasiūlymą?|pasiūlymus?)\s+(.+?)(?:\n|$)/i,
      /(?:PRANEŠIMAS|Pranešimas)\s+(.+?)(?:\n|$)/i,
      /(?:KONKURSAS|Konkursas)\s+(.+?)(?:\n|$)/i,
      /(?:SKELBIAMAS|Skelbiamas)\s+(.+?)(?:\n|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].trim().length > 10) {
        let extracted = match[1].trim();
        // Clean up common endings
        extracted = extracted.replace(/\s*(\.|\,|\;|\:)\s*$/, '');
        // Limit length
        if (extracted.length > 100) {
          extracted = extracted.substring(0, 97) + '...';
        }
        return extracted;
      }
    }
    
    // If no pattern matches, try to get the first meaningful line
    const lines = content.split('\n').filter(line => line.trim().length > 20);
    if (lines.length > 0) {
      let firstLine = lines[0].trim();
      if (firstLine.length > 100) {
        firstLine = firstLine.substring(0, 97) + '...';
      }
      return firstLine;
    }
    
    return null;
  };

  // Function to fetch recent projects with optimized metadata mapping
  const fetchRecentProjects = async () => {
    try {
      const response = await axios.get<RecentProjectsResponse>(`${API_URL}/api/recent-projects`);
      
      if (response.data?.projects?.length) {
        const convertedDocs = response.data.projects.map(project => {
          // Extract title from content/summary if available
          let extractedTitle = "";
          if (project.summary) {
            extractedTitle = extractTitleFromContent(project.summary) || "";
          }

          // Choose the best document name available
          const documentName = 
            project.Dokumento_pavadinimas || 
            extractedTitle ||
            project.Dokumento_failas ||
            project.file_name ||
            project.title ||
            (project.location ? `Kvietimas pateikti pasiūlymą adresu ${project.location}` : 
            "Kvietimas pateikti pasiūlymą");
            
          // Create a base metadata object with original project fields
          const metadata: Record<string, any> = {
            // Preserve original fields that exist in the project
            ...project,
            // Essential identification fields
            uuid: project.id,
            id: project.id,
            _source: "recent_projects"
          };
          
          // Add only missing standard fields needed by the system
          if (!metadata.Dokumento_pavadinimas) metadata.Dokumento_pavadinimas = documentName;
          if (!metadata.dokumento_pavadinimas) metadata.dokumento_pavadinimas = documentName;
          if (!metadata.Dokumento_tipas) metadata.Dokumento_tipas = "Kvietimas";
          if (!metadata.dokumento_tipas) metadata.dokumento_tipas = "Kvietimas";
          
          // Parse location into components only if needed and not already present
          if (project.location && !metadata.Miestas) {
            metadata.Miestas = project.location.split(',').pop()?.trim() || '';
            metadata.miestas = metadata.Miestas;
            metadata.Vieta = project.location;
            metadata.vieta = project.location;
            
            if (project.location.includes(',')) {
              const street = project.location.split(',').slice(0, -1).join(',').trim();
              metadata.Gatvė = street;
              metadata.gatvė = street;
            }
          }
          
          // Set data_objektas if it doesn't exist
          if (project.location && !metadata.data_objektas) {
            metadata.data_objektas = project.location;
          }
          
          // Standardize deadline fields if a deadline exists
          if (project.deadline && !metadata.Pasiulyma_pateikti_iki) {
            metadata.Pasiulyma_pateikti_iki = project.deadline;
            metadata.pasiulyma_pateikti_iki = project.deadline;
            metadata.deadline = project.deadline;
          }

          return {
            page_content: project.summary || "",
            metadata
          };
        });
        
        setRecentProjects(convertedDocs);
        if (summaryDocuments.length === 0) {
          setAllDocuments(convertedDocs);
        }
      }
    } catch (error) {
      console.error('❌ [CHAT] Error fetching recent projects:', error);
    }
  };

  // Helper function to get best document name - prioritize Dokumento_pavadinimas
  const getDetailedDocName = (doc: SourceDoc): string => {
    // First check if we have a page content to extract title from
    if (doc.page_content && (!doc.metadata?.Dokumento_pavadinimas || doc.metadata?.Dokumento_pavadinimas === "Nežinomas dokumentas")) {
      const extractedTitle = extractTitleFromContent(doc.page_content);
      if (extractedTitle) {
        // Update the metadata for future reference
        if (doc.metadata) {
          doc.metadata.Dokumento_pavadinimas = extractedTitle;
          doc.metadata.dokumento_pavadinimas = extractedTitle;
        }
        return extractedTitle;
      }
    }
    
    // Always prioritize Dokumento_pavadinimas first - this contains the full document name
    if (doc.metadata?.Dokumento_pavadinimas && doc.metadata.Dokumento_pavadinimas !== "Nežinomas dokumentas") 
      return doc.metadata.Dokumento_pavadinimas;
    if (doc.metadata?.dokumento_pavadinimas && doc.metadata.dokumento_pavadinimas !== "Nežinomas dokumentas") 
      return doc.metadata.dokumento_pavadinimas;
    if (doc.metadata?.Dokumento_failas) 
      return doc.metadata.Dokumento_failas;
    if (doc.metadata?.file_name) 
      return doc.metadata.file_name;
    if (doc.metadata?.Projekto_pavadinimas) 
      return doc.metadata.Projekto_pavadinimas;
    if (doc.metadata?.projekto_pavadinimas) 
      return doc.metadata.projekto_pavadinimas;
    if (doc.metadata?.pavadinimas) 
      return doc.metadata.pavadinimas;
    if (doc.metadata?.title) 
      return doc.metadata.title;
    if (doc.metadata?.name) 
      return doc.metadata.name;
    
    return "Nežinomas dokumentas";
  };

  // Handle document click in sidebar
  const handleDocumentClick = (doc: SourceDoc) => {
    const docName = getDetailedDocName(doc);
    setInput(`Papasakok apie: ${docName}`);
    inputRef.current?.focus();
  };

  // Handle focusing on a specific document
  const handleDocumentFocus = async (docId: string) => {
    const doc = allDocuments.find(doc => 
      (doc.metadata?.uuid === docId) || 
      (doc.metadata?.id === docId)
    );
    if (doc) {
      setFocusedDocumentId(docId);
      setFocusedDocument(doc);
      const detailedDocName = getDetailedDocName(doc);
      setMessages(prev => [
        ...prev,
        { 
          role: 'system', 
          content: `Aktyvuotas dokumentas: "${detailedDocName}"\n\nAtsakymai bus teikiami remiantis tik šiuo dokumentu. Klauskite apie šį projektą.`,
          timestamp: new Date()
        }
      ]);
      setInput('');
      inputRef.current?.focus();
    } else {
      try {
        const response = await axios.post<DirectDocumentResponse>(`${API_URL}/api/document-workflow`, {
          document_id: docId
        });
        if (response.data?.document) {
          const fetchedDoc = response.data.document;
          
          // Try to extract a better document name from content if needed
          if (!fetchedDoc.metadata?.Dokumento_pavadinimas && fetchedDoc.page_content) {
            const extractedTitle = extractTitleFromContent(fetchedDoc.page_content);
            if (extractedTitle && fetchedDoc.metadata) {
              fetchedDoc.metadata.Dokumento_pavadinimas = extractedTitle;
              fetchedDoc.metadata.dokumento_pavadinimas = extractedTitle;
            }
          }
          
          setFocusedDocumentId(docId);
          setFocusedDocument(fetchedDoc);
          const detailedDocName = getDetailedDocName(fetchedDoc);
          setMessages(prev => [
            ...prev,
            { 
              role: 'system', 
              content: `Aktyvuotas dokumentas: "${detailedDocName}"\n\nAtsakymai bus teikiami remiantis tik šiuo dokumentu. Klauskite apie šį projektą.`,
              timestamp: new Date()
            }
          ]);
          setInput('');
          inputRef.current?.focus();
        } else {
          setMessages(prev => [
            ...prev,
            { 
              role: 'system', 
              content: `⚠️ Nepavyko aktyvuoti dokumento. Bandykite dar kartą vėliau.`,
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'system', 
            content: `⚠️ Nepavyko aktyvuoti dokumento. Bandykite dar kartą vėliau.`,
            timestamp: new Date()
          }
        ]);
      }
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
    e.target.style.height = 'auto';
    const newHeight = Math.min(e.target.scrollHeight, 80);
    e.target.style.height = `${newHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Reset input height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    try {
      // Choose the appropriate endpoint based on whether a document is focused
      // This is the key change to use create_direct_document_workflow
      const endpoint = focusedDocumentId 
        ? `${API_URL}/api/document-chat` 
        : `${API_URL}/api/chat`;
      
      // Prepare request data
      const requestData = {
        message: input,
        model_name: selectedModel,
        conversation_id: conversationId,
        ...(focusedDocumentId ? { document_id: focusedDocumentId } : {})
      };
      
      console.log(`Sending request to ${endpoint} with document_id: ${focusedDocumentId || 'none'}`);
      
      // Make API request
      const response = await axios.post<ChatApiResponse>(
        endpoint, 
        requestData, 
        { timeout: 120000 }
      );
      
      // Parse response timestamp
      let responseTimestamp = new Date();
      try {
        if (response.data.created_at) {
          const timestamp = new Date(response.data.created_at);
          if (!isNaN(timestamp.getTime())) {
            responseTimestamp = timestamp;
          }
        }
      } catch (dateError) {
        // Use default timestamp if parsing fails
      }
      
      // Add response to messages
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message,
          timestamp: responseTimestamp,
          sources: response.data.sources
        }
      ]);
      
      // Only update documents if not in focused mode and if summary documents are provided
      if (!focusedDocumentId && response.data.summary_documents?.length) {
        setSummaryDocuments(response.data.summary_documents);
      }
      
      // Store conversation ID if not already set
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
    } catch (error) {
      // Handle error case
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
      // Reset loading state and focus input
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

  // Test connection to API
  const testConnection = async () => {
    try {
      const testResponse = await axios.post(`${API_URL}/api/chat`, {
        message: "Test message",
        model_name: selectedModel
      });
      alert(`Connection successful! Backend is responding.`);
    } catch (error) {
      alert(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
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
              onClick={testConnection}
              className="ml-2 px-3 py-1 bg-[#F4A261] text-[#1A3A5E] font-medium rounded text-sm hover:bg-[#FFB703] transition"
            >
              Testuoti Ryšį
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - conditionally shown */}
        {showSidebar && (
          <div className="hidden md:block md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white overflow-hidden">
            <DocumentSidebar 
              documents={allDocuments} 
              onDocumentClick={handleDocumentClick}
              onDocumentFocus={handleDocumentFocus}
              expandable={true}
            />
          </div>
        )}
        
        {/* Main content with chat and input */}
        <div className="flex-grow flex flex-col">
          {/* Chat messages area */}
          <div className="flex-grow overflow-y-auto bg-white mb-1 border border-gray-100">
            <ChatBox messages={messages} />
            <div ref={messagesEndRef} />
          </div>

          {/* Document focus indicator (if active) */}
          {focusedDocumentId && focusedDocument && (
            <div className="px-4 py-2 bg-[#E6F3EC] border-t border-[#B7E0C7]">
              <div className="flex items-center justify-between">
                <div className="flex-grow pr-3">
                  <p className="text-sm font-medium text-[#2D6A4F]">
                    Aktyvuotas specifinis dokumentas
                  </p>
                  <p className="text-xs text-gray-600 break-words whitespace-normal">
                    {getDetailedDocName(focusedDocument)}
                  </p>
                </div>
                <button 
                  onClick={clearDocumentFocus}
                  className="ml-3 p-1 bg-[#2D6A4F] text-white rounded-full hover:bg-[#1B4332] flex-shrink-0 flex items-center justify-center"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
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