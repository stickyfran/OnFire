import React, { useState } from 'react';
import { AVATARS, getRandomAvatar } from '../data/avatars';
import { Sparkles, Dices, ChevronDown, ChevronUp } from 'lucide-react';

export default function AvatarPicker({ selectedAvatar, onSelectAvatar, label = "Elegí tu ícono o emoji:" }) {
  const [showAll, setShowAll] = useState(false);

  const handleRandomize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const random = getRandomAvatar();
    onSelectAvatar(random);
  };

  // Muestra una selección destacada inicial o la lista completa si expande
  const visibleAvatars = showAll ? AVATARS : AVATARS.slice(0, 16);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{label}</span>
        </label>

        <button
          type="button"
          onClick={handleRandomize}
          className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-xl border border-amber-500/40 transition active:scale-95 shadow-sm"
          title="Elegir ícono al azar"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Aleatorio</span>
        </button>
      </div>

      <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
        <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
          {visibleAvatars.map((emoji) => {
            const isSelected = selectedAvatar === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelectAvatar(emoji)}
                className={`w-9 h-9 sm:w-10 sm:h-10 text-lg sm:text-xl rounded-xl flex items-center justify-center transition-all transform active:scale-90 ${
                  isSelected
                    ? 'bg-gradient-to-br from-rose-500 to-purple-600 shadow-[0_0_15px_rgba(244,63,94,0.6)] scale-110 ring-2 ring-white z-10'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 hover:scale-105 border border-slate-700/60'
                }`}
              >
                <span>{emoji}</span>
              </button>
            );
          })}
        </div>

        {AVATARS.length > 16 && (
          <div className="pt-1.5 mt-1 border-t border-slate-800/80 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-[11px] font-bold text-slate-400 hover:text-purple-300 flex items-center gap-1 transition"
            >
              {showAll ? (
                <>
                  <span>Ver menos</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Ver más íconos (+{AVATARS.length - 16})</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
