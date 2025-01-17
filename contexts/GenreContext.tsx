import React, { createContext, useContext, useEffect, useState } from 'react';

const GenreContext = createContext<Record<number, string>>({});

export const GenreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [genres, setGenres] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchGenres = async () => {
      const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`
      );
      const data = await response.json();
      const genreMap = data.genres.reduce(
        (acc: Record<number, string>, genre: { id: number; name: string }) => {
          acc[genre.id] = genre.name;
          return acc;
        },
        {}
      );
      setGenres(genreMap);
    };

    fetchGenres();
  }, []);

  return (
    <GenreContext.Provider value={genres}>{children}</GenreContext.Provider>
  );
};

export const useGenres = () => useContext(GenreContext);
