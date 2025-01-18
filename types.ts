export interface Movie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  rating?: number;
  vote_count: number;
  user_rating?: number | null; // Optional user rating
}
export interface RatedMovie extends Movie {
  rating: number;
}

// Add 'id' to MovieProps
export type MovieProps = Pick<
  Movie,
  | 'id'
  | 'title'
  | 'overview'
  | 'poster_path'
  | 'release_date'
  | 'genre_ids'
  | 'vote_average'
  | 'user_rating'
>;
