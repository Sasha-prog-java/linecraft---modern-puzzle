
import React from 'react';
import { ColorType, SpecialBlockType } from '../types';
import { COLOR_MAP } from '../constants';

interface BlockProps {
  color: ColorType | null;
  size?: number;
  isPreview?: boolean;
  specialType?: SpecialBlockType;
  life?: number;
}

export const Block: React.FC<BlockProps> = ({ color, size, isPreview = false, specialType, life }) => {
  const hex = color ? COLOR_MAP[color] : 'transparent';
  
  if (!color) {
    return (
      <div 
        style={{ width: size ? size : '100%', height: size ? size : '100%' }}
        className="bg-slate-800/10 rounded-md border border-slate-800/10 transition-all"
      />
    );
  }

  const isFrozen = specialType === 'frozen' && (life ?? 0) > 0;

  return (
    <div
      className={`rounded-md block-shadow transition-all duration-100 relative flex items-center justify-center ${isPreview ? 'opacity-40 scale-90' : 'scale-100'} ${isFrozen ? 'brightness-125' : ''}`}
      style={{
        width: size ? size - 2 : 'calc(100% - 2px)',
        height: size ? size - 2 : 'calc(100% - 2px)',
        backgroundColor: hex,
        border: `1px solid rgba(255,255,255,0.3)`,
        margin: 1,
        boxShadow: `inset 0 2px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)`
      }}
    >
      {/* Special Overlays - Increased text size for better visibility */}
      {specialType === 'bomb' && (
        <div className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl animate-pulse z-10">💣</div>
      )}
      {specialType === 'star' && (
        <div className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl drop-shadow-lg z-10">⭐</div>
      )}
      {isFrozen && (
        <div className="absolute inset-0 bg-cyan-200/40 rounded-sm border-2 border-cyan-100/50 flex items-center justify-center z-10">
          <span className="text-sm font-black text-white drop-shadow-md">{life}</span>
        </div>
      )}
      
      {/* Tactile Highlight */}
      <div className="absolute top-0.5 left-0.5 right-0.5 h-1/4 bg-white/10 rounded-t-sm pointer-events-none" />
      <div className="absolute bottom-0.5 left-0.5 right-0.5 h-1/4 bg-black/10 rounded-b-sm pointer-events-none" />
    </div>
  );
};
