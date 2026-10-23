import React from 'react';
import '../Pages_css/Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="Footer_Main">
      <div className="Footer_Content">
        <div className="Footer_Grid">
          {/* Brand Col */}
          <div className="Footer_Col">
            <div className="text-xl font-black tracking-wider text-white mb-3">
              AMI<span className="text-orange-500">WATCH</span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm mb-4">
              Your premier destination for blockbuster movies, timeless anime classics, and immersive cinematic experiences with zero interruptions.
            </p>
            <div className="flex items-center gap-3 text-neutral-400 text-xs">
              <span className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-semibold text-orange-400">
                HD & 4K Ultra
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-semibold text-neutral-300">
                Dolby Audio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="Footer_Col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/Movies">All Movies</Link></li>
              <li><Link to="/Watchlist">My Watchlist</Link></li>
              <li><Link to="/Pricing">Subscription Plans</Link></li>
            </ul>
          </div>

          {/* Genres */}
          <div className="Footer_Col">
            <h4>Genres</h4>
            <ul>
              <li><Link to="/Movies/Suzume">Anime & Fantasy</Link></li>
              <li><Link to="/Movies/peaky-blinders">Crime & Period Drama</Link></li>
              <li><Link to="/Movies/Interstellar">Sci-Fi & Thriller</Link></li>
              <li><Link to="/Movies/20th%20Century%20Girl">Romance & Coming-of-Age</Link></li>
            </ul>
          </div>

          {/* Account & Help */}
          <div className="Footer_Col">
            <h4>Account & Help</h4>
            <ul>
              <li><Link to="/Login">Sign In</Link></li>
              <li><Link to="/Signup">Create Account</Link></li>
              <li><a href="#help" onClick={(e) => { e.preventDefault(); alert("Help Center: Contact support@amiwatch.com for inquiries."); }}>Help Center</a></li>
              <li><a href="#terms" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Standard consumer streaming terms apply."); }}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="Footer_Bottom">
          <div>
            &copy; {new Date().getFullYear()} Ami Watch. All rights reserved. Powered by Vite + React.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;