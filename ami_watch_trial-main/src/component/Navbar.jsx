import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import moviesInfo from '../assets/Movies_info/Movies_info.json';
import moviePickups from '../assets/Movies_info/Movie_pickup.json';
import { getCurrentUser, setCurrentUser, getWatchlist } from '../utils/watchlist';

const Navbar = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBrowseOpen, setMobileBrowseOpen] = useState(false);
  const [currentUser, setUser] = useState(null);
  const [watchlistCount, setWatchlistCount] = useState(0);

  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const browseRef = useRef(null);
  const navigate = useNavigate();
  const [backendItems, setBackendItems] = useState([]);

  // Dynamic API catalog fetch
  useEffect(() => {
    let isMounted = true;
    const fetchSearchCatalog = async () => {
      try {
        const res = await fetch('https://cv-backend-theta.vercel.app/use/insert');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            setBackendItems(data);
          }
        }
      } catch {
        // Fallback to static catalog
      }
    };
    fetchSearchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Combine and deduplicate movie catalogue for comprehensive search (API active -> pause local catalog)
  const movieCatalog = useMemo(() => {
    const list = [];
    const seenTitles = new Set();
    const hasLiveApi = backendItems.length > 0;

    if (hasLiveApi) {
      // Use EXCLUSIVELY Live API items when active
      backendItems.forEach((item) => {
        const title = item.Movie || item.title;
        if (title && !seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          list.push({
            title: title,
            poster: item.Poster || item.Image || '/Movie_content/1299334.jpg',
            genres: Array.isArray(item.Genres) ? item.Genres : typeof item.Genres === 'string' ? item.Genres.split(',').map(s=>s.trim()) : ['Featured'],
            features: Array.isArray(item.Features) ? item.Features.join(' • ') : item.Features || 'Sub • Dub',
            description: item.Description || 'Stream on Ami Watch.',
            rating: item.Rating || '8.5',
          });
        }
      });
    } else {
      // Fallback to static catalog ONLY if API is offline
      moviesInfo.forEach((item) => {
        const title = item.Movie;
        if (title && !seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          list.push({
            title: item.Movie,
            poster: item.Poster || '/Movie_content/1299334.jpg',
            genres: item.Genres || ['Drama'],
            features: Array.isArray(item.Features) ? item.Features.join(' • ') : 'Sub • Dub',
            description: item.Description || '',
            rating: '8.4',
          });
        }
      });

      moviePickups.forEach((item) => {
        const title = item.Movie_title;
        if (title && !seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          list.push({
            title: item.Movie_title,
            poster: item.Movie_poster || '/Movie_content/1299334.jpg',
            genres: ['Popular', 'Featured'],
            features: item.Movie_feature || 'Sub',
            description: 'A popular selection curated for you.',
            rating: '8.1',
          });
        }
      });
    }

    return list;
  }, [backendItems]);

  // Debounce search query (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter movies based on query
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return movieCatalog.filter((movie) => {
      const titleMatch = movie.title.toLowerCase().includes(q);
      const genreMatch = movie.genres.some((g) => g.toLowerCase().includes(q));
      const descMatch = movie.description.toLowerCase().includes(q);
      return titleMatch || genreMatch || descMatch;
    });
  }, [debouncedQuery, movieCatalog]);

  // Click outside and escape key handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (browseRef.current && !browseRef.current.contains(event.target)) {
        setBrowseOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setBrowseOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync user authentication and watchlist count
  useEffect(() => {
    const syncState = () => {
      setUser(getCurrentUser());
      setWatchlistCount(getWatchlist().length);
    };
    syncState();
    window.addEventListener('ami-user-updated', syncState);
    window.addEventListener('ami-watchlist-updated', syncState);
    return () => {
      window.removeEventListener('ami-user-updated', syncState);
      window.removeEventListener('ami-watchlist-updated', syncState);
    };
  }, []);

  const handleSignout = (e) => {
    e.preventDefault();
    setCurrentUser(null);
  };

  const handleSelectMovie = (title) => {
    setIsOpen(false);
    setMobileMenuOpen(false);
    setQuery('');
    navigate(`/Movies/${encodeURIComponent(title)}`);
  };

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
  };

  const browseCategories = [
    { label: 'All Movies', path: '/Movies' },
    { label: 'Anime & Fantasy', path: '/Movies/Suzume' },
    { label: 'Gangster & Crime', path: '/Movies/peaky-blinders' },
    { label: 'Sci-Fi & Thriller', path: '/Movies/Interstellar' },
    { label: 'Classic Animation', path: '/Movies/Spirited%20Away' },
    { label: 'Romance & Drama', path: '/Movies/20th%20Century%20Girl' },
  ];

  return (
    <nav className="w-full">
      <div className="max-w-[1920px] mx-auto px-4 md:px-12 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <div className="logo font-black text-2xl tracking-wider text-white">
            <Link to="/" className="Link">
              AMI<span className="text-orange-500">WATCH</span>
            </Link>
          </div>

          {/* Desktop Navigation Links (hidden on mobile/tablet) */}
          <div className="hidden lg:flex items-center gap-6 text-[15px] font-semibold text-neutral-200">
            <Link to="/" className="Link hover:text-orange-400 transition-colors">
              Home
            </Link>

            {/* Desktop Browse Dropdown */}
            <div
              ref={browseRef}
              className="relative cursor-pointer select-none"
              onClick={() => setBrowseOpen(!browseOpen)}
            >
              <span className="flex items-center gap-0.5 hover:text-orange-400 transition-colors">
                Browse
                <i className={`material-icons text-base transition-transform duration-200 ${browseOpen ? 'rotate-180' : ''}`}>
                  arrow_drop_down
                </i>
              </span>

              {browseOpen && (
                <div className="absolute top-[130%] left-0 w-52 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/60 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                  <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    Categories
                  </div>
                  {browseCategories.map((cat) => (
                    <Link
                      key={cat.label}
                      to={cat.path}
                      onClick={() => setBrowseOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2 text-xs text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      <span>{cat.label}</span>
                      <i className="material-icons text-xs text-neutral-500">chevron_right</i>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/Movies" className="Link hover:text-orange-400 transition-colors">
              Movies
            </Link>
            <Link to="/Pricing" className="Link hover:text-orange-400 transition-colors">
              Pricing
            </Link>
            <Link to="/Watchlist" className="Link hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <span>Watchlist</span>
              {watchlistCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {watchlistCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Desktop Search Bar */}
          <div ref={searchRef} className="hidden lg:flex relative items-center bg-white/10 hover:bg-white/15 focus-within:bg-neutral-900/90 border border-white/15 focus-within:border-orange-500/70 rounded-full px-3.5 py-1.5 min-w-[240px] transition-all">
            <i className="material-icons text-neutral-400 text-lg mr-2">search</i>
            <input
              type="text"
              placeholder="Search movies..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (query.trim().length > 0) setIsOpen(true);
              }}
              className="bg-transparent text-sm text-white placeholder-neutral-400 outline-none w-full"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-neutral-400 hover:text-white ml-1 p-0.5"
              >
                <i className="material-icons text-sm">close</i>
              </button>
            )}

            {/* Desktop Search Results Dropdown */}
            {isOpen && query.trim().length > 0 && (
              <div className="absolute top-[125%] right-0 w-[360px] max-h-[420px] bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/70 rounded-2xl shadow-2xl overflow-y-auto z-[100] p-2 text-white">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 text-xs text-neutral-400">
                  <span>Results ({searchResults.length})</span>
                  <span className="text-[10px] text-neutral-500">ESC to close</span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-neutral-800/60 mt-1">
                    {searchResults.map((movie) => (
                      <div
                        key={movie.title}
                        onClick={() => handleSelectMovie(movie.title)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800/90 cursor-pointer transition-colors"
                      >
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/Movie_content/1299334.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{movie.title}</div>
                          <div className="text-[11px] text-orange-400 font-medium">★ {movie.rating}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-neutral-400">No titles found</div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Account Details */}
          <div className="hidden lg:flex items-center gap-2">
            <i className="material-icons text-neutral-300 text-2xl">
              {currentUser ? 'account_circle' : 'person'}
            </i>
            <div className="flex flex-col text-left">
              {currentUser ? (
                <>
                  <span className="text-xs text-neutral-200 font-semibold truncate max-w-[85px]">
                    {currentUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignout}
                    className="text-[10px] text-orange-400 hover:text-orange-300 text-left cursor-pointer font-bold bg-transparent border-none p-0"
                  >
                    Signout
                  </button>
                </>
              ) : (
                <Link to="/Login" className="Link text-xs text-neutral-300 hover:text-white flex flex-col">
                  <span>Account</span>
                  <span className="text-orange-400 font-bold text-[11px]">Sign in</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Actions: Watchlist icon & Hamburger menu */}
          <div className="flex lg:hidden items-center gap-3">
            <Link to="/Watchlist" className="relative p-2 text-neutral-300 hover:text-white">
              <i className="material-icons text-2xl">bookmark_border</i>
              {watchlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {watchlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-orange-400 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <i className="material-icons text-2xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Visible when mobileMenuOpen is true) */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full bg-neutral-950/98 backdrop-blur-2xl border-b border-neutral-800 px-5 py-6 flex flex-col gap-4 text-white shadow-2xl animate-fadeIn">
          {/* Mobile Search input */}
          <div ref={mobileSearchRef} className="relative w-full">
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5">
              <i className="material-icons text-neutral-400 text-lg mr-2">search</i>
              <input
                type="text"
                placeholder="Search movies..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                className="bg-transparent text-sm text-white placeholder-neutral-400 outline-none w-full"
              />
              {query && (
                <button type="button" onClick={clearSearch} className="text-neutral-400">
                  <i className="material-icons text-sm">close</i>
                </button>
              )}
            </div>

            {/* Mobile Search Results */}
            {isOpen && query.trim().length > 0 && (
              <div className="mt-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 max-h-56 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((m) => (
                    <div
                      key={m.title}
                      onClick={() => handleSelectMovie(m.title)}
                      className="flex items-center gap-3 p-2 hover:bg-neutral-800 rounded-lg cursor-pointer"
                    >
                      <img src={m.poster} alt={m.title} className="w-8 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{m.title}</div>
                        <div className="text-[10px] text-orange-400">★ {m.rating}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-neutral-400">No titles found</div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1 text-sm font-semibold border-b border-neutral-800/80 pb-4">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-between"
            >
              <span>Home</span>
              <i className="material-icons text-neutral-500 text-sm">chevron_right</i>
            </Link>

            {/* Mobile Browse accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileBrowseOpen(!mobileBrowseOpen)}
                className="w-full py-2.5 px-3 rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-between text-left"
              >
                <span>Browse Categories</span>
                <i className={`material-icons text-neutral-500 text-sm transition-transform ${mobileBrowseOpen ? 'rotate-90' : ''}`}>
                  chevron_right
                </i>
              </button>

              {mobileBrowseOpen && (
                <div className="pl-6 pr-2 py-1 flex flex-col gap-1 text-xs text-neutral-400">
                  {browseCategories.map((c) => (
                    <Link
                      key={c.label}
                      to={c.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 hover:text-orange-400 transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/Movies"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-between"
            >
              <span>All Movies</span>
              <i className="material-icons text-neutral-500 text-sm">chevron_right</i>
            </Link>

            <Link
              to="/Pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-between"
            >
              <span>Pricing & Plans</span>
              <i className="material-icons text-neutral-500 text-sm">chevron_right</i>
            </Link>

            <Link
              to="/Watchlist"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                Watchlist
                {watchlistCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {watchlistCount}
                  </span>
                )}
              </span>
              <i className="material-icons text-neutral-500 text-sm">chevron_right</i>
            </Link>
          </div>

          {/* User Account in Mobile Menu */}
          <div className="pt-2 flex items-center justify-between px-3">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <i className="material-icons text-orange-400 text-2xl">account_circle</i>
                  <span className="text-sm font-bold text-white">{currentUser.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    handleSignout(e);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-orange-400 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/Login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition-colors"
              >
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;