import { useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '@/app/context/theme-context';
import { useSound } from '@/app/context/sound-context';
import type { ThinkingModel } from '@/app/data/thinking-models';

interface DiagramShape {
  id: string;
  type: 'circle' | 'rectangle' | 'triangle';
  x: number;
  y: number;
  size: number;
  opacity?: number;
}

interface ModelDiagramProps {
  model: ThinkingModel;
}

// Diagram configurations for each model
const DIAGRAM_CONFIGS: Record<string, DiagramShape[]> = {
  'first-principles': [
    // Assumptions column (circles)
    { id: 'a1', type: 'circle', x: 15, y: 20, size: 18, opacity: 0.7 },
    { id: 'a2', type: 'circle', x: 20, y: 45, size: 16, opacity: 0.6 },
    { id: 'a3', type: 'circle', x: 12, y: 68, size: 14, opacity: 0.5 },
    
    // Fundamentals column (rectangles) - fewer, showing filtering
    { id: 'f1', type: 'rectangle', x: 42, y: 30, size: 20, opacity: 0.8 },
    { id: 'f2', type: 'rectangle', x: 45, y: 60, size: 18, opacity: 0.7 },
    
    // Rebuild column (triangles) - new insights
    { id: 'r1', type: 'triangle', x: 75, y: 25, size: 22, opacity: 0.9 },
    { id: 'r2', type: 'triangle', x: 78, y: 55, size: 20, opacity: 0.85 },
    { id: 'r3', type: 'triangle', x: 72, y: 75, size: 18, opacity: 0.8 },
  ],
  
  'five-whys': [
    // Layer 1 - Surface
    { id: 'q1', type: 'circle', x: 15, y: 12, size: 14, opacity: 0.5 },
    { id: 'a1', type: 'rectangle', x: 70, y: 12, size: 14, opacity: 0.6 },
    
    // Layer 2
    { id: 'q2', type: 'circle', x: 18, y: 28, size: 15, opacity: 0.6 },
    { id: 'a2', type: 'rectangle', x: 68, y: 28, size: 15, opacity: 0.7 },
    
    // Layer 3
    { id: 'q3', type: 'circle', x: 22, y: 44, size: 16, opacity: 0.7 },
    { id: 'a3', type: 'rectangle', x: 64, y: 44, size: 16, opacity: 0.75 },
    
    // Layer 4
    { id: 'q4', type: 'circle', x: 26, y: 60, size: 17, opacity: 0.8 },
    { id: 'a4', type: 'rectangle', x: 60, y: 60, size: 17, opacity: 0.8 },
    
    // Layer 5 - Root (triangle for decision point)
    { id: 'q5', type: 'circle', x: 30, y: 78, size: 18, opacity: 0.9 },
    { id: 'root', type: 'triangle', x: 58, y: 78, size: 20, opacity: 1 },
  ],
  
  'second-order': [
    // Direct effect (center square)
    { id: 'd1', type: 'rectangle', x: 15, y: 45, size: 22, opacity: 0.9 },
    
    // Secondary effects (circles radiating)
    { id: 's1', type: 'circle', x: 45, y: 25, size: 16, opacity: 0.7 },
    { id: 's2', type: 'circle', x: 48, y: 48, size: 18, opacity: 0.75 },
    { id: 's3', type: 'circle', x: 42, y: 68, size: 15, opacity: 0.65 },
    
    // Long-term ripples (triangles - decisions made in response)
    { id: 'l1', type: 'triangle', x: 70, y: 20, size: 14, opacity: 0.6 },
    { id: 'l2', type: 'triangle', x: 75, y: 40, size: 16, opacity: 0.7 },
    { id: 'l3', type: 'triangle', x: 78, y: 58, size: 15, opacity: 0.65 },
    { id: 'l4', type: 'triangle', x: 72, y: 75, size: 13, opacity: 0.6 },
  ],
  
  'eisenhower': [
    // Urgent-Important quadrant (top-left) - triangles (urgent decisions)
    { id: 'ui1', type: 'triangle', x: 15, y: 15, size: 16, opacity: 0.9 },
    { id: 'ui2', type: 'triangle', x: 28, y: 22, size: 14, opacity: 0.85 },
    
    // Not Urgent-Important quadrant (top-right) - rectangles (important facts)
    { id: 'ni1', type: 'rectangle', x: 58, y: 18, size: 18, opacity: 0.8 },
    { id: 'ni2', type: 'rectangle', x: 72, y: 25, size: 16, opacity: 0.75 },
    { id: 'ni3', type: 'rectangle', x: 65, y: 35, size: 14, opacity: 0.7 },
    
    // Urgent-Not Important quadrant (bottom-left) - fewer items
    { id: 'un1', type: 'circle', x: 18, y: 60, size: 12, opacity: 0.5 },
    { id: 'un2', type: 'circle', x: 28, y: 72, size: 10, opacity: 0.45 },
    
    // Not Urgent-Not Important quadrant (bottom-right) - minimal
    { id: 'nn1', type: 'circle', x: 65, y: 68, size: 8, opacity: 0.3 },
  ],
  
  'ice': [
    // Ideas to evaluate (circles on left)
    { id: 'i1', type: 'circle', x: 12, y: 25, size: 14, opacity: 0.6 },
    { id: 'i2', type: 'circle', x: 15, y: 45, size: 16, opacity: 0.65 },
    { id: 'i3', type: 'circle', x: 18, y: 65, size: 15, opacity: 0.6 },
    { id: 'i4', type: 'circle', x: 14, y: 80, size: 12, opacity: 0.5 },
    
    // High-impact opportunities (rectangles in middle) - filtered
    { id: 'h1', type: 'rectangle', x: 42, y: 30, size: 18, opacity: 0.8 },
    { id: 'h2', type: 'rectangle', x: 45, y: 55, size: 20, opacity: 0.85 },
    
    // Quick wins (triangles on right) - highest priority
    { id: 'q1', type: 'triangle', x: 72, y: 35, size: 22, opacity: 0.95 },
    { id: 'q2', type: 'triangle', x: 75, y: 60, size: 20, opacity: 0.9 },
  ],
};

export default function ModelDiagram({ model }: ModelDiagramProps) {
  const { theme } = useTheme();
  const { playClick } = useSound();
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);

  const shapes = DIAGRAM_CONFIGS[model.id] || [];

  const handleShapeClick = (shapeId: string) => {
    playClick();
    setSelectedShapeId(selectedShapeId === shapeId ? null : shapeId);
  };

  // Color based on theme
  const getShapeColor = (type: string, isHovered: boolean, isSelected: boolean) => {
    const isDark = theme === 'dark';
    
    if (isSelected) {
      return isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 35, 0.9)';
    }
    
    if (isHovered) {
      return isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 30, 35, 0.7)';
    }
    
    // Default colors based on shape type
    if (type === 'circle') {
      return isDark ? 'rgba(150, 170, 200, 0.6)' : 'rgba(100, 115, 145, 0.6)';
    } else if (type === 'rectangle') {
      return isDark ? 'rgba(130, 160, 140, 0.7)' : 'rgba(85, 110, 90, 0.7)';
    } else {
      return isDark ? 'rgba(190, 130, 110, 0.7)' : 'rgba(145, 90, 75, 0.7)';
    }
  };

  const renderShape = (shape: DiagramShape) => {
    const isHovered = hoveredShapeId === shape.id;
    const isSelected = selectedShapeId === shape.id;
    const color = getShapeColor(shape.type, isHovered, isSelected);

    const baseProps = {
      onClick: () => handleShapeClick(shape.id),
      onMouseEnter: () => setHoveredShapeId(shape.id),
      onMouseLeave: () => setHoveredShapeId(null),
      style: { cursor: 'pointer' },
      initial: { opacity: 0, scale: 0.8 },
      animate: { 
        opacity: shape.opacity || 1, 
        scale: isSelected ? 1.15 : isHovered ? 1.1 : 1 
      },
      transition: { 
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      },
      whileTap: { scale: 0.95 }
    };

    if (shape.type === 'circle') {
      return (
        <motion.circle
          key={shape.id}
          cx={`${shape.x}%`}
          cy={`${shape.y}%`}
          r={`${shape.size}px`}
          fill={color}
          {...baseProps}
        />
      );
    } else if (shape.type === 'rectangle') {
      return (
        <motion.rect
          key={shape.id}
          x={`${shape.x}%`}
          y={`${shape.y}%`}
          width={`${shape.size}px`}
          height={`${shape.size}px`}
          rx="3"
          fill={color}
          style={{ transform: `translate(-${shape.size / 2}px, -${shape.size / 2}px)`, cursor: 'pointer' }}
          {...baseProps}
        />
      );
    } else {
      // Triangle
      const halfSize = shape.size / 2;
      const height = (shape.size * Math.sqrt(3)) / 2;
      
      return (
        <motion.g
          key={shape.id}
          {...baseProps}
        >
          <polygon
            points={`0,-${height * 0.6} -${halfSize},${height * 0.4} ${halfSize},${height * 0.4}`}
            fill={color}
            style={{ 
              transform: `translate(${shape.x}%, ${shape.y}%)`,
            }}
          />
        </motion.g>
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {shapes.map(renderShape)}
      </svg>
    </div>
  );
}