import { AppProps } from 'next/app';
import { GuestSessionProvider } from '../contexts/GuestSessionContext';
import { GenreProvider } from '../contexts/GenreContext';
import { MovieProvider } from '../contexts/MovieContext';
import '../styles/global.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GuestSessionProvider>
      <GenreProvider>
        <MovieProvider>
          <Component {...pageProps} />
        </MovieProvider>
      </GenreProvider>
    </GuestSessionProvider>
  );
}
