import { GetServerSideProps } from 'next';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input, Spin, Alert, Pagination, Tabs } from 'antd';
import debounce from 'lodash/debounce';
import MovieCard from '../components/MovieCard';
import styles from '../styles/Layout.module.css';
import { Movie } from '../types';
import { RatedMovie } from '../types';
import 'antd/dist/reset.css';
import React from 'react';
import { useGuestSession } from '../contexts/GuestSessionContext';

export default function Home({
  initialMovies,
  initialTotalPages,
}: {
  initialMovies: Movie[];
  initialTotalPages: number;
}) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [ratedMovies, setRatedMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [isLoadingRated, setIsLoadingRated] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ratedError, setRatedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('1');
  const guestSessionId = useGuestSession();

  // Debounced fetch for search movies
  const debouncedFetchMovies = useMemo(
    () =>
      debounce(async (searchQuery: string, page: number) => {
        console.log(
          `Fetching movies for query: "${searchQuery}" on page: ${page}`
        );
        setIsLoadingSearch(true);
        setFetchError(null);

        try {
          const endpoint = searchQuery
            ? `/api/movies?query=${encodeURIComponent(searchQuery)}&page=${page}`
            : `/api/movies/popular?page=${page}`;
          const response = await fetch(endpoint);

          if (!response.ok) {
            throw new Error(`Failed to fetch movies: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Fetched Movies:', data);
          setMovies(data.movies || []);
          setTotalPages(data.total_pages || 1);
        } catch (error) {
          console.error('Error fetching movies:', error);
          setFetchError('Failed to fetch movies. Please try again later.');
          setMovies([]);
        } finally {
          setIsLoadingSearch(false);
        }
      }, 500),
    []
  );

  const fetchRatedMovies = useCallback(async () => {
    if (!guestSessionId) return;

    console.log('Fetching rated movies...');
    setIsLoadingRated(true);
    setRatedError(null);

    try {
      const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/guest_session/${guestSessionId}/rated/movies?api_key=${API_KEY}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('No rated movies found for this guest session.');
          setRatedMovies([]);
          return;
        }
        throw new Error(`Failed to fetch rated movies: ${response.statusText}`);
      }

      const data = await response.json();

      // Use RatedMovie type here
      const fetchedRatedMovies: RatedMovie[] = data.results.map(
        (movie: RatedMovie) => ({
          ...movie,
          user_rating: movie.rating, // Map the API's rating to user_rating
        })
      );

      console.log('Fetched Rated Movies:', fetchedRatedMovies);

      setRatedMovies((prev) => {
        const mergedMovies = [...prev];
        fetchedRatedMovies.forEach((fetchedMovie) => {
          const existingIndex = mergedMovies.findIndex(
            (movie) => movie.id === fetchedMovie.id
          );
          if (existingIndex !== -1) {
            mergedMovies[existingIndex] = fetchedMovie;
          } else {
            mergedMovies.push(fetchedMovie);
          }
        });
        return mergedMovies;
      });
    } catch (error) {
      console.error('Error fetching rated movies:', error);
      setRatedError('Failed to fetch rated movies. Please try again later.');
    } finally {
      setIsLoadingRated(false);
    }
  }, [guestSessionId]);

  const handleRate = (movieId: number, rating: number) => {
    if (!guestSessionId) return;

    console.log(`Rating movie ID ${movieId} with ${rating} stars.`);

    // Update local movies state
    setMovies((prev) =>
      prev.map((movie) =>
        movie.id === movieId ? { ...movie, user_rating: rating } : movie
      )
    );

    // Update local ratedMovies state
    setRatedMovies((prev) => {
      const existingMovie = prev.find((movie) => movie.id === movieId);
      const movieToUpdate =
        existingMovie || movies.find((movie) => movie.id === movieId);

      if (!movieToUpdate) return prev;

      const updatedMovie = { ...movieToUpdate, user_rating: rating };

      return existingMovie
        ? prev.map((movie) => (movie.id === movieId ? updatedMovie : movie))
        : [...prev, updatedMovie];
    });

    // Submit the rating to the API
    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/rating?api_key=${API_KEY}&guest_session_id=${guestSessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: rating * 2 }), // TMDB uses a 10-point scale
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to submit rating.');
        return res.json();
      })
      .then((data) => {
        console.log('Rating submitted successfully:', data);
      })
      .catch((error) => {
        console.error('Error submitting rating:', error);
      });
  };

  useEffect(() => {
    if (!query) {
      console.log('Fetching popular movies...');
      debouncedFetchMovies('', 1);
    }
  }, [debouncedFetchMovies, query]);

  useEffect(() => {
    if (activeTab === '2' && guestSessionId) {
      console.log('Switching to Rated tab...');
      fetchRatedMovies();
    }
  }, [activeTab, guestSessionId, fetchRatedMovies]);

  useEffect(() => {
    console.log('Current Rated Movies:', ratedMovies);
  }, [ratedMovies]);

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
              setQuery(e.target.value);
              setCurrentPage(1);
              debouncedFetchMovies(e.target.value, 1);
            }}
            className={styles.searchBar}
          />
          {isLoadingSearch ? (
            <Spin tip="Loading movies..." />
          ) : fetchError ? (
            <Alert message="Error" description={fetchError} type="error" />
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
              setCurrentPage(page);
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
          {isLoadingRated ? (
            <Spin tip="Loading rated movies..." />
          ) : ratedError ? (
            <Alert message="Error" description={ratedError} type="error" />
          ) : ratedMovies.length === 0 ? (
            <p>No movies have been rated yet. Start rating movies!</p>
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

  return <Tabs items={tabItems} onChange={(key) => setActiveTab(key)} />;
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
