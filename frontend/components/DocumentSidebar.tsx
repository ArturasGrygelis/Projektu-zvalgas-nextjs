import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaChevronDown, FaChevronRight, FaCalendarAlt, FaSearch, FaMapMarkerAlt, FaFileContract } from 'react-icons/fa';

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

interface Project {
  id: string;
  title: string;
  deadline: string;
  location: string;
  summary: string;
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
  const [recentProjects, setRecentProjects] = useState<SourceDoc[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(initialDocumentId || null);
  
  // Fetch recent projects on mount
  useEffect(() => {
    fetchRecentProjects();
  }, []);
  
  // Handle initial document ID
  useEffect(() => {
    if (initialDocumentId) {
      setHighlightedDocId(initialDocumentId);
      setExpandedDocs(prev => ({ ...prev, [initialDocumentId]: true }));
      setTimeout(() => {
        const docElement = document.getElementById(`doc-${initialDocumentId}`);
        if (docElement) docElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [initialDocumentId]);
  
  // Function to fetch recent projects with extensive debugging
  const fetchRecentProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<ProjectsResponse>('/api/recent-projects');
      
      console.log('DEBUG - Raw response from /api/recent-projects:', response.data);
      
      if (response.data && Array.isArray(response.data.projects)) {
        // Extract project file name from the title if possible
        const extractDocumentName = (project: Project): string => {
          // Better document name extraction
          if (project.title && project.title.includes("Kvietimas")) {
            return project.title;
          }
          
          // If it already includes .pdf, it's likely a filename
          if (project.title && project.title.includes('.pdf')) {
            return project.title;
          }
          
          // Create a descriptive name based on location
          if (project.location) {
            return `Kvietimas pateikti pasiūlymą (${project.location})`;
          }
          
          return project.title || "Nežinomas dokumentas";
        };
        
        // Convert projects to match EXACTLY the format of query results
        const convertedDocs: SourceDoc[] = response.data.projects.map(project => {
          // Extract a better document name
          const documentName = extractDocumentName(project);
          
          return {
            page_content: project.summary || "",
            metadata: {
              // UUID for workflow - MUST BE THE VECTORSTORE UUID
              uuid: project.id,
              
              // THESE FIELD NAMES MUST MATCH QUERY RESULTS!
              Dokumento_pavadinimas: documentName,
              dokumento_pavadinimas: documentName,
              Projekto_pavadinimas: documentName,
              projekto_pavadinimas: documentName,
              pavadinimas: documentName,
              title: documentName,
              name: documentName,
              
              // Location fields in all variations
              Miestas: project.location?.split(',')[0]?.trim() || '',
              miestas: project.location?.split(',')[0]?.trim() || '',
              Vieta: project.location || '',
              vieta: project.location || '',
              
              // Address fields
              Gatvė: project.location?.includes(',') ? project.location.split(',')[1]?.trim() : '',
              gatvė: project.location?.includes(',') ? project.location.split(',')[1]?.trim() : '',
              
              // Deadline fields in all variations
              Pasiulyma_pateikti_iki: project.deadline,
              pasiulyma_pateikti_iki: project.deadline,
              Pateikti_projekta_iki: project.deadline,
              pateikti_iki: project.deadline,
              Terminas: project.deadline,
              terminas: project.deadline,
              deadline: project.deadline,
              
              // Other needed fields
              data_objektas: project.location,
              Dokumento_tipas: "Kvietimas",
              dokumento_tipas: "Kvietimas",
              konkurso_id: project.id
            }
          };
        });
        
        console.log('DEBUG - Converted docs with proper titles:', 
          convertedDocs.map(d => ({title: d.metadata.Dokumento_pavadinimas, uuid: d.metadata.uuid}))
        );
        
        setRecentProjects(convertedDocs);
      }
    } catch (err) {
      console.error('Failed to fetch recent projects:', err);
      setRecentProjects([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleDocument = (docId: string) => {
    setExpandedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };
  
  // Helper functions - IMPROVED to handle more field variations
  const getDocId = (doc: SourceDoc): string => {
    return doc.metadata?.uuid || doc.metadata?.id || `doc-${Math.random().toString(36).substring(2, 9)}`;
  };

  const getDocName = (doc: SourceDoc): string => {
    // Try ALL possible field variations that might contain document name
    const name = doc.metadata?.Dokumento_pavadinimas || 
                 doc.metadata?.dokumento_pavadinimas || 
                 doc.metadata?.Projekto_pavadinimas ||
                 doc.metadata?.projekto_pavadinimas ||
                 doc.metadata?.pavadinimas ||
                 doc.metadata?.title ||
                 doc.metadata?.name;
                 
    if (name && typeof name === 'string' && name.trim() !== '') {
      return name;
    }
    
    // Try to build a name from location if available
    if (doc.metadata?.data_objektas || doc.metadata?.Miestas || doc.metadata?.miestas) {
      const location = doc.metadata?.data_objektas || 
                       `${doc.metadata?.Miestas || doc.metadata?.miestas || ''}`;
      if (location) {
        return `Kvietimas pateikti pasiūlymą (${location})`;
      }
    }
    
    return "Nežinomas dokumentas";
  };

  const getDocumentType = (doc: SourceDoc): string | null => {
    return doc.metadata?.Dokumento_tipas || 
           doc.metadata?.dokumento_tipas || 
           "Kvietimas";
  };

  const getCity = (doc: SourceDoc): string | null => {
    return doc.metadata?.Miestas || 
           doc.metadata?.miestas || 
           doc.metadata?.Vieta || 
           doc.metadata?.vieta || 
           null;
  };

  const getStreet = (doc: SourceDoc): string | null => {
    return doc.metadata?.Gatvė || 
           doc.metadata?.gatvė || 
           null;
  };

  const getSubject = (doc: SourceDoc): string | null => {
    return doc.metadata?.Kreipiamasi_dėl || 
           doc.metadata?.kreipiamasi_dėl || 
           null;
  };
  
  const formatDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    
    try {
      if (dateStr.includes('d.') && dateStr.includes('val.')) {
        return dateStr;
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateStr;
    }
  };
  
  // Use propDocuments if available (from query), otherwise use recent projects
  const documentsToShow = propDocuments && propDocuments.length > 0 ? propDocuments : recentProjects;
  
  // Filter documents based on search query
  const filteredDocuments = documentsToShow.filter(doc => {
    if (!searchQuery.trim()) return true;
    
    const docName = getDocName(doc).toLowerCase();
    const city = getCity(doc)?.toLowerCase() || '';
    const subject = getSubject(doc)?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return docName.includes(query) || city.includes(query) || subject.includes(query);
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-[#1A3A5E]">Aktualūs dokumentai</h2>
        </div>
        
        {/* Search input */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ieškoti pagal pavadinimą, miestą ar temą..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
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
              
              // Extract information using the exact metadata field names
              const proposalDeadline = doc.metadata?.Pasiulyma_pateikti_iki || 
                                      doc.metadata?.pasiulyma_pateikti_iki || 
                                      doc.metadata?.Pateikti_projekta_iki || 
                                      doc.metadata?.pateikti_iki || 
                                      doc.metadata?.deadline;
              const formattedProposalDeadline = proposalDeadline ? formatDate(proposalDeadline) : null;
              
              const city = getCity(doc);
              const street = getStreet(doc);
              const documentType = getDocumentType(doc);
              const subject = getSubject(doc);
              
              // Combine location information
              const location = [street, city].filter(Boolean).join(', ') || doc.metadata?.data_objektas;
              
              return (
                <li 
                  key={`${docId}-${index}`} 
                  id={`doc-${docId}`}
                  className={`border rounded-lg overflow-hidden transition-all duration-200
                    ${isHighlighted ? 'border-[#2D6A4F] shadow-md ring-2 ring-[#2D6A4F]/20' : 'border-gray-200'}`}
                >
                  {/* Document header */}
                  <div 
                    className={`p-3 flex items-start cursor-pointer transition
                      ${isHighlighted ? 'bg-[#E6F3EC]' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => onDocumentClick(doc)}
                  >
                    <FaFileAlt className={`mt-1 mr-2 flex-shrink-0 ${isHighlighted ? 'text-[#1B4332]' : 'text-[#2D6A4F]'}`} />
                    <div className="flex-grow">
                      {/* Document type */}
                      {documentType && (
                        <div className="flex items-center mb-1 text-xs">
                          <FaFileContract className="text-purple-500 mr-1 flex-shrink-0" />
                          <span className="text-purple-700 font-medium">{documentType}</span>
                        </div>
                      )}
                      
                      {/* Proposal submission deadline */}
                      {formattedProposalDeadline && (
                        <div className="flex items-center mb-1 text-xs">
                          <FaCalendarAlt className="text-blue-500 mr-1 flex-shrink-0" />
                          <span className="text-blue-700 font-medium">Pasiūlymą pateikti iki: {formattedProposalDeadline}</span>
                        </div>
                      )}
                      
                      {/* Document title - FIXED to show proper names */}
                      <p className={`font-medium text-sm ${isHighlighted ? 'text-[#1B4332]' : 'text-[#1A3A5E]'}`}>
                        {docName}
                      </p>
                      
                      {/* Location information */}
                      {location && (
                        <div className="flex items-center mt-1 text-xs">
                          <FaMapMarkerAlt className="text-green-500 mr-1 flex-shrink-0" />
                          <span className="text-gray-600">{location}</span>
                        </div>
                      )}
                      
                      {/* Subject */}
                      {subject && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {subject}
                        </p>
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
                  
                  {/* Document action button - FIXED to ensure proper UUID is passed */}
                  <div className="px-3 py-2 border-t border-gray-200 bg-white">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        console.log('DEBUG - Button click:', {
                          docName,
                          uuid: doc.metadata?.uuid,
                          hasCallback: !!onDocumentFocus
                        });
                        
                        setHighlightedDocId(docId);
                        
                        // The key fix: Make sure we pass the vectorstore UUID to create_direct_document_workflow
                        if (onDocumentFocus && doc.metadata?.uuid) {
                          console.log('Calling onDocumentFocus with UUID:', doc.metadata.uuid);
                          onDocumentFocus(doc.metadata.uuid);
                        } else {
                          console.error('Missing UUID or onDocumentFocus!', {
                            hasUUID: !!doc.metadata?.uuid,
                            hasCallback: !!onDocumentFocus,
                            metadata: doc.metadata
                          });
                        }
                      }}
                      className={`w-full py-1.5 px-2 text-white text-sm rounded transition flex items-center justify-center
                        ${isHighlighted ? 'bg-[#1B4332] hover:bg-[#143026]' : 'bg-[#2D6A4F] hover:bg-[#1B4332]'}`}
                    >
                      <span>Klauskite apie šį dokumentą</span>
                    </button>
                  </div>
                  
                  {/* Document content (when expanded) */}
                  {expandable && isExpanded && (
                    <div className="p-3 text-sm bg-white border-t border-gray-200">
                      <div className="max-h-32 overflow-y-auto">
                        <p className="text-gray-600 whitespace-pre-line">
                          {doc.page_content ? doc.page_content.substring(0, 300) : 'Turinys neprieinamas'}
                          {doc.page_content && doc.page_content.length > 300 ? '...' : ''}
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