import { GetServerSideProps } from 'next';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { Input, Spin, Alert, Pagination, Tabs } from 'antd';
import debounce from 'lodash/debounce';
import MovieCard from '../components/MovieCard';
import styles from '../styles/Layout.module.css';
import { useGuestSession } from '../contexts/GuestSessionContext';
import { useMovieContext } from '../contexts/MovieContext';
import { Movie } from '../types';
import 'antd/dist/reset.css';

export default function Home({
  initialMovies,
  initialTotalPages,
}: {
  initialMovies: Movie[];
  initialTotalPages: number;
}) {
  const { state, dispatch } = useMovieContext();
  const { movies, ratedMovies, query, currentPage, totalPages, activeTab } =
    state;
  const guestSessionId = useGuestSession();
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isLoadingRatedMovies, setIsLoadingRatedMovies] = useState(false);

  // Set initial state from server-side props
  useEffect(() => {
    dispatch({ type: 'SET_MOVIES', payload: initialMovies });
    dispatch({ type: 'SET_TOTAL_PAGES', payload: initialTotalPages });
  }, [initialMovies, initialTotalPages, dispatch]);

  // Debounced fetch for search movies
  const debouncedFetchMovies = useMemo(
    () =>
      debounce(async (searchQuery: string, page: number) => {
        setIsLoadingMovies(true);
        dispatch({ type: 'SET_MOVIES', payload: [] });
        try {
          const endpoint = searchQuery
            ? `/api/movies?query=${encodeURIComponent(searchQuery)}&page=${page}`
            : `/api/movies/popular?page=${page}`;
          const response = await fetch(endpoint);

          if (!response.ok) {
            throw new Error(`Failed to fetch movies: ${response.statusText}`);
          }

          const data = await response.json();
          dispatch({ type: 'SET_MOVIES', payload: data.movies || [] });
          dispatch({ type: 'SET_TOTAL_PAGES', payload: data.total_pages || 1 });
        } catch (error) {
          console.error('Error fetching movies:', error);
          dispatch({ type: 'SET_MOVIES', payload: [] });
        } finally {
          setIsLoadingMovies(false);
        }
      }, 500),
    [dispatch]
  );

  // Fetch rated movies
  const fetchRatedMovies = useCallback(async () => {
    if (!guestSessionId) return;

    setIsLoadingRatedMovies(true);
    try {
      const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/guest_session/${guestSessionId}/rated/movies?api_key=${API_KEY}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          dispatch({ type: 'SET_RATED_MOVIES', payload: [] });
          return;
        }
        throw new Error(`Failed to fetch rated movies: ${response.statusText}`);
      }

      const data = await response.json();
      const ratedMovies = data.results.map((movie: Movie) => ({
        ...movie,
        user_rating: movie.rating, // Use user rating from API
      }));

      dispatch({ type: 'SET_RATED_MOVIES', payload: ratedMovies });
    } catch (error) {
      console.error('Error fetching rated movies:', error);
    } finally {
      setIsLoadingRatedMovies(false);
    }
  }, [guestSessionId, dispatch]);

  // Handle rating update
  const handleRate = (movieId: number, rating: number) => {
    if (!guestSessionId) return;

    const movieToUpdate =
      movies.find((movie) => movie.id === movieId) ||
      ratedMovies.find((movie) => movie.id === movieId);

    if (!movieToUpdate) return;

    const updatedMovie = { ...movieToUpdate, user_rating: rating };

    // Update movies in search tab
    dispatch({
      type: 'SET_MOVIES',
      payload: movies.map((movie) =>
        movie.id === movieId
          ? rating === 0
            ? { ...movie, user_rating: undefined } // Reset to original rating
            : updatedMovie
          : movie
      ),
    });

    // Update ratedMovies
    const updatedRatedMovies = rating
      ? [...ratedMovies.filter((m) => m.id !== movieId), updatedMovie]
      : ratedMovies.filter((m) => m.id !== movieId); // Remove if rating is 0

    dispatch({ type: 'SET_RATED_MOVIES', payload: updatedRatedMovies });

    // Submit the rating to the API
    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (rating === 0) {
      // DELETE request to remove the rating
      fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/rating?api_key=${API_KEY}&guest_session_id=${guestSessionId}`,
        { method: 'DELETE' }
      ).catch((error) => console.error('Error removing rating:', error));
    } else {
      // POST request to submit the rating
      fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/rating?api_key=${API_KEY}&guest_session_id=${guestSessionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: rating * 2 }), // TMDB uses a 10-point scale
        }
      ).catch((error) => console.error('Error submitting rating:', error));
    }
  };

  useEffect(() => {
    if (!query) {
      debouncedFetchMovies('', 1);
    }
  }, [debouncedFetchMovies, query]);

  useEffect(() => {
    if (activeTab === '2' && guestSessionId) {
      fetchRatedMovies();
    }
  }, [activeTab, guestSessionId, fetchRatedMovies]);

  const tabItems = [
    {
      key: '1',
      label: 'Search',
      children: (
        <div className={styles.container}>
          <Input
            placeholder="Search movies..."
            value={query}
            onChange={(e) => {
              dispatch({ type: 'SET_QUERY', payload: e.target.value });
              dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 });
              debouncedFetchMovies(e.target.value, 1);
            }}
            className={styles.searchBar}
          />
          {isLoadingMovies ? (
            <Spin tip="Loading movies..." />
          ) : movies.length === 0 && query ? (
            <Alert
              message="No movies found for your search."
              type="info"
              showIcon
            />
          ) : (
            <div className={styles.grid}>
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onImageLoad={() => {}}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
          <Pagination
            className={styles.pagination}
            current={currentPage}
            total={totalPages * 10}
            onChange={(page) => {
              dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
              debouncedFetchMovies(query, page);
            }}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: 'Rated',
      children: (
        <div className={styles.container}>
          {isLoadingRatedMovies ? (
            <Spin tip="Loading rated movies..." />
          ) : ratedMovies.length === 0 ? (
            <Alert message="No rated movies yet." type="info" showIcon />
          ) : (
            <div className={styles.grid}>
              {ratedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onImageLoad={() => {}}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Tabs
      items={tabItems}
      onChange={(key) => dispatch({ type: 'SET_ACTIVE_TAB', payload: key })}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
    return { props: { initialMovies: [], initialTotalPages: 0 } };
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=1`
    );
    const data = await response.json();
    return {
      props: {
        initialMovies: data.results || [],
        initialTotalPages: data.total_pages || 1,
      },
    };
  } catch (error) {
    console.error('Error fetching initial movies:', error);
    return { props: { initialMovies: [], initialTotalPages: 0 } };
  }
};
