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

const ModelSelector: React.FC<ModelSelectorProps> = React.memo(({ 
  selectedModel, 
  onModelSelect 
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        console.log("Fetching models from:", `${apiUrl}/api/models`);
        
        const response = await axios.get<ModelsApiResponse>(`${apiUrl}/api/models`);
        console.log("Models response:", response.data);
        setModels(response.data.models);
      } catch (error) {
        console.error('Error fetching models:', error);
        // Fallback models with Maverick as first option
        setModels([
          { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'LLaMA-4 Maverick (17B)' },
          { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'LLaMA-4 Scout (17B)' }
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
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
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
});

export default ModelSelector;