import React, { useState } from 'react';

interface SourceDoc {
  page_content: string;
  metadata: Record<string, any>;
}

type DocumentSidebarProps = {
  documents: SourceDoc[];
  onDocumentClick?: (doc: SourceDoc) => void;
  expandable?: boolean;
  infoText?: string;
};

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  documents, 
  onDocumentClick,
  expandable = false,
  infoText = "Jeigu duomenų apdirbimo etape, dokumente pateikimo datai trūksta dienos, jos vertė priskiriama kaip 28 d. Todėl pamačius pateikimo datą su 28 d., patariame pateikimo data patikrinti pilname dokumente, tai galima rasti punkte „Pasiūlymų vertinimo vieta, data, laikas“.",
}) => {
  // Track which documents are expanded
  const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});

  // Function to get document name from metadata
  const getDocumentName = (metadata: Record<string, any>): string => {
    return metadata.Dokumento_pavadinimas || 
           metadata.dokumento_pavadinimas || 
           metadata.title || 
           "Unnamed Document";
  };

  // Format date string in a more readable way
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    try {
      // Handle different date formats
      if (dateStr.includes(',')) {
        // Format like "2025-06-04, 10 val"
        return dateStr; // Already in readable format
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('lt-LT');
    } catch (e) {
      return dateStr;
    }
  };

  // Toggle document expansion
  const toggleExpand = (index: number) => {
    if (!expandable) return;
    setExpandedDocs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#1A3A5E]">Dokumentai</h2>
        
        {/* Eye-catching info notice */}
        <div className="mt-3 bg-[#FFB703] bg-opacity-15 p-3 rounded-md border border-[#FFB703] shadow-sm">
          <div className="flex items-start">
            <div className="bg-[#FFB703] rounded-full p-1 mr-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1A3A5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-[#1A3A5E] leading-tight font-medium">
              {infoText}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        {!documents || documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 text-sm mb-2">Nėra dokumentų</p>
            <p className="text-xs text-gray-400">Dokumentai bus rodomi kai pateiksite užklausą</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {documents.map((doc, index) => {
              const isExpanded = !!expandedDocs[index];
              return (
                <li 
                  key={index}
                  className="border border-gray-200 rounded-md overflow-hidden transition-all duration-200 hover:border-[#2D6A4F]"
                >
                  <div 
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => expandable ? toggleExpand(index) : onDocumentClick?.(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-[#1A3A5E] line-clamp-2">
                        {getDocumentName(doc.metadata)}
                      </h3>
                      {expandable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            toggleExpand(index);
                          }} 
                          className="ml-2 text-gray-400 hover:text-[#2D6A4F]"
                        >
                          {isExpanded ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {doc.metadata.Pasiulyma_pateikti_iki && (
                      <div className="mt-1 text-xs text-[#2D6A4F] flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Galioja iki: {formatDate(doc.metadata.Pasiulyma_pateikti_iki)}
                      </div>
                    )}
                    
                    {/* Preview text - always visible */}
                    <p className={`mt-2 text-xs text-gray-500 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {doc.page_content.substring(0, isExpanded ? 500 : 100)}{!isExpanded && doc.page_content.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  
                  {/* Expanded content - removed the button */}
                  {expandable && isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-100 max-h-[400px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans">
                          {doc.page_content}
                        </pre>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentSidebar;