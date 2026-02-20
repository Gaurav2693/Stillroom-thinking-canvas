/**
 * ============================================================================
 * STILLROOM Canvas — Standalone Entry Point
 * ============================================================================
 * 
 * This file wraps the Stillroom thinking canvas as a fully self-contained,
 * standalone deployable application. It provides its own context providers,
 * routing, and a minimal standalone header — zero portfolio dependencies.
 * 
 * Unlike the portfolio version which renders inside a 1315x893 card shell
 * with Header + NavigationSidebar, this standalone version renders
 * full-viewport for maximum canvas space.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a new Vite + React + TS project
 * 2. Copy all files listed in /src/app/pages/extraction-manifest.tsx
 * 3. Replace all `@/app/` path aliases with relative imports
 * 4. Use this file as your App.tsx entry point
 * 5. Install deps: react-router, motion, lucide-react
 * 6. npm run build && deploy
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserRouter, RouterProvider, Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, BookOpen, ArrowLeft } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/app/context/theme-context';
import { SoundProvider, useSound } from '@/app/context/sound-context';

// Canvas pages (the actual systems — unchanged)
import ThinkingCanvas from '@/app/pages/thinking-canvas';
import ThinkingEncyclopedia from '@/app/pages/thinking-encyclopedia';

// ─── Standalone Minimal Header ───
// Replaces the portfolio Header + NavigationSidebar with a clean floating bar

function StandaloneStillroomHeader() {
  const { theme, toggleTheme } = useTheme();
  const { playClick } = useSound();
  const location = useLocation();

  const isCanvas = location.pathname === '/' || location.pathname === '/canvas';
  const isEncyclopedia = location.pathname === '/encyclopedia';

  const bgColor = theme === 'dark' ? 'rgba(15, 15, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textColor = theme === 'dark' ? '#E6E9F0' : '#14171F';
  const mutedColor = theme === 'dark' ? '#5C6475' : '#9AA3B2';

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-xl"
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: theme === 'dark'
          ? '0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.08)',
      }}
    >
      {/* Brand */}
      <span
        className="font-['Caladea',serif] text-[15px] tracking-[-0.3px] pr-3"
        style={{ color: textColor, borderRight: `1px solid ${borderColor}` }}
      >
        STILLROOM
      </span>

      {/* Navigation */}
      <Link
        to="/"
        onClick={() => playClick()}
        className="px-3 py-1 rounded-full text-[11px] font-['Cambay',sans-serif] uppercase tracking-wider transition-all"
        style={{
          color: isCanvas ? (theme === 'dark' ? '#000' : '#fff') : mutedColor,
          backgroundColor: isCanvas
            ? (theme === 'dark' ? '#E6E9F0' : '#14171F')
            : 'transparent',
        }}
      >
        Canvas
      </Link>

      <Link
        to="/encyclopedia"
        onClick={() => playClick()}
        className="px-3 py-1 rounded-full text-[11px] font-['Cambay',sans-serif] uppercase tracking-wider transition-all flex items-center gap-1.5"
        style={{
          color: isEncyclopedia ? (theme === 'dark' ? '#000' : '#fff') : mutedColor,
          backgroundColor: isEncyclopedia
            ? (theme === 'dark' ? '#E6E9F0' : '#14171F')
            : 'transparent',
        }}
      >
        <BookOpen size={12} />
        Models
      </Link>

      {/* Separator */}
      <div className="w-px h-4" style={{ backgroundColor: borderColor }} />

      {/* Theme toggle */}
      <button
        onClick={() => {
          playClick();
          toggleTheme();
        }}
        className="p-1.5 rounded-full transition-colors hover:opacity-70"
        style={{ color: mutedColor }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}

// ─── Standalone Canvas Wrapper ───
// Renders the ThinkingCanvas full-viewport (no 1315x893 card shell)
// The ThinkingCanvas component already handles isMobile detection
// and when isMobile=true it renders full-viewport. We exploit this
// by wrapping it in a full-viewport container.

function StandaloneCanvasPage() {
  return (
    <div className="w-full h-screen relative">
      <StandaloneStillroomHeader />
      <ThinkingCanvas />
    </div>
  );
}

// ─── Standalone Encyclopedia Wrapper ───

function StandaloneEncyclopediaPage() {
  return (
    <div className="w-full min-h-screen relative">
      <StandaloneStillroomHeader />
      <ThinkingEncyclopedia />
    </div>
  );
}

// ─── Router ───

const standaloneStillroomRouter = createBrowserRouter([
  {
    path: '/',
    Component: StandaloneCanvasPage,
  },
  {
    path: '/canvas',
    Component: StandaloneCanvasPage,
  },
  {
    path: '/encyclopedia',
    Component: StandaloneEncyclopediaPage,
  },
]);

// ─── Standalone App Entry ───

export default function StandaloneStillroom() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.title = 'STILLROOM — Thinking Canvas';
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-['Caladea',serif] text-[32px] tracking-[-0.5px] text-white opacity-90">
            STILLROOM
          </p>
          <p className="font-['Cambay',sans-serif] text-[14px] text-gray-500 tracking-[0.14px]">
            Preparing canvas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SoundProvider>
        <RouterProvider router={standaloneStillroomRouter} />
      </SoundProvider>
    </ThemeProvider>
  );
}
