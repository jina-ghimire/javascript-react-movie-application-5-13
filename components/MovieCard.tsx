import Image from 'next/image';
import { format } from 'date-fns';
import truncateText from '../utils/truncateText';
import styles from '../styles/MovieCard.module.css';
import { MovieProps } from '../types';

export default function MovieCard({
  movie,
  onImageLoad,
}: {
  movie: MovieProps;
  onImageLoad: () => void;
}) {
  placeholderGenres = ['Action'];
  const formattedDate = movie.release_date
    ? format(new Date(movie.release_date), 'MMMM d, yyyy')
    : 'Unknown Release Date';

  console.log(
    `Rendering MovieCard for: ${movie.title}, Poster Path: ${movie.poster_path || 'No poster'}`
  );

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : '/images/return.png'
          }
          alt={movie.title}
          fill
          style={{ objectFit: 'cover' }}
          priority
          onLoad={() => {
            console.log(`Image loaded for movie: ${movie.title}`);
            onImageLoad();
          }}
          onError={() => {
            console.error(`Failed to load image for movie: ${movie.title}`);
            onImageLoad(); // Increment count even if image fails
          }}
        />
      </div>
      <div className={styles.details}>
        <h2 className={styles.title}>{movie.title}</h2>
        <p className={styles.date}>{formattedDate}</p>
        <div className={styles.genres}>
          {placeholderGenres.map((genre, index) => (
            <span key={index} className={styles.genreTag}>
              {genre}
            </span>
          ))}
        </div>
        <p className={styles.description}>
          {truncateText(movie.overview || 'No description available.', 150)}
        </p>
      </div>
    </div>
  );
}
