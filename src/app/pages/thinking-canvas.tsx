import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useSpring } from 'motion/react';
import { Maximize2, Minimize2, Square, Copy, Trash2, Circle, Droplet, Zap, Menu, RotateCcw, ArrowLeft, Lightbulb, X, Triangle, ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import { useTheme } from '@/app/context/theme-context';
import { useSound } from '@/app/context/sound-context';
import { Link } from 'react-router';
import { THINKING_MODELS, type ThinkingModel, type LaneConfig } from '@/app/data/thinking-models';
import { SketchColorPaletteRedesign } from '@/app/components/sketch-color-palette-redesign';
import { ThinkingCanvasMobileFloatingUI } from '@/app/components/thinking-canvas-mobile-floating-ui';
import { ThinkingModelsMobileSheet } from '@/app/components/thinking-models-mobile-sheet';

interface Point {
  x: number;
  y: number;
  speed?: number;
}

type StrokeMode = 'calm' | 'quick' | 'focus';
type GlowIntensity = 'subtle';
type CardSize = 'small' | 'medium' | 'large';
type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

interface Stroke {
  points: Point[];
  color: string;
  glowColor: string;
  mode: StrokeMode;
  glow: GlowIntensity;
  isEraser?: boolean;
}

interface Card {
  id: string;
  x: number;
  y: number;
  content: string;
  size: CardSize;
  color: string;
  customWidth?: number;
  customHeight?: number;
}

interface Connection {
  id: string;
  sourceId: string;
  sourceHandle: HandlePosition;
  targetId: string;
  targetHandle: HandlePosition;
  color: string;
}

type ShapeType = 'circle' | 'square' | 'triangle';

interface GeometricShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  color: string;
  glowColor: string;
}

// Rich, warm muted color palette
const CARD_COLORS = [
  { name: 'Pure White', bg: 'rgba(255, 255, 255, 0.95)', text: 'rgba(30, 30, 35, 1)' },
  { name: 'Soft Lavender', bg: 'rgba(240, 235, 255, 0.95)', text: 'rgba(60, 50, 80, 1)' },
  { name: 'Pale Rose', bg: 'rgba(255, 240, 245, 0.95)', text: 'rgba(80, 50, 65, 1)' },
  { name: 'Mint Cream', bg: 'rgba(240, 255, 250, 0.95)', text: 'rgba(40, 70, 60, 1)' },
  { name: 'Sky Blue', bg: 'rgba(240, 248, 255, 0.95)', text: 'rgba(40, 60, 85, 1)' },
  { name: 'Pale Peach', bg: 'rgba(255, 248, 240, 0.95)', text: 'rgba(85, 65, 50, 1)' },
];

const DARK_CARD_COLORS = [
  { name: 'Soft Black', bg: 'rgba(30, 30, 35, 0.95)', text: 'rgba(255, 255, 255, 1)' },
  { name: 'Deep Lavender', bg: 'rgba(50, 45, 65, 0.95)', text: 'rgba(230, 225, 245, 1)' },
  { name: 'Deep Rose', bg: 'rgba(65, 45, 55, 0.95)', text: 'rgba(255, 230, 240, 1)' },
  { name: 'Deep Mint', bg: 'rgba(40, 55, 50, 0.95)', text: 'rgba(230, 250, 240, 1)' },
  { name: 'Deep Sky', bg: 'rgba(40, 50, 65, 0.95)', text: 'rgba(230, 240, 255, 1)' },
  { name: 'Deep Peach', bg: 'rgba(65, 55, 45, 0.95)', text: 'rgba(255, 240, 230, 1)' },
];

// Stroke colors for sketch control panel
const STROKE_COLORS = [
  { name: 'Charcoal', stroke: 'rgba(60, 60, 65, 0.85)', glow: 'rgba(120, 120, 130, 0.4)' },
  { name: 'Slate Blue', stroke: 'rgba(100, 115, 145, 0.85)', glow: 'rgba(150, 170, 200, 0.4)' },
  { name: 'Forest', stroke: 'rgba(85, 110, 90, 0.85)', glow: 'rgba(130, 160, 140, 0.4)' },
  { name: 'Rust', stroke: 'rgba(145, 90, 75, 0.85)', glow: 'rgba(190, 130, 110, 0.4)' },
];

const DARK_STROKE_COLORS = [
  { name: 'Charcoal', stroke: 'rgba(200, 200, 210, 0.85)', glow: 'rgba(160, 160, 180, 0.4)' },
  { name: 'Slate Blue', stroke: 'rgba(150, 170, 200, 0.85)', glow: 'rgba(120, 140, 170, 0.4)' },
  { name: 'Forest', stroke: 'rgba(130, 160, 140, 0.85)', glow: 'rgba(100, 130, 110, 0.4)' },
  { name: 'Rust', stroke: 'rgba(190, 130, 110, 0.85)', glow: 'rgba(160, 100, 80, 0.4)' },
];

// Card size dimensions
const CARD_SIZES = {
  small: { width: 140, height: 100 },
  medium: { width: 200, height: 140 },
  large: { width: 280, height: 200 },
};

const GRID_SIZE = 10;
const CARD_SNAP_GRID = 20;

