import React from 'react';
import Navbar from './Navbar';
import appBackground from '../assets/Background.png';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen relative text-slate-900">
      {/* Global background image — shown on every page that uses Layout.
          Login/Signup render outside Layout, so they never get it. */}
      <div className="fixed inset-0 -z-10 bg-slate-50">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: `url(${appBackground})` }}
        />
      </div>

      <Navbar />
      {/* offset for desktop sidebar (w-60) and mobile top bar (h-14) */}
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
