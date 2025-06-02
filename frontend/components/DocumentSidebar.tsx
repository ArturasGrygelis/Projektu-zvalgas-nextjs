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
  
  // API base URL from environment variable or default
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Load test projects immediately on component mount
  useEffect(() => {
    // Set some initial test data to ensure something is displayed
    const testProjects = generateTestProjects();
    setRecentProjects(convertProjectsToSourceDocs(testProjects));
    
    // Then try to fetch actual data
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
  
  // UNIFIED CLICK HANDLER - Use this for ALL document types
  const handleDocumentFocus = (doc: SourceDoc) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const docId = doc.metadata?.uuid;
    console.log('UNIFIED HANDLER: Document focus with UUID:', docId);
    
    // Highlight the document
    setHighlightedDocId(docId);
    
    // Call the workflow with the document UUID
    if (onDocumentFocus && docId) {
      onDocumentFocus(docId);
      console.log('✅ Called onDocumentFocus with UUID:', docId);
    } else {
      console.error('❌ Missing UUID or handler', {
        hasDocId: !!docId,
        hasHandler: !!onDocumentFocus
      });
    }
  };
  
  // Generate test projects for immediate display - same as RecentProjects.tsx
  const generateTestProjects = (cityFilter: string = ""): Project[] => {
    const allCities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"];
    const titles = [
      "Renovacija - Daugiabučio modernizavimas",
      "Statyba - Administracinio pastato rekonstrukcija",
      "Renovacija - Mokyklos atnaujinimas",
      "Statyba - Sporto komplekso įrengimas",
      "Renovacija - Kultūros centro atnaujinimas"
    ];
    
    const projects = [];
    
    for (let i = 0; i < 5; i++) {
      const location = allCities[i % allCities.length];
      
      // Skip if filtering by city and doesn't match
      if (cityFilter && location !== cityFilter) {
        continue;
      }
      
      projects.push({
        id: `test-${i + 1}`,
        title: titles[i % titles.length],
        deadline: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        location,
        summary: `Testinis projektas #${i + 1}: Projekte numatyti energetinio efektyvumo didinimo darbai.`
      });
    }
    
    return projects;
  };

  // Convert Project objects to SourceDoc format
  const convertProjectsToSourceDocs = (projects: Project[]): SourceDoc[] => {
    return projects.map(project => {
      // Try to extract a proper document title from the summary/content
      const extractedTitle = extractTitleFromContent(project.summary || '');
      
      // Use extracted title if available, otherwise fall back to API title
      const documentTitle = extractedTitle || project.title;
      
      return {
        page_content: project.summary || "",
        metadata: {
          // UUID for workflow - MUST BE THE VECTORSTORE UUID
          uuid: project.id,
          id: project.id,
          
          // Use the determined document title (extracted from content or API title)
          Dokumento_pavadinimas: documentTitle,
          dokumento_pavadinimas: documentTitle,
          
          // Keep project-specific fields with original API title
          Projekto_pavadinimas: project.title,
          projekto_pavadinimas: project.title,
          
          // Additional title fields for compatibility
          file_name: documentTitle,
          pavadinimas: documentTitle,
          title: documentTitle,
          name: documentTitle,
          
          // Location fields in all variations
          Miestas: project.location?.split(',').pop()?.trim() || '',
          miestas: project.location?.split(',').pop()?.trim() || '',
          Vieta: project.location || '',
          vieta: project.location || '',
          
          // Try to extract street from location if it has commas
          Gatvė: project.location?.includes(',') ? 
            project.location.split(',').slice(0, -1).join(',').trim() : '',
          gatvė: project.location?.includes(',') ? 
            project.location.split(',').slice(0, -1).join(',').trim() : '',
          
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
          konkurso_id: project.id,
          _source: "recent_projects"
        }
      };
    });
  };

  // Helper function to extract document title from page content as fallback
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
  
  // Function to fetch recent projects with consistent naming - similar to RecentProjects.tsx
  const fetchRecentProjects = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching projects for DocumentSidebar from ${API_URL}/api/recent-projects`);
      
      // Use the API_URL for direct communication with backend
      const response = await axios.get<ProjectsResponse>(`${API_URL}/api/recent-projects`);
      
      if (response.data && Array.isArray(response.data.projects)) {
        console.log('📊 Raw project data from API:', response.data.projects);
        // Convert the projects to SourceDoc format
        const convertedDocs = convertProjectsToSourceDocs(response.data.projects);
        console.log('📊 Total loaded recent projects:', convertedDocs.length);
        setRecentProjects(convertedDocs);
      }
    } catch (err) {
      console.error('❌ Failed to fetch recent projects:', err);
      // Keep the test data that was already set
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleDocument = (docId: string) => {
    setExpandedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };
  
  // Helper functions for document information
  const getDocId = (doc: SourceDoc): string => {
    return doc.metadata?.uuid || doc.metadata?.id || `doc-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Improved name extraction with consistent priority order
  const getDetailedDocName = (doc: SourceDoc): string => {
    // Priority 1: Use the document title fields (same as query results)
    if (doc.metadata?.Dokumento_pavadinimas) {
      return doc.metadata.Dokumento_pavadinimas;
    }
    
    if (doc.metadata?.dokumento_pavadinimas) {
      return doc.metadata.dokumento_pavadinimas;
    }
    
    // Priority 2: Try to extract from page content as fallback
    if (doc.page_content) {
      const extractedTitle = extractTitleFromContent(doc.page_content);
      if (extractedTitle) {
        return extractedTitle;
      }
    }
    
    // Priority 3: Use document file fields
    if (doc.metadata?.Dokumento_failas) {
      return doc.metadata.Dokumento_failas;
    }
    
    if (doc.metadata?.file_name) {
      return doc.metadata.file_name;
    }
    
    // Priority 4: Fall back to project/other name fields
    const fallbackName = doc.metadata?.Projekto_pavadinimas ||
                         doc.metadata?.projekto_pavadinimas ||
                         doc.metadata?.pavadinimas ||
                         doc.metadata?.title ||
                         doc.metadata?.name;
    
    if (fallbackName) {
      return fallbackName;
    }
    
    // Priority 5: Construct from location if available
    if (doc.metadata?.data_objektas) {
      return `Kvietimas pateikti pasiūlymą adresu ${doc.metadata.data_objektas}`;
    }
    
    // Last resort
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
  
  console.log('📋 Documents to show:', documentsToShow.length);
  console.log('📋 PropDocuments length:', propDocuments?.length || 0);
  console.log('📋 RecentProjects length:', recentProjects.length);
  
  // Filter documents based on search query
  const filteredDocuments = documentsToShow.filter(doc => {
    if (!searchQuery.trim()) return true;
    
    const docName = getDetailedDocName(doc).toLowerCase();
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
              const docName = getDetailedDocName(doc);
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
                      
                      {/* Document title - now consistent between recent and related documents */}
                      <p className={`font-medium text-sm ${isHighlighted ? 'text-[#1B4332]' : 'text-[#1A3A5E]'} break-words whitespace-normal leading-tight`}>
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
                  
                  {/* SINGLE BUTTON HANDLER for all document types */}
                  <div className="px-3 py-2 border-t border-gray-200 bg-white">
                    <button
                      onClick={handleDocumentFocus(doc)}
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