import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, X } from 'lucide-react';
import { useTheme } from '@/app/context/theme-context';

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface ColorGroup {
  name: string;
  colors: { hex: string; name: string }[];
}

const colorGroups: ColorGroup[] = [
  {
    name: 'Base Inks',
    colors: [
      { hex: '#14171F', name: 'Midnight' },
      { hex: '#E6E9F0', name: 'Cloud' },
      { hex: '#5C6475', name: 'Slate' },
      { hex: '#9AA3B2', name: 'Silver' },
      { hex: '#2A3148', name: 'Dusk' },
    ],
  },
  {
    name: 'Primary Thinking',
    colors: [
      { hex: '#5CE1E6', name: 'Cyan' },
      { hex: '#1FB6C1', name: 'Teal' },
      { hex: '#5A5CE6', name: 'Indigo' },
      { hex: '#9B8CFF', name: 'Lavender' },
      { hex: '#3B82F6', name: 'Blue' },
    ],
  },
  {
    name: 'Secondary',
    colors: [
      { hex: '#A7F3A1', name: 'Mint' },
      { hex: '#5FBF8E', name: 'Emerald' },
      { hex: '#4FB3A6', name: 'Seafoam' },
      { hex: '#8FAE7D', name: 'Sage' },
    ],
  },
  {
    name: 'Emphasis',
    colors: [
      { hex: '#F5C77A', name: 'Gold' },
      { hex: '#D4A24F', name: 'Amber' },
      { hex: '#FF8A7A', name: 'Coral' },
      { hex: '#E36B5D', name: 'Terracotta' },
    ],
  },
  {
    name: 'Meta',
    colors: [
      { hex: '#B38CFF', name: 'Purple' },
      { hex: '#6EE7C8', name: 'Aqua' },
      { hex: '#F472B6', name: 'Pink' },
    ],
  },
];

// Flatten all colors for single-line desktop view
const allColors = colorGroups.flatMap(group => group.colors);

export function SketchColorPaletteRedesign({ selectedColor, onColorSelect, isMobile = false, onClose }: ColorPaletteProps) {
  const { theme } = useTheme();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const labelColor = theme === 'dark' ? '#E6E9F0' : '#14171F';
  const borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const bgColor = theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(250, 250, 250, 0.95)';

  // Mobile: Bottom sheet with grouped colors
  if (isMobile) {
    return (
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/40 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <div
          className="rounded-t-3xl px-5 pt-4 pb-8"
          style={{
            backgroundColor: bgColor,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: `1px solid ${borderColor}`,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: labelColor, opacity: 0.2 }}
            />
          </div>

          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-['Cambay',sans-serif] text-[15px] font-semibold"
              style={{ color: labelColor }}
            >
              Sketch Colors
            </h3>
            <button onClick={onClose} className="p-1">
              <X className="w-5 h-5" style={{ color: labelColor, opacity: 0.6 }} />
            </button>
          </div>

          {/* Color Groups */}
          <div className="space-y-4">
            {colorGroups.map((group) => {
              const isExpanded = expandedGroup === group.name || expandedGroup === null;

              return (
                <div key={group.name}>
                  {/* Group Header */}
                  <button
                    onClick={() => setExpandedGroup(isExpanded && expandedGroup !== null ? null : group.name)}
                    className="flex items-center justify-between w-full mb-2"
                  >
                    <span
                      className="font-['Cambay',sans-serif] text-[11px] font-medium uppercase tracking-wider"
                      style={{ color: labelColor, opacity: 0.5 }}
                    >
                      {group.name}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        className="w-3.5 h-3.5"
                        style={{ color: labelColor, opacity: 0.3 }}
                      />
                    </motion.div>
                  </button>

                  {/* Colors */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-3">
                          {group.colors.map((color) => {
                            const isActive = selectedColor === color.hex;

                            return (
                              <button
                                key={color.hex}
                                onClick={() => {
                                  onColorSelect(color.hex);
                                  onClose?.();
                                }}
                                className="flex flex-col items-center gap-1"
                              >
                                <div className="relative">
                                  <motion.div
                                    className="rounded-full"
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      backgroundColor: color.hex,
                                      border: isActive ? `3px solid ${color.hex}` : `1px solid ${borderColor}`,
                                      opacity: isActive ? 1 : 0.9,
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                  />
                                  {isActive && (
                                    <motion.div
                                      className="absolute inset-0 rounded-full"
                                      style={{
                                        border: `2px solid ${theme === 'dark' ? 'white' : 'black'}`,
                                        opacity: 0.3,
                                      }}
                                      initial={{ scale: 0.8 }}
                                      animate={{ scale: 1.1 }}
                                      transition={{ duration: 0.2 }}
                                    />
                                  )}
                                </div>
                                <span
                                  className="font-['Cambay',sans-serif] text-[10px] font-medium"
                                  style={{ color: labelColor, opacity: 0.6 }}
                                >
                                  {color.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // Desktop: Single horizontal line
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-full"
      style={{
        backgroundColor: bgColor,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
      }}
    >
      {allColors.map((color, index) => {
        const isActive = selectedColor === color.hex;

        return (
          <div key={`${color.hex}-${index}`} className="relative group">
            <motion.button
              onClick={() => onColorSelect(color.hex)}
              className="rounded-full relative"
              style={{
                width: '32px',
                height: '32px',
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              {/* Active ring */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid ${color.hex}`,
                    opacity: 0.4,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.4 }}
                  transition={{ duration: 0.15 }}
                />
              )}

              {/* Color swatch */}
              <div
                className="absolute rounded-full"
                style={{
                  backgroundColor: color.hex,
                  top: isActive ? '3px' : '1px',
                  left: isActive ? '3px' : '1px',
                  right: isActive ? '3px' : '1px',
                  bottom: isActive ? '3px' : '1px',
                  border: `1px solid ${borderColor}`,
                }}
              />
            </motion.button>

            {/* Tooltip on hover */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${borderColor}`,
              }}
            >
              <p className="font-['Cambay',sans-serif] text-[11px]" style={{ color: labelColor }}>
                {color.name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
