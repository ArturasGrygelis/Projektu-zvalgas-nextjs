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
    const { message, model_name } = req.body;
    
    // Call your backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/chat`,
      { message, model_name }
    );
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling chat API:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
}