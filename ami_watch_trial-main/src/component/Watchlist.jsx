import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist, toggleWatchlist } from '../utils/watchlist';

const Watchlist = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = () => {
      setItems(getWatchlist());
    };
    load();
    window.addEventListener('ami-watchlist-updated', load);
    return () => window.removeEventListener('ami-watchlist-updated', load);
  }, []);

  const handleRemove = (movie) => {
    toggleWatchlist(movie);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-neutral-800 mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              My <span className="text-orange-500">Watchlist</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              {items.length === 0
                ? 'Your watchlist is empty'
                : `You have ${items.length} title${items.length > 1 ? 's' : ''} saved for later`}
            </p>
          </div>

          <Link
            to="/Movies"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs md:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <i className="material-icons text-sm">add</i> Browse More
          </Link>
        </div>

        {/* Watchlist Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
            {items.map((movie) => (
              <div
                key={movie.title}
                className="group relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 flex flex-col"
              >
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                    <Link
                      to={`/Video/${encodeURIComponent(movie.title)}`}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-md transition-colors"
                    >
                      <i className="material-icons text-sm">play_arrow</i> Play Now
                    </Link>
                  </div>

                  <button
                    onClick={() => handleRemove(movie)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Remove from Watchlist"
                  >
                    <i className="material-icons text-sm">delete_outline</i>
                  </button>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <Link
                    to={`/Movies/${encodeURIComponent(movie.title)}`}
                    className="font-bold text-sm text-neutral-100 hover:text-orange-400 transition-colors line-clamp-1"
                  >
                    {movie.title}
                  </Link>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                    <span className="text-orange-400 font-medium">★ {movie.rating}</span>
                    <span>{Array.isArray(movie.features) ? movie.features.join(' • ') : movie.features}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800/80 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-500">
              <i className="material-icons text-3xl">bookmark_border</i>
            </div>
            <h3 className="text-xl font-bold text-neutral-200">No movies saved yet</h3>
            <p className="text-neutral-400 text-sm mt-2 max-w-sm mx-auto">
              Explore our library and click the bookmark icon or &ldquo;Add to List&rdquo; on any title to save it here.
            </p>
            <Link
              to="/Movies"
              className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-orange-500/20"
            >
              Browse Movies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
