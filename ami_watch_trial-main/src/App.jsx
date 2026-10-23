import { useEffect } from 'react'
import Lenis from "@studio-freight/lenis";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './Pages_css/App.css'
import Home from './Pages/Home'
import Navbar from './component/Navbar';
import Footer from './component/Footer';
import Mov from './component/Mov';
import Signup from './component/Signup';
import Login from './component/Login';
import Pricing from './component/Pricing';
import Movs from './component/Movs';
import Page1 from './component/Page1';
import Watchlist from './component/Watchlist';
import ScrollToTop from './component/ScrollToTop';

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, // Adjusts smoothness
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
      direction: "vertical",
      smooth: true,
      smoothTouch: false,
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      window.lenis = null;
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Movies" element={<Mov />} />
        <Route path="/Pricing" element={<Pricing />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Watchlist" element={<Watchlist />} />
        <Route path="/Movies/:id" element={<Movs />} />
        <Route path="/Video/:id" element={<Page1 />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
