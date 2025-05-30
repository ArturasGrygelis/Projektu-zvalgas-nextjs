import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaChevronDown, FaChevronRight, FaClock, FaCalendarAlt, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';

interface SourceDoc {
  page_content: string;
  metadata: Record<string, any>;
}

interface DocumentSidebarProps {
  documents: SourceDoc[];
  onDocumentClick: (doc: SourceDoc) => void;
  onDocumentFocus?: (docId: string) => void;
  expandable?: boolean;
  initialDocumentId?: string;
}

// Define project structure (same as RecentProjects)
interface Project {
  id: string;
  title: string;
  deadline: string;
  location: string;
  summary: string;
  document_id?: string;
}

// API response types
interface CitiesResponse {
  cities: string[];
}

interface ProjectsResponse {
  projects: Project[];
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  documents: propDocuments, 
  onDocumentClick,
  onDocumentFocus,
  expandable = false,
  initialDocumentId
}) => {
  // State for both recent projects and chat-provided documents
  const [documents, setDocuments] = useState<SourceDoc[]>([]);
  const [recentProjects, setRecentProjects] = useState<SourceDoc[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(initialDocumentId || null);
  
  // Flag to track if documents came from chat response
  const [hasDocumentsFromChat, setHasDocumentsFromChat] = useState(false);
  
  // Fetch cities for filter
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get<CitiesResponse>('/api/cities');
        if (response.data && Array.isArray(response.data.cities)) {
          setCities(response.data.cities);
        } else {
          console.error("Invalid cities data format:", response.data);
          setCities([]);
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setCities([]);
      }
    };

    fetchCities();
  }, []);
  
  // Handle initial document ID
  useEffect(() => {
    if (initialDocumentId) {
      setHighlightedDocId(initialDocumentId);
      setExpandedDocs(prev => ({
        ...prev,
        [initialDocumentId]: true
      }));
      
      // Scroll to the highlighted document after it renders
      setTimeout(() => {
        const docElement = document.getElementById(`doc-${initialDocumentId}`);
        if (docElement) {
          docElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [initialDocumentId]);
  
  // Load recent projects initially and whenever selectedCity changes
  useEffect(() => {
    fetchRecentProjects(selectedCity);
  }, [selectedCity]);
  
  // Update when prop documents change (for chat responses)
  useEffect(() => {
    if (propDocuments && propDocuments.length > 0) {
      // If we have chat query documents, mark them and merge with recent projects
      setHasDocumentsFromChat(true);
      
      // Merge documents, showing chat documents first, then recent projects
      updateDocumentsList(propDocuments);
    }
  }, [propDocuments]);
  
  // Function to update documents list with chat results prioritized
  const updateDocumentsList = (chatDocuments: SourceDoc[]) => {
    // Get document IDs to avoid duplicates
    const chatDocIds = new Set(chatDocuments.map(doc => getDocId(doc)));
    
    // Filter recent projects to exclude any that appear in chat documents
    const filteredRecentProjects = recentProjects.filter(doc => 
      !chatDocIds.has(getDocId(doc))
    );
    
    // Set documents with chat documents first, then recent projects
    setDocuments([...chatDocuments, ...filteredRecentProjects]);
  };
  
  // Function to fetch recent projects
  const fetchRecentProjects = async (city: string = '') => {
    try {
      setIsLoading(true);
      
      const url = city 
        ? `/api/recent-projects?city=${encodeURIComponent(city)}` 
        : '/api/recent-projects';
      
      const response = await axios.get<ProjectsResponse>(url);
      
      if (response.data && Array.isArray(response.data.projects)) {
        // Convert projects to SourceDoc format
        const convertedDocs: SourceDoc[] = response.data.projects.map(project => ({
          page_content: project.summary || "",
          metadata: {
            uuid: project.document_id || project.id,
            Dokumento_pavadinimas: project.title,
            data_objektas: project.location,
            Terminas: project.deadline,
            konkurso_id: project.id
          }
        }));
        
        // Store recent projects separately
        setRecentProjects(convertedDocs);
        
        // If we have chat documents, merge them with recent projects
        if (hasDocumentsFromChat && propDocuments && propDocuments.length > 0) {
          updateDocumentsList(propDocuments);
        } else {
          // Otherwise just use recent projects
          setDocuments(convertedDocs);
        }
      } else {
        console.error("Invalid projects data format:", response.data);
        setRecentProjects([]);
        if (!hasDocumentsFromChat) {
          setDocuments([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch recent projects:', err);
      setRecentProjects([]);
      if (!hasDocumentsFromChat) {
        setDocuments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset to show all documents with chat documents on top
  const resetDocuments = () => {
    if (propDocuments && propDocuments.length > 0) {
      updateDocumentsList(propDocuments);
    } else {
      setDocuments(recentProjects);
      setHasDocumentsFromChat(false);
    }
    setSearchQuery('');
  };
  
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
  };
  
  const toggleDocument = (docId: string) => {
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };
  
  // Helper functions
  const getDocId = (doc: SourceDoc): string => {
    return doc.metadata.uuid || 
           doc.metadata.id || 
           doc.metadata.Dokumento_pavadinimas || 
           doc.metadata.dokumento_pavadinimas || 
           Math.random().toString(36).substring(2, 9);
  };

  const getDocName = (doc: SourceDoc): string => {
    return doc.metadata.Dokumento_pavadinimas || 
           doc.metadata.dokumento_pavadinimas || 
           "Dokumentas " + getDocId(doc).substring(0, 8);
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return original if invalid
      
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateStr;
    }
  };
  
  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    
    const docName = getDocName(doc).toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return docName.includes(query);
  });
  
  // Check if a document is from chat query (to potentially highlight it differently)
  const isFromChatQuery = (doc: SourceDoc): boolean => {
    if (!propDocuments || propDocuments.length === 0) return false;
    
    const docId = getDocId(doc);
    return propDocuments.some(chatDoc => getDocId(chatDoc) === docId);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header with filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-[#1A3A5E]">Aktualūs dokumentai</h2>
          
          {/* Show reset button when there are search results or filtered content */}
          {(searchQuery || (hasDocumentsFromChat && selectedCity)) && (
            <button
              onClick={resetDocuments}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Atstatyti
            </button>
          )}
        </div>
        
        {/* Search input */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ieškoti pagal pavadinimą..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* City filter dropdown - always show filter */}
        {cities.length > 0 && (
          <div className="relative">
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm appearance-none"
              aria-label="Filtruoti pagal miestą"
            >
              <option value="">Visi miestai</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <FaMapMarkerAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>
      
      {/* Documents list - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2D6A4F]"></div>
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <ul className="space-y-3">
            {filteredDocuments.map((doc, index) => {
              const docId = getDocId(doc);
              const isExpanded = expandedDocs[docId];
              const docName = getDocName(doc);
              const isHighlighted = highlightedDocId === docId;
              const isChatResult = isFromChatQuery(doc);
              
              // Extract project deadline information
              const projectDeadline = doc.metadata.Pateikti_projekta_iki || 
                                     doc.metadata.pateikti_projekta_iki || 
                                     doc.metadata.Terminas || 
                                     doc.metadata.terminas;
              
              const formattedProjectDeadline = projectDeadline ? formatDate(projectDeadline) : null;
              
              // Extract proposal submission deadline - shown above document name
              const proposalDeadline = doc.metadata.Pasiulyma_pateikti_iki || 
                                      doc.metadata.pasiulyma_pateikti_iki;
              
              const formattedProposalDeadline = proposalDeadline ? formatDate(proposalDeadline) : null;
              
              return (
                <li 
                  key={docId || index} 
                  id={`doc-${docId}`}
                  className={`border rounded-lg overflow-hidden transition-all duration-200
                    ${isHighlighted ? 'border-[#2D6A4F] shadow-md ring-2 ring-[#2D6A4F]/20' : 
                      isChatResult ? 'border-blue-300 shadow-sm' : 'border-gray-200'}`}
                >
                  {/* Document header */}
                  <div 
                    className={`p-3 flex items-start cursor-pointer transition
                      ${isHighlighted ? 'bg-[#E6F3EC]' : 
                        isChatResult ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => onDocumentClick(doc)}
                  >
                    <FaFileAlt className={`mt-1 mr-2 flex-shrink-0 ${
                      isHighlighted ? 'text-[#1B4332]' : 
                      isChatResult ? 'text-blue-600' : 'text-[#2D6A4F]'}`} 
                    />
                    <div className="flex-grow">
                      {/* Proposal submission deadline - ABOVE document name */}
                      {formattedProposalDeadline && (
                        <div className="flex items-center mb-1 text-xs">
                          <FaCalendarAlt className="text-blue-500 mr-1 flex-shrink-0" />
                          <span className="text-blue-700 font-medium">Pasiūlymą pateikti iki: {formattedProposalDeadline}</span>
                        </div>
                      )}
                      
                      <p className={`font-medium text-sm ${
                        isHighlighted ? 'text-[#1B4332]' : 
                        isChatResult ? 'text-blue-800' : 'text-[#1A3A5E]'}`}
                      >
                        {docName}
                      </p>
                      
                      {doc.metadata.data_objektas && (
                        <p className="text-xs text-gray-500 mt-1">{doc.metadata.data_objektas}</p>
                      )}
                      
                      {/* Project submission deadline */}
                      {formattedProjectDeadline && (
                        <div className="flex items-center mt-1 text-xs">
                          <FaClock className="text-amber-500 mr-1 flex-shrink-0" />
                          <span className="text-amber-700">Terminas: {formattedProjectDeadline}</span>
                        </div>
                      )}
                      
                      {doc.metadata.konkurso_id && (
                        <p className="text-xs text-gray-500 mt-1">ID: {doc.metadata.konkurso_id}</p>
                      )}
                    </div>
                    {expandable && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDocument(docId);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                      </button>
                    )}
                  </div>
                  
                  {/* Green "Klauskite apie šį dokumentą" button */}
                  <div className="px-3 py-2 border-t border-gray-200 bg-white">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedDocId(docId);
                        if (onDocumentFocus) {
                          onDocumentFocus(docId);
                        }
                      }}
                      className={`w-full py-1.5 px-2 text-white text-sm rounded transition flex items-center justify-center
                        ${isHighlighted ? 'bg-[#1B4332] hover:bg-[#143026]' : 
                          'bg-[#2D6A4F] hover:bg-[#1B4332]'}`}
                    >
                      <span>Klauskite apie šį dokumentą</span>
                    </button>
                  </div>
                  
                  {/* Document content (when expanded) */}
                  {expandable && isExpanded && (
                    <div className="p-3 text-sm bg-white border-t border-gray-200">
                      <div className="max-h-32 overflow-y-auto">
                        <p className="text-gray-600 whitespace-pre-line">
                          {doc.page_content.substring(0, 300)}
                          {doc.page_content.length > 300 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Nėra dokumentų rodymui.</p>
        )}
      </div>
    </div>
  );
};

export default DocumentSidebar;