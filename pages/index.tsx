import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { Input, Spin, Alert, Pagination } from 'antd';
import debounce from 'lodash/debounce';
import MovieCard from '../components/MovieCard';
import styles from '../styles/Layout.module.css';
import { Movie } from '../types';
import 'antd/dist/reset.css';
import React from 'react';

export default function Home({
  initialMovies,
  initialTotalPages,
}: {
  initialMovies: Movie[];
  initialTotalPages: number;
}) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [query, setQuery] = useState<string>(''); // Start with empty input
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMovies = debounce(async (searchQuery: string, page: number) => {
    console.log(
      `Fetching movies for query: "${searchQuery}" and page: ${page}`
    );
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(
        `/api/movies?query=${encodeURIComponent(searchQuery)}&page=${page}`
      );
      if (!response.ok) {
        console.error('API response not OK:', response);
        throw new Error(`Failed to fetch movies: ${response.statusText}`);
      }
      const data = await response.json();
      setMovies(data.movies || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setFetchError('Failed to fetch movies. Please try again later.');
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, 1000);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setCurrentPage(1);
    fetchMovies(value, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchMovies(query, page);
  };

  return (
    <div className={styles.container}>
      <Input
        placeholder="Search movies..."
        value={query}
        onChange={handleSearch}
        className={styles.searchBar}
      />
      {isLoading ? (
        <div className={styles.loading}>
          <Spin tip="Loading movies..." size="large" />
        </div>
      ) : fetchError ? (
        <div className={styles.error}>
          <Alert
            message="Error"
            description={fetchError}
            type="error"
            showIcon
          />
        </div>
      ) : movies.length === 0 ? (
        <div className={styles.noMovies}>
          <Alert
            message="No Movies Found"
            description="Try a different search term."
            type="info"
            showIcon
          />
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onImageLoad={() => {}} />
            ))}
          </div>
          <Pagination
            current={currentPage}
            total={totalPages * 10}
            onChange={handlePageChange}
            pageSize={10}
            className={styles.pagination}
          />
        </>
      )}
    </div>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const query = context.query.query || ''; // Empty query by default
  const page = parseInt(context.query.page as string) || 1;

  if (!API_KEY) {
    return {
      props: {
        initialMovies: [],
        initialTotalPages: 0,
        error: 'API key is missing. Check your .env.local configuration.',
      },
    };
  }

  try {
    let tmdbUrl = '';

    if (query === '') {
      // Fetch popular movies if no search query
      tmdbUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`;
    } else {
      // Fetch movies based on the search query
      tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`;
    }

    const response = await fetch(tmdbUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      props: {
        initialMovies: data.results || [],
        initialTotalPages: data.total_pages || 0,
        error: null,
      },
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred';
    return {
      props: {
        initialMovies: [],
        initialTotalPages: 0,
        error: errorMessage,
      },
    };
  }
};
