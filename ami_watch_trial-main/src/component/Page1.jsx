import React from "react";
import Styles from "../Pages_css/Page.module.css";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { useParams, Link } from 'react-router-dom';
import moviesInfo from '../assets/Movies_info/Movies_info.json';
import moviePickups from '../assets/Movies_info/Movie_pickup.json';

const MOVIE_VIDEOS = {
  'spirited away': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742597568/nrngavphybpyggcgqdrf.mp4',
  '20th century girl': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742599098/20th_Century_Girl___Official_Trailer___Netflix_ENG_SUB_flu6u2.mp4',
  'hometown cha-cha-cha': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598176/Hometown_Cha-Cha-Cha___Official_Trailer___Netflix_ENG_SUB_znyxvo.mp4',
  'interstellar': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1751371370/SSYouTube.online_Interstellar_2014_Trailer___4K_Ultra_HD_1080p_vhusgs.mp4',
  'oppenheimer': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598852/Oppenheimer___New_Trailer_xbbcal.mp4',
  'dead reckoning': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1751394489/MI7_DIGITAL_DOM-TRLR-2-NO-GC_TXTD_STEREO_HD_PRORES_2398_051523_zoa5js.mp4',
  'impossible - dead reckoning': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1751394489/MI7_DIGITAL_DOM-TRLR-2-NO-GC_TXTD_STEREO_HD_PRORES_2398_051523_zoa5js.mp4',
  'suzume': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742597568/nrngavphybpyggcgqdrf.mp4',
  'the-wind-rises': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742597568/nrngavphybpyggcgqdrf.mp4',
  'peaky-blinders': 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598852/Oppenheimer___New_Trailer_xbbcal.mp4',
};

const resolveMovieVideo = (rawTitle) => {
  const clean = (rawTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, val] of Object.entries(MOVIE_VIDEOS)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKey === clean || cleanKey.includes(clean) || clean.includes(cleanKey)) {
      return val;
    }
  }
  return 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598852/Oppenheimer___New_Trailer_xbbcal.mp4';
};

const Page1 = () => {
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const { id } = useParams();
  const movieTitle = decodeURIComponent(id || 'Featured Stream');

  const [apiMovies, setApiMovies] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    fetch('https://cv-backend-theta.vercel.app/use/insert')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          setApiMovies(data);
        }
      })
      .catch((err) => console.warn('Page1 API notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Related recommendations
  const relatedMovies = React.useMemo(() => {
    if (apiMovies.length > 0) {
      return apiMovies
        .filter((m) => (m.Movie || m.title || '').toLowerCase() !== movieTitle.toLowerCase())
        .map((m) => ({
          title: m.Movie || m.title,
          poster: m.Poster || m.Image || '/Movie_content/1299334.jpg',
        }))
        .slice(0, 4);
    }

    const list = [
      ...moviesInfo.map((m) => ({ title: m.Movie, poster: m.Poster })),
      ...moviePickups.map((m) => ({ title: m.Movie_title, poster: m.Movie_poster })),
    ];
    return list.filter((m) => m.title.toLowerCase() !== movieTitle.toLowerCase()).slice(0, 4);
  }, [apiMovies, movieTitle]);

  React.useEffect(() => {
    if (!videoRef.current) return;

    const specificMovieVideo = resolveMovieVideo(id);
    const videoLink = `https://final-ffmpeg.vercel.app/hls/${id}/index.m3u8`;
    const fallbackLink = specificMovieVideo;

    const options = {
      controls: true,
      responsive: true,
      fluid: true,
      autoplay: true,
      sources: [
        {
          src: videoLink,
          type: "application/x-mpegURL",
        },
        {
          src: specificMovieVideo,
          type: "video/mp4",
        },
      ],
    };

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    videoRef.current.appendChild(videoElement);

    const player = (playerRef.current = videojs(videoElement, options, () => {
      videojs.log("player is ready");
      player.autoplay(true);
    }));

    player.on("error", () => {
      const currentSrc = player.src();
      if (currentSrc !== fallbackLink) {
        player.src({ src: fallbackLink, type: "video/mp4" });
        player.play().catch(() => {});
      }
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [id]);

  return (
    <div className={Styles.Video}>
      {/* Top Header Bar */}
      <div className="w-[90%] max-w-[1100px] mb-4 flex items-center justify-between text-white">
        <Link
          to={`/Movies/${encodeURIComponent(movieTitle)}`}
          className="flex items-center gap-1.5 text-xs md:text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <i className="material-icons text-base">arrow_back</i>
          <span>Back to details</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded font-bold">
            1080p Full HD
          </span>
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
            Dolby 5.1
          </span>
        </div>
      </div>

      {/* Main Video Frame */}
      <div className={Styles.Player}>
        <div data-vjs-player>
          <div ref={videoRef} className={Styles.Child_Player} />
        </div>
      </div>

      {/* Video Info Card */}
      <div className="w-[90%] max-w-[1100px] mt-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 text-white backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{movieTitle}</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Now streaming on Ami Watch &bull; Subtitled & Dubbed &bull; Ultra Low Latency
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/Movies"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Browse Library
            </Link>
            <Link
              to="/Pricing"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-xs font-semibold rounded-xl transition-colors text-white shadow-lg shadow-orange-500/20"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Up Next Row */}
      <div className="w-[90%] max-w-[1100px] mt-8 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="material-icons text-orange-500">playlist_play</i> Up Next
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {relatedMovies.map((m) => (
            <Link
              key={m.title}
              to={`/Video/${encodeURIComponent(m.title)}`}
              className="group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all p-2 flex flex-col gap-2"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-lg bg-neutral-800">
                <img
                  src={m.poster}
                  alt={m.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/Movie_content/1299334.jpg';
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-neutral-200 group-hover:text-orange-400 truncate">
                {m.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page1;






