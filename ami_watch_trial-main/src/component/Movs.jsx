import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import moviesInfo from '../assets/Movies_info/Movies_info.json';
import moviePickups from '../assets/Movies_info/Movie_pickup.json';
import { isInWatchlist, toggleWatchlist } from '../utils/watchlist';

// Rich catalog database with accurate metadata and official Cloudinary trailers
const MOVIE_DATABASE = {
  'suzume': {
    title: 'Suzume',
    year: '2022',
    age: 'PG-13',
    runtime: '2h 2m',
    rating: '7.7',
    match: '96%',
    genres: ['Anime', 'Fantasy', 'Adventure', 'Drama'],
    director: 'Makoto Shinkai',
    cast: [
      { name: 'Nanoka Hara', role: 'Suzume Iwato' },
      { name: 'Hokuto Matsumura', role: 'Souta Munakata' },
      { name: 'Eri Fukatsu', role: 'Tamaki Iwato' },
      { name: 'Shota Sometani', role: 'Minoru Okabe' },
    ],
    description: 'A modern action-adventure road story where 17-year-old Suzume helps a mysterious young man close disaster-releasing doors across Japan to prevent a catastrophic earthquake.',
    poster: '/Movie_content/1299334.jpg',
    backdrop: '/Movie_content/1299334.jpg',
    audio: 'Japanese (Dolby 5.1), English (Dubbed)',
    subtitles: 'English, Japanese, Spanish, French',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742597568/nrngavphybpyggcgqdrf.mp4',
  },
  'peaky-blinders': {
    title: 'Peaky Blinders',
    year: '2013-2022',
    age: '18+',
    runtime: '6 Seasons',
    rating: '8.8',
    match: '98%',
    genres: ['Crime', 'Period Drama', 'Gangster'],
    director: 'Steven Knight',
    cast: [
      { name: 'Cillian Murphy', role: 'Thomas Shelby' },
      { name: 'Paul Anderson', role: 'Arthur Shelby' },
      { name: 'Helen McCrory', role: 'Polly Gray' },
      { name: 'Tom Hardy', role: 'Alfie Solomons' },
    ],
    description: 'A notorious gang in 1919 Birmingham, England, is led by the fierce Tommy Shelby, a crime boss set on moving up in the world no matter the cost.',
    poster: '/Movie_content/HD-wallpaper-peaky-blinders-thomas-shelby-tv-series.jpg',
    backdrop: '/Movie_content/HD-wallpaper-peaky-blinders-thomas-shelby-tv-series.jpg',
    audio: 'English (Original Dolby 5.1)',
    subtitles: 'English, Spanish, French, German',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598852/Oppenheimer___New_Trailer_xbbcal.mp4',
  },
  'spirited away': {
    title: 'Spirited Away',
    year: '2001',
    age: 'PG',
    runtime: '2h 5m',
    rating: '8.6',
    match: '99%',
    genres: ['Animation', 'Fantasy', 'Adventure', 'Family'],
    director: 'Hayao Miyazaki',
    cast: [
      { name: 'Rumi Hiiragi', role: 'Chihiro / Sen' },
      { name: 'Miyu Irino', role: 'Haku' },
      { name: 'Mari Natsuki', role: 'Yubaba / Zeniba' },
      { name: 'Takashi Naito', role: 'Akio Ogino' },
    ],
    description: 'Ten-year-old Chihiro and her parents stumble upon a seemingly abandoned amusement park. When her parents undergo a mysterious transformation, she must navigate a spirit world to free them.',
    poster: '/Movie_content/spirited-away-4k-upscaled-samples-v0-7uhyv9zj4dea1.webp',
    backdrop: '/Movie_content/spirited-away-4k-upscaled-samples-v0-7uhyv9zj4dea1.webp',
    audio: 'Japanese (Original), English (Dubbed)',
    subtitles: 'English, Japanese, Spanish',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742597568/nrngavphybpyggcgqdrf.mp4',
  },
  'the-wind-rises': {
    title: 'The Wind Rises',
    year: '2013',
    age: 'PG-13',
    runtime: '2h 6m',
    rating: '7.8',
    match: '94%',
    genres: ['Animation', 'Biography', 'Drama', 'Romance'],
    director: 'Hayao Miyazaki',
    cast: [
      { name: 'Hideaki Anno', role: 'Jiro Horikoshi' },
      { name: 'Hidetoshi Nishijima', role: 'Kiro Honjo' },
      { name: 'Miori Takimoto', role: 'Naoko Satomi' },
      { name: 'Masahiko Nishimura', role: 'Kurokawa' },
    ],
    description: 'A chronicle of the life of Jiro Horikoshi, the passionate designer of Japanese fighter aircraft during World War II, portraying his dreams, love, and creations.',
    poster: '/Movie_content/the-wind-rises-wallpaper-17c1169820060d9969b728ab21c2d546.jpg',
    backdrop: '/Movie_content/the-wind-rises-wallpaper-17c1169820060d9969b728ab21c2d546.jpg',
    audio: 'Japanese (Original), English',
    subtitles: 'English, Spanish',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742597568/nrngavphybpyggcgqdrf.mp4',
  },
  '20th century girl': {
    title: '20th Century Girl',
    year: '2022',
    age: '13+',
    runtime: '2h 1m',
    rating: '7.3',
    match: '92%',
    genres: ['Romance', 'Drama', 'Coming-of-Age'],
    director: 'Bang Woo-ri',
    cast: [
      { name: 'Kim Yoo-jung', role: 'Na Bo-ra' },
      { name: 'Byeon Woo-seok', role: 'Poong Woon-ho' },
      { name: 'Park Jung-woo', role: 'Baek Hyun-jin' },
      { name: 'Roh Yoon-seo', role: 'Kim Yeon-doo' },
    ],
    description: 'In 1999, high schooler Bo-ra keeps tabs on a popular boy on behalf of her lovesick best friend. But unexpected romance blossoms, changing their lives forever.',
    poster: '/Movie_content/20th_Century_Girl.jpg',
    backdrop: '/Movie_content/20th_Century_Girl.jpg',
    audio: 'Korean (Original), English',
    subtitles: 'English, Korean, Spanish',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742599098/20th_Century_Girl___Official_Trailer___Netflix_ENG_SUB_flu6u2.mp4',
  },
  'hometown cha-cha-cha': {
    title: 'Hometown Cha-Cha-Cha',
    year: '2021',
    age: '13+',
    runtime: '16 Episodes',
    rating: '8.4',
    match: '95%',
    genres: ['Romance', 'Comedy', 'Drama'],
    director: 'Yu Je-won',
    cast: [
      { name: 'Shin Min-a', role: 'Yoon Hye-jin' },
      { name: 'Kim Seon-ho', role: 'Hong Du-sik' },
      { name: 'Lee Sang-yi', role: 'Ji Seong-hyun' },
    ],
    description: 'A pragmatic big-city dentist moves to a serene seaside village, where she crosses paths with an eccentric, resourceful handyman who helps everyone in town.',
    poster: '/Movie_content/MV5BNDFkYmM3MGMtYWIwNC00ZDkxLWFjZjItYmQ4NTdiZWNjMzczXkEyXkFqcGc@._V1_.jpg',
    backdrop: '/Movie_content/MV5BNDFkYmM3MGMtYWIwNC00ZDkxLWFjZjItYmQ4NTdiZWNjMzczXkEyXkFqcGc@._V1_.jpg',
    audio: 'Korean (Original)',
    subtitles: 'English, Korean',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598176/Hometown_Cha-Cha-Cha___Official_Trailer___Netflix_ENG_SUB_znyxvo.mp4',
  },
  'oppenheimer': {
    title: 'Oppenheimer',
    year: '2023',
    age: 'R',
    runtime: '3h 0m',
    rating: '8.9',
    match: '99%',
    genres: ['Biography', 'Drama', 'History'],
    director: 'Christopher Nolan',
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', role: 'Katherine Oppenheimer' },
      { name: 'Matt Damon', role: 'Leslie Groves' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
    ],
    description: 'The monumental biographical story of theoretical physicist J. Robert Oppenheimer, the visionary director of the Manhattan Project who led the dawn of the atomic age.',
    poster: '/Movie_content/MV5BM2MyYjg0NWMtMjUyMy00Mzg4LTk5NDYtYzcxNmJhOTVhMmU0XkEyXkFqcGc@._V1_.jpg',
    backdrop: '/Movie_content/MV5BM2MyYjg0NWMtMjUyMy00Mzg4LTk5NDYtYzcxNmJhOTVhMmU0XkEyXkFqcGc@._V1_.jpg',
    audio: 'English (Original Dolby Atmos)',
    subtitles: 'English, Spanish, French',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598852/Oppenheimer___New_Trailer_xbbcal.mp4',
  },
  'impossible - dead reckoning': {
    title: 'Mission: Impossible - Dead Reckoning',
    year: '2023',
    age: 'PG-13',
    runtime: '2h 43m',
    rating: '7.7',
    match: '94%',
    genres: ['Action', 'Adventure', 'Thriller'],
    director: 'Christopher McQuarrie',
    cast: [
      { name: 'Tom Cruise', role: 'Ethan Hunt' },
      { name: 'Hayley Atwell', role: 'Grace' },
      { name: 'Ving Rhames', role: 'Luther Stickell' },
      { name: 'Simon Pegg', role: 'Benji Dunn' },
    ],
    description: 'Ethan Hunt and his IMF team must track down a terrifying rogue artificial intelligence before it falls into the hands of a dangerous new enemy from his past.',
    poster: '/Movie_content/Tom.jpg',
    backdrop: '/Movie_content/Tom.jpg',
    audio: 'English (Original Dolby Atmos)',
    subtitles: 'English, Spanish, French',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1751394489/MI7_DIGITAL_DOM-TRLR-2-NO-GC_TXTD_STEREO_HD_PRORES_2398_051523_zoa5js.mp4',
  },
  'dead reckoning': {
    title: 'Mission: Impossible - Dead Reckoning',
    year: '2023',
    age: 'PG-13',
    runtime: '2h 43m',
    rating: '7.7',
    match: '94%',
    genres: ['Action', 'Adventure', 'Thriller'],
    director: 'Christopher McQuarrie',
    cast: [
      { name: 'Tom Cruise', role: 'Ethan Hunt' },
      { name: 'Hayley Atwell', role: 'Grace' },
      { name: 'Ving Rhames', role: 'Luther Stickell' },
      { name: 'Simon Pegg', role: 'Benji Dunn' },
    ],
    description: 'Ethan Hunt and his IMF team must track down a terrifying rogue artificial intelligence before it falls into the hands of a dangerous new enemy from his past.',
    poster: '/Movie_content/Tom.jpg',
    backdrop: '/Movie_content/Tom.jpg',
    audio: 'English (Original Dolby Atmos)',
    subtitles: 'English, Spanish, French',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1751394489/MI7_DIGITAL_DOM-TRLR-2-NO-GC_TXTD_STEREO_HD_PRORES_2398_051523_zoa5js.mp4',
  },
  'interstellar': {
    title: 'Interstellar',
    year: '2014',
    age: 'PG-13',
    runtime: '2h 49m',
    rating: '8.7',
    match: '99%',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    director: 'Christopher Nolan',
    cast: [
      { name: 'Matthew McConaughey', role: 'Joseph Cooper' },
      { name: 'Anne Hathaway', role: 'Dr. Amelia Brand' },
      { name: 'Jessica Chastain', role: 'Murphy Cooper' },
      { name: 'Michael Caine', role: 'Professor Brand' },
    ],
    description: 'In a desperate future where Earth is slowly dying, a courageous team of astronauts travels through a newly discovered wormhole near Saturn in search of a habitable new home for humanity.',
    poster: '/Movie_content/inter.jpg',
    backdrop: '/Movie_content/inter.jpg',
    audio: 'English (Original Dolby Atmos)',
    subtitles: 'English, Spanish, French, German',
    trailer: 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1751371370/SSYouTube.online_Interstellar_2014_Trailer___4K_Ultra_HD_1080p_vhusgs.mp4',
  },
};

