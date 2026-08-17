import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full text-slate-800">
      {/* Ambient Gradient Blobs (Agivant Logo Inspired Palette) */}
      <div className="bg-ambient-blobs">
        <div className="blob-blue" />
        <div className="blob-red" />
        <div className="blob-lavender" />
      </div>

      {/* Main Layout Grid */}
      <div className="relative z-10 flex min-h-screen p-4 gap-6 items-start">
        {/* Left Floating Sticky Sidebar */}
        <Sidebar />

        {/* Right Content Area */}
        <main className="flex-1 flex flex-col min-w-0 max-w-7xl">
          <Navbar />
          <div className="flex-1 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
