import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaChevronDown, FaChevronRight, FaCalendarAlt, FaSearch, FaMapMarkerAlt, FaFileContract, FaRegFileAlt } from 'react-icons/fa';

// Define interfaces
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
  Dokumento_pavadinimas?: string;
  dokumento_pavadinimas?: string;
  Projekto_pavadinimas?: string;
  projekto_pavadinimas?: string;
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
  // State
  const [recentProjects, setRecentProjects] = useState<SourceDoc[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(initialDocumentId || null);
  
  // API base URL from environment variable or default
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Initialize with test data and fetch real data
  useEffect(() => {
    // Set initial test data to ensure users see something immediately
    setRecentProjects(convertProjectsToSourceDocs(generateTestProjects()));
    
    // Then fetch actual data
    fetchRecentProjects();
  }, []);
  
  // Handle initial document ID for highlighting
  useEffect(() => {
    if (initialDocumentId) {
      setHighlightedDocId(initialDocumentId);
      setExpandedDocs(prev => ({ ...prev, [initialDocumentId]: true }));
      
      // Scroll to highlighted document
      setTimeout(() => {
        const docElement = document.getElementById(`doc-${initialDocumentId}`);
        if (docElement) docElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [initialDocumentId]);
  
  // Document focus handler
  const handleDocumentFocus = (doc: SourceDoc) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const docId = doc.metadata?.uuid || doc.metadata?.id;
    if (!docId) {
      console.error('Missing document ID');
      return;
    }
    
    // Highlight the document locally
    setHighlightedDocId(docId);
    
    // Call the parent handler to focus on this document
    if (onDocumentFocus) {
      onDocumentFocus(docId);
    }
  };
  
  // Generate test projects for immediate display
  const generateTestProjects = (): Project[] => {
    const cities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"];
    const titles = [
      "Renovacija - Daugiabučio modernizavimas",
      "Statyba - Administracinio pastato rekonstrukcija",
      "Renovacija - Mokyklos atnaujinimas",
      "Statyba - Sporto komplekso įrengimas",
      "Renovacija - Kultūros centro atnaujinimas"
    ];
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `test-${i + 1}`,
      title: titles[i % titles.length],
      deadline: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
      location: cities[i % cities.length],
      summary: `Testinis projektas #${i + 1}: Projekte numatyti energetinio efektyvumo didinimo darbai.`,
      // Add the key fields that match query document naming patterns
      Dokumento_pavadinimas: `${cities[i % cities.length]} - ${titles[i % titles.length]}`,
      Projekto_pavadinimas: titles[i % titles.length]
    }));
  };

  // Convert Project objects to SourceDoc format with consistent naming for both sources
  const convertProjectsToSourceDocs = (projects: Project[]): SourceDoc[] => {
    return projects.map(project => {
      // Create a uniform naming hierarchy for documents
      
      // 1. First choice: use explicit Dokumento_pavadinimas from API if available
      const dokPavadinimas = project.Dokumento_pavadinimas || project.dokumento_pavadinimas;
      
      // 2. Second choice: use Projekto_pavadinimas from API if available
      const projPavadinimas = project.Projekto_pavadinimas || project.projekto_pavadinimas;
      
      // 3. Third choice: combine location and title for a more descriptive name
      const combinedTitle = project.location ? 
        `${project.location} - ${project.title}` : 
        project.title;
      
      // Use the best available title based on priority
      const bestTitle = dokPavadinimas || projPavadinimas || combinedTitle;
      
      // Format to match query result documents: "Kvietimas: Title"
      // And standardize the document type prefix
      const formattedTitle = bestTitle.startsWith('Kvietimas') ? 
        bestTitle : 
        `Kvietimas pateikti pasiūlymą: ${bestTitle}`;
      
      return {
        page_content: project.summary || "",
        metadata: {
          // Essential IDs
          uuid: project.id,
          id: project.id,
          
          // STANDARDIZED NAMING: Primary document title fields
          // These are the fields checked by query results (prioritize the same as backend)
          Dokumento_pavadinimas: formattedTitle,
          dokumento_pavadinimas: formattedTitle,
          
          // Project specific fields
          Projekto_pavadinimas: project.title,
          projekto_pavadinimas: project.title,
          
          // Other name fields for compatibility
          file_name: formattedTitle,
          pavadinimas: formattedTitle,
          title: formattedTitle,
          name: formattedTitle,
          
          // Location fields
          Miestas: project.location?.split(',').pop()?.trim() || '',
          miestas: project.location?.split(',').pop()?.trim() || '',
          Vieta: project.location || '',
          vieta: project.location || '',
          Gatvė: project.location?.includes(',') ? 
            project.location.split(',').slice(0, -1).join(',').trim() : '',
          gatvė: project.location?.includes(',') ? 
            project.location.split(',').slice(0, -1).join(',').trim() : '',
          data_objektas: project.location,
          
          // Deadline fields - unified naming
          Pasiulyma_pateikti_iki: project.deadline,
          pasiulyma_pateikti_iki: project.deadline,
          Pateikti_projekta_iki: project.deadline,
          pateikti_iki: project.deadline,
          Terminas: project.deadline,
          terminas: project.deadline,
          deadline: project.deadline,
          
          // Type fields
          Dokumento_tipas: "Kvietimas",
          dokumento_tipas: "Kvietimas",
          konkurso_id: project.id,
          
          // File type info for icon display
          file_type: "pdf",
          
          // Source tracking
          _source: "recent_projects"
        }
      };
    });
  };
  
  // Fetch recent projects from API
  const fetchRecentProjects = async () => {
    try {
      setIsLoading(true);
      
      // Direct API call to backend
      const response = await axios.get<ProjectsResponse>(`${API_URL}/api/recent-projects`);
      
      if (response.data?.projects?.length) {
        // Process projects to ensure they have consistent naming with query results
        const processedProjects = response.data.projects.map(project => {
          // Check if we need to enhance the title with location
          const shouldIncludeLocation = 
            !project.Dokumento_pavadinimas && 
            !project.dokumento_pavadinimas && 
            project.location && 
            !project.title.includes(project.location);
          
          // Add a properly formatted document title if one doesn't exist
          if (shouldIncludeLocation) {
            return {
              ...project,
              Dokumento_pavadinimas: `${project.location} - ${project.title}`
            };
          }
          return project;
        });
        
        // Convert projects to source docs format and store
        const convertedDocs = convertProjectsToSourceDocs(processedProjects);
        setRecentProjects(convertedDocs);
      }
    } catch (err) {
      console.error('Failed to fetch recent projects:', err);
      // Keep test data as fallback
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle document expansion
  const toggleDocument = (docId: string) => {
    setExpandedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };
  
  // Helper functions for document information
  const getDocId = (doc: SourceDoc): string => {
    return doc.metadata?.uuid || doc.metadata?.id || `doc-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Get document name with prioritization - now consistent between sources
  const getDetailedDocName = (doc: SourceDoc): string => {
    // First priority: Use explicit document title fields (same as backend)
    if (doc.metadata?.Dokumento_pavadinimas) {
      return doc.metadata.Dokumento_pavadinimas;
    }
    
    if (doc.metadata?.dokumento_pavadinimas) {
      return doc.metadata.dokumento_pavadinimas;
    }
    
    // Second priority: Use project title fields
    if (doc.metadata?.Projekto_pavadinimas) {
      return doc.metadata.Projekto_pavadinimas;
    }
    
    if (doc.metadata?.projekto_pavadinimas) {
      return doc.metadata.projekto_pavadinimas;
    }
    
    // Third priority: Check file name fields
    if (doc.metadata?.Dokumento_failas) {
      return doc.metadata.Dokumento_failas;
    }
    
    if (doc.metadata?.file_name) {
      return doc.metadata.file_name;
    }
    
    // Fourth priority: Check other title fields
    if (doc.metadata?.pavadinimas) {
      return doc.metadata.pavadinimas;
    }
    
    if (doc.metadata?.title) {
      return doc.metadata.title;
    }
    
    if (doc.metadata?.name) {
      return doc.metadata.name;
    }
    
    // Last resort: Try to build from location data
    if (doc.metadata?.data_objektas) {
      return `Kvietimas pateikti pasiūlymą adresu ${doc.metadata.data_objektas}`;
    }
    
    // Default fallback
    return "Nežinomas dokumentas";
  };
  
  // Extract main title without document type prefix for better display
  const getCleanTitle = (docName: string): string => {
    // Remove common prefixes
    const prefixesToRemove = [
      'Kvietimas pateikti pasiūlymą:', 
      'Kvietimas teikti pasiūlymą:', 
      'Kvietimas:',
      'Dokumentas:'
    ];
    
    let cleanTitle = docName;
    
    for (const prefix of prefixesToRemove) {
      if (cleanTitle.startsWith(prefix)) {
        cleanTitle = cleanTitle.substring(prefix.length).trim();
        break;
      }
    }
    
    return cleanTitle;
  };

  // Get document type
  const getDocumentType = (doc: SourceDoc): string => {
    return doc.metadata?.Dokumento_tipas || 
           doc.metadata?.dokumento_tipas || 
           "Kvietimas";
  };

  // Get document city
  const getCity = (doc: SourceDoc): string | null => {
    return doc.metadata?.Miestas || 
           doc.metadata?.miestas || 
           doc.metadata?.Vieta || 
           doc.metadata?.vieta || 
           null;
  };

  // Get document street
  const getStreet = (doc: SourceDoc): string | null => {
    return doc.metadata?.Gatvė || 
           doc.metadata?.gatvė || 
           null;
  };

  // Get document subject
  const getSubject = (doc: SourceDoc): string | null => {
    return doc.metadata?.Kreipiamasi_dėl || 
           doc.metadata?.kreipiamasi_dėl || 
           null;
  };
  
  // Get document file type for icon display
  const getFileType = (doc: SourceDoc): string => {
    return doc.metadata?.file_type || 'pdf';
  };
  
  // Format date for display
  const formatDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    
    try {
      // Return as-is if already formatted in Lithuanian style
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
  
  // Determine which documents to show - props or recently fetched
  const documentsToShow = propDocuments?.length > 0 ? propDocuments : recentProjects;
  
  // Filter documents based on search query
  const filteredDocuments = documentsToShow.filter(doc => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const docName = getDetailedDocName(doc).toLowerCase();
    const city = getCity(doc)?.toLowerCase() || '';
    const subject = getSubject(doc)?.toLowerCase() || '';
    
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
        ) : filteredDocuments?.length > 0 ? (
          <ul className="space-y-3">
            {filteredDocuments.map((doc, index) => {
              // Get document properties
              const docId = getDocId(doc);
              const isExpanded = expandedDocs[docId] || false;
              const fullDocName = getDetailedDocName(doc);
              const isHighlighted = highlightedDocId === docId;
              
              // Clean the title for display 
              const docName = getCleanTitle(fullDocName);
              
              // Get file type
              const fileType = getFileType(doc);
              
              // Get document metadata
              const proposalDeadline = doc.metadata?.Pasiulyma_pateikti_iki || 
                                      doc.metadata?.pasiulyma_pateikti_iki || 
                                      doc.metadata?.Pateikti_projekta_iki || 
                                      doc.metadata?.pateikti_iki || 
                                      doc.metadata?.deadline;
              const formattedDeadline = formatDate(proposalDeadline);
              const city = getCity(doc);
              const street = getStreet(doc);
              const documentType = getDocumentType(doc);
              const subject = getSubject(doc);
              
              // Combine location information
              const location = [street, city].filter(Boolean).join(', ') || doc.metadata?.data_objektas;
              
              // Generate a document date string for display
              const dateString = formattedDeadline ? `Pasiūlymą pateikti iki: ${formattedDeadline}` : null;
              
              return (
                <li 
                  key={`${docId}-${index}`} 
                  id={`doc-${docId}`}
                  className="bg-white rounded-lg overflow-hidden border border-gray-200"
                >
                  {/* Document header - main clickable card */}
                  <div className="p-3">
                    {/* Document type badge */}
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 mr-2">
                        {fileType === 'pdf' ? (
                          <div className="bg-[#F87171]/10 p-1.5 rounded text-[#F87171]">
                            <FaRegFileAlt size={16} />
                          </div>
                        ) : (
                          <div className="bg-[#3B82F6]/10 p-1.5 rounded text-[#3B82F6]">
                            <FaFileAlt size={16} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        {/* Document type badge */}
                        <div className="text-xs text-[#4F46E5] font-medium">
                          {documentType || "Kvietimas"}
                        </div>

                        {/* Submission deadline */}
                        {dateString && (
                          <div className="text-xs text-gray-500">
                            {dateString}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Document title - main clickable item */}
                    <div 
                      onClick={() => onDocumentClick(doc)}
                      className="cursor-pointer"
                    >
                      <h3 className="font-medium text-sm text-[#1A3A5E] mb-1.5 leading-tight">
                        {docName}
                      </h3>
                      
                      {/* Location */}
                      {location && (
                        <div className="flex items-center mb-2 text-xs text-gray-500">
                          <FaMapMarkerAlt size={10} className="mr-1 text-[#2D6A4F]" />
                          <span>{location}</span>
                        </div>
                      )}
                      
                      {/* Document preview - limited to 2 lines */}
                      {doc.page_content && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {doc.page_content.substring(0, 120)}
                          {doc.page_content.length > 120 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    
                    {/* Ask about document button */}
                    <button
                      onClick={handleDocumentFocus(doc)}
                      className="w-full py-2 px-3 text-white text-sm rounded transition flex items-center justify-center bg-[#2D6A4F] hover:bg-[#1B4332]"
                    >
                      <span>Klauskite apie šį dokumentą</span>
                    </button>
                  </div>
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