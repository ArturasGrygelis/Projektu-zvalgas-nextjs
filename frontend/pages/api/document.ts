import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define our own error interface for older Axios versions
interface ErrorWithResponse {
  response?: {
    status?: number;
    data?: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, document_id, model_name, conversation_id } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (!document_id) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    // Get backend URL from environment variable or use default
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';
    
    // Call the document_query endpoint in the backend - UPDATED with /api prefix
    const response = await axios.post(`${backendUrl}/api/document_query`, {
      message,
      document_id,
      model_name,
      conversation_id
    }, {
      timeout: 120000, // 2-minute timeout for longer queries
    });

    // Return the response directly
    return res.status(200).json(response.data);
    
  } catch (error: any) {
    console.error('Error in document query API route:', error);
    
    // Handle errors with response property (likely Axios errors)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as ErrorWithResponse;
      const status = axiosError.response?.status || 500;
      const detail = axiosError.response?.data?.detail || 'Error processing document query';
      
      return res.status(status).json({
        message: detail,
        error: axiosError.response?.data
      });
    }

    // Handle generic errors
    return res.status(500).json({
      message: 'Failed to get response from backend service',
      error: String(error)
    });
  }
}