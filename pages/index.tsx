import { GetServerSideProps } from 'next';
import MovieCard from '../components/MovieCard';
import styles from '../styles/Layout.module.css';
import { Movie } from '../types';
import { Spin, Alert } from 'antd';
import { useState, useEffect } from 'react';
import 'antd/dist/reset.css';

export default function Home({
  movies,
  error,
}: {
  movies: Movie[];
  error: string | null;
}) {
  const [isOffline, setIsOffline] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  // Track online/offline status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Mark data as loaded when movies are available
  useEffect(() => {
    if (movies.length > 0) {
      setDataLoaded(true);
    }
  }, [movies]);

  // Fallback timeout to stop spinner if something fails
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('Fallback: Forcing spinner to stop after timeout.');
      setImagesLoadedCount(movies.length);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [movies.length]);

  const handleImageLoad = () => {
    setImagesLoadedCount((prev) => prev + 1);
  };

  const isLoading = !dataLoaded || imagesLoadedCount < movies.length;

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spin tip="Loading movies..." size="large" />
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className={styles.error}>
        <Alert
          message="No Internet Connection"
          description="Please check your network and try again."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className={styles.noMovies}>
        <Alert
          message="No Movies Found"
          description="No movies match your search."
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onImageLoad={handleImageLoad}
          />
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
    return {
      props: {
        movies: [],
        error: 'API key is missing. Check your .env.local configuration.',
      },
    };
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=return`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.statusText}`);
    }

    const data = await response.json();
    return { props: { movies: data.results || [], error: null } };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred';
    return { props: { movies: [], error: errorMessage } };
  }
};
