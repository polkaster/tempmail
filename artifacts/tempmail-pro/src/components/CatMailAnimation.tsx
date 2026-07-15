import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  show: boolean;
  count: number; // new email count label
}

export default function CatMailAnimation({ show, count }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="cat-mail"
          className="fixed bottom-20 left-0 z-50 pointer-events-none select-none"
          initial={{ x: '-140px' }}
          animate={{ x: 'calc(100vw + 140px)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3.8, ease: 'linear' }}
        >
          {/* speech bubble */}
          <motion.div
            className="absolute -top-12 left-4 bg-white text-gray-800 text-xs font-bold
                       px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap"
            style={{ borderRadius: '12px' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -4] }}
            transition={{ duration: 3.8, times: [0, 0.1, 0.85, 1] }}
          >
            📬 {count} email baru!
            {/* triangle tail */}
            <span className="absolute -bottom-2 left-5 border-l-8 border-r-8 border-t-8
                             border-l-transparent border-r-transparent border-t-white" />
          </motion.div>

          {/* Cat SVG */}
          <CatSVG />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CatSVG() {
  return (
    <svg
      width="120" height="100"
      viewBox="0 0 120 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <style>{`
        @keyframes cat-walk {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          25%      { transform: translateY(-3px) rotate(1deg); }
          75%      { transform: translateY(-3px) rotate(-1deg); }
        }
        @keyframes leg-front {
          0%,100% { transform: rotate(-20deg); }
          50%      { transform: rotate(25deg); }
        }
        @keyframes leg-back {
          0%,100% { transform: rotate(25deg); }
          50%      { transform: rotate(-20deg); }
        }
        @keyframes tail-wag {
          0%,100% { transform: rotate(-10deg); }
          50%      { transform: rotate(30deg); }
        }
        @keyframes ear-twitch {
          0%,90%,100% { transform: scaleY(1); }
          95%          { transform: scaleY(0.7); }
        }
        @keyframes envelope-bob {
          0%,100% { transform: translateY(0px) rotate(-5deg); }
          50%      { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes eye-blink {
          0%,92%,100% { scaleY: 1; }
          96%          { transform: scaleY(0.1); }
        }
        .cat-body    { animation: cat-walk 0.45s ease-in-out infinite; transform-origin: 50px 60px; }
        .leg-fl      { animation: leg-front 0.45s ease-in-out infinite; transform-origin: 38px 72px; }
        .leg-bl      { animation: leg-back  0.45s ease-in-out infinite; transform-origin: 62px 72px; }
        .leg-fr      { animation: leg-back  0.45s ease-in-out infinite; transform-origin: 38px 72px; }
        .leg-br      { animation: leg-front 0.45s ease-in-out infinite; transform-origin: 62px 72px; }
        .cat-tail    { animation: tail-wag  0.6s ease-in-out infinite; transform-origin: 80px 68px; }
        .cat-ear-l   { animation: ear-twitch 2.5s ease-in-out infinite; transform-origin: 28px 30px; }
        .envelope    { animation: envelope-bob 0.9s ease-in-out infinite; transform-origin: 18px 58px; }
      `}</style>

      <g className="cat-body">

        {/* ── Envelope (held in front paw) ─────────────────────────────────── */}
        <g className="envelope">
          {/* envelope body */}
          <rect x="2" y="52" width="28" height="20" rx="2" fill="#FFF9C4" stroke="#E6AC00" strokeWidth="1.5"/>
          {/* envelope flap */}
          <polyline points="2,52 16,64 30,52" fill="none" stroke="#E6AC00" strokeWidth="1.5"/>
          {/* envelope lines */}
          <line x1="6" y1="60" x2="12" y2="60" stroke="#E6AC00" strokeWidth="1" opacity="0.6"/>
          <line x1="6" y1="65" x2="18" y2="65" stroke="#E6AC00" strokeWidth="1" opacity="0.6"/>
          {/* seal */}
          <circle cx="16" cy="65" r="3" fill="#FF6B6B" stroke="#CC3333" strokeWidth="0.8"/>
        </g>

        {/* ── Tail ─────────────────────────────────────────────────────────── */}
        <g className="cat-tail">
          <path d="M80,68 Q95,55 100,45 Q104,38 98,36 Q92,34 90,40 Q88,46 85,55 Q82,62 80,68"
                fill="#FF9066" stroke="#E0704A" strokeWidth="1"/>
        </g>

        {/* ── Back legs (behind body) ───────────────────────────────────────── */}
        <g className="leg-br">
          <rect x="60" y="70" width="9" height="20" rx="4" fill="#FF9B6B"/>
          {/* paw */}
          <ellipse cx="64.5" cy="91" rx="6" ry="4" fill="#FFB899"/>
        </g>
        <g className="leg-bl">
          <rect x="50" y="70" width="9" height="20" rx="4" fill="#FF9066"/>
          <ellipse cx="54.5" cy="91" rx="6" ry="4" fill="#FFB899"/>
        </g>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <ellipse cx="55" cy="62" rx="28" ry="22" fill="#FF9066" stroke="#E07040" strokeWidth="1.2"/>
        {/* belly */}
        <ellipse cx="52" cy="66" rx="16" ry="13" fill="#FFCBA4" opacity="0.8"/>
        {/* stripes */}
        <path d="M35,55 Q38,58 35,61" fill="none" stroke="#E07040" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M38,51 Q41,54 38,57" fill="none" stroke="#E07040" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M73,55 Q70,58 73,61" fill="none" stroke="#E07040" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M70,51 Q67,54 70,57" fill="none" stroke="#E07040" strokeWidth="1.8" strokeLinecap="round"/>

        {/* ── Front legs ───────────────────────────────────────────────────── */}
        <g className="leg-fr">
          <rect x="58" y="70" width="9" height="19" rx="4" fill="#FF9B6B"/>
          <ellipse cx="62.5" cy="90" rx="6" ry="4" fill="#FFB899"/>
        </g>
        <g className="leg-fl">
          {/* this arm holds the envelope */}
          <rect x="28" y="66" width="9" height="16" rx="4" fill="#FF9066"/>
          <ellipse cx="32.5" cy="83" rx="6" ry="4" fill="#FFB899"/>
        </g>

        {/* ── Head ─────────────────────────────────────────────────────────── */}
        <circle cx="38" cy="38" r="22" fill="#FF9066" stroke="#E07040" strokeWidth="1.2"/>

        {/* ears */}
        <g className="cat-ear-l">
          <polygon points="18,22 26,36 10,36" fill="#FF9066" stroke="#E07040" strokeWidth="1"/>
          <polygon points="20,25 25,34 14,34" fill="#FFB899"/>
        </g>
        {/* right ear */}
        <polygon points="56,22 62,36 48,36" fill="#FF9066" stroke="#E07040" strokeWidth="1"/>
        <polygon points="54,25 60,34 50,34" fill="#FFB899"/>

        {/* face */}
        {/* eyes */}
        <ellipse cx="30" cy="36" rx="4.5" ry="5" fill="#1a1a2e"/>
        <ellipse cx="46" cy="36" rx="4.5" ry="5" fill="#1a1a2e"/>
        {/* eye shine */}
        <circle cx="31.5" cy="34" r="1.5" fill="white"/>
        <circle cx="47.5" cy="34" r="1.5" fill="white"/>
        {/* pupils */}
        <ellipse cx="30" cy="37" rx="2.5" ry="3" fill="#0d0d1a"/>
        <ellipse cx="46" cy="37" rx="2.5" ry="3" fill="#0d0d1a"/>

        {/* nose */}
        <polygon points="38,43 35.5,46 40.5,46" fill="#FF6B9D"/>
        {/* mouth */}
        <path d="M35.5,46 Q38,50 40.5,46" fill="none" stroke="#CC4477" strokeWidth="1.2" strokeLinecap="round"/>
        {/* whiskers left */}
        <line x1="16" y1="44" x2="33" y2="46" stroke="#9966AA" strokeWidth="0.9" opacity="0.7"/>
        <line x1="14" y1="48" x2="33" y2="48" stroke="#9966AA" strokeWidth="0.9" opacity="0.7"/>
        {/* whiskers right */}
        <line x1="43" y1="46" x2="60" y2="44" stroke="#9966AA" strokeWidth="0.9" opacity="0.7"/>
        <line x1="43" y1="48" x2="62" y2="48" stroke="#9966AA" strokeWidth="0.9" opacity="0.7"/>

      </g>
    </svg>
  );
}