const Movs = () => {
  const { id } = useParams();
  const [showTrailer, setShowTrailer] = useState(false);
  const [inList, setInList] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [hasTrailerStarted, setHasTrailerStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [dynamicTrailer, setDynamicTrailer] = useState('');
  const bgVideoRef = useRef(null);

  const [backendMovie, setBackendMovie] = useState(null);
  const [allBackendMovies, setAllBackendMovies] = useState([]);

  // Scroll to top immediately when viewing a movie
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
  }, [id]);

  // Dynamic fetch for live movie details & official video trailer from backend
  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      try {
        const res = await fetch('https://cv-backend-theta.vercel.app/use/insert');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && isMounted) {
          setAllBackendMovies(data);
          const rawId = decodeURIComponent(id || '').trim().toLowerCase().replace(/[-_ ]/g, '');
          const match = data.find((item) => {
            const title = (item.Movie || item.title || '').toLowerCase().replace(/[-_ ]/g, '');
            return (
              title === rawId ||
              rawId.includes(title) ||
              title.includes(rawId) ||
              title.replace(/\s+/g, '') === rawId.replace(/\s+/g, '')
            );
          });
          if (match && isMounted) {
            setBackendMovie(match);
            if (match.Video) {
              setDynamicTrailer(match.Video);
            }
          }
        }
      } catch {
        // Fallback to MOVIE_DATABASE and static JSON
      }
    };

    fetchBackendData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Resolve movie details dynamically
  const movie = useMemo(() => {
    const rawId = decodeURIComponent(id || '').trim();
    const normalizedKey = rawId.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');

    let base = MOVIE_DATABASE[normalizedKey] || MOVIE_DATABASE[rawId.toLowerCase()];

    if (!base) {
      const cleanInput = normalizedKey.replace(/[^a-z0-9]/g, '');
      for (const [key, value] of Object.entries(MOVIE_DATABASE)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanInput || cleanKey.includes(cleanInput) || cleanInput.includes(cleanKey)) {
          base = value;
          break;
        }
      }
    }

    const foundInfo = moviesInfo.find(
      (m) =>
        m.Movie.toLowerCase().replace(/[-_ ]/g, '') === normalizedKey.replace(/[^a-z0-9]/g, '') ||
        m.Movie.toLowerCase().includes(normalizedKey)
    );
    const foundPickup = moviePickups.find(
      (m) =>
        m.Movie_title.toLowerCase().replace(/[-_ ]/g, '') === normalizedKey.replace(/[^a-z0-9]/g, '') ||
        m.Movie_title.toLowerCase().includes(normalizedKey)
    );

    const prettyTitle = rawId
      .split(/[-_ ]+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');

    const fallbackObj = {
      title: base?.title || foundInfo?.Movie || foundPickup?.Movie_title || prettyTitle,
      year: base?.year || foundInfo?.Year || '2023',
      age: base?.age || '13+',
      runtime: base?.runtime || '2h 10m',
      rating: base?.rating || foundInfo?.Rating || '8.4',
      match: base?.match || '95%',
      genres: base?.genres || (foundInfo?.Genres ? (Array.isArray(foundInfo.Genres) ? foundInfo.Genres : [foundInfo.Genres]) : ['Drama', 'Featured']),
      director: base?.director || foundInfo?.Dir || 'Featured Director',
      cast: base?.cast || [
        { name: typeof foundInfo?.Cast === 'string' ? foundInfo.Cast : 'Leading Ensemble', role: 'Main Cast' },
      ],
      description: base?.description || foundInfo?.Description || 'An extraordinary cinematic experience streaming on Ami Watch.',
      poster: base?.poster || foundInfo?.Poster || foundPickup?.Movie_poster || '/Movie_content/1299334.jpg',
      backdrop: base?.backdrop || foundInfo?.Poster || foundPickup?.Movie_poster || '/Movie_content/1299334.jpg',
      audio: base?.audio || 'English (Original), Japanese',
      subtitles: base?.subtitles || 'English, Spanish, French',
      trailer: base?.trailer || 'https://res.cloudinary.com/dfkhg7gkp/video/upload/v1742598852/Oppenheimer___New_Trailer_xbbcal.mp4',
    };

    if (backendMovie) {
      return {
        ...fallbackObj,
        title: backendMovie.Movie || fallbackObj.title,
        poster: backendMovie.Poster || backendMovie.Image || fallbackObj.poster,
        backdrop: backendMovie.Image || backendMovie.Poster || fallbackObj.backdrop,
        description: backendMovie.Description || fallbackObj.description,
        rating: backendMovie.Rating || fallbackObj.rating,
        year: backendMovie.Year || fallbackObj.year,
        director: backendMovie.Dir || fallbackObj.director,
        cast: backendMovie.Cast
          ? Array.isArray(backendMovie.Cast)
            ? backendMovie.Cast.map((item) =>
                typeof item === 'string'
                  ? { name: item, role: 'Cast Member' }
                  : { name: item?.name || 'Cast Member', role: item?.role || 'Actor' }
              )
            : typeof backendMovie.Cast === 'string'
            ? backendMovie.Cast.split(',').map((c) => ({ name: c.trim(), role: 'Cast Member' }))
            : fallbackObj.cast
          : fallbackObj.cast,
        genres: backendMovie.Genres
          ? Array.isArray(backendMovie.Genres)
            ? backendMovie.Genres
            : backendMovie.Genres.split(',').map((s) => s.trim())
          : fallbackObj.genres,
      };
    }

    return fallbackObj;
  }, [id, backendMovie]);

  const effectiveTrailer = dynamicTrailer || movie.trailer;

  // Auto-play trailer timer in background after initial delay
  useEffect(() => {
    setHasTrailerStarted(false);
    setIsPaused(true);
    setCountdown(3);

    const video = bgVideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      setHasTrailerStarted(true);
      const v = bgVideoRef.current;
      if (v) {
        v.play()
          .then(() => {
            setIsPaused(false);
          })
          .catch(() => {
            setIsPaused(true);
          });
      }
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [id, movie.title, effectiveTrailer]);

  const startTrailerImmediately = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCountdown(0);
    setHasTrailerStarted(true);
    const video = bgVideoRef.current;
    if (video) {
      video
        .play()
        .then(() => {
          setIsPaused(false);
        })
        .catch(() => {
          setIsPaused(true);
        });
    }
  };

  const togglePlayPause = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = bgVideoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPaused(false);
        })
        .catch((err) => {
          console.warn('Play error:', err);
        });
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const toggleMute = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = bgVideoRef.current;
    if (video) {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
    } else {
      setIsMuted((prev) => !prev);
    }
  };

  const handleReplay = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = bgVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video
      .play()
      .then(() => {
        setIsPaused(false);
      })
      .catch(() => {});
  };

  const handleOpenTrailerModal = () => {
    const video = bgVideoRef.current;
    if (video && !video.paused) {
      video.pause();
      setIsPaused(true);
    }
    setShowTrailer(true);
  };

  const handleCloseTrailerModal = () => {
    setShowTrailer(false);
    const video = bgVideoRef.current;
    if (video && hasTrailerStarted) {
      video
        .play()
        .then(() => {
          setIsPaused(false);
        })
        .catch(() => {});
    }
  };

  // Sync Watchlist
  useEffect(() => {
    if (movie.title) {
      setInList(isInWatchlist(movie.title));
    }
    const handleUpdate = () => {
      if (movie.title) setInList(isInWatchlist(movie.title));
    };
    window.addEventListener('ami-watchlist-updated', handleUpdate);
    return () => window.removeEventListener('ami-watchlist-updated', handleUpdate);
  }, [movie.title]);

  const handleToggleWatchlist = () => {
    const added = toggleWatchlist({
      title: movie.title,
      poster: movie.poster,
      genres: movie.genres,
      rating: movie.rating,
      features: 'Sub • Dub',
    });
    setToastMessage(added ? `Added "${movie.title}" to Watchlist` : `Removed from Watchlist`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Recommendations: Live API movies first, pausing static local catalog when API is active
  const recommendations = useMemo(() => {
    if (allBackendMovies.length > 0) {
      return allBackendMovies
        .filter((m) => (m.Movie || m.title || '').toLowerCase() !== movie.title.toLowerCase())
        .map((m) => ({
          title: m.Movie || m.title,
          poster: m.Poster || m.Image || '/Movie_content/1299334.jpg',
          rating: m.Rating || '8.5',
          year: m.Year || '2023',
        }))
        .slice(0, 4);
    }
    return Object.values(MOVIE_DATABASE)
      .filter((m) => m.title.toLowerCase() !== movie.title.toLowerCase())
      .slice(0, 4);
  }, [movie.title, allBackendMovies]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-orange-500 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <i className="material-icons text-orange-400 text-base">bookmark</i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                <i className="material-icons text-orange-500 text-lg">movie</i>
                {movie.title} — Official Trailer
              </h3>
              <button
                onClick={handleCloseTrailerModal}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close trailer"
              >
                <i className="material-icons text-lg">close</i>
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <video key={`modal-${effectiveTrailer}`} controls autoPlay className="w-full h-full object-cover">
                <source src={effectiveTrailer} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Backdrop & Timed Background Video */}
      <div className="relative w-full min-h-[600px] md:min-h-[680px] flex items-end">
        {/* Background Artwork & Timed Trailer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Static Backdrop Image */}
          <img
            src={movie.backdrop}
            alt={movie.title}
            className={`w-full h-full object-cover object-top filter brightness-[0.38] saturate-[1.1] scale-105 transition-opacity duration-1000 ${
              hasTrailerStarted ? 'opacity-0' : 'opacity-100'
            }`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Movie_content/1299334.jpg';
            }}
          />

          {/* Background Trailer Video */}
          <video
            ref={bgVideoRef}
            key={`bg-${effectiveTrailer}`}
            src={effectiveTrailer}
            muted={isMuted}
            playsInline
            loop
            preload="auto"
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
            onEnded={() => setIsPaused(true)}
            onVolumeChange={() => setIsMuted(bgVideoRef.current?.muted ?? true)}
            className={`absolute inset-0 w-full h-full object-cover filter brightness-[0.45] saturate-[1.15] scale-105 transition-opacity duration-1000 ${
              hasTrailerStarted ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />
        </div>

        {/* Ambient Video Control Badge in bottom right - elevated to z-30 pointer-events-auto */}
        <div className="absolute bottom-6 right-4 sm:right-6 md:right-12 z-30 flex items-center gap-2 pointer-events-auto">
          {!hasTrailerStarted && countdown > 0 ? (
            <button
              type="button"
              onClick={startTrailerImmediately}
              className="px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-orange-500/50 hover:border-orange-400 text-neutral-100 hover:text-white text-xs flex items-center gap-2.5 transition-all shadow-2xl cursor-pointer group"
              title="Click to start trailer immediately"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="font-semibold">Trailer begins in {countdown}s</span>
              <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded border border-orange-500/40 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                Play Now
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 pr-2 border-r border-white/15 hidden sm:flex">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span className="truncate max-w-[140px] text-neutral-200">
                  {isPaused ? 'Trailer Paused' : 'Official Trailer'}
                </span>
              </div>
              <button
                type="button"
                onClick={togglePlayPause}
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white hover:text-orange-400 transition-all cursor-pointer flex items-center justify-center"
                title={isPaused ? 'Resume trailer' : 'Pause trailer'}
                aria-label={isPaused ? 'Resume trailer' : 'Pause trailer'}
              >
                <i className="material-icons text-base leading-none">
                  {isPaused ? 'play_arrow' : 'pause'}
                </i>
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white hover:text-orange-400 transition-all cursor-pointer flex items-center justify-center"
                title={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
              >
                <i className="material-icons text-base leading-none">
                  {isMuted ? 'volume_off' : 'volume_up'}
                </i>
              </button>
              <button
                type="button"
                onClick={handleReplay}
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white hover:text-orange-400 transition-all cursor-pointer flex items-center justify-center"
                title="Replay trailer from start"
                aria-label="Replay trailer from start"
              >
                <i className="material-icons text-base leading-none">replay</i>
              </button>
            </div>
          )}
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-12">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <i className="material-icons text-xs">chevron_right</i>
            <Link to="/Movies" className="hover:text-white transition-colors">Movies</Link>
            <i className="material-icons text-xs">chevron_right</i>
            <span className="text-orange-400 font-semibold truncate max-w-[200px]">{movie.title}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            {/* Left: Movie Poster Card */}
            <div className="w-40 sm:w-48 md:w-60 flex-shrink-0 mx-auto md:mx-0">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-neutral-900">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/Movie_content/1299334.jpg';
                  }}
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[11px] font-bold text-orange-400 border border-orange-500/30">
                  ★ {movie.rating}
                </div>
              </div>
            </div>

            {/* Right: Detailed Metadata */}
            <div className="flex-1 min-w-0 flex flex-col justify-end text-left w-full">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mb-2">
                <span className="text-emerald-400 font-bold">{movie.match} Match</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-medium">{movie.year}</span>
                <span className="text-neutral-500">•</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-semibold border border-neutral-700">
                  {movie.age}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-medium">{movie.runtime}</span>
                <span className="text-neutral-500">•</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[11px] font-bold border border-orange-500/30">
                  Ultra HD 4K
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                {movie.title}
              </h1>

              {/* Genres Pills */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-neutral-200 border border-white/10 transition-colors"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <p className="text-neutral-300 text-sm md:text-base leading-relaxed max-w-3xl mb-6">
                {movie.description}
              </p>

              {/* Director & Starring info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-400 mb-6 pb-6 border-b border-neutral-800">
                <div>
                  <span className="text-neutral-500 font-medium">Director: </span>
                  <span className="text-neutral-200 font-semibold">{movie.director}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Starring: </span>
                  <span className="text-neutral-200 font-semibold truncate">
                    {movie.cast.map((c) => c.name).slice(0, 3).join(', ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/Video/${encodeURIComponent(movie.title)}`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/30 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <i className="material-icons text-xl">play_arrow</i>
                  <span>Play Movie</span>
                </Link>

                <button
                  type="button"
                  onClick={handleOpenTrailerModal}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <i className="material-icons text-lg text-orange-400">play_circle_outline</i>
                  <span>Watch Trailer</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWatchlist}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold border backdrop-blur-md flex items-center gap-2 transition-all ${
                    inList
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                  }`}
                  title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  <i className="material-icons text-lg">{inList ? 'bookmark' : 'bookmark_border'}</i>
                  <span>{inList ? 'In Watchlist' : 'Add to List'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Details & Recommendations */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-neutral-800 pb-3 mb-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'overview' ? 'text-orange-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Overview & Audio
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('cast')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'cast' ? 'text-orange-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Cast & Crew ({movie.cast.length})
            {activeTab === 'cast' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Audio & Sound
              </h4>
              <p className="text-sm font-semibold text-white">{movie.audio}</p>
              <p className="text-xs text-neutral-500 mt-1">Dolby Atmos & 5.1 Surround Available</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Subtitles
              </h4>
              <p className="text-sm font-semibold text-white">{movie.subtitles}</p>
              <p className="text-xs text-neutral-500 mt-1">Closed captions (CC) supported</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Resolution & Playback
              </h4>
              <p className="text-sm font-semibold text-white">4K Ultra HD & Full HD 1080p</p>
              <p className="text-xs text-neutral-500 mt-1">Adaptive bitrate streaming enabled</p>
            </div>
          </div>
        )}

        {/* Tab 2: Cast */}
        {activeTab === 'cast' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            {movie.cast.map((c, idx) => {
              const actorName = typeof c === 'string' ? c : c?.name || 'Cast Member';
              const actorRole = typeof c === 'string' ? 'Cast Member' : c?.role || 'Actor';
              const initial = actorName ? actorName.charAt(0).toUpperCase() : 'A';
              return (
                <div
                  key={`${actorName}-${idx}`}
                  className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{actorName}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{actorRole}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recommendations Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <i className="material-icons text-orange-500 text-xl">recommend</i>
              More Like This
            </h3>
            <Link
              to="/Movies"
              className="text-xs md:text-sm font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              Browse All <i className="material-icons text-sm">arrow_forward</i>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {recommendations.map((rec) => (
              <Link
                key={rec.title}
                to={`/Movies/${encodeURIComponent(rec.title)}`}
                className="group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col"
              >
                <div className="aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                  <img
                    src={rec.poster}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/Movie_content/1299334.jpg';
                    }}
                  />
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-orange-400 truncate">
                    {rec.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                    <span className="text-orange-400 font-semibold">★ {rec.rating}</span>
                    <span>{rec.year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movs;
