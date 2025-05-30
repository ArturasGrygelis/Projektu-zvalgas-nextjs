import React, { useState } from 'react';
import { FaFileAlt, FaChevronDown, FaChevronRight, FaClock, FaCalendarAlt } from 'react-icons/fa';

interface SourceDoc {
  page_content: string;
  metadata: Record<string, any>;
}

interface DocumentSidebarProps {
  documents: SourceDoc[];
  onDocumentClick: (doc: SourceDoc) => void;
  onDocumentFocus?: (docId: string) => void; // Function to focus on a specific document
  expandable?: boolean;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  documents, 
  onDocumentClick,
  onDocumentFocus,
  expandable = false 
}) => {
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});

  const toggleDocument = (docId: string) => {
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  // Helper to get a unique ID for each document
  const getDocId = (doc: SourceDoc): string => {
    return doc.metadata.uuid || 
           doc.metadata.id || 
           doc.metadata.Dokumento_pavadinimas || 
           doc.metadata.dokumento_pavadinimas || 
           Math.random().toString(36).substring(2, 9);
  };

  // Helper to get document name
  const getDocName = (doc: SourceDoc): string => {
    return doc.metadata.Dokumento_pavadinimas || 
           doc.metadata.dokumento_pavadinimas || 
           "Dokumentas " + getDocId(doc).substring(0, 8);
  };
  
  // Format date for display
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

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-4">
        <h2 className="text-lg font-medium text-[#1A3A5E] mb-4">Aktualūs dokumentai</h2>
        {documents && documents.length > 0 ? (
          <ul className="space-y-3">
            {documents.map((doc, index) => {
              const docId = getDocId(doc);
              const isExpanded = expandedDocs[docId];
              const docName = getDocName(doc);
              
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
                <li key={docId || index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Document header */}
                  <div 
                    className="bg-gray-50 p-3 flex items-start cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => onDocumentClick(doc)}
                  >
                    <FaFileAlt className="text-[#2D6A4F] mt-1 mr-2 flex-shrink-0" />
                    <div className="flex-grow">
                      {/* Proposal submission deadline - ABOVE document name */}
                      {formattedProposalDeadline && (
                        <div className="flex items-center mb-1 text-xs">
                          <FaCalendarAlt className="text-blue-500 mr-1 flex-shrink-0" />
                          <span className="text-blue-700 font-medium">Pasiūlymą pateikti iki: {formattedProposalDeadline}</span>
                        </div>
                      )}
                      
                      <p className="font-medium text-[#1A3A5E] text-sm">{docName}</p>
                      
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
                        if (onDocumentFocus) {
                          onDocumentFocus(docId);
                        }
                      }}
                      className="w-full py-1.5 px-2 bg-[#2D6A4F] text-white text-sm rounded hover:bg-[#1B4332] transition flex items-center justify-center"
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