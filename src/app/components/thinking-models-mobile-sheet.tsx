import { motion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useTheme } from '@/app/context/theme-context';
import { THINKING_MODELS, type ThinkingModel } from '@/app/data/thinking-models';

interface MobileModelSheetProps {
  onSelectModel: (modelId: string) => void;
  onClose: () => void;
  activeModelId: string | null;
  playClick: () => void;
}

export function ThinkingModelsMobileSheet({ onSelectModel, onClose, activeModelId, playClick }: MobileModelSheetProps) {
  const { theme } = useTheme();

  const bgColor = theme === 'dark' 
    ? 'rgba(20, 20, 20, 0.98)' 
    : 'rgba(250, 250, 250, 0.98)';
  
  const borderColor = theme === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(20, 20, 20, 0.1)';
  
  const labelColor = theme === 'dark' ? '#E6E9F0' : '#14171F';
  const descColor = theme === 'dark' ? '#9AA3B2' : '#5C6475';

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
          maxHeight: '85vh',
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#9B8CFF' }} />
            <h3
              className="font-['Cambay',sans-serif] text-[17px] font-semibold"
              style={{ color: labelColor }}
            >
              Thinking Models
            </h3>
          </div>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5" style={{ color: labelColor, opacity: 0.6 }} />
          </button>
        </div>

        {/* Models Grid */}
        <div className="space-y-3">
          {THINKING_MODELS.map((model) => {
            const isActive = activeModelId === model.id;

            return (
              <motion.button
                key={model.id}
                onClick={() => {
                  playClick();
                  onSelectModel(model.id);
                  onClose();
                }}
                className="w-full text-left p-4 rounded-xl"
                style={{
                  backgroundColor: isActive 
                    ? (theme === 'dark' ? 'rgba(155, 140, 255, 0.12)' : 'rgba(155, 140, 255, 0.15)')
                    : (theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                  border: `1.5px solid ${isActive ? (theme === 'dark' ? '#9B8CFF' : '#5A5CE6') : borderColor}`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4
                      className="font-['Cambay',sans-serif] text-[15px] font-semibold mb-1"
                      style={{ 
                        color: isActive ? (theme === 'dark' ? '#9B8CFF' : '#5A5CE6') : labelColor 
                      }}
                    >
                      {model.name}
                    </h4>
                    <p
                      className="font-['Cambay',sans-serif] text-[13px] leading-relaxed"
                      style={{ color: descColor }}
                    >
                      {model.description}
                    </p>
                  </div>
                  {isActive && (
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: theme === 'dark' ? '#9B8CFF' : '#5A5CE6',
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>

                {/* Suggested Shapes Preview */}
                {model.suggestedShapes && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <span
                      className="font-['Cambay',sans-serif] text-[11px] font-medium uppercase tracking-wider"
                      style={{ color: labelColor, opacity: 0.4 }}
                    >
                      Shapes:
                    </span>
                    <div className="flex gap-1.5">
                      {model.suggestedShapes.map((shape) => (
                        <div
                          key={shape}
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          <span
                            className="font-['Cambay',sans-serif] text-[10px] font-medium capitalize"
                            style={{ color: labelColor, opacity: 0.6 }}
                          >
                            {shape}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Info Footer */}
        <div 
          className="mt-6 p-3 rounded-lg"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(92, 225, 230, 0.08)' : 'rgba(92, 225, 230, 0.12)',
            border: `1px solid ${theme === 'dark' ? 'rgba(92, 225, 230, 0.2)' : 'rgba(92, 225, 230, 0.3)'}`,
          }}
        >
          <p
            className="font-['Cambay',sans-serif] text-[12px] leading-relaxed"
            style={{ color: theme === 'dark' ? '#5CE1E6' : '#1FB6C1' }}
          >
            Select a thinking model to organize your canvas with guided structure and suggested shapes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