export default function ThinkingCanvas() {
  const { theme, toggleTheme } = useTheme();
  const { playClick } = useSound();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showSketchControls, setShowSketchControls] = useState(false);
  const [showCardControls, setShowCardControls] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [strokeMode, setStrokeMode] = useState<StrokeMode>('calm');
  const [strokeColor, setStrokeColor] = useState('#14171F'); // Default to Midnight from Base Inks
  const [glowColor, setGlowColor] = useState('');
  
  // Connection state - matches reference implementation
  const [connectingFrom, setConnectingFrom] = useState<{
    cardId: string;
    side: HandlePosition;
  } | null>(null);
  const [previewEnd, setPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deleteProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, { x: number; y: number }>>({});
  const createCardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingCardRef = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clearProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isEraserMode, setIsEraserMode] = useState(false);

  // Thinking Models state
  const [showModelsOverlay, setShowModelsOverlay] = useState(false);
  const [showLearningOverlay, setShowLearningOverlay] = useState(false);
  const [hasSeenLearning, setHasSeenLearning] = useState(false);
  const [showThinkingCTA, setShowThinkingCTA] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const interactionCountRef = useRef(0);

  // Lane reconfiguration state (Phase 3A)
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [isStructureApplied, setIsStructureApplied] = useState(false);
  const [originalCardsSnapshot, setOriginalCardsSnapshot] = useState<Card[]>([]);
  const [cardAffinities, setCardAffinities] = useState<Record<string, string>>({});
  const [activeLanes, setActiveLanes] = useState<LaneConfig[]>([]);

  // Geometric shapes state
  const [shapes, setShapes] = useState<GeometricShape[]>([]);
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null); // NEW: for shape selection and resizing
  const [resizingShapeId, setResizingShapeId] = useState<string | null>(null); // NEW: for shape resizing

  // Sketch mode toggle
  const [isSketchModeEnabled, setIsSketchModeEnabled] = useState(true);

  // Pan/zoom state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Help tooltip carousel state
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [currentTooltipIndex, setCurrentTooltipIndex] = useState(0);
  const tooltipAutoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Resize state
  const [resizingCardId, setResizingCardId] = useState<string | null>(null);
  const [resizingLaneId, setResizingLaneId] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);

  // Lane drag state
  const [isDraggingLane, setIsDraggingLane] = useState(false);
  const [laneDragStartPositions, setLaneDragStartPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Smooth cursor position with spring physics
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const smoothX = useSpring(cursorX, { damping: 18, stiffness: 220 });
  const smoothY = useSpring(cursorY, { damping: 18, stiffness: 220 });

  // Theme-aware colors
  const outerBg = theme === 'dark' ? 'bg-white' : 'bg-black';
  const cardBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';
  const gridDotColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const controlsBg = theme === 'dark' ? 'rgba(20, 20, 20, 0.92)' : 'rgba(250, 250, 250, 0.92)';
  const controlsBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const cardColors = theme === 'dark' ? DARK_CARD_COLORS : CARD_COLORS;
  const strokeColors = theme === 'dark' ? DARK_STROKE_COLORS : STROKE_COLORS;

  // Help tooltip content
  const helpTooltips = [
    {
      title: 'Create Cards',
      description: isMobile 
        ? 'Long-press anywhere to create a new card. Cards are your building blocks for organizing ideas.'
        : 'Right-click or double-click anywhere to create a new card. Cards are your building blocks for organizing ideas.',
    },
    {
      title: 'Pan the Canvas',
      description: 'Hold Shift and drag anywhere to pan the entire canvas. This helps you navigate large workspaces.',
    },
    {
      title: 'Sketch Mode',
      description: 'Toggle sketch mode to draw freely on the canvas. When disabled, you can interact with cards without accidental drawing.',
    },
    {
      title: 'Geometric Shapes',
      description: 'Use circle, square, and triangle tools to add visual structure. Click a shape tool, then click on the canvas to place it.',
    },
    {
      title: 'Connect Cards',
      description: 'Click and drag from the small handles on card edges to create connections between related ideas.',
    },
    {
      title: 'Thinking Lenses',
      description: 'Apply cognitive frameworks like First Principles or Eisenhower Matrix to organize your cards into meaningful structures.',
    },
  ];

  // Initialize stroke colors
  useEffect(() => {
    if (!strokeColor) {
      setStrokeColor(strokeColors[0].stroke);
      setGlowColor(strokeColors[0].glow);
    }
  }, [strokeColor, strokeColors]);

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show help tooltip on every page load
  useEffect(() => {
    // Delay showing help slightly to let the page render
    const timer = setTimeout(() => {
      setShowHelpTooltip(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance tooltip carousel
  useEffect(() => {
    if (showHelpTooltip) {
      tooltipAutoAdvanceRef.current = setInterval(() => {
        setCurrentTooltipIndex((prev) => (prev + 1) % helpTooltips.length);
      }, 5000); // Advance every 5 seconds

      return () => {
        if (tooltipAutoAdvanceRef.current) {
          clearInterval(tooltipAutoAdvanceRef.current);
        }
      };
    }
  }, [showHelpTooltip, helpTooltips.length]);

  const handleCloseHelpTooltip = () => {
    playClick();
    setShowHelpTooltip(false);
    if (tooltipAutoAdvanceRef.current) {
      clearInterval(tooltipAutoAdvanceRef.current);
    }
  };

  const handleNextTooltip = () => {
    playClick();
    setCurrentTooltipIndex((prev) => (prev + 1) % helpTooltips.length);
    // Reset auto-advance timer
    if (tooltipAutoAdvanceRef.current) {
      clearInterval(tooltipAutoAdvanceRef.current);
    }
    tooltipAutoAdvanceRef.current = setInterval(() => {
      setCurrentTooltipIndex((prev) => (prev + 1) % helpTooltips.length);
    }, 5000);
  };

  const handlePrevTooltip = () => {
    playClick();
    setCurrentTooltipIndex((prev) => (prev - 1 + helpTooltips.length) % helpTooltips.length);
    // Reset auto-advance timer
    if (tooltipAutoAdvanceRef.current) {
      clearInterval(tooltipAutoAdvanceRef.current);
    }
    tooltipAutoAdvanceRef.current = setInterval(() => {
      setCurrentTooltipIndex((prev) => (prev + 1) % helpTooltips.length);
    }, 5000);
  };

  // Calculate speed between points
  const calculateSpeed = (p1: Point, p2: Point, timeDiff: number): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return timeDiff > 0 ? distance / timeDiff : 0;
  };

  // Get stroke width based on speed and mode
  const getStrokeWidth = (speed: number, mode: StrokeMode): number => {
    const baseWidth = mode === 'calm' ? 2.5 : mode === 'quick' ? 1.8 : 3.2;
    const speedFactor = Math.min(speed / 8, 1);
    const variableWidth = mode === 'calm' ? 2 : mode === 'quick' ? 2.5 : 1.5;
    return baseWidth + variableWidth * (1 - speedFactor);
  };

  // Get glow blur radius
  const getGlowBlur = (): number => {
    return 10;
  };

  // Snap to grid
  const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Get canvas coordinates
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left - panOffset.x,
      y: clientY - rect.top - panOffset.y,
    };
  }, [panOffset]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    if (controlsHideTimerRef.current) {
      clearTimeout(controlsHideTimerRef.current);
    }

    controlsHideTimerRef.current = setTimeout(() => {
      setShowSketchControls(false);
    }, 5000);
  }, []);

  // Get card center position
  const getCardCenter = useCallback((cardId: string): { x: number; y: number } | null => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;

    const cardSize = CARD_SIZES[card.size];
    return {
      x: card.x + cardSize.width / 2,
      y: card.y + cardSize.height / 2,
    };
  }, [cards]);

  // Get handle position based on card and handle type
  const getHandlePosition = useCallback((cardId: string, handle: HandlePosition): { x: number; y: number } | null => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;

    const cardSize = CARD_SIZES[card.size];
    
    switch (handle) {
      case 'top':
        return {
          x: card.x + cardSize.width / 2,
          y: card.y,
        };
      case 'right':
        return {
          x: card.x + cardSize.width,
          y: card.y + cardSize.height / 2,
        };
      case 'bottom':
        return {
          x: card.x + cardSize.width / 2,
          y: card.y + cardSize.height,
        };
      case 'left':
        return {
          x: card.x,
          y: card.y + cardSize.height / 2,
        };
    }
  }, [cards]);

  // Lane system helpers (Phase 3A)
  const getActiveModel = useCallback(() => {
    if (!activeModelId) return null;
    return THINKING_MODELS.find((m) => m.id === activeModelId) || null;
  }, [activeModelId]);

  // Calculate which lane a card should belong to based on model logic
  const calculateCardAffinity = useCallback((card: Card, model: ThinkingModel): string | null => {
    if (!card.content.trim()) return null;
    
    const content = card.content.toLowerCase();
    
    // Simple keyword-based affinity (can be made more sophisticated)
    if (model.id === 'first-principles') {
      if (content.includes('assume') || content.includes('belief') || content.includes('think')) {
        return 'assumptions';
      }
      if (content.includes('fundamental') || content.includes('truth') || content.includes('fact')) {
        return 'fundamentals';
      }
      return 'rebuild';
    }
    
    if (model.id === 'five-whys') {
      if (content.includes('?') || content.includes('why') || content.includes('how')) {
        return 'why1';
      }
      if (content.includes('because') || content.includes('cause')) {
        return 'why3';
      }
      if (content.includes('root') || content.includes('core')) {
        return 'why5';
      }
      return 'why2';
    }
    
    if (model.id === 'second-order') {
      if (content.includes('then') || content.includes('next') || content.includes('after')) {
        return 'secondary';
      }
      if (content.includes('future') || content.includes('eventually') || content.includes('long')) {
        return 'longterm';
      }
      return 'direct';
    }
    
    if (model.id === 'eisenhower') {
      const isUrgent = content.includes('urgent') || content.includes('now') || content.includes('asap');
      const isImportant = content.includes('important') || content.includes('critical') || content.includes('key');
      
      if (isUrgent && isImportant) return 'urgent-important';
      if (!isUrgent && isImportant) return 'not-urgent-important';
      if (isUrgent && !isImportant) return 'urgent-not-important';
      return 'not-urgent-not-important';
    }
    
    if (model.id === 'ice') {
      if (content.includes('impact') || content.includes('big') || content.includes('major')) {
        return 'impact';
      }
      if (content.includes('confident') || content.includes('sure') || content.includes('certain')) {
        return 'confidence';
      }
      if (content.includes('easy') || content.includes('simple') || content.includes('quick')) {
        return 'ease';
      }
      return 'impact';
    }
    
    return null;
  }, []);

  // Apply lane structure - animate cards to their suggested positions
  const handleApplyStructure = useCallback(() => {
    const model = getActiveModel();
    if (!model || isStructureApplied) return;
    
    playClick();
    
    // Save current state for undo
    setOriginalCardsSnapshot([...cards]);
    
    // Calculate affinities for all cards
    const affinities: Record<string, string> = {};
    cards.forEach((card) => {
      const affinity = calculateCardAffinity(card, model);
      if (affinity) {
        affinities[card.id] = affinity;
      }
    });
    setCardAffinities(affinities);
    
    // Animate cards to their target lanes
    const newCards = cards.map((card) => {
      const laneId = affinities[card.id];
      if (!laneId) return card;
      
      const lane = model.lanes.find((l) => l.id === laneId);
      if (!lane) return card;
      
      const cardSize = CARD_SIZES[card.size];
      
      // Position card in lane with some randomness
      const padding = 20;
      const randomX = lane.x + padding + Math.random() * (lane.width - cardSize.width - padding * 2);
      const randomY = lane.y + padding + Math.random() * (lane.height - cardSize.height - padding * 2);
      
      return {
        ...card,
        x: snapToGrid(randomX, CARD_SNAP_GRID),
        y: snapToGrid(randomY, CARD_SNAP_GRID),
      };
    });
    
    setCards(newCards);
    setIsStructureApplied(true);
    
    // Make lanes solid and persistent
    setActiveLanes([...model.lanes]);
  }, [cards, activeModelId, isStructureApplied, getActiveModel, calculateCardAffinity, playClick]);

  // Undo structure application - restore card positions but keep lanes visible
  const handleUndoStructure = useCallback(() => {
    if (!isStructureApplied || originalCardsSnapshot.length === 0) return;
    
    playClick();
    setCards(originalCardsSnapshot);
    setIsStructureApplied(false);
    setCardAffinities({});
    // Keep lanes visible after undo - don't clear activeLanes
  }, [isStructureApplied, originalCardsSnapshot, playClick]);

  // Exit model and restore original state
  const handleExitModel = useCallback(() => {
    playClick();
    
    if (isStructureApplied && originalCardsSnapshot.length > 0) {
      setCards(originalCardsSnapshot);
    }
    
    setActiveModelId(null);
    setIsStructureApplied(false);
    setOriginalCardsSnapshot([]);
    setCardAffinities({});
    setActiveLanes([]);
  }, [isStructureApplied, originalCardsSnapshot, playClick]);

  // Handle geometric shape placement
  const handleCanvasClickForShape = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedShapeType) return;
    
    const board = boardRef.current;
    if (!board) return;
    
    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    playClick();
    
    const newShape: GeometricShape = {
      id: `shape-${Date.now()}`,
      type: selectedShapeType,
      x,
      y,
      size: 60,
      color: strokeColor,
      glowColor: glowColor,
    };
    
    setShapes([...shapes, newShape]);
    setSelectedShapeType(null); // Clear selection after placing
  }, [selectedShapeType, shapes, strokeColor, glowColor, playClick]);

  // Draw connections
  const drawConnections = useCallback(() => {
    const canvas = connectionCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Warm, neutral rope colors based on theme
    const ropeCore = theme === 'dark' ? 'rgba(200, 195, 190, 0.75)' : 'rgba(80, 75, 70, 0.65)';
    const ropeGlow = theme === 'dark' ? 'rgba(200, 195, 190, 0.15)' : 'rgba(80, 75, 70, 0.12)';
    const ropeCapColor = theme === 'dark' ? 'rgba(200, 195, 190, 0.85)' : 'rgba(80, 75, 70, 0.75)';

    connections.forEach((connection) => {
      const sourcePos = getHandlePosition(connection.sourceId, connection.sourceHandle);
      const targetPos = getHandlePosition(connection.targetId, connection.targetHandle);

      if (!sourcePos || !targetPos) return;

      const isHovered = hoveredConnectionId === connection.id;
      const isSelected = selectedConnectionId === connection.id;

      // Calculate smooth Bezier curve with soft tension
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Soft, editorial tension - more curve for longer distances
      const tension = Math.min(distance * 0.35, 120);
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      
      // Perpendicular offset for natural sag
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      const controlX = midX + perpX * tension * 0.25;
      const controlY = midY + perpY * tension * 0.25;

      // Interaction state modifiers
      const opacityMultiplier = isSelected ? 1.2 : isHovered ? 1.1 : 1;

      // Draw glow underlay (wide, soft)
      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.quadraticCurveTo(controlX, controlY, targetPos.x, targetPos.y);

      ctx.strokeStyle = ropeGlow;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.5 * opacityMultiplier;
      ctx.stroke();

      // Draw core stroke (thin, crisp)
      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.quadraticCurveTo(controlX, controlY, targetPos.x, targetPos.y);

      ctx.strokeStyle = ropeCore;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.75 * opacityMultiplier;
      ctx.stroke();

      ctx.globalAlpha = 1;

      // Draw attachment caps at endpoints
      const capRadius = isHovered ? 4 : 3.5;
      const capOpacity = 0.85 * opacityMultiplier;

      // Source cap
      ctx.beginPath();
      ctx.arc(sourcePos.x, sourcePos.y, capRadius, 0, Math.PI * 2);
      ctx.fillStyle = ropeCapColor;
      ctx.globalAlpha = capOpacity;
      ctx.fill();

      // Target cap
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, capRadius, 0, Math.PI * 2);
      ctx.fillStyle = ropeCapColor;
      ctx.globalAlpha = capOpacity;
      ctx.fill();

      ctx.globalAlpha = 1;
    });

    // Draw connection preview (lighter, dashed)
    if (previewEnd && connectingFrom) {
      const sourcePos = getHandlePosition(connectingFrom.cardId, connectingFrom.side);
      if (sourcePos) {
        const dx = previewEnd.x - sourcePos.x;
        const dy = previewEnd.y - sourcePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const tension = Math.min(distance * 0.35, 120);
        const midX = (sourcePos.x + previewEnd.x) / 2;
        const midY = (sourcePos.y + previewEnd.y) / 2;
        
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        const controlX = midX + perpX * tension * 0.25;
        const controlY = midY + perpY * tension * 0.25;

        // Preview glow (very subtle)
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.quadraticCurveTo(controlX, controlY, previewEnd.x, previewEnd.y);

        ctx.strokeStyle = ropeGlow;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.25;
        ctx.stroke();

        // Preview core (dashed, lighter)
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.quadraticCurveTo(controlX, controlY, previewEnd.x, previewEnd.y);

        ctx.strokeStyle = ropeCore;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.globalAlpha = 1;

        // Preview attachment cap at source
        ctx.beginPath();
        ctx.arc(sourcePos.x, sourcePos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ropeCapColor;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        ctx.globalAlpha = 1;
      }
    }
  }, [connections, hoveredConnectionId, selectedConnectionId, previewEnd, connectingFrom, theme, getHandlePosition]);

  // Redraw sketch canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const glowCanvas = glowCanvasRef.current;
    if (!canvas || !glowCanvas) return;

    const ctx = canvas.getContext('2d');
    const glowCtx = glowCanvas.getContext('2d');
    if (!ctx || !glowCtx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      const glowBlur = getGlowBlur();

      // For eraser mode, use destination-out composite on BOTH canvases
      if (stroke.isEraser) {
        // Erase from main canvas
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          const width = getStrokeWidth(stroke.points[i].speed || 0, stroke.mode) * 1.5; // Slightly wider eraser
          ctx.lineWidth = width;

          const xc = (stroke.points[i].x + (stroke.points[i + 1]?.x || stroke.points[i].x)) / 2;
          const yc = (stroke.points[i].y + (stroke.points[i + 1]?.y || stroke.points[i].y)) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }

        ctx.stroke();
        ctx.restore();

        // Erase from glow canvas
        glowCtx.save();
        glowCtx.globalCompositeOperation = 'destination-out';
        glowCtx.lineCap = 'round';
        glowCtx.lineJoin = 'round';

        glowCtx.beginPath();
        glowCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          const width = getStrokeWidth(stroke.points[i].speed || 0, stroke.mode) * 1.5; // Slightly wider eraser
          glowCtx.lineWidth = width;

          const xc = (stroke.points[i].x + (stroke.points[i + 1]?.x || stroke.points[i].x)) / 2;
          const yc = (stroke.points[i].y + (stroke.points[i + 1]?.y || stroke.points[i].y)) / 2;
          glowCtx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }

        glowCtx.stroke();
        glowCtx.restore();
        return;
      }

      // Draw glow layer for normal strokes
      if (glowBlur > 0) {
        glowCtx.strokeStyle = stroke.color;
        glowCtx.shadowColor = stroke.glowColor;
        glowCtx.shadowBlur = glowBlur;
        glowCtx.lineCap = 'round';
        glowCtx.lineJoin = 'round';

        glowCtx.beginPath();
        glowCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          const width = getStrokeWidth(stroke.points[i].speed || 0, stroke.mode);
          glowCtx.lineWidth = width;

          const xc = (stroke.points[i].x + (stroke.points[i + 1]?.x || stroke.points[i].x)) / 2;
          const yc = (stroke.points[i].y + (stroke.points[i + 1]?.y || stroke.points[i].y)) / 2;
          glowCtx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }

        glowCtx.stroke();
        glowCtx.shadowBlur = 0;
      }

      // Draw main stroke
      ctx.strokeStyle = stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const width = getStrokeWidth(stroke.points[i].speed || 0, stroke.mode);
        ctx.lineWidth = width;

        const xc = (stroke.points[i].x + (stroke.points[i + 1]?.x || stroke.points[i].x)) / 2;
        const yc = (stroke.points[i].y + (stroke.points[i + 1]?.y || stroke.points[i].y)) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      if (isEraserMode) {
        // Erase from main canvas
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

        for (let i = 1; i < currentStroke.length; i++) {
          const width = getStrokeWidth(currentStroke[i].speed || 0, strokeMode) * 1.5; // Slightly wider eraser
          ctx.lineWidth = width;

          const xc = (currentStroke[i].x + (currentStroke[i + 1]?.x || currentStroke[i].x)) / 2;
          const yc = (currentStroke[i].y + (currentStroke[i + 1]?.y || currentStroke[i].y)) / 2;
          ctx.quadraticCurveTo(currentStroke[i].x, currentStroke[i].y, xc, yc);
        }

        ctx.stroke();
        ctx.restore();

        // Erase from glow canvas
        glowCtx.save();
        glowCtx.globalCompositeOperation = 'destination-out';
        glowCtx.lineCap = 'round';
        glowCtx.lineJoin = 'round';

        glowCtx.beginPath();
        glowCtx.moveTo(currentStroke[0].x, currentStroke[0].y);

        for (let i = 1; i < currentStroke.length; i++) {
          const width = getStrokeWidth(currentStroke[i].speed || 0, strokeMode) * 1.5; // Slightly wider eraser
          glowCtx.lineWidth = width;

          const xc = (currentStroke[i].x + (currentStroke[i + 1]?.x || currentStroke[i].x)) / 2;
          const yc = (currentStroke[i].y + (currentStroke[i + 1]?.y || currentStroke[i].y)) / 2;
          glowCtx.quadraticCurveTo(currentStroke[i].x, currentStroke[i].y, xc, yc);
        }

        glowCtx.stroke();
        glowCtx.restore();
      } else {
        const glowBlur = getGlowBlur();

        if (glowBlur > 0) {
          glowCtx.strokeStyle = strokeColor;
          glowCtx.shadowColor = glowColor;
          glowCtx.shadowBlur = glowBlur;
          glowCtx.lineCap = 'round';
          glowCtx.lineJoin = 'round';

          glowCtx.beginPath();
          glowCtx.moveTo(currentStroke[0].x, currentStroke[0].y);

          for (let i = 1; i < currentStroke.length; i++) {
            const width = getStrokeWidth(currentStroke[i].speed || 0, strokeMode);
            glowCtx.lineWidth = width;

            const xc = (currentStroke[i].x + (currentStroke[i + 1]?.x || currentStroke[i].x)) / 2;
            const yc = (currentStroke[i].y + (currentStroke[i + 1]?.y || currentStroke[i].y)) / 2;
            glowCtx.quadraticCurveTo(currentStroke[i].x, currentStroke[i].y, xc, yc);
          }

          glowCtx.stroke();
          glowCtx.shadowBlur = 0;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

        for (let i = 1; i < currentStroke.length; i++) {
          const width = getStrokeWidth(currentStroke[i].speed || 0, strokeMode);
          ctx.lineWidth = width;

          const xc = (currentStroke[i].x + (currentStroke[i + 1]?.x || currentStroke[i].x)) / 2;
          const yc = (currentStroke[i].y + (currentStroke[i + 1]?.y || currentStroke[i].y)) / 2;
          ctx.quadraticCurveTo(currentStroke[i].x, currentStroke[i].y, xc, yc);
        }

        ctx.stroke();
      }
    }
  }, [strokes, currentStroke, strokeColor, glowColor, strokeMode, isEraserMode]);

  // Create single card
  const createCard = (x: number, y: number) => {
    if (showIntro) {
      setShowIntro(false);
    }

    playClick();
    isCreatingCardRef.current = true;

    const cardId = `card-${Date.now()}`;
    const size: CardSize = 'medium';
    const cardSize = CARD_SIZES[size];

    const newCard: Card = {
      id: cardId,
      x: snapToGrid(x - cardSize.width / 2, CARD_SNAP_GRID),
      y: snapToGrid(y - cardSize.height / 2, CARD_SNAP_GRID),
      content: '',
      size,
      color: cardColors[0].bg,
    };

    setCards((prev) => [...prev, newCard]);
    setActiveCardId(cardId);
    setSelectedCardId(cardId);
    setShowCardControls(true);

    setTimeout(() => {
      isCreatingCardRef.current = false;
    }, 200);
  };

  // Handle right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    createCard(x, y);
  };

  // Handle double-click to create card
  const handleDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    createCard(x, y);
  };

  // Handle drawing start
  const handleDrawStart = (x: number, y: number) => {
    if (isCreatingCardRef.current || isDraggingCard || connectingFrom || !isSketchModeEnabled) return;

    setIsDrawing(true);
    setCurrentStroke([{ x, y, speed: 0 }]);
    lastInputPosRef.current = { x, y, time: Date.now() };

    cursorX.set(x);
    cursorY.set(y);
  };

  // Handle drawing move
  const handleDrawMove = (x: number, y: number) => {
    cursorX.set(x);
    cursorY.set(y);

    // Update connection preview if connecting
    if (previewEnd && connectingFrom) {
      setPreviewEnd({ x, y });
    }

    if (!isDrawing || isDraggingCard || connectingFrom) return;

    const now = Date.now();
    const lastPos = lastInputPosRef.current;

    if (lastPos) {
      const timeDiff = now - lastPos.time;
      const speed = calculateSpeed(lastPos, { x, y }, timeDiff);

      const smoothedX = smoothX.get();
      const smoothedY = smoothY.get();

      setCurrentStroke((prev) => [...prev, { x: smoothedX, y: smoothedY, speed }]);
    }

    lastInputPosRef.current = { x, y, time: now };
  };

  // Handle drawing end
  const handleDrawEnd = () => {
    if (isDrawing && currentStroke.length > 1) {
      setStrokes((prev) => [
        ...prev,
        { 
          points: currentStroke, 
          color: isEraserMode ? 'transparent' : strokeColor, 
          glowColor: isEraserMode ? 'transparent' : glowColor, 
          mode: strokeMode, 
          glow: 'subtle', 
          isEraser: isEraserMode 
        },
      ]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
    lastInputPosRef.current = null;
  };

  // Mouse handlers for canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // Ignore right-click (handled by context menu)
    
    // If Shift is pressed, start panning
    if (isShiftPressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    handleDrawStart(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If panning, update pan offset
    if (isPanning && isShiftPressed) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    handleDrawMove(x, y);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    handleDrawEnd();
  };

  // Touch handlers for canvas
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);

    createCardTimerRef.current = setTimeout(() => {
      createCard(x, y);
    }, 600);

    handleDrawStart(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (createCardTimerRef.current) {
      clearTimeout(createCardTimerRef.current);
      createCardTimerRef.current = null;
    }

    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    handleDrawMove(x, y);
  };

  const handleTouchEnd = () => {
    if (createCardTimerRef.current) {
      clearTimeout(createCardTimerRef.current);
      createCardTimerRef.current = null;
    }
    handleDrawEnd();
  };

  // Handle card selection
  const handleCardClick = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    
    setSelectedCardId(cardId);
    setShowCardControls(true);
    setSelectedConnectionId(null);
  };

  // Start connection from card
  const handleStartConnection = (cardId: string, handle: HandlePosition, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playClick();
    
    setConnectingFrom({
      cardId,
      side: handle,
    });
    
    // Initialize preview at current mouse position (not handle position)
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    setPreviewEnd({ x, y });
  };

  // Complete connection to card
  const handleCompleteConnection = (targetId: string, handle: HandlePosition, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!connectingFrom || connectingFrom.cardId === targetId) {
      setConnectingFrom(null);
      setPreviewEnd(null);
      return;
    }

    playClick();

    const connectionId = `connection-${Date.now()}`;
    const newConnection: Connection = {
      id: connectionId,
      sourceId: connectingFrom.cardId,
      sourceHandle: connectingFrom.side,
      targetId: targetId,
      targetHandle: handle,
      color: strokeColor,
    };

    setConnections((prev) => [...prev, newConnection]);
    setConnectingFrom(null);
    setPreviewEnd(null);
  };

  // Cancel connection on canvas click
  const handleCancelConnection = () => {
    setConnectingFrom(null);
    setPreviewEnd(null);
  };

  // Handle card drag
  const handleCardDragStart = (cardId: string) => {
    setIsDraggingCard(true);
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setDragStartPositions((prev) => ({
        ...prev,
        [cardId]: { x: card.x, y: card.y },
      }));
    }
  };

  const handleCardDrag = (cardId: string, info: PanInfo) => {
    const startPos = dragStartPositions[cardId];
    if (!startPos) return;
    
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, x: startPos.x + info.offset.x, y: startPos.y + info.offset.y }
          : c
      )
    );
  };

  // Snap card to grid on drag end
  const handleCardDragEnd = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, x: snapToGrid(c.x, CARD_SNAP_GRID), y: snapToGrid(c.y, CARD_SNAP_GRID) }
          : c
      )
    );
    setIsDraggingCard(false);
  };

  // Handle lane drag
  const handleLaneDragStart = (laneId: string) => {
    setIsDraggingLane(true);
    const lane = activeLanes.find((l) => l.id === laneId);
    if (lane) {
      setLaneDragStartPositions((prev) => ({
        ...prev,
        [laneId]: { x: lane.x, y: lane.y },
      }));
    }
  };

  const handleLaneDrag = (laneId: string, info: PanInfo) => {
    const startPos = laneDragStartPositions[laneId];
    if (!startPos) return;
    
    setActiveLanes((prev) =>
      prev.map((l) =>
        l.id === laneId
          ? { ...l, x: startPos.x + info.offset.x, y: startPos.y + info.offset.y }
          : l
      )
    );
  };

  // Snap lane to grid on drag end
  const handleLaneDragEnd = (laneId: string) => {
    setActiveLanes((prev) =>
      prev.map((l) =>
        l.id === laneId
          ? { ...l, x: snapToGrid(l.x, CARD_SNAP_GRID), y: snapToGrid(l.y, CARD_SNAP_GRID) }
          : l
      )
    );
    setIsDraggingLane(false);
  };

  // Handle text input
  const handleTextInput = (cardId: string, content: string) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, content } : c)));
  };

  // Change card size
  const handleSizeChange = (size: CardSize) => {
    playClick();
    if (!selectedCardId) return;

    setCards((prev) => prev.map((c) => (c.id === selectedCardId ? { ...c, size } : c)));
  };

  // Change card color
  const handleColorChange = (colorBg: string) => {
    playClick();
    if (!selectedCardId) return;

    setCards((prev) => prev.map((c) => (c.id === selectedCardId ? { ...c, color: colorBg } : c)));
  };

  // Duplicate card
  const handleDuplicate = () => {
    playClick();
    if (!selectedCardId) return;

    const card = cards.find((c) => c.id === selectedCardId);
    if (!card) return;

    const newCardId = `card-${Date.now()}`;
    setCards((prev) => [
      ...prev,
      {
        ...card,
        id: newCardId,
        x: card.x + 40,
        y: card.y + 40,
      },
    ]);
  };

  // Delete card with press-and-hold
  const handleDeleteStart = () => {
    let progress = 0;
    setIsDeleting(true);
    setDeleteProgress(0);

    deleteProgressIntervalRef.current = setInterval(() => {
      progress += 2;
      setDeleteProgress(progress);
    }, 20);

    longPressTimerRef.current = setTimeout(() => {
      playClick();
      if (deleteProgressIntervalRef.current) {
        clearInterval(deleteProgressIntervalRef.current);
      }

      if (selectedCardId) {
        // Delete card and its connections
        setCards((prev) => prev.filter((c) => c.id !== selectedCardId));
        setConnections((prev) => prev.filter((conn) => conn.sourceId !== selectedCardId && conn.targetId !== selectedCardId));
        setSelectedCardId(null);
        setShowCardControls(false);
      } else if (selectedConnectionId) {
        // Delete connection
        setConnections((prev) => prev.filter((c) => c.id !== selectedConnectionId));
        setSelectedConnectionId(null);
      }

      setIsDeleting(false);
      setDeleteProgress(0);
    }, 1000);
  };

  const handleDeleteEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (deleteProgressIntervalRef.current) {
      clearInterval(deleteProgressIntervalRef.current);
      deleteProgressIntervalRef.current = null;
    }
    setIsDeleting(false);
    setDeleteProgress(0);
  };

  // Handle clear with confirmation
  const handleClearStart = () => {
    let progress = 0;
    setIsClearing(true);
    setClearProgress(0);

    clearProgressIntervalRef.current = setInterval(() => {
      progress += 2;
      setClearProgress(progress);
    }, 20);

    clearTimerRef.current = setTimeout(() => {
      playClick();
      if (clearProgressIntervalRef.current) {
        clearInterval(clearProgressIntervalRef.current);
      }

      // Clear everything
      setStrokes([]);
      setCards([]);
      setConnections([]);
      setShapes([]);
      setSelectedCardId(null);
      setShowCardControls(false);
      setSelectedConnectionId(null);
      setConnectingFrom(null);
      setPreviewEnd(null);
      setShowIntro(true);

      // Immediately clear both canvases imperatively for instant visual feedback
      const canvas = canvasRef.current;
      const glowCanvas = glowCanvasRef.current;
      if (canvas && glowCanvas) {
        const ctx = canvas.getContext('2d');
        const glowCtx = glowCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (glowCtx) glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
      }

      setIsClearing(false);
      setClearProgress(0);
    }, 1000);
  };

  const handleClearEnd = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    if (clearProgressIntervalRef.current) {
      clearInterval(clearProgressIntervalRef.current);
      clearProgressIntervalRef.current = null;
    }
    setIsClearing(false);
    setClearProgress(0);
  };

  // Click canvas to deselect
  const handleCanvasClick = () => {
    setSelectedCardId(null);
    setShowCardControls(false);
    setSelectedConnectionId(null);
    setSelectedShapeId(null); // Deselect shapes
    handleCancelConnection();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedCardId) {
        e.preventDefault();
        handleDuplicate();
      }
      if (e.key === 'Escape') {
        // Cancel shape selection first
        if (selectedShapeType) {
          setSelectedShapeType(null);
        // Exit model if active
        } else if (activeModelId) {
          handleExitModel();
        // Otherwise deselect
        } else {
          setSelectedCardId(null);
          setShowCardControls(false);
          setSelectedConnectionId(null);
          setConnectingFrom(null);
          setPreviewEnd(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardId, activeModelId, handleExitModel]);

  // Track Shift key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle card and lane resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCardId && resizeStartPos && resizeStartSize) {
        const dx = e.clientX - resizeStartPos.x;
        const dy = e.clientY - resizeStartPos.y;
        
        setCards((prev) =>
          prev.map((card) => {
            if (card.id === resizingCardId) {
              const newWidth = Math.max(100, resizeStartSize.width + dx);
              const newHeight = Math.max(80, resizeStartSize.height + dy);
              // Store custom size in card - we'll need to add this to the Card type
              return {
                ...card,
                customWidth: newWidth,
                customHeight: newHeight,
              };
            }
            return card;
          })
        );
      }
      
      if (resizingLaneId && resizeStartPos && resizeStartSize) {
        const dx = e.clientX - resizeStartPos.x;
        const dy = e.clientY - resizeStartPos.y;
        
        setActiveLanes((prev) =>
          prev.map((lane) => {
            if (lane.id === resizingLaneId) {
              return {
                ...lane,
                width: Math.max(150, resizeStartSize.width + dx),
                height: Math.max(100, resizeStartSize.height + dy),
              };
            }
            return lane;
          })
        );
      }

      if (resizingShapeId && resizeStartPos && resizeStartSize) {
        const dx = e.clientX - resizeStartPos.x;
        const dy = e.clientY - resizeStartPos.y;
        const delta = Math.max(dx, dy); // Use the larger delta for uniform scaling
        
        setShapes((prev) =>
          prev.map((shape) => {
            if (shape.id === resizingShapeId) {
              return {
                ...shape,
                size: Math.max(30, resizeStartSize.width + delta), // min size 30
              };
            }
            return shape;
          })
        );
      }
    };

    const handleMouseUp = () => {
      setResizingCardId(null);
      setResizingLaneId(null);
      setResizingShapeId(null);
      setResizeStartPos(null);
      setResizeStartSize(null);
    };

    if (resizingCardId || resizingLaneId || resizingShapeId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingCardId, resizingLaneId, resizingShapeId, resizeStartPos, resizeStartSize]);

  // Track interactions and show Thinking Models CTA after sufficient activity
  useEffect(() => {
    // Show CTA after 3 cards created or 5 strokes drawn or 2 connections made
    const totalInteractions = cards.length + Math.floor(strokes.length / 5) + connections.length * 2;
    
    if (totalInteractions >= 3 && !showThinkingCTA && !hasSeenLearning) {
      // Delay showing the CTA for a smooth, non-intrusive appearance
      const timer = setTimeout(() => {
        setShowThinkingCTA(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [cards.length, strokes.length, connections.length, showThinkingCTA, hasSeenLearning]);

  // Calculate card affinities when model becomes active (Phase 3A)
  useEffect(() => {
    if (!activeModelId || isStructureApplied) {
      setCardAffinities({});
      return;
    }
    
    const model = getActiveModel();
    if (!model) return;
    
    const affinities: Record<string, string> = {};
    cards.forEach((card) => {
      const affinity = calculateCardAffinity(card, model);
      if (affinity) {
        affinities[card.id] = affinity;
      }
    });
    
    setCardAffinities(affinities);
  }, [activeModelId, isStructureApplied, cards, getActiveModel, calculateCardAffinity]);

  // Redraw canvases when needed
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    drawConnections();
  }, [drawConnections]);

  // Continuous redraw during card drag
  useEffect(() => {
    if (!isDraggingCard) return;

    let animationFrameId: number;
    const continuousRedraw = () => {
      drawConnections();
      animationFrameId = requestAnimationFrame(continuousRedraw);
    };

    animationFrameId = requestAnimationFrame(continuousRedraw);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDraggingCard, drawConnections]);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasContainerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const canvas = canvasRef.current;
      const glowCanvas = glowCanvasRef.current;
      const connectionCanvas = connectionCanvasRef.current;
      if (!canvas || !glowCanvas || !connectionCanvas) return;

      canvas.width = width;
      canvas.height = height;
      glowCanvas.width = width;
      glowCanvas.height = height;
      connectionCanvas.width = width;
      connectionCanvas.height = height;

      redrawCanvas();
      drawConnections();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [redrawCanvas, drawConnections]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (deleteProgressIntervalRef.current) clearInterval(deleteProgressIntervalRef.current);
      if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
      if (createCardTimerRef.current) clearTimeout(createCardTimerRef.current);
    };
  }, []);

  // Prevent scrolling on mobile
  useEffect(() => {
    const preventDefault = (e: Event) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', preventDefault, { passive: false });
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isDrawing, isMobile]);

  // Global mouse tracking for connection preview
  useEffect(() => {
    if (!previewEnd || !connectingFrom) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      setPreviewEnd({ x, y });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [previewEnd, connectingFrom, getCanvasCoords]);

  return (
    <div className={`${outerBg} ${isMobile ? 'min-h-screen w-full' : 'min-h-screen w-full flex items-start justify-center py-[74px]'}`}>
      <div className={`relative ${isMobile ? 'w-full h-screen' : 'w-[1315px] h-[893px]'}`}>
        {/* Main Black Card */}
        <div className={`absolute ${cardBg} ${isMobile ? 'w-full h-full rounded-none' : 'h-[893px] left-0 rounded-[31px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] top-0 w-[1315px]'} overflow-hidden`} />
        
        {/* Navigation Sidebar - Desktop only */}
        
        
        {/* Header - Desktop only */}
        
        
        {/* Canvas Content Area */}
        <div className={`absolute ${isMobile ? 'inset-0' : 'left-0 top-[135px] w-[1315px] h-[758px]'} overflow-hidden`}>
          <div
            ref={canvasContainerRef}
            className={`${bgColor} w-full h-full relative overflow-hidden`}
            onClick={handleCanvasClick}
          >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${gridDotColor} 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className={`text-center px-6 space-y-4 ${textColor}`}>
              <p className={`font-['Caladea',serif] text-[32px] md:text-[36px] tracking-[-0.5px] opacity-90`}>
                STILLROOM
              </p>
              <p className={`font-['Cambay',sans-serif] text-[14px] md:text-[16px] tracking-[0.14px] opacity-50`}>
                {isMobile ? 'Draw freely • Long-press for cards' : 'Draw freely • Right-click for cards'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geometric Shapes Layer */}
      <div className="absolute inset-0" style={{ zIndex: 4, pointerEvents: 'none' }}>
        <svg className="w-full h-full" style={{ pointerEvents: 'auto', transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          {shapes.map((shape) => {
            const isSelected = selectedShapeId === shape.id;
            const strokeWidth = isSelected ? 3.5 : 2.5;
            
            if (shape.type === 'circle') {
              return (
                <g key={shape.id}>
                  <circle
                    cx={shape.x}
                    cy={shape.y}
                    r={shape.size / 2}
                    fill="none"
                    stroke={shape.color}
                    strokeWidth={strokeWidth}
                    style={{
                      filter: `drop-shadow(0 0 8px ${shape.glowColor})`,
                      pointerEvents: 'stroke',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClick();
                      setSelectedShapeId(shape.id);
                    }}
                  />
                  {isSelected && (
                    <>
                      {/* Resize handle */}
                      <circle
                        cx={shape.x + shape.size / 2}
                        cy={shape.y}
                        r={6}
                        fill={theme === 'dark' ? 'white' : 'black'}
                        style={{
                          pointerEvents: 'all',
                          cursor: 'ew-resize',
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingShapeId(shape.id);
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: shape.size, height: shape.size });
                        }}
                      />
                    </>
                  )}
                </g>
              );
            }
            if (shape.type === 'square') {
              return (
                <g key={shape.id}>
                  <rect
                    x={shape.x - shape.size / 2}
                    y={shape.y - shape.size / 2}
                    width={shape.size}
                    height={shape.size}
                    fill="none"
                    stroke={shape.color}
                    strokeWidth={strokeWidth}
                    style={{
                      filter: `drop-shadow(0 0 8px ${shape.glowColor})`,
                      pointerEvents: 'stroke',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClick();
                      setSelectedShapeId(shape.id);
                    }}
                  />
                  {isSelected && (
                    <>
                      {/* Resize handle */}
                      <circle
                        cx={shape.x + shape.size / 2}
                        cy={shape.y + shape.size / 2}
                        r={6}
                        fill={theme === 'dark' ? 'white' : 'black'}
                        style={{
                          pointerEvents: 'all',
                          cursor: 'se-resize',
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingShapeId(shape.id);
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: shape.size, height: shape.size });
                        }}
                      />
                    </>
                  )}
                </g>
              );
            }
            if (shape.type === 'triangle') {
              const height = shape.size * 0.866; // equilateral triangle
              const halfBase = shape.size / 2;
              const points = `${shape.x},${shape.y - height / 2} ${shape.x + halfBase},${shape.y + height / 2} ${shape.x - halfBase},${shape.y + height / 2}`;
              return (
                <g key={shape.id}>
                  <polygon
                    points={points}
                    fill="none"
                    stroke={shape.color}
                    strokeWidth={strokeWidth}
                    style={{
                      filter: `drop-shadow(0 0 8px ${shape.glowColor})`,
                      pointerEvents: 'stroke',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClick();
                      setSelectedShapeId(shape.id);
                    }}
                  />
                  {isSelected && (
                    <>
                      {/* Resize handle */}
                      <circle
                        cx={shape.x + halfBase}
                        cy={shape.y + height / 2}
                        r={6}
                        fill={theme === 'dark' ? 'white' : 'black'}
                        style={{
                          pointerEvents: 'all',
                          cursor: 'se-resize',
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingShapeId(shape.id);
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: shape.size, height: shape.size });
                        }}
                      />
                    </>
                  )}
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Connection canvas - below cards */}
      <canvas
        ref={connectionCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
      />

      {/* Glow canvas - below main canvas */}
      <canvas ref={glowCanvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: isSketchModeEnabled ? 14 : 0, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }} />

      {/* Shape placement overlay - appears when shape is selected */}
      {selectedShapeType && (
        <div
          ref={boardRef}
          className="absolute inset-0 cursor-crosshair"
          style={{ zIndex: 20 }}
          onClick={handleCanvasClickForShape}
        >
          {/* Hint text */}
          <div
            className={`absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full ${textColor} opacity-70 font-['Cambay',sans-serif] text-[14px]`}
            style={{
              backgroundColor: controlsBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${controlsBorder}`,
            }}
          >
            Click to place {selectedShapeType}
          </div>
        </div>
      )}

      {/* Card creation layer - handles double-click/right-click when sketch mode is off */}
      {!isSketchModeEnabled && !isShiftPressed && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 2 }}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />
      )}

      {/* Pan layer - appears when Shift is pressed and sketch mode is off */}
      {isShiftPressed && !isSketchModeEnabled && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 20, cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => {
            if (e.button === 0) {
              setIsPanning(true);
              setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            }
          }}
          onMouseMove={(e) => {
            if (isPanning) {
              setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
              });
            }
          }}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => setIsPanning(false)}
        />
      )}

      {/* Drawing canvas - handles sketching */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        className="absolute inset-0 touch-none"
        style={{ 
          touchAction: 'none', 
          zIndex: isSketchModeEnabled ? 15 : 0.5, // Higher z-index when sketching, below everything when not
          cursor: isSketchModeEnabled ? (isShiftPressed ? (isPanning ? 'grabbing' : 'grab') : (isEraserMode ? 'cell' : 'crosshair')) : 'default',
          pointerEvents: isSketchModeEnabled ? 'auto' : 'none', // Only capture events when sketching
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      />

      {/* Ghost Lanes Layer (Phase 3A) - appears when model is active but not applied */}
      <AnimatePresence>
        {activeModelId && !isStructureApplied && (() => {
          const model = getActiveModel();
          if (!model) return null;
          
          return (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 6, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {model.lanes.map((lane, index) => (
                <motion.div
                  key={lane.id}
                  className="absolute rounded-xl"
                  style={{
                    left: lane.x,
                    top: lane.y,
                    width: lane.width,
                    height: lane.height,
                    border: `1px dashed ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {/* Lane label */}
                  <div
                    className={`absolute top-3 left-4 font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-40`}
                  >
                    {lane.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Solid Lanes Layer - appears after structure is applied */}
      <AnimatePresence>
        {activeLanes.length > 0 && (
          <motion.div
            className="absolute inset-0"
            style={{ zIndex: 6, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {activeLanes.map((lane, index) => (
              <motion.div
                key={lane.id}
                drag={!resizingLaneId && !resizingCardId}
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => handleLaneDragStart(lane.id)}
                onDrag={(_, info) => handleLaneDrag(lane.id, info)}
                onDragEnd={() => handleLaneDragEnd(lane.id)}
                className="absolute rounded-xl group cursor-move"
                style={{
                  x: lane.x,
                  y: lane.y,
                  width: lane.width,
                  height: lane.height,
                  border: `1.5px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)'}`,
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: lane.x,
                  y: lane.y,
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.08, 
                  ease: [0.25, 0.1, 0.25, 1],
                  x: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                  y: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                }}
              >
                {/* Lane label */}
                <div
                  className={`absolute top-3 left-4 font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-60 pointer-events-none`}
                >
                  {lane.label}
                </div>

                {/* Lane resize handle - bottom-right only - appears on hover */}
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full cursor-se-resize opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity pointer-events-auto"
                  style={{
                    backgroundColor: theme === 'dark' ? 'white' : 'black',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingLaneId(lane.id);
                    setResizeStartPos({ x: e.clientX, y: e.clientY });
                    setResizeStartSize({ width: lane.width, height: lane.height });
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
        <AnimatePresence>
          {cards.map((card) => {
            const cardSize = CARD_SIZES[card.size];
            // Use custom size if available, otherwise use preset size
            const actualWidth = card.customWidth || cardSize.width;
            const actualHeight = card.customHeight || cardSize.height;
            const isSelected = selectedCardId === card.id;
            const cardColorConfig = cardColors.find((c) => c.bg === card.color) || cardColors[0];
            
            // Card affinity hint (Phase 3A)
            const hasAffinity = activeModelId && !isStructureApplied && cardAffinities[card.id];
            const affinityGlow = hasAffinity 
              ? theme === 'dark' 
                ? '0 0 20px rgba(255, 255, 255, 0.15), 0 0 40px rgba(255, 255, 255, 0.08)' 
                : '0 0 20px rgba(0, 0, 0, 0.12), 0 0 40px rgba(0, 0, 0, 0.06)'
              : '';
            
            // Enhanced affinity styling
            const enhancedAffinityBorder = hasAffinity ? '3px solid rgba(34, 197, 94, 0.5)' : undefined;
            const enhancedAffinityGlow = hasAffinity 
              ? theme === 'dark'
                ? '0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.15), 0 6px 20px rgba(0, 0, 0, 0.10)'
                : '0 0 30px rgba(34, 197, 94, 0.25), 0 0 60px rgba(34, 197, 94, 0.12), 0 6px 20px rgba(0, 0, 0, 0.10)'
              : hasAffinity 
                ? `${affinityGlow}, 0 6px 20px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06)`
                : '0 6px 20px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06)';

            return (
              <motion.div
                key={card.id}
                drag={!resizingCardId && !resizingLaneId && !isDraggingLane}
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => handleCardDragStart(card.id)}
                onDrag={(_, info) => handleCardDrag(card.id, info)}
                onDragEnd={() => handleCardDragEnd(card.id)}
                onClick={(e) => connectingFrom ? handleCompleteConnection(card.id, 'left', e) : handleCardClick(card.id, e)}
                className="absolute pointer-events-auto cursor-move group"
                style={{
                  x: card.x,
                  y: card.y,
                  width: actualWidth,
                  height: actualHeight,
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: hasAffinity ? 1.01 : 1,
                  x: card.x,
                  y: card.y,
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.25, 0.1, 0.25, 1],
                  x: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
                  y: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
                }}
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className={`w-full h-full rounded-xl p-4 relative ${isSelected ? 'ring-2' : ''}`}
                  style={{
                    backgroundColor: card.color,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: enhancedAffinityBorder,
                    boxShadow: enhancedAffinityGlow,
                    ringColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <textarea
                    value={card.content}
                    onChange={(e) => handleTextInput(card.id, e.target.value)}
                    onFocus={() => setActiveCardId(card.id)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type here..."
                    className="w-full h-full bg-transparent border-none outline-none resize-none font-['Cambay',sans-serif] text-[15px] tracking-[0.15px] placeholder:opacity-30"
                    style={{ color: cardColorConfig.text }}
                    autoFocus={card.id === activeCardId}
                  />

                  {/* Connection handles - 4 positions - only show when selected or in connecting mode */}
                  {(isSelected || connectingFrom) && (
                    <>
                      {/* Top handle */}
                      <motion.button
                        onClick={(e) => {
                          if (connectingFrom) {
                            handleCompleteConnection(card.id, 'top', e);
                          } else {
                            handleStartConnection(card.id, 'top', e);
                          }
                        }}
                        className={`absolute left-1/2 -top-3 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center`}
                        style={{
                          backgroundColor: controlsBg,
                          border: `2px solid ${controlsBorder}`,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
                      </motion.button>

                      {/* Right handle */}
                      <motion.button
                        onClick={(e) => {
                          if (connectingFrom) {
                            handleCompleteConnection(card.id, 'right', e);
                          } else {
                            handleStartConnection(card.id, 'right', e);
                          }
                        }}
                        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center`}
                        style={{
                          backgroundColor: controlsBg,
                          border: `2px solid ${controlsBorder}`,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
                      </motion.button>

                      {/* Bottom handle */}
                      <motion.button
                        onClick={(e) => {
                          if (connectingFrom) {
                            handleCompleteConnection(card.id, 'bottom', e);
                          } else {
                            handleStartConnection(card.id, 'bottom', e);
                          }
                        }}
                        className={`absolute left-1/2 -bottom-3 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center`}
                        style={{
                          backgroundColor: controlsBg,
                          border: `2px solid ${controlsBorder}`,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
                      </motion.button>

                      {/* Left handle */}
                      <motion.button
                        onClick={(e) => {
                          if (connectingFrom) {
                            handleCompleteConnection(card.id, 'left', e);
                          } else {
                            handleStartConnection(card.id, 'left', e);
                          }
                        }}
                        className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center`}
                        style={{
                          backgroundColor: controlsBg,
                          border: `2px solid ${controlsBorder}`,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
                      </motion.button>
                    </>
                  )}

                  {/* Resize handles - corner handles only - show when selected */}
                  {isSelected && (
                    <>
                      {/* Bottom-right - primary resize handle */}
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                        style={{
                          backgroundColor: theme === 'dark' ? 'white' : 'black',
                          opacity: 0.6,
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const currentSize = card.customWidth && card.customHeight 
                            ? { width: card.customWidth, height: card.customHeight }
                            : { width: cardSize.width, height: cardSize.height };
                          setResizingCardId(card.id);
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize(currentSize);
                        }}
                      />

                    </>
                  )}
                  
                  {/* Green glowing button for cards with affinity */}
                  {hasAffinity && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full cursor-pointer"
                      style={{
                        backgroundColor: 'rgb(34, 197, 94)',
                        boxShadow: '0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3)',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                      }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile UI - Clean Navigation */}
      {isMobile ? (
        <ThinkingCanvasMobileFloatingUI
          isClearing={isClearing}
          clearProgress={clearProgress}
          onClearStart={handleClearStart}
          onClearEnd={handleClearEnd}
          strokeColor={strokeColor}
          onColorSelect={(color) => setStrokeColor(color)}
          onToggleSketch={() => setIsSketchModeEnabled((prev) => !prev)}
          onToggleModels={() => setShowModelSelector((prev) => !prev)}
          onToggleEraser={() => setIsEraserMode((prev) => !prev)}
          isSketchModeEnabled={isSketchModeEnabled}
          isEraserMode={isEraserMode}
          playClick={playClick}
        />
      ) : (
        <>
          {/* Desktop: Unified Navigation Anchor */}
          <motion.button
            onClick={() => {
              playClick();
              setShowSketchControls((prev) => !prev);
              if (!showSketchControls) {
                resetControlsTimer();
              }
            }}
            className="absolute left-6 bottom-6 w-11 h-11 rounded-full flex items-center justify-center transition-opacity duration-300 z-40"
            style={{
              backgroundColor: controlsBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${controlsBorder}`,
              opacity: showSketchControls || showCardControls ? 0.3 : 0.6,
            }}
            whileHover={{ scale: 1.08, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-4.5 h-4.5" style={{ color: textColor.replace('text-', '') }} />
          </motion.button>

          {/* Desktop: Back and Clear Navigation Buttons - Icon only */}
          <div className="absolute right-6 top-6 flex items-center gap-3 z-40">
            {/* Back button - Icon only */}
            <Link to="/canvas" onClick={() => playClick()}>
              <motion.button
                className="w-10 h-10 rounded-lg border flex items-center justify-center"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)',
                  borderColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Back to Home"
              >
                <ArrowLeft className={`w-[18px] h-[18px] ${theme === 'dark' ? 'text-black' : 'text-white'}`} strokeWidth={2.5} />
              </motion.button>
            </Link>

            {/* Clear button - Icon only, hold to clear */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearStart();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearEnd();
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearEnd();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearEnd();
              }}
              className="w-10 h-10 rounded-lg relative border flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)',
                borderColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
              }}
              title="Hold to Clear Canvas"
            >
              <RotateCcw className={`w-[18px] h-[18px] ${theme === 'dark' ? 'text-black' : 'text-white'} relative z-10`} strokeWidth={2.5} />
              {isClearing && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: `conic-gradient(${
                      theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                    } ${clearProgress}%, transparent ${clearProgress}%)`,
                  }}
                />
              )}
            </button>
          </div>
        </>
      )}

      {/* Active Model Info Panel - shows when model is selected */}
      <AnimatePresence>
        {activeModelId && !isStructureApplied && (
          <motion.div
            className={`absolute ${isMobile ? 'top-20 left-4 right-4' : 'top-20 left-1/2 -translate-x-1/2'} ${isMobile ? '' : 'max-w-md'} z-40`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: controlsBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${controlsBorder}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className={`w-4 h-4 ${textColor} opacity-60`} />
                    <h3 className={`font-['Caladea',serif] text-[16px] tracking-[-0.3px] ${textColor}`}>
                      {getActiveModel()?.name}
                    </h3>
                  </div>
                  <p className={`font-['Cambay',sans-serif] text-[13px] leading-relaxed tracking-[0.13px] ${textColor} opacity-60`}>
                    {getActiveModel()?.description}
                  </p>
                  <p className={`font-['Cambay',sans-serif] text-[12px] tracking-[0.12px] ${textColor} opacity-40 mt-2`}>
                    Position cards in the ghost lanes, then apply the structure
                  </p>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    handleExitModel();
                  }}
                  className={`p-1.5 rounded-lg hover:opacity-70 transition-opacity ${textColor}`}
                  title="Close model"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lane Structure Controls (Phase 3A) */}
      <AnimatePresence>
        {activeModelId && (
          <motion.div
            className={`absolute ${isMobile ? 'left-1/2 -translate-x-1/2 bottom-4' : 'left-1/2 -translate-x-1/2 bottom-6'} flex items-center gap-2 z-40`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {!isStructureApplied ? (
              <>
                {/* Apply structure button */}
                <motion.button
                  onClick={handleApplyStructure}
                  className={`${isMobile ? 'px-4 py-3' : 'px-5 py-2.5'} rounded-full flex items-center gap-2`}
                  style={{
                    backgroundColor: controlsBg,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${controlsBorder}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className={`w-4 h-4 ${textColor.replace('text-', 'text-')}`} />
                  <span className={`font-['Cambay',sans-serif] text-[14px] tracking-[0.14px] ${textColor.replace('text-', 'text-')}`}>
                    Apply this structure
                  </span>
                </motion.button>
                
                {/* Exit model button */}
                <motion.button
                  onClick={handleExitModel}
                  className={`${isMobile ? 'w-11 h-11' : 'w-10 h-10'} rounded-full flex items-center justify-center`}
                  style={{
                    backgroundColor: controlsBg,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${controlsBorder}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Exit model"
                >
                  <X className={`w-4 h-4 ${textColor.replace('text-', 'text-')}`} />
                </motion.button>
              </>
            ) : (
              <>
                {/* Undo button */}
                <motion.button
                  onClick={handleUndoStructure}
                  className={`${isMobile ? 'px-4 py-3' : 'px-5 py-2.5'} rounded-full flex items-center gap-2`}
                  style={{
                    backgroundColor: controlsBg,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${controlsBorder}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className={`w-4 h-4 ${textColor.replace('text-', 'text-')}`} />
                  <span className={`font-['Cambay',sans-serif] text-[14px] tracking-[0.14px] ${textColor.replace('text-', 'text-')}`}>
                    Undo
                  </span>
                </motion.button>
                
                {/* Exit model button */}
                <motion.button
                  onClick={handleExitModel}
                  className={`${isMobile ? 'w-11 h-11' : 'w-10 h-10'} rounded-full flex items-center justify-center`}
                  style={{
                    backgroundColor: controlsBg,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${controlsBorder}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Exit model"
                >
                  <X className={`w-4 h-4 ${textColor.replace('text-', 'text-')}`} />
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sketch Mode Toggle - Bottom Right (Desktop only, mobile uses FAB) */}
      {!isMobile && (
        <motion.button
          onClick={() => {
            playClick();
            setIsSketchModeEnabled(!isSketchModeEnabled);
          }}
          className="absolute right-6 bottom-6 w-12 h-12 rounded-full flex items-center justify-center z-40"
          style={{
            backgroundColor: controlsBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${controlsBorder}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isSketchModeEnabled ? 'Disable sketch mode' : 'Enable sketch mode'}
        >
          {isSketchModeEnabled ? (
            <Droplet className="w-5 h-5" style={{ color: textColor.replace('text-', '') }} />
          ) : (
            <div className="relative">
              <Droplet className="w-5 h-5 opacity-30" style={{ color: textColor.replace('text-', '') }} />
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  fontSize: '20px',
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                }}
              >
                /
              </div>
            </div>
          )}
        </motion.button>
      )}

      {/* Horizontal Sketch Control Panel - Desktop only, mobile uses bottom sheet */}
      <AnimatePresence>
        {showSketchControls && !isMobile && (
          <motion.div
            className="absolute left-6 bottom-20 flex items-center gap-2 z-30"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: controlsBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${controlsBorder}`,
              }}
            >
              {/* Stroke modes */}
              <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: controlsBorder }}>
                <button
                  onClick={() => {
                    playClick();
                    setStrokeMode('calm');
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 ${
                    strokeMode === 'calm' ? (theme === 'dark' ? 'bg-white/18' : 'bg-black/18') : 'opacity-40 hover:opacity-70'
                  }`}
                  title="Calm"
                >
                  <Circle className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setStrokeMode('quick');
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 ${
                    strokeMode === 'quick' ? (theme === 'dark' ? 'bg-white/18' : 'bg-black/18') : 'opacity-40 hover:opacity-70'
                  }`}
                  title="Quick"
                >
                  <Zap className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setStrokeMode('focus');
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 ${
                    strokeMode === 'focus' ? (theme === 'dark' ? 'bg-white/18' : 'bg-black/18') : 'opacity-40 hover:opacity-70'
                  }`}
                  title="Focus"
                >
                  <Droplet className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
              </div>

              {/* Eraser */}
              <div className="flex items-center gap-1 px-2 border-x" style={{ borderColor: controlsBorder }}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playClick();
                    setIsEraserMode((prev) => !prev);
                    resetControlsTimer();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playClick();
                    setIsEraserMode((prev) => !prev);
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 cursor-pointer ${
                    isEraserMode ? (theme === 'dark' ? 'bg-red-500/20' : 'bg-red-500/20') : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation', position: 'relative', zIndex: 50 }}
                  title="Eraser"
                >
                  <Eraser 
                    className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${isEraserMode ? 'text-red-500' : textColor.replace('text-', 'text-')}`} 
                    style={{ pointerEvents: 'none' }}
                  />
                </button>
              </div>

              {/* Geometric shapes */}
              <div className="flex items-center gap-1 pl-2 border-l" style={{ borderColor: controlsBorder }}>
                <button
                  onClick={() => {
                    playClick();
                    setSelectedShapeType(selectedShapeType === 'circle' ? null : 'circle');
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 ${
                    selectedShapeType === 'circle' ? (theme === 'dark' ? 'bg-white/18' : 'bg-black/18') : 'opacity-40 hover:opacity-70'
                  }`}
                  title="Circle"
                >
                  <Circle className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setSelectedShapeType(selectedShapeType === 'square' ? null : 'square');
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 ${
                    selectedShapeType === 'square' ? (theme === 'dark' ? 'bg-white/18' : 'bg-black/18') : 'opacity-40 hover:opacity-70'
                  }`}
                  title="Square"
                >
                  <Square className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setSelectedShapeType(selectedShapeType === 'triangle' ? null : 'triangle');
                    resetControlsTimer();
                  }}
                  className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-all duration-300 ${
                    selectedShapeType === 'triangle' ? (theme === 'dark' ? 'bg-white/18' : 'bg-black/18') : 'opacity-40 hover:opacity-70'
                  }`}
                  title="Triangle"
                >
                  <Triangle className={`${isMobile ? 'w-4.5 h-4.5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Palette - Desktop only (mobile uses floating UI) */}
      <AnimatePresence>
        {!isMobile && showSketchControls && isSketchModeEnabled && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 bottom-6 z-30"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <SketchColorPaletteRedesign
              selectedColor={strokeColor}
              onColorSelect={(color) => {
                playClick();
                setStrokeColor(color);
                resetControlsTimer();
              }}
              isMobile={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Thinking Models Sheet */}
      {isMobile && (
        <AnimatePresence>
          {showModelSelector && (
            <ThinkingModelsMobileSheet
              onSelectModel={(modelId) => {
                playClick();
                setActiveModelId(modelId);
                setShowModelSelector(false);
              }}
              onClose={() => setShowModelSelector(false)}
              activeModelId={activeModelId}
              playClick={playClick}
            />
          )}
        </AnimatePresence>
      )}

      {/* Vertical Card Control Rail */}
      <AnimatePresence>
        {showCardControls && selectedCardId && (
          <motion.div
            className={`absolute ${isMobile ? 'left-4 bottom-20' : 'left-6 bottom-20'} flex flex-col gap-2 z-30`}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="flex flex-col gap-1 p-2 rounded-2xl"
              style={{
                backgroundColor: controlsBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${controlsBorder}`,
              }}
            >
              {/* Color controls */}
              <div className="flex flex-col gap-1 pb-2 border-b" style={{ borderColor: controlsBorder }}>
                {cardColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorChange(color.bg)}
                    className={`${isMobile ? 'w-11 h-11' : 'w-9 h-9'} rounded-lg transition-all duration-300`}
                    style={{
                      backgroundColor: color.bg,
                      border:
                        cards.find((c) => c.id === selectedCardId)?.color === color.bg
                          ? `2px solid ${theme === 'dark' ? 'white' : 'black'}`
                          : '1px solid rgba(0,0,0,0.15)',
                      transform:
                        cards.find((c) => c.id === selectedCardId)?.color === color.bg
                          ? 'scale(1.1)'
                          : 'scale(1)',
                    }}
                    title={color.name}
                  />
                ))}
              </div>

              {/* Size controls */}
              <div className="flex flex-col gap-1 py-2 border-b" style={{ borderColor: controlsBorder }}>
                <button
                  onClick={() => handleSizeChange('small')}
                  className={`${isMobile ? 'p-3' : 'p-2.5'} rounded-lg transition-all duration-300 ${
                    cards.find((c) => c.id === selectedCardId)?.size === 'small'
                      ? theme === 'dark' ? 'bg-white/20' : 'bg-black/20'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  title="Small"
                >
                  <Minimize2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onClick={() => handleSizeChange('medium')}
                  className={`${isMobile ? 'p-3' : 'p-2.5'} rounded-lg transition-all duration-300 ${
                    cards.find((c) => c.id === selectedCardId)?.size === 'medium'
                      ? theme === 'dark' ? 'bg-white/20' : 'bg-black/20'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  title="Medium"
                >
                  <Square className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onClick={() => handleSizeChange('large')}
                  className={`${isMobile ? 'p-3' : 'p-2.5'} rounded-lg transition-all duration-300 ${
                    cards.find((c) => c.id === selectedCardId)?.size === 'large'
                      ? theme === 'dark' ? 'bg-white/20' : 'bg-black/20'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  title="Large"
                >
                  <Maximize2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
              </div>

              {/* Action controls */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={handleDuplicate}
                  className={`${isMobile ? 'p-3' : 'p-2.5'} rounded-lg transition-all duration-300 opacity-60 hover:opacity-100`}
                  title="Duplicate (⌘D)"
                >
                  <Copy className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                </button>
                <button
                  onMouseDown={handleDeleteStart}
                  onMouseUp={handleDeleteEnd}
                  onMouseLeave={handleDeleteEnd}
                  onTouchStart={handleDeleteStart}
                  onTouchEnd={handleDeleteEnd}
                  className={`${isMobile ? 'p-3' : 'p-2.5'} rounded-lg transition-all duration-300 relative ${
                    isDeleting ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Delete (hold)"
                >
                  <Trash2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${textColor.replace('text-', 'text-')}`} />
                  {isDeleting && (
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: `conic-gradient(${
                          theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                        } ${deleteProgress}%, transparent ${deleteProgress}%)`,
                      }}
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thinking Models CTA - appears after interaction (desktop only, mobile uses bottom nav) */}
      <AnimatePresence>
        {showThinkingCTA && !showModelsOverlay && !activeModelId && !isMobile && (
          <motion.button
            onClick={() => {
              playClick();
              setShowModelsOverlay(true);
              if (!hasSeenLearning) {
                setShowLearningOverlay(true);
              }
            }}
            className="absolute bottom-6 right-24 px-4 py-2.5 rounded-full flex items-center gap-2 z-40"
            style={{
              backgroundColor: controlsBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${controlsBorder}`,
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 0.9 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.05, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Lightbulb className={`w-4 h-4 ${textColor.replace('text-', 'text-')}`} />
            <span className={`font-['Cambay',sans-serif] text-[14px] tracking-[0.14px] ${textColor.replace('text-', 'text-')}`}>
              Apply a thinking lens
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Deselect Thinking Lens Button - appears when a model is active (desktop only) */}
      <AnimatePresence>
        {activeModelId && !showModelsOverlay && !isMobile && (
          <motion.button
            onClick={() => {
              playClick();
              handleExitModel();
            }}
            className="absolute bottom-6 right-24 px-4 py-2.5 rounded-full flex items-center gap-2 z-40"
            style={{
              backgroundColor: controlsBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${controlsBorder}`,
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 0.9 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.05, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className={`w-4 h-4 ${textColor.replace('text-', 'text-')}`} />
            <span className={`font-['Cambay',sans-serif] text-[14px] tracking-[0.14px] ${textColor.replace('text-', 'text-')}`}>
              Deselect lens
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pan mode indicator - appears when Shift is pressed */}
      <AnimatePresence>
        {isShiftPressed && (
          <motion.div
            className={`absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full ${textColor} opacity-70 z-40`}
            style={{
              backgroundColor: controlsBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${controlsBorder}`,
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 0.9 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className={`font-['Cambay',sans-serif] text-[14px] tracking-[0.14px]`}>
              {isPanning ? 'Panning canvas...' : 'Hold and drag to pan canvas'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Tooltip Carousel */}
      <AnimatePresence>
        {showHelpTooltip && (
          <motion.div
            className={`absolute ${isMobile ? 'bottom-4 right-4 left-4' : 'top-1/2 -translate-y-1/2 left-8'} z-50`}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className={`relative rounded-2xl p-6 ${isMobile ? 'w-full' : 'w-80'}`}
              style={{
                backgroundColor: controlsBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${controlsBorder}`,
                boxShadow: theme === 'dark' 
                  ? '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 20px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Close button */}
              <button
                onClick={handleCloseHelpTooltip}
                className={`absolute top-4 right-4 p-1.5 rounded-lg ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Tooltip content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTooltipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="pr-8"
                >
                  <h3 className={`font-['Caladea',serif] text-[20px] ${textColor} mb-3`}>
                    {helpTooltips[currentTooltipIndex].title}
                  </h3>
                  <p className={`font-['Cambay',sans-serif] text-[14px] leading-[1.6] tracking-[0.14px] ${textColor} opacity-70`}>
                    {helpTooltips[currentTooltipIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                {/* Navigation dots */}
                <div className="flex gap-1.5">
                  {helpTooltips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        playClick();
                        setCurrentTooltipIndex(index);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentTooltipIndex
                          ? theme === 'dark' ? 'bg-white w-4' : 'bg-black w-4'
                          : theme === 'dark' ? 'bg-white/30' : 'bg-black/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Prev/Next buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevTooltip}
                    className={`p-1.5 rounded-lg ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextTooltip}
                    className={`p-1.5 rounded-lg ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 text-center">
                <span className={`font-['Cambay',sans-serif] text-[12px] ${textColor} opacity-40`}>
                  {currentTooltipIndex + 1} of {helpTooltips.length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thinking Models Overlay */}
      <AnimatePresence>
        {showModelsOverlay && (
          <>
            {/* Dim background */}
            <motion.div
              className="absolute inset-0 bg-black/15 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                playClick();
                setShowModelsOverlay(false);
                setShowLearningOverlay(false);
              }}
            />

            {/* Models container */}
            <motion.div
              className={`absolute inset-0 flex items-center justify-center z-50 p-4 md:p-8 pointer-events-none`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="w-full max-w-5xl max-h-[85vh] overflow-y-auto pointer-events-auto rounded-2xl p-6 md:p-10"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(20, 20, 20, 0.97)' : 'rgba(255, 255, 255, 0.97)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className={`font-['Caladea',serif] text-[28px] md:text-[32px] tracking-[-0.5px] ${textColor} mb-2`}>
                      Thinking Models
                    </h2>
                    <p className={`font-['Cambay',sans-serif] text-[15px] tracking-[0.15px] opacity-60 ${textColor}`}>
                      Frameworks to structure your thinking
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      playClick();
                      setShowModelsOverlay(false);
                      setShowLearningOverlay(false);
                    }}
                    className={`p-2 rounded-lg hover:opacity-70 transition-opacity ${textColor}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Models grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  {THINKING_MODELS.map((model) => (
                    <motion.div
                      key={model.id}
                      className="p-6 rounded-xl"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(40, 40, 45, 0.5)' : 'rgba(245, 245, 250, 0.8)',
                        border: `1px solid ${controlsBorder}`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Model name */}
                      <h3 className={`font-['Caladea',serif] text-[20px] tracking-[-0.3px] ${textColor} mb-3`}>
                        {model.name}
                      </h3>

                      {/* Description */}
                      <p className={`font-['Cambay',sans-serif] text-[14px] leading-relaxed tracking-[0.14px] ${textColor} opacity-80 mb-4`}>
                        {model.description}
                      </p>

                      {/* When to use */}
                      <div className="mb-4">
                        <p className={`font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-50 mb-1`}>
                          When to use this
                        </p>
                        <p className={`font-['Cambay',sans-serif] text-[14px] leading-relaxed tracking-[0.14px] ${textColor} opacity-75`}>
                          {model.whenToUse}
                        </p>
                      </div>

                      {/* Steps */}
                      <div className="mb-5">
                        <p className={`font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-50 mb-2`}>
                          How to think through it
                        </p>
                        <ol className="space-y-1.5">
                          {model.steps.map((step, index) => (
                            <li
                              key={index}
                              className={`font-['Cambay',sans-serif] text-[14px] leading-relaxed tracking-[0.14px] ${textColor} opacity-75 flex gap-2`}
                            >
                              <span className="opacity-50">{index + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Shape guidance */}
                      <div
                        className="p-4 rounded-lg mb-4"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(30, 30, 35, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        <p className={`font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-50 mb-3`}>
                          Shape guidance
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Circle className={`w-4 h-4 ${textColor} opacity-60`} />
                            <span className={`font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-70`}>
                              {model.shapeMapping.circle}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Square className={`w-4 h-4 ${textColor} opacity-60`} />
                            <span className={`font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-70`}>
                              {model.shapeMapping.square}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Triangle className={`w-4 h-4 ${textColor} opacity-60`} />
                            <span className={`font-['Cambay',sans-serif] text-[13px] tracking-[0.13px] ${textColor} opacity-70`}>
                              {model.shapeMapping.triangle}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Use this model button */}
                      <button
                        onClick={() => {
                          playClick();
                          setActiveModelId(model.id);
                          setShowModelsOverlay(false);
                          setShowLearningOverlay(false);
                        }}
                        className={`w-full py-2.5 rounded-lg font-['Cambay',sans-serif] text-[14px] tracking-[0.14px] transition-all duration-200`}
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                      >
                        Use this model
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Learning overlay - first time only */}
            <AnimatePresence>
              {showLearningOverlay && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <div
                    className="max-w-md pointer-events-auto rounded-2xl p-8 text-center"
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(30, 30, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(30px)',
                      WebkitBackdropFilter: 'blur(30px)',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                      border: `1px solid ${controlsBorder}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-6">
                      <Lightbulb className={`w-10 h-10 ${textColor} opacity-70 mx-auto mb-4`} />
                      <h3 className={`font-['Caladea',serif] text-[24px] tracking-[-0.4px] ${textColor} mb-3`}>
                        Welcome to Thinking Models
                      </h3>
                    </div>

                    <div className="space-y-4 mb-8">
                      <p className={`font-['Cambay',sans-serif] text-[15px] leading-relaxed tracking-[0.15px] ${textColor} opacity-75`}>
                        These frameworks help structure your thinking without forcing a specific workflow.
                      </p>
                      <p className={`font-['Cambay',sans-serif] text-[15px] leading-relaxed tracking-[0.15px] ${textColor} opacity-75`}>
                        Use shapes to represent different types of thoughts ��� circles for unknowns, squares for facts, triangles for
                        decisions.
                      </p>
                      <p className={`font-['Cambay',sans-serif] text-[14px] leading-relaxed tracking-[0.14px] ${textColor} opacity-60`}>
                        Nothing is automatic. You're in control.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        playClick();
                        setShowLearningOverlay(false);
                        setHasSeenLearning(true);
                      }}
                      className={`w-full py-3 rounded-lg font-['Cambay',sans-serif] text-[15px] tracking-[0.15px] transition-all duration-200`}
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          theme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      Got it
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}