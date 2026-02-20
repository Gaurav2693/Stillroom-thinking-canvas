import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Palette, Sparkles, Eraser } from 'lucide-react';
import { Link } from 'react-router';
import { useTheme } from '@/app/context/theme-context';
import { useState } from 'react';

interface MobileFloatingUIProps {
  isClearing: boolean;
  clearProgress: number;
  onClearStart: () => void;
  onClearEnd: () => void;
  strokeColor: string;
  onColorSelect: (color: string) => void;
  onToggleSketch: () => void;
  onToggleModels: () => void;
  onToggleEraser: () => void;
  isSketchModeEnabled: boolean;
  isEraserMode: boolean;
  playClick: () => void;
}

const STROKE_COLORS = [
  { name: 'Charcoal', color: 'rgba(60, 60, 65, 0.85)' },
  { name: 'Slate Blue', color: 'rgba(100, 115, 145, 0.85)' },
  { name: 'Forest', color: 'rgba(85, 110, 90, 0.85)' },
  { name: 'Rust', color: 'rgba(145, 90, 75, 0.85)' },
  { name: 'Purple', color: 'rgba(120, 85, 145, 0.85)' },
  { name: 'Coral', color: 'rgba(220, 110, 95, 0.85)' },
];

const DARK_STROKE_COLORS = [
  { name: 'Charcoal', color: 'rgba(200, 200, 210, 0.85)' },
  { name: 'Slate Blue', color: 'rgba(150, 170, 200, 0.85)' },
  { name: 'Forest', color: 'rgba(130, 160, 140, 0.85)' },
  { name: 'Rust', color: 'rgba(190, 130, 110, 0.85)' },
  { name: 'Purple', color: 'rgba(180, 140, 200, 0.85)' },
  { name: 'Coral', color: 'rgba(255, 150, 130, 0.85)' },
];

