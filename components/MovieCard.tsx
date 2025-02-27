import React from 'react';
import Image from 'next/image';
import { Rate } from 'antd';
import { format } from 'date-fns';
import styles from '../styles/MovieCard.module.css';
import { MovieProps } from '../types';
import { useGenres } from '../contexts/GenreContext'; // Import GenreContext
import truncateText from '../utils/truncateText';

export default function MovieCard({
  movie,
  onImageLoad,
  onRate,
}: {
  movie: MovieProps;
  onImageLoad: () => void;
  onRate: (movieId: number, rating: number) => void;
}) {
  const genres = useGenres(); // Get genres as Record<number, string>

  // Function to determine the rating circle's color
  const getRatingColor = (rating: number) => {
    if (rating >= 7) return '#66E900';
    if (rating >= 5) return '#E9D100';
    if (rating >= 3) return '#E97E00';
    return '#E90000';
  };

  const formattedDate = movie.release_date
    ? format(new Date(movie.release_date), 'MMMM d, yyyy')
    : 'Unknown Release Date';

  return (
    <div className={styles.card}>
      {/* Movie Poster */}
      <div className={styles.imageContainer}>
        <Image
          src={
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : '/images/return.png' // Placeholder image
          }
          alt={movie.title}
          fill
          style={{ objectFit: 'cover' }}
          priority
          onLoad={onImageLoad}
          onError={onImageLoad}
        />
      </div>

      {/* Movie Details */}
      <div className={styles.details}>
        {/* Rating Circle */}
        <div
          className={styles.ratingCircle}
          style={{
            backgroundColor: getRatingColor(
              movie.user_rating || movie.vote_average || 0
            ),
          }}
        >
          {movie.user_rating?.toFixed(1) ||
            movie.vote_average?.toFixed(1) ||
            '-'}
        </div>

        {/* Movie Title */}
        <h2 className={styles.title}>{movie.title}</h2>

        {/* Release Date */}
        <p className={styles.date}>{formattedDate}</p>

        {/* Genres */}
        <div className={styles.genres}>
          {movie.genre_ids?.map(
            (id) =>
              genres[id] && (
                <span key={id} className={styles.genre}>
                  {genres[id]}
                </span>
              )
          )}
        </div>

        {/* Rating Component */}
        <Rate
          allowHalf
          value={movie.user_rating || 0} // Use user's rating or default to 0
          onChange={(value) => onRate(movie.id, value)} // Pass rating changes to handler
        />

        {/* Movie Description */}
        <p className={styles.description}>
          {truncateText(movie.overview || 'No description available.', 150)}
        </p>
      </div>
    </div>
  );
}
