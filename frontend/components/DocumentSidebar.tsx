import React from 'react';

interface SourceDoc {
  page_content: string;
  metadata: Record<string, any>;
}

type DocumentSidebarProps = {
  documents: SourceDoc[];
  onDocumentClick?: (doc: SourceDoc) => void;
};

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ documents, onDocumentClick }) => {
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

  return (
    <div className="w-full md:w-72 bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-180px)]">
      <h2 className="text-lg font-semibold text-[#1a365d] mb-4">Dokumentai</h2>
      
      {documents.length === 0 ? (
        <p className="text-gray-500 text-sm">Nėra dokumentų</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc, index) => (
            <li 
              key={index}
              className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => onDocumentClick?.(doc)}
            >
              <h3 className="font-medium text-[#1a365d] line-clamp-2">
                {getDocumentName(doc.metadata)}
              </h3>
              
              {doc.metadata.Pasiulyma_pateikti_iki && (
                <div className="mt-1 text-xs text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Galioja iki: {formatDate(doc.metadata.Pasiulyma_pateikti_iki)}
                </div>
              )}
              
              <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                {doc.page_content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentSidebar;