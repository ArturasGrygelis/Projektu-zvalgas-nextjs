import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city } = req.query;
    
    // Fetch recent projects from the backend
    const response = await axios.get(
      `http://localhost:8000/api/recent-projects${city ? `?city=${encodeURIComponent(String(city))}` : ''}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    // Pass the backend response directly to the frontend
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching recent projects:', error);
    
    // Return empty array as fallback to prevent build errors
    return res.status(500).json({ 
      error: 'An error occurred while fetching recent projects',
      projects: []
    });
  }
}