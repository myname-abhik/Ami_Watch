// import React from 'react'

// const Signup = () => {
//   return (
//     // <div>Signup</div>
    
//   )
// }

// export default Signup




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../utils/watchlist';

// Main App component
const Signup = () =>  {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false); // State to toggle between login and signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false); // New state to control OTP section visibility

  const images = [
    '/Movie_content/1299334.jpg',
    '/Movie_content/20th_Century_Girl.jpg',
    '/Movie_content/spirited-away-4k-upscaled-samples-v0-7uhyv9zj4dea1.webp',
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Handle form submission (Login/Signup)
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (isLogin) {
      if (email && password) {
        const username = email.split('@')[0];
        setCurrentUser({ email, name: username });
        setMessage(`Welcome back, ${username}! Redirecting...`);
        setTimeout(() => navigate('/'), 1200);
      } else {
        setMessage('Please enter both email and password.');
      }
    } else {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
      if (email && password && confirmPassword) {
        const username = email.split('@')[0];
        setCurrentUser({ email, name: username });
        setMessage('Account created! Welcome to Ami Watch. Redirecting...');
        setTimeout(() => navigate('/'), 1200);
      } else {
        setMessage('Please fill in all fields.');
      }
    }
  };

  // Handle Verify OTP button click
  const handleVerifyOtp = () => {
    if (otp) {
      const username = email ? email.split('@')[0] : 'Member';
      setCurrentUser({ email: email || 'user@amiwatch.com', name: username });
      setMessage('OTP verified! Redirecting to home...');
      setTimeout(() => navigate('/'), 1200);
    } else {
      setMessage('Please enter the OTP.');
    }
  };

  // Handle Google Sign-in
  const handleGoogleSignIn = () => {
    setCurrentUser({ email: 'google.user@amiwatch.com', name: 'Google Member' });
    setMessage('Signed in with Google! Redirecting...');
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black pt-24 pb-16 px-4 font-inter relative">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10 brightness-40 blur-md pointer-events-none"
      >
        <source src="https://videos.pexels.com/video-files/3129540/3129540-uhd_2560_1440_30fps.mp4" type="video/mp4" />
      </video>
      <div className="flex flex-col md:flex-row bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full">
        {/* Left Section - Image Slider */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-8 relative">
          <img
            src={images[currentImageIndex]}
            alt={`Slider Image ${currentImageIndex + 1}`}
            className="rounded-lg object-cover w-full h-full transition-opacity duration-1000 ease-in-out"
            // Adding onError for fallback if image fails to load
            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x600/000000/FFFFFF?text=Image+Load+Error"; }}
          />
          {/* Optional: Add dots for slider indication */}
          <div className="absolute bottom-10 flex space-x-2">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`block w-3 h-3 rounded-full ${
                  currentImageIndex === idx ? 'bg-orange-500' : 'bg-gray-400'
                } cursor-pointer`}
                onClick={() => setCurrentImageIndex(idx)}
              ></span>
            ))}
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-white text-3xl font-bold mb-2 text-center">
            Welcome <span role="img" aria-label="sparkles">✨</span>
          </h2>
          <p className="text-gray-400 mb-8 text-center">
            Please enter your email & password
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="jhondoe@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {message && (
              <p className="text-center text-sm font-medium text-red-400">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              {isLogin ? 'Sign In now' : 'Sign Up now'}
            </button>
          </form>

          {/* OTP Section - now conditionally visible after a login attempt */}
          {isLogin && showOtpInput && (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="otp" className="block text-gray-300 text-sm font-medium mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <button
                  onClick={handleVerifyOtp}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                  Verify OTP
                </button>
              </div>
            </div>
          )}

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          {/* Sign in with Google */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.27c-.24 0-.48-.02-.72-.03l-4.12 4.12c-.11.11-.23.2-.36.27-.13.07-.27.1-.4.1-.19 0-.37-.05-.54-.15-.17-.1-.3-.24-.4-.41-.1-.17-.15-.36-.15-.56 0-.2.05-.39.15-.56.1-.17.23-.31.4-.41.17-.1.35-.15.54-.15.13 0 .27.03.4.1.13.07.25.16.36.27l4.12-4.12c.01-.24.03-.48.03-.72 0-2.43-1.66-4.48-3.92-5.18l-1.08 1.08c1.37.53 2.37 1.83 2.37 3.38 0 .24-.02.48-.03.72zm-1.08 1.08c-.01.24-.03.48-.03.72 0 2.43 1.66 4.48 3.92 5.18l1.08-1.08c-1.37-.53-2.37-1.83-2.37-3.38 0-.24.02-.48.03-.72zm-1.08 1.08c-.01.24-.03.48-.03.72 0 2.43 1.66 4.48 3.92 5.18l1.08-1.08c-1.37-.53-2.37-1.83-2.37-3.38 0-.24.02-.48.03-.72zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22.32c-5.61 0-10.18-4.57-10.18-10.18S6.39 1.82 12 1.82s10.18 4.57 10.18 10.18-4.57 10.18-10.18 10.18z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(''); // Clear message when toggling
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setOtp('');
                setShowOtpInput(false); // Hide OTP section when toggling
              }}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium focus:outline-none"
            >
              {isLogin ? 'Don\'t have an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Signup
