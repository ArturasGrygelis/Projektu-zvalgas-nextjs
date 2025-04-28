import React, { useState, useEffect } from 'react';
import axios from 'axios';

type Model = {
  id: string;
  name: string;
};

// Define the expected API response structure
interface ModelsApiResponse {
  models: Model[];
}

type ModelSelectorProps = {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
};

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelSelect 
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Specify the expected response type here
        const response = await axios.get<ModelsApiResponse>('/api/models');
        setModels(response.data.models); // Now TypeScript knows response.data has a 'models' property
      } catch (error) {
        console.error('Error fetching models:', error);
        // Fallback to default models
        setModels([
          { id: 'default', name: 'Default Assistant' },
          { id: 'advanced', name: 'Advanced Assistant' }
        ]);
      }
    };

    fetchModels();
  }, []);

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-100 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
      >
        <span>Model: {models.find(m => m.id === selectedModel)?.name || selectedModel}</span>
        <svg 
          className="h-4 w-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left
                  ${selectedModel === model.id ? 'bg-gray-100' : ''}
                `}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;