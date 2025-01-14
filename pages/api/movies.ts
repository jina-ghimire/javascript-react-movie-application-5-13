import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, page } = req.query;

  console.log('API request received:', { query, page });

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
    console.error('Error: Missing TMDb API key in environment variables');
    return res
      .status(500)
      .json({ error: 'API key missing. Check your .env.local file.' });
  }

  try {
    let tmdbUrl = '';

    if (!query || typeof query !== 'string' || query.trim() === '') {
      // Fetch popular movies if query is empty
      console.log('Empty query received. Fetching popular movies.');
      tmdbUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`;
    } else {
      // Fetch movies based on the search query
      tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`;
    }

    console.log('Fetching data from TMDb API:', tmdbUrl);

    const response = await fetch(tmdbUrl);

    console.log('TMDb API response status:', response.status);

    if (!response.ok) {
      throw new Error(`TMDb API returned an error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('TMDb API response data:', data);

    res
      .status(200)
      .json({ movies: data.results, total_pages: data.total_pages });
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: 'Failed to fetch movies from TMDb.' });
  }
}
