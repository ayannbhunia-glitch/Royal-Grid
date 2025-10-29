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


const PlayingCard: React.FC<PlayingCardProps> = ({ cell, isKingHere, isPossibleMove, onClick, cardSize }) => {
  if (!cell) return null;

  const { card, isInvalid, justMovedTo } = cell;
  const { rank, suit } = card;
  const config = suitConfig[suit];

  const cardContent = (
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
  );

  const kingOverlay = isKingHere && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
      {isKingHere.type === 'human' ? <CrownIcon color={playerColors[isKingHere.id]} /> : <BotIcon color={playerColors[isKingHere.id]} />}
    </div>
  );

  return (
    <motion.div
      animate={justMovedTo ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-lg select-none",
        'bg-[hsl(var(--card))] border-[hsl(var(--border))]',
        isInvalid && 'opacity-50 grayscale contrast-50',
        isPossibleMove && 'ring-4 ring-offset-2 ring-offset-slate-900 ring-cyan-400 cursor-pointer hover:scale-105',
        isKingHere && `ring-4 ring-offset-2 ring-offset-slate-900`
      )}
      style={{
        width: `${cardSize}px`,
        height: `${cardSize * 1.4}px`,
        ringColor: isKingHere ? playerColors[isKingHere.id] : undefined,
      }}
      onClick={onClick}
    >
      {cardContent}
      {kingOverlay}
    </motion.div>
  );
};

export default PlayingCard;
