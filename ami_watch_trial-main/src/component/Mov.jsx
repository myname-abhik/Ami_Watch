import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import moviesInfo from '../assets/Movies_info/Movies_info.json';
import moviePickups from '../assets/Movies_info/Movie_pickup.json';
import { toggleWatchlist } from '../utils/watchlist';

const Mov = () => {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedFeature, setSelectedFeature] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [searchFilter, setSearchFilter] = useState('');
  const [watchlistTitles, setWatchlistTitles] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [backendMovies, setBackendMovies] = useState([]);
  const [backendPickups, setBackendPickups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync watchlist state
  useEffect(() => {
    const updateList = () => {
      try {
        const raw = localStorage.getItem('ami_watch_watchlist');
        const parsed = raw ? JSON.parse(raw) : [];
        setWatchlistTitles(parsed.map((m) => m.title.toLowerCase()));
      } catch {
        setWatchlistTitles([]);
      }
    };

    updateList();
    window.addEventListener('ami-watchlist-updated', updateList);
    return () => window.removeEventListener('ami-watchlist-updated', updateList);
  }, []);

  // Fetch live backend movie catalog
  useEffect(() => {
    let isMounted = true;
    const fetchApiData = async () => {
      try {
        setIsLoading(true);
        const [moviesRes, pickupsRes] = await Promise.allSettled([
          fetch('https://cv-backend-theta.vercel.app/use/insert'),
          fetch('https://cv-backend-theta.vercel.app/use/movie_pickup/insert'),
        ]);

        if (moviesRes.status === 'fulfilled' && moviesRes.value.ok) {
          const mData = await moviesRes.value.json();
          if (Array.isArray(mData) && isMounted) {
            setBackendMovies(mData);
          }
        }

        if (pickupsRes.status === 'fulfilled' && pickupsRes.value.ok) {
          const pData = await pickupsRes.value.json();
          if (Array.isArray(pData) && isMounted) {
            setBackendPickups(pData);
          }
        }
      } catch (err) {
        console.warn('Backend fetch notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchApiData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Compile movie catalog (Uses Live API exclusively when active, local catalog paused)
  const allMovies = useMemo(() => {
    const map = new Map();
    const hasLiveApi = backendMovies.length > 0 || backendPickups.length > 0;

    if (hasLiveApi) {
      // Use EXCLUSIVELY Live API Data when available
      if (backendMovies.length > 0) {
        backendMovies.forEach((m) => {
          const title = m.Movie || m.title;
          if (!title) return;
          const key = title.toLowerCase();

          let genresList = ['Drama'];
          if (Array.isArray(m.Genres)) genresList = m.Genres;
          else if (typeof m.Genres === 'string') genresList = m.Genres.split(',').map((s) => s.trim());

          let featuresList = ['Sub', 'Dub'];
          if (Array.isArray(m.Features)) featuresList = m.Features;
          else if (typeof m.Features === 'string') featuresList = [m.Features];

          map.set(key, {
            title: title,
            poster: m.Poster || m.Image || '/Movie_content/1299334.jpg',
            genres: genresList,
            features: featuresList,
            description: m.Description || 'Watch on Ami Watch in Ultra HD.',
            rating: parseFloat(m.Rating || '8.5'),
            year: parseInt(m.Year || '2023', 10),
          });
        });
      }

      if (backendPickups.length > 0) {
        backendPickups.forEach((m) => {
          const title = m.Movie_title || m.title || m.Movie;
          if (!title) return;
          const key = title.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              title: title,
              poster: m.Movie_poster || m.Poster || '/Movie_content/1299334.jpg',
              genres: ['Popular', 'Drama'],
              features: [m.Movie_feature || 'Sub'],
              description: 'Popular fan favorite title streaming now on Ami Watch.',
              rating: 8.3,
              year: 2023,
            });
          }
        });
      }
    } else {
      // ONLY fallback to static local catalog when API is offline / empty
      moviesInfo.forEach((m) => {
        map.set(m.Movie.toLowerCase(), {
          title: m.Movie,
          poster: m.Poster || '/Movie_content/1299334.jpg',
          genres: Array.isArray(m.Genres) ? m.Genres : [m.Genres || 'Drama'],
          features: Array.isArray(m.Features) ? m.Features : ['Sub', 'Dub'],
          description: m.Description || 'Stream now in HD on Ami Watch.',
          rating: parseFloat(m.Rating || '8.5'),
          year: parseInt(m.Year || '2023', 10),
        });
      });

      moviePickups.forEach((m) => {
        const key = (m.Movie_title || '').toLowerCase();
        if (key && !map.has(key)) {
          map.set(key, {
            title: m.Movie_title,
            poster: m.Movie_poster || '/Movie_content/1299334.jpg',
            genres: ['Popular', 'Drama'],
            features: [m.Movie_feature || 'Sub'],
            description: 'Popular fan favorite title streaming now on Ami Watch.',
            rating: 8.2,
            year: 2022,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [backendMovies, backendPickups]);

  const genres = ['All', 'Anime', 'Drama', 'Fantasy', 'Gangster', 'Crime', 'Supernatural', 'Romance', 'Action', 'Sci-Fi', 'Biography'];

  // Filtered and sorted movies
  const filteredMovies = useMemo(() => {
    let result = allMovies.filter((movie) => {
      // Genre filter
      const matchesGenre =
        selectedGenre === 'All' ||
        movie.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()));

      // Audio feature filter
      const matchesFeature =
        selectedFeature === 'All' ||
        movie.features.some((f) => f.toLowerCase().includes(selectedFeature.toLowerCase()));

      // Search text filter
      const matchesSearch =
        !searchFilter.trim() ||
        movie.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        movie.genres.some((g) => g.toLowerCase().includes(searchFilter.toLowerCase()));

      return matchesGenre && matchesFeature && matchesSearch;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return b.year - a.year;
    });

    return result;
  }, [allMovies, selectedGenre, selectedFeature, searchFilter, sortBy]);

  const handleToggleWatchlist = (movie, e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWatchlist(movie);
    showToast(added ? `Added "${movie.title}" to Watchlist` : `Removed "${movie.title}" from Watchlist`);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-orange-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <i className="material-icons text-orange-400">bookmark</i>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
          Explore <span className="text-orange-500">Movies & Anime</span>
        </h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Stream the latest blockbuster movies, critically acclaimed anime masterpieces, and timeless classics in HD.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 md:p-6 mb-10 max-w-6xl mx-auto backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5">
          {/* Search within page */}
          <div className="relative flex-1 max-w-md">
            <i className="material-icons absolute left-3 top-2.5 text-neutral-400 text-lg">search</i>
            <input
              type="text"
              placeholder="Search title, genre..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Sub / Dub & Sort controls */}
          <div className="flex items-center gap-3">
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs md:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="All">All Audio (Sub/Dub)</option>
              <option value="Sub">Subtitled</option>
              <option value="Dub">Dubbed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs md:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="year">Latest Release</option>
            </select>
          </div>
        </div>

        {/* Genre Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-wide">
            {selectedGenre === 'All' ? 'All Titles' : `${selectedGenre} Titles`}
            <span className="text-neutral-500 text-sm font-normal ml-2">({filteredMovies.length} available)</span>
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Syncing live catalog...
            </div>
          )}
        </div>

        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
            {filteredMovies.map((movie) => {
              const bookmarked = watchlistTitles.includes(movie.title.toLowerCase());
              return (
                <div
                  key={movie.title}
                  className="group relative bg-neutral-900/90 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col"
                >
                  {/* Poster Image Container */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/Movie_content/1299334.jpg';
                      }}
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/Video/${encodeURIComponent(movie.title)}`}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-md transition-colors"
                        >
                          <i className="material-icons text-sm">play_arrow</i> Play
                        </Link>
                        <Link
                          to={`/Movies/${encodeURIComponent(movie.title)}`}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs p-2 rounded-lg transition-colors"
                          title="Details"
                        >
                          <i className="material-icons text-sm">info</i>
                        </Link>
                      </div>
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="bg-black/70 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded text-orange-400 border border-orange-500/30">
                        ★ {movie.rating}
                      </span>
                    </div>

                    {/* Bookmark / Watchlist Button */}
                    <button
                      onClick={(e) => handleToggleWatchlist(movie, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                        bookmarked
                          ? 'bg-orange-500 text-white'
                          : 'bg-black/60 text-white/80 hover:bg-orange-500 hover:text-white'
                      }`}
                      title={bookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <i className="material-icons text-sm">{bookmarked ? 'bookmark' : 'bookmark_border'}</i>
                    </button>
                  </div>

                  {/* Info Card Body */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <Link
                        to={`/Movies/${encodeURIComponent(movie.title)}`}
                        className="font-bold text-sm text-neutral-100 hover:text-orange-400 transition-colors line-clamp-1"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                        {Array.isArray(movie.genres) ? movie.genres.join(' • ') : movie.genres}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-500">
                      <span>{Array.isArray(movie.features) ? movie.features.join(' / ') : movie.features}</span>
                      <span>HD</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800">
            <i className="material-icons text-5xl text-neutral-600 mb-3">movie_filter</i>
            <h3 className="text-xl font-bold text-neutral-300">No movies found</h3>
            <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
              No titles match the selected filters. Try clearing your search or picking another genre.
            </p>
            <button
              onClick={() => {
                setSelectedGenre('All');
                setSelectedFeature('All');
                setSearchFilter('');
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mov;