export function ThinkingCanvasMobileFloatingUI({
  isClearing,
  clearProgress,
  onClearStart,
  onClearEnd,
  strokeColor,
  onColorSelect,
  onToggleSketch,
  onToggleModels,
  onToggleEraser,
  isSketchModeEnabled,
  isEraserMode,
  playClick,
}: MobileFloatingUIProps) {
  const { theme } = useTheme();
  const [showSketchMenu, setShowSketchMenu] = useState(false);

  const bgColor = theme === 'dark' 
    ? 'rgba(30, 30, 30, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)';
  
  const borderColor = theme === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(20, 20, 20, 0.1)';
  
  const iconColor = theme === 'dark' ? '#E6E9F0' : '#14171F';

  const availableColors = theme === 'dark' ? DARK_STROKE_COLORS : STROKE_COLORS;

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 safe-area-top">
        <div 
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: bgColor,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          {/* Back Button */}
          <Link to="/canvas" onClick={() => playClick()}>
            <motion.button
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft 
                className="w-5 h-5" 
                style={{ color: iconColor }} 
                strokeWidth={2.5} 
              />
            </motion.button>
          </Link>

          {/* Title */}
          <div className="flex-1 text-center">
            <h1 
              className="font-['Cambay',sans-serif] text-[15px] font-semibold"
              style={{ color: iconColor }}
            >
              Thinking Canvas
            </h1>
          </div>

          {/* Clear Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearEnd();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearEnd();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearStart();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearEnd();
            }}
            onMouseLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearEnd();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full relative overflow-hidden active:scale-90 transition-transform"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              pointerEvents: 'auto',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <RotateCcw 
              className="w-5 h-5 relative z-10" 
              style={{ color: iconColor, pointerEvents: 'none' }} 
              strokeWidth={2.5} 
            />
            {isClearing && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `conic-gradient(${
                    theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
                  } ${clearProgress}%, transparent ${clearProgress}%)`,
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Left - Thinking Models Button (Standalone) */}
      <div className="fixed bottom-6 left-6 z-40">
        <motion.button
          onClick={() => {
            playClick();
            onToggleModels();
          }}
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
          style={{
            backgroundColor: bgColor,
            border: `2px solid ${borderColor}`,
          }}
          whileTap={{ scale: 0.9 }}
        >
          <Sparkles 
            className="w-6 h-6" 
            style={{ color: theme === 'dark' ? '#9B8CFF' : '#5A5CE6' }} 
            strokeWidth={2.5} 
          />
        </motion.button>
      </div>

      {/* Bottom Right - Sketch Tools FAB Group */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Main FAB */}
          <motion.button
            onClick={() => {
              playClick();
              setShowSketchMenu(!showSketchMenu);
            }}
            className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg relative"
            style={{
              backgroundColor: showSketchMenu || isSketchModeEnabled
                ? (theme === 'dark' ? '#5CE1E6' : '#1FB6C1')
                : bgColor,
              border: `2px solid ${showSketchMenu || isSketchModeEnabled ? (theme === 'dark' ? '#5CE1E6' : '#1FB6C1') : borderColor}`,
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Palette 
              className="w-6 h-6" 
              style={{ color: (showSketchMenu || isSketchModeEnabled) ? 'white' : (theme === 'dark' ? '#5CE1E6' : '#1FB6C1') }} 
              strokeWidth={2.5} 
            />
            {isSketchModeEnabled && !showSketchMenu && (
              <div
                className="absolute top-0 right-0 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: theme === 'dark' ? '#5CE1E6' : '#1FB6C1',
                  borderColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                }}
              />
            )}
          </motion.button>

          {/* Sketch Menu Items */}
          <AnimatePresence>
            {showSketchMenu && (
              <motion.div
                className="absolute bottom-20 right-0 flex flex-col gap-3"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {/* Sketch Mode Toggle */}
                <motion.button
                  onClick={() => {
                    playClick();
                    onToggleSketch();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg"
                  style={{
                    backgroundColor: isSketchModeEnabled
                      ? (theme === 'dark' ? 'rgba(92, 225, 230, 0.15)' : 'rgba(92, 225, 230, 0.2)')
                      : bgColor,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1.5px solid ${isSketchModeEnabled ? (theme === 'dark' ? '#5CE1E6' : '#1FB6C1') : borderColor}`,
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  <span 
                    className="font-['Cambay',sans-serif] text-[14px] font-medium"
                    style={{ color: isSketchModeEnabled ? (theme === 'dark' ? '#5CE1E6' : '#1FB6C1') : iconColor }}
                  >
                    Sketch {isSketchModeEnabled ? 'ON' : 'OFF'}
                  </span>
                </motion.button>

                {/* Eraser Toggle */}
                <motion.button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playClick();
                    onToggleEraser();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playClick();
                    onToggleEraser();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg"
                  style={{
                    backgroundColor: isEraserMode
                      ? (theme === 'dark' ? 'rgba(255, 110, 110, 0.15)' : 'rgba(255, 110, 110, 0.2)')
                      : bgColor,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1.5px solid ${isEraserMode ? (theme === 'dark' ? '#FF8080' : '#E85D5D') : borderColor}`,
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Eraser 
                    className="w-5 h-5" 
                    style={{ color: isEraserMode ? (theme === 'dark' ? '#FF8080' : '#E85D5D') : iconColor, pointerEvents: 'none' }} 
                    strokeWidth={2.5} 
                  />
                  <span 
                    className="font-['Cambay',sans-serif] text-[14px] font-medium"
                    style={{ color: isEraserMode ? (theme === 'dark' ? '#FF8080' : '#E85D5D') : iconColor, pointerEvents: 'none' }}
                  >
                    Eraser
                  </span>
                </motion.button>

                {/* Color Palette */}
                <motion.div
                  className="flex flex-col gap-2 px-3 py-3 rounded-2xl shadow-lg w-[140px]"
                  style={{
                    backgroundColor: bgColor,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${borderColor}`,
                  }}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span 
                    className="font-['Cambay',sans-serif] text-[12px] font-medium opacity-60 px-1"
                    style={{ color: iconColor }}
                  >
                    Color
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {availableColors.map((color) => (
                      <motion.button
                        key={color.name}
                        onClick={() => {
                          playClick();
                          onColorSelect(color.color);
                        }}
                        className="w-9 h-9 rounded-full border-2"
                        style={{
                          backgroundColor: color.color,
                          borderColor: strokeColor === color.color 
                            ? (theme === 'dark' ? '#5CE1E6' : '#1FB6C1')
                            : 'transparent',
                        }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}