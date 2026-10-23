// LocalStorage Watchlist and User Session utilities

const WATCHLIST_KEY = 'ami_watch_watchlist';
const USER_KEY = 'ami_watch_user';

export const getWatchlist = () => {
  try {
    const data = localStorage.getItem(WATCHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const isInWatchlist = (title) => {
  if (!title) return false;
  const list = getWatchlist();
  return list.some((item) => item.title.toLowerCase() === title.toLowerCase());
};

export const toggleWatchlist = (movie) => {
  if (!movie || !movie.title) return false;
  const list = getWatchlist();
  const exists = list.some((item) => item.title.toLowerCase() === movie.title.toLowerCase());

  let updated;
  if (exists) {
    updated = list.filter((item) => item.title.toLowerCase() !== movie.title.toLowerCase());
  } else {
    updated = [
      ...list,
      {
        title: movie.title,
        poster: movie.poster || movie.Movie_poster || movie.Poster || '/Movie_content/1299334.jpg',
        genres: movie.genres || movie.Genres || ['Drama'],
        rating: movie.rating || movie.Rating || '8.2',
        features: movie.features || movie.Movie_feature || 'Sub',
        addedAt: Date.now(),
      },
    ];
  }

  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('ami-watchlist-updated'));
  return !exists;
};

export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  window.dispatchEvent(new Event('ami-user-updated'));
};
