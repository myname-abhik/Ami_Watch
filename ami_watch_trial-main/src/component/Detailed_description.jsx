import React, { useState, useEffect } from 'react';
import Styles from '../Pages_css/Movs.module.css';
import 'material-icons/iconfont/material-icons.css';
import { Link } from "react-router-dom";
import { isInWatchlist, toggleWatchlist } from '../utils/watchlist';

const Detailed_description = ({ val }) => {
  const movie = val && val[0] ? val[0] : {};
  const [showTrailer, setShowTrailer] = useState(false);
  const [inList, setInList] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (movie.Movie) {
      setInList(isInWatchlist(movie.Movie));
    }
    const handleUpdate = () => {
      if (movie.Movie) setInList(isInWatchlist(movie.Movie));
    };
    window.addEventListener('ami-watchlist-updated', handleUpdate);
    return () => window.removeEventListener('ami-watchlist-updated', handleUpdate);
  }, [movie.Movie]);

  const handleWatchlist = () => {
    const added = toggleWatchlist({
      title: movie.Movie,
      poster: movie.Poster || movie.Image,
      genres: [movie.Language || 'Feature'],
      rating: movie.Rating,
      features: 'Sub',
    });
    setToast(added ? 'Added to Watchlist!' : 'Removed from Watchlist');
    setTimeout(() => setToast(''), 2500);
  };

  const trailerVideo =
    movie.Video || 'https://videos.pexels.com/video-files/3129540/3129540-uhd_2560_1440_30fps.mp4';

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-orange-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2">
          <i className="material-icons text-orange-400 text-sm">bookmark</i>
          <span>{toast}</span>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                <i className="material-icons text-orange-500">movie</i>
                {movie.Movie} — Official Trailer
              </h3>
              <button
                onClick={() => setShowTrailer(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <i className="material-icons">close</i>
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <video controls autoPlay className="w-full h-full object-cover">
                <source src={trailerVideo} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      )}

      <div className={Styles.Detailed_desc}>
        <div className={Styles.Title}>{movie.Movie}</div>
        <div className={Styles.Genre}>
          {movie.Year || '2023'} | {movie.Age || '13+'} | Language : {movie.Language || 'English / Japanese'}
        </div>
        <div className={Styles.Desc}>
          <img
            src={movie.Image || movie.Poster || '/Movie_content/1299334.jpg'}
            className={Styles.image_2}
            alt={movie.Movie}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Movie_content/1299334.jpg';
            }}
          />
          <div className={Styles.Dir_cast_desc_button}>
            <div className={Styles.Dir_name}>Dir. {movie.Dir || 'Featured Director'}</div>
            <div className={Styles.Cast_name}>Cast : {movie.Cast || 'Featured Ensemble'}</div>
            <div className={Styles.Movie_desc}>
              Description : {movie.Description || 'An extraordinary cinematic experience streaming on Ami Watch.'}
            </div>
            <div className={Styles.buttons}>
              <div className={Styles.Play_now}>
                <i className={`material-icons right_arrow ${Styles.meterial}`}>play_arrow</i>
                <Link to={`/Video/${encodeURIComponent(movie.Movie)}`} className="Link">
                  Play now
                </Link>
              </div>

              <div
                className={`${Styles.Watch_later} cursor-pointer hover:bg-neutral-800 transition-colors select-none`}
                onClick={() => setShowTrailer(true)}
              >
                <i className="material-icons text-sm mr-1">play_circle_outline</i>
                Watch Trailer
              </div>

              <div
                className={`${Styles.Watch_later} cursor-pointer hover:bg-neutral-800 transition-colors select-none ${
                  inList ? 'text-orange-400 border border-orange-500/50' : ''
                }`}
                onClick={handleWatchlist}
              >
                <i className="material-icons text-sm mr-1">{inList ? 'bookmark' : 'bookmark_border'}</i>
                {inList ? 'Saved' : 'Watchlist'}
              </div>
            </div>
          </div>
          <div className={Styles.Imdb_rating}>{movie.Rating || '8.5'}</div>
        </div>
      </div>
    </>
  );
};

export default Detailed_description;