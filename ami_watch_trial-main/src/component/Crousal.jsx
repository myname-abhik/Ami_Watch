import React, { useState, useEffect } from 'react';
import '../Pages_css/Home.css';
import { Link } from "react-router-dom";
import { isInWatchlist, toggleWatchlist } from '../utils/watchlist';

const Crousal = ({ image, ele, Description, genre, name }) => {
  const movieTitle = ele || name || "";
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setInList(isInWatchlist(movieTitle));
    const handleUpdate = () => {
      setInList(isInWatchlist(movieTitle));
    };
    window.addEventListener('ami-watchlist-updated', handleUpdate);
    return () => window.removeEventListener('ami-watchlist-updated', handleUpdate);
  }, [movieTitle]);

  const handleAddToList = () => {
    toggleWatchlist({
      title: movieTitle,
      poster: image,
      genres: Array.isArray(genre) ? genre : [genre],
      description: Description,
      features: 'Sub • Dub',
    });
  };

  return (
    <>
      <div className="swiper-slide">
        <img src={image} alt={movieTitle} />
        <div className="crousal-content">
          <div className="Movies">
            <p>{ele}</p>
          </div>
          <div className="Features">
            <div className="Line"></div>
            <div className="Genre">{Array.isArray(genre) ? genre.join(' • ') : genre}</div>
          </div>
          <div className="Description">
            {Description}
          </div>
          <div className="Description">
            <div className="Play">
              <Link to={`/Video/${encodeURIComponent(name || ele)}`} className='Link'>
                <div className="Child_play">
                  <i className="material-icons Child_arrow">play_arrow</i> Play Now
                </div>
              </Link>
            </div>
            <div
              className={`Add-to-list cursor-pointer select-none transition-colors ${inList ? 'text-orange-400' : ''}`}
              onClick={handleAddToList}
            >
              {inList ? '✓ In Watchlist' : '+ Add to List'}
            </div>
          </div>
        </div>
        <div className="Down-shadow"></div>
      </div>
    </>
  );
};

export default Crousal;