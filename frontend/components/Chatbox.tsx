import React, { useState, useEffect } from 'react'; // Import useEffect

// Define SourceDoc type (should match chat.tsx)
type SourceDoc = {
  page_content: string;
  metadata: Record<string, any>;
};

// Update the Message type definition HERE
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  sources?: SourceDoc[];
};

// Keep ChatBoxProps as is, it uses the updated Message type
type ChatBoxProps = {
  messages: Message[];
};

const ChatBox: React.FC<ChatBoxProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {/* Pass the message object which now correctly includes sources type */}
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

  // Function to get a display name for the source (customize as needed)
  const getSourceName = (metadata: Record<string, any>, index: number): string => {
    return metadata.title || metadata.source || metadata.file_path || `Source ${index + 1}`;
  };

  return (
    <div className={`p-3 rounded-lg max-w-xl ${
      message.role === 'user'
        ? 'bg-blue-500 text-white'
        : message.role === 'assistant'
        ? 'bg-gray-200 text-gray-800'
        : 'bg-yellow-100 text-yellow-800 text-center italic'
    }`}>
      <div className="message-content whitespace-pre-wrap">{message.content}</div>

      {/* --- MODIFICATION START --- */}
      {/* Only render timestamp on the client after hydration */}
      {isClient && message.timestamp && (
        <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      {/* --- MODIFICATION END --- */}

      {/* Conditionally render Sources button */}
      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-blue-600 hover:underline focus:outline-none"
          >
            {showSources ? 'Hide Sources' : `Show Sources (${message.sources.length})`}
          </button>

          {/* Conditionally render the list of sources */}
          {showSources && (
            <ul className="mt-1 list-disc list-inside text-xs text-gray-600">
              {message.sources.map((source, index) => ( // Added index here
                <li key={index}>
                  <button
                    onClick={() => setSelectedSource(source)}
                    className="text-blue-500 hover:text-blue-700 hover:underline focus:outline-none text-left"
                    title={JSON.stringify(source.metadata)} // Show full metadata on hover
                  >
                    {/* Pass index to getSourceName if needed */}
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
            <h3 className="text-lg font-semibold mb-2">
              {/* Pass index if needed */}
              Source: {getSourceName(selectedSource.metadata, message.sources?.findIndex(s => s === selectedSource) ?? 0)}
            </h3>
            <pre className="text-sm whitespace-pre-wrap bg-gray-100 p-3 rounded">
              {selectedSource.page_content}
            </pre>
            <div className="mt-4 text-xs text-gray-500">
              Metadata: {JSON.stringify(selectedSource.metadata, null, 2)}
            </div>
            <button
              onClick={() => setSelectedSource(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;