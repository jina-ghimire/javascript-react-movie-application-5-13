import { AppProps } from 'next/app';
import { GuestSessionProvider } from '../contexts/GuestSessionContext';
import { GenreProvider } from '../contexts/GenreContext';
import '../styles/global.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GuestSessionProvider>
      <GenreProvider>
        <Component {...pageProps} />
      </GenreProvider>
    </GuestSessionProvider>
  );
}
