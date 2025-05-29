import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, model_name, conversation_id } = req.body;
    
    // Always use localhost for internal container communication
    const response = await axios.post(
      'http://localhost:8000/api/chat',
      { message, model_name, conversation_id },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling chat API:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: errorMessage
    });
  }
}