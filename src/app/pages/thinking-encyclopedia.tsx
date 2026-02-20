import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, Lightbulb, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { THINKING_MODELS, type ThinkingModel } from '@/app/data/thinking-models';
import { useTheme } from '@/app/context/theme-context';
import { useSound } from '@/app/context/sound-context';
import ModelDiagram from '@/app/components/model-diagram';

export default function ThinkingEncyclopedia() {
  const { theme } = useTheme();
  const { playClick } = useSound();
  const [selectedModel, setSelectedModel] = useState<ThinkingModel | null>(null);

  const handleModelClick = (model: ThinkingModel) => {
    playClick();
    setSelectedModel(model);
  };

  const handleBackToOverview = () => {
    playClick();
    setSelectedModel(null);
  };

  // Theme-aware colors
  const outerBg = theme === 'dark' ? 'bg-white' : 'bg-black';
  const cardBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';

  return (
    <div className={`${outerBg} min-h-screen w-full flex items-start justify-center py-[74px]`}>
      <div className="relative w-[1315px] h-[893px]">
        {/* Main Black Card */}
        <div className={`absolute ${cardBg} inset-0 overflow-hidden`} />
        
        {/* Navigation Sidebar */}
        
        {/* Header */}
        
        {/* Scrollable content area */}
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-premium">
          <div className="relative min-h-full px-16 py-8">
            <AnimatePresence mode="wait">
              {!selectedModel ? (
                <OverviewGrid 
                  key="overview"
                  models={THINKING_MODELS}
                  onModelClick={handleModelClick}
                />
              ) : (
                <ModelDetailView 
                  key="detail"
                  model={selectedModel}
                  onBack={handleBackToOverview}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Grid Component
function OverviewGrid({ 
  models, 
  onModelClick 
}: { 
  models: ThinkingModel[];
  onModelClick: (model: ThinkingModel) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {models.map((model, index) => (
        <motion.button
          key={model.id}
          onClick={() => onModelClick(model)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.08,
            ease: [0.23, 1, 0.32, 1] 
          }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          className="group relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-left transition-all duration-300 hover:border-[var(--foreground)]/20"
        >
          {/* Model Icon */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center">
              <Lightbulb size={24} className="text-[var(--accent-foreground)]" />
            </div>
          </div>

          {/* Model Name */}
          <h3 
            className="mb-3"
            style={{ 
              fontFamily: 'Caladea, serif', 
              fontSize: '22px',
              fontWeight: 400,
              lineHeight: 1.3
            }}
          >
            {model.name}
          </h3>

          {/* Purpose Statement */}
          <p 
            className="text-[var(--muted-foreground)]"
            style={{ 
              fontFamily: 'Cambay, sans-serif',
              fontSize: '15px',
              lineHeight: 1.6
            }}
          >
            {model.description}
          </p>

          {/* Hover Indicator */}
          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-8 h-8 rounded-full bg-[var(--foreground)] flex items-center justify-center">
              <ArrowLeft size={16} className="text-[var(--background)] rotate-180" />
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

// Model Detail View Component
function ModelDetailView({ 
  model, 
  onBack 
}: { 
  model: ThinkingModel;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Back Button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8 flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        style={{ fontFamily: 'Cambay, sans-serif' }}
      >
        <ArrowLeft size={20} />
        Back to overview
      </motion.button>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
        {/* Model Title & Overview - Large */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="col-span-12 lg:col-span-8 row-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <Lightbulb size={32} className="text-[var(--accent-foreground)]" />
            </div>
            <div className="flex-1">
              <h2 
                className="mb-3"
                style={{ 
                  fontFamily: 'Caladea, serif', 
                  fontSize: '36px',
                  fontWeight: 400,
                  lineHeight: 1.2
                }}
              >
                {model.name}
              </h2>
              <p 
                className="text-[var(--muted-foreground)]"
                style={{ 
                  fontFamily: 'Cambay, sans-serif',
                  fontSize: '17px',
                  lineHeight: 1.6
                }}
              >
                {model.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Visual Diagram Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="col-span-12 lg:col-span-4 row-span-2 bg-[var(--card)] border border-[var(--border)] border-dashed rounded-2xl p-8 flex flex-col items-center justify-center"
        >
          <ModelDiagram model={model} />
        </motion.div>

        {/* How to Think Through It */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="col-span-12 lg:col-span-6 row-span-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={24} className="text-[var(--foreground)]" />
            <h3 
              style={{ 
                fontFamily: 'Caladea, serif', 
                fontSize: '20px',
                fontWeight: 400
              }}
            >
              How to think through it
            </h3>
          </div>
          <div className="space-y-4">
            {model.steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div 
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center"
                  style={{ 
                    fontFamily: 'Cambay, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  {index + 1}
                </div>
                <p 
                  className="flex-1 pt-0.5"
                  style={{ 
                    fontFamily: 'Cambay, sans-serif',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: 'var(--foreground)'
                  }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* When to Use */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="col-span-12 lg:col-span-6 row-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-[var(--foreground)]" />
            <h3 
              style={{ 
                fontFamily: 'Caladea, serif', 
                fontSize: '20px',
                fontWeight: 400
              }}
            >
              When to use
            </h3>
          </div>
          <p 
            className="text-[var(--foreground)] mb-6"
            style={{ 
              fontFamily: 'Cambay, sans-serif',
              fontSize: '15px',
              lineHeight: 1.7
            }}
          >
            {model.whenToUse}
          </p>

          <div className="h-px bg-[var(--border)] my-6" />

          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-[var(--muted-foreground)]" />
            <h3 
              style={{ 
                fontFamily: 'Caladea, serif', 
                fontSize: '20px',
                fontWeight: 400,
                color: 'var(--muted-foreground)'
              }}
            >
              When not to use
            </h3>
          </div>
          <p 
            className="text-[var(--muted-foreground)]"
            style={{ 
              fontFamily: 'Cambay, sans-serif',
              fontSize: '15px',
              lineHeight: 1.7
            }}
          >
            {model.whenNotToUse}
          </p>
        </motion.div>

        {/* Shape Guidance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="col-span-12 lg:col-span-6 row-span-1 bg-[var(--card)] border border-[var(--border)] border-dashed rounded-2xl p-6 flex items-center justify-between"
        >
          <p 
            className="text-[var(--muted-foreground)]"
            style={{ 
              fontFamily: 'Cambay, sans-serif',
              fontSize: '14px'
            }}
          >
            Shape guidance & visual tools
          </p>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)]" />
            <div className="w-8 h-8 rounded bg-[var(--muted)]" />
            <div className="w-8 h-8 rounded bg-[var(--muted)]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>
        </motion.div>

        {/* Apply to Canvas CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          disabled
          className="col-span-12 lg:col-span-12 row-span-1 bg-[var(--foreground)] text-[var(--background)] border border-[var(--foreground)] rounded-2xl p-6 flex items-center justify-center gap-3 opacity-40 cursor-not-allowed"
        >
          <Sparkles size={20} />
          <span 
            style={{ 
              fontFamily: 'Cambay, sans-serif',
              fontSize: '15px',
              fontWeight: 500
            }}
          >
            Apply to canvas (coming soon)
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}