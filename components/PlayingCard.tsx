import React from 'react';
import { motion } from 'framer-motion';
import { Cell, Player, Suit } from '../lib/types';
import { cn } from '../lib/utils';
import { playerColors } from '../lib/constants';

interface PlayingCardProps {
  cell: Cell;
  isKingHere?: Player;
  isPossibleMove: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  cardSize: number;
}

export const suitConfig: { [key in Suit]: { symbol: string; color: string } } = {
  Hearts: { symbol: '♥', color: 'text-[#D96F95]' },
  Diamonds: { symbol: '♦', color: 'text-[#5DA0A8]' },
  Clubs: { symbol: '♣', color: 'text-[#58A87B]' },
  Spades: { symbol: '♠', color: 'text-[#8E82B3]' },
};

const CrownIcon = ({ color }: { color: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
);

const BotIcon = ({ color }: { color: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8"/>
        <rect width="16" height="12" x="4" y="8" rx="2"/>
        <path d="M2 14h2"/><path d="M20 14h2"/>
        <path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
);


const PlayingCard: React.FC<PlayingCardProps> = ({ cell, isKingHere, isPossibleMove, onClick, onMouseEnter, onMouseLeave, cardSize }) => {
  if (!cell) return null;

  const { card, isInvalid, justMovedTo } = cell;
  const { rank, suit } = card;
  const config = suitConfig[suit];

  const cardContent = (
    <>
      {!isInvalid ? (
        <>
          <div className={cn("absolute top-1 left-2", config.color)} style={{ fontSize: `${cardSize * 0.2}px`}}>
            {isKingHere ? <span className="font-bold">{rank}</span> : config.symbol}
          </div>
          {!isKingHere && (
            <div className={cn("absolute font-bold", config.color)} style={{ fontSize: `${cardSize * 0.5}px` }}>{rank}</div>
          )}
          <div className={cn("absolute bottom-1 right-2 transform rotate-180", config.color)} style={{ fontSize: `${cardSize * 0.2}px`}}>
            {isKingHere ? <span className="font-bold">{rank}</span> : config.symbol}
          </div>
        </>
      ) : (
        <>
          {/* Invalid cells: swap number and suit positions */}
          <div className={cn("absolute top-1 left-2", config.color)} style={{ fontSize: `${cardSize * 0.22}px`}}>
            {rank}
          </div>
          {!isKingHere && (
            <div className={cn("absolute font-black", config.color)} style={{ fontSize: `${cardSize * 0.5}px` }}>{config.symbol}</div>
          )}
          <div className={cn("absolute bottom-1 right-2 transform rotate-180", config.color)} style={{ fontSize: `${cardSize * 0.22}px`}}>
            {rank}
          </div>
        </>
      )}
    </>
  );

  const kingOverlay = isKingHere && (
    <motion.div
      layoutId={`king-${isKingHere.id}`}
      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {isKingHere.type === 'human' ? (
        <CrownIcon color={playerColors[isKingHere.id]} />
      ) : (
        <BotIcon color={playerColors[isKingHere.id]} />
      )}
    </motion.div>
  );

  return (
    <motion.div
      layout
      animate={justMovedTo 
        ? { 
            scale: [1, 1.12, 1.06, 1],
            filter: [
              'drop-shadow(0 0 0px rgba(34,211,238,0))',
              'drop-shadow(0 0 18px rgba(34,211,238,0.7))',
              'drop-shadow(0 0 8px rgba(34,211,238,0.4))',
              'drop-shadow(0 0 0px rgba(34,211,238,0))'
            ]
          } 
        : { scale: 1, filter: 'none' }}
      transition={{ duration: 0.9, times: [0, 0.4, 0.75, 1] }}
      className={cn(
        "relative rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-lg select-none",
        'bg-[hsl(var(--card))] border-[hsl(var(--border))]',
        isInvalid && 'opacity-30 grayscale brightness-40 contrast-125',
        isPossibleMove && 'z-10 ring-4 ring-offset-2 ring-offset-[hsl(var(--background))] ring-emerald-400 cursor-pointer hover:scale-105 outline outline-2 outline-emerald-400/50 bg-emerald-500/10',
        isKingHere && `ring-4 ring-offset-2 ring-offset-[hsl(var(--background))]`
      )}
      style={{
        width: `${cardSize}px`,
        height: `${cardSize * 1.4}px`,
        '--tw-ring-color': isKingHere ? playerColors[isKingHere.id] : undefined,
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {cardContent}
      {kingOverlay}
    </motion.div>
  );
};

export default PlayingCard;