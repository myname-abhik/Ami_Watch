import React from 'react';
import { Link } from "react-router-dom";

const Movies = ({ image, title, features }) => {
  return (
    <div className="Movies_Second group">
      <Link to={`/Movies/${encodeURIComponent(title || '')}`} className="Movie_image block overflow-hidden relative">
        <img
          src={image}
          alt={title || "Movie poster"}
          loading="lazy"
          className="transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/Movie_content/1299334.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
          <span className="text-[11px] font-bold text-white bg-orange-500/90 px-2 py-0.5 rounded shadow">
            Watch
          </span>
        </div>
      </Link>
      <div className="Movie_info">
        <div className="Movie_name">
          <Link to={`/Movies/${encodeURIComponent(title || '')}`} className="Link hover:text-orange-400 transition-colors">
            {title}
          </Link>
        </div>
        <div className="Features">{features}</div>
      </div>
    </div>
  );
};

export default Movies;