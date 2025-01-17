import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'API key is missing. Check your .env.local configuration.',
    });
  }

  const { page } = req.query;
  const pageNumber = page ? page.toString() : '1';

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${pageNumber}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch popular movies: ${response.statusText}`);
    }

    const data = await response.json();
    return res
      .status(200)
      .json({ movies: data.results, total_pages: data.total_pages });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return res.status(500).json({ error: 'Failed to fetch popular movies.' });
  }
}
