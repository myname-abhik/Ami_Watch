# Ami Watch — Further Development Plan

## Overview
**Ami Watch** is a modern anime and movie streaming web application built with React, Vite, Tailwind CSS, Swiper, and Video.js. This roadmap outlines key milestones to transform the prototype into a production-grade streaming platform.

---

## Architecture Current State
- **Frontend**: React 19 (SPA), Vite 6, React Router DOM 7, Tailwind CSS, Swiper 11, Video.js 8, GSAP & Lenis smooth scrolling.
- **Routing**:
  - `/` — Homepage with Hero Carousel & Top Picks.
  - `/Movies` — Movie browsing & animated preview.
  - `/Movies/:id` — Detailed movie overview, metadata, cast & trailer modal.
  - `/Video/:id` — Fullscreen video player with HLS/MP4 playback.
  - `/Pricing` — Subscription tier selection.
  - `/Login` & `/Signup` — Authentication flows.
- **Data Layer**: Local JSON catalogue (`Movies_info.json`, `Movie_pickup.json`) with resilient fallback to remote microservices.

---

## Roadmap & Milestones

### Phase 1: Navigation, Search & Discovery
- [x] **Live Search Bar** *(Completed)*:
  - Implemented real-time fuzzy search in `Navbar.jsx` with 250ms debouncing.
  - Search overlay dropdown displaying posters, genre tags, IMDb rating, and direct navigation to `/Movies/:id`.
  - Empty state with suggestion links, clear button (✕), click-outside closing, and ESC key support.
- [x] **Genre & Category Filtering** *(Completed)*:
  - Added interactive genre filter tabs, Sub/Dub filter, and sorting (Top Rated, A-Z, Latest) in `/Movies` (`Mov.jsx`).
  - Added curated "Anime & Fantasy Masterpieces" shelf and Streaming CTA banner on the homepage.
- [x] **Browse Dropdown Menu** *(Completed)*:
  - Populated interactive `Browse` menu in the navigation bar with quick category navigation (Anime, Gangster, Sci-Fi, Animation, Drama).

### Phase 2: Video Player Enhancements (`/Video/:id`)
- [x] **Quality Indicator & Player UI** *(Completed)*:
  - Styled video frame with glowing shadow and back button.
  - Multi-source fallback (HLS index.m3u8 with graceful MP4 fallback).
  - Added "Up Next" recommended titles row underneath player.

### Phase 3: User Personalization & State Management
- [x] **Watchlist / Favorites System** *(Completed)*:
  - Full local storage watchlist utility (`src/utils/watchlist.js`).
  - Interactive "+ Add to List" / "✓ In Watchlist" toggle on carousel and movie detail pages.
  - Dedicated `/Watchlist` page with direct play and remove controls.
  - Live watchlist badge count in the navigation bar.

### Phase 4: Authentication & Local Session
- [x] **User Session Management** *(Completed)*:
  - Functional login and signup flows with instant local session persistence.
  - Real-time user greeting in navbar with one-click "Signout".
  - Google Sign-In and OTP simulation.

### Phase 5: Monetization & Subscription Management
- [x] **Interactive Plan Checkout** *(Completed)*:
  - Interactive subscription modal on `/Pricing` with plan breakdown, simulated payment gateway selection (Card, Google Pay, PayPal), and active plan management.
  - Tier-based access control (e.g., 4K streaming for 12-Month plan, single device limits for 3-Month plan).

### Phase 6: Performance, PWA & SEO
- [ ] **Image & Video Optimization**:
  - Use responsive WebP/AVIF formats with lazy-loading for movie posters.
  - Preload hero slide images for instant Largest Contentful Paint (LCP).
- [ ] **Progressive Web App (PWA)**:
  - Add Web App Manifest and service worker for offline shell caching and installability on mobile and desktop.
- [ ] **SEO & Social Sharing**:
  - Dynamic OpenGraph and Twitter cards per movie page using `react-helmet-async`.
  - Structured schema data (`Movie` and `VideoObject` Schema.org JSON-LD).

---

## Recommended Next Steps
1. **Immediate**: Implement the live search dropdown in `Navbar.jsx` and wire up the "Add to List" state.
2. **Short-term**: Connect Firebase Auth for real user login/signup and persist watchlist items.
3. **Mid-term**: Upgrade the Video.js player with custom UI controls and resume playback features.
