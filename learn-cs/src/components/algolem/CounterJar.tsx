'use client';
import { AnimatePresence, motion } from 'motion/react';

const R = 9; // ball radius
const PER_ROW = 5;
const MAX_DRAWN = 30;

function ballPos(i: number, width: number, bottom: number) {
  const row = Math.floor(i / PER_ROW);
  const col = i % PER_ROW;
  const left = (width - (PER_ROW * 2 * R + R * 0.6)) / 2;
  const offset = row % 2 ? R * 0.6 : 0;
  return { cx: left + R + col * 2 * R + offset, cy: bottom - R - row * (2 * R - 2.2) };
}

export interface CounterJarProps {
  name: string;
  value: number;
  /** What happened to this counter in the last step. */
  flash?: 'add' | 'sub' | 'test-full' | 'test-empty' | 'error' | null;
  /** Small caption under the name, e.g. "A ← R1" or "מונה עזר". */
  caption?: string;
  size?: 'md' | 'sm';
  dim?: boolean;
}

/** A glass jar holding balls. Adding a ball drops it in; removing lifts the top ball out. */
export function CounterJar({ name, value, flash = null, caption, size = 'md', dim = false }: CounterJarProps) {
  const W = PER_ROW * 2 * R + R * 0.6 + 22;
  const rows = Math.max(3, Math.ceil(Math.min(value, MAX_DRAWN) / PER_ROW) + 1);
  const H = 22 + rows * (2 * R - 2.5) + 14;
  const bottom = H - 8;
  const shown = Math.min(value, MAX_DRAWN);
  const scale = size === 'sm' ? 0.72 : 1;
  const ring =
    flash === 'add' ? 'var(--ok)' : flash === 'sub' ? 'var(--warn)' : flash === 'test-full' ? 'var(--info)' : flash === 'test-empty' || flash === 'error' ? 'var(--bad)' : 'transparent';
  return (
    <figure className={`flex flex-col items-center gap-1 ${dim ? 'opacity-55' : ''}`} aria-label={`מונה ${name}: ${value} כדורים`}>
      <div className="relative rounded-xl p-1 transition-shadow" style={{ boxShadow: `0 0 0 2px ${ring}` }}>
        <svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden>
          <defs>
            <radialGradient id="ball-grad" cx="35%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#fff6dd" />
              <stop offset="35%" stopColor="var(--ball)" />
              <stop offset="100%" stopColor="var(--ball-dark)" />
            </radialGradient>
            <linearGradient id="glass" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.07" />
              <stop offset="45%" stopColor="var(--ink)" stopOpacity="0.015" />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path d={`M5 6 V${bottom - 8} Q5 ${bottom} 13 ${bottom} H${W - 13} Q${W - 5} ${bottom} ${W - 5} ${bottom - 8} V6`} fill="url(#glass)" stroke="var(--ink-2)" strokeWidth="1.6" strokeLinecap="round" />
          <path d={`M10 12 V${bottom - 12}`} stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
          <AnimatePresence initial={false}>
            {Array.from({ length: shown }, (_, i) => {
              const p = ballPos(i, W, bottom);
              return (
                <motion.circle
                  key={i}
                  r={R - 0.6}
                  cx={p.cx}
                  initial={{ cy: -R * 2, opacity: 0 }}
                  animate={{ cy: p.cy, opacity: 1 }}
                  exit={{ cy: -R * 3, opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  fill="url(#ball-grad)"
                  stroke="var(--ball-dark)"
                  strokeWidth="0.8"
                />
              );
            })}
          </AnimatePresence>
          {value > MAX_DRAWN && (
            <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontFamily="var(--font-mono)">
              +{value - MAX_DRAWN}
            </text>
          )}
        </svg>
      </div>
      <figcaption className="text-center leading-tight">
        <span className="font-mono text-[0.95rem] font-semibold" dir="ltr">
          {name} = <motion.span key={value} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="inline-block">{value}</motion.span>
        </span>
        {caption && <span className="block text-[0.72rem] muted">{caption}</span>}
      </figcaption>
    </figure>
  );
}
