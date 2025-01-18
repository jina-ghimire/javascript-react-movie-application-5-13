import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Movie } from '../types';

type State = {
  movies: Movie[];
  ratedMovies: Movie[];
  query: string;
  currentPage: number;
  totalPages: number;
  activeTab: string;
};

type Action =
  | { type: 'SET_MOVIES'; payload: Movie[] }
  | { type: 'SET_RATED_MOVIES'; payload: Movie[] }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number }
  | { type: 'SET_ACTIVE_TAB'; payload: string };

const initialState: State = {
  movies: [],
  ratedMovies: [],
  query: '',
  currentPage: 1,
  totalPages: 1,
  activeTab: '1',
};

// Create the reducer function
function movieReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MOVIES':
      return { ...state, movies: action.payload };
    case 'SET_RATED_MOVIES':
      return { ...state, ratedMovies: action.payload };
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
}

// Create the context
const MovieContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

// Create a provider component
export const MovieProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  return (
    <MovieContext.Provider value={{ state, dispatch }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovieContext = () => {
  return useContext(MovieContext);
};
