import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Get the API base URL from environment variable, default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract document_id from the request body
    const { document_id } = req.body;
    
    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required' });
    }
    
    // Call the backend API to create a direct document workflow
    const response = await axios.post(`${API_BASE_URL}/api/workflows/create_direct_document_workflow`, {
      document_id: document_id
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Forward the backend response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating direct document workflow:', error);
    
    // Fixed approach that doesn't require AxiosError type
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      const status = axiosError.response?.status || 500;
      const message = axiosError.response?.data?.detail || 
                     axiosError.message || 
                     'Unknown error';
      
      return res.status(status).json({
        error: `Backend error: ${message}`,
        details: axiosError.response?.data
      });
    }
    
    // Generic error handler
    return res.status(500).json({
      error: 'Failed to create document workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}