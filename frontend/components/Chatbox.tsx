import React from 'react';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
};

type ChatBoxProps = {
  messages: Message[];
};

const ChatBox: React.FC<ChatBoxProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`
            flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}
          `}
        >
          <div 
            className={`
              max-w-[80%] rounded-lg px-4 py-2
              ${message.role === 'user' 
                ? 'bg-blue-100 text-blue-900' 
                : message.role === 'system' 
                ? 'bg-gray-100 text-gray-800 italic' 
                : 'bg-white border border-gray-200 text-gray-800'}
            `}
          >
            <div className="text-sm">{message.content}</div>
            {message.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatBox;