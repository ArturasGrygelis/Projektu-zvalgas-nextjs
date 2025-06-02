import React, { useState, useEffect } from 'react';

// Define SourceDoc type (should match chat.tsx)
type SourceDoc = {
  page_content: string;
  metadata: Record<string, any>;
};

// Update the Message type definition
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  sources?: SourceDoc[];
};

// ChatBox props
type ChatBoxProps = {
  messages: Message[];
};

const ChatBox: React.FC<ChatBoxProps> = ({ messages }) => {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <MessageItem message={message} />
        </div>
      ))}
    </div>
  );
};

// MessageItem component
const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceDoc | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mount

  // Set isClient to true only after mounting on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to get a display name for the source
  const getSourceName = (metadata: Record<string, any>, index: number): string => {
    return metadata.Dokumento_pavadinimas || 
           metadata.dokumento_pavadinimas || 
           metadata.title || 
           metadata.source || 
           metadata.file_path || 
           `Šaltinis ${index + 1}`;
  };

  return (
    <div className={`p-3 rounded-lg max-w-xl ${
      message.role === 'user'
        ? 'bg-[#E6EFF6] text-gray-800 border border-[#C9D8E5]' // Soft blue background with dark text
        : message.role === 'assistant'
        ? 'bg-[#F0F9F2] text-gray-800 border border-[#D1EDDA]' // Soft green background with dark text
        : 'bg-[#FFF3E0] text-[#664D03] text-center italic border border-[#FFECB5]' // System message style
    }`}>
      <div className="message-content whitespace-pre-wrap">{message.content}</div>

      {/* Only render timestamp on the client after hydration */}
      {isClient && message.timestamp && (
        <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-gray-500' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* Conditionally render Sources button in Lithuanian */}
      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-[#2D6A4F] hover:text-[#1B4332] hover:underline focus:outline-none font-medium"
          >
            {showSources ? 'Slėpti šaltinius' : `Rodyti šaltinius (${message.sources.length})`}
          </button>

          {/* Conditionally render the list of sources */}
          {showSources && (
            <ul className="mt-1 list-disc list-inside text-xs text-gray-600">
              {message.sources.map((source, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedSource(source)}
                    className="text-[#2D6A4F] hover:text-[#1B4332] hover:underline focus:outline-none text-left"
                    title={JSON.stringify(source.metadata)}
                  >
                    {getSourceName(source.metadata, index)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal for displaying selected source content */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 text-[#1A3A5E]">
              Šaltinis: {getSourceName(selectedSource.metadata, message.sources?.findIndex(s => s === selectedSource) ?? 0)}
            </h3>
            <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
              {selectedSource.page_content}
            </pre>
            <div className="mt-4 text-xs text-gray-500">
              Metadata: {JSON.stringify(selectedSource.metadata, null, 2)}
            </div>
            <button
              onClick={() => setSelectedSource(null)}
              className="mt-4 px-4 py-2 bg-[#F4A261] text-[#1A3A5E] font-medium rounded hover:bg-[#FFB703] transition"
            >
              Uždaryti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;