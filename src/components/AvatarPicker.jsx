import React from 'react';
import { AVATARS, getRandomAvatar } from '../data/avatars';
import { Sparkles, Dices, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AvatarPicker({ selectedAvatar, onSelectAvatar, onClose, label = "Elegí tu ícono o emoji:" }) {
  const handleRandomize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const random = getRandomAvatar();
    onSelectAvatar(random);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      className="bg-slate-900/95 p-3 rounded-2xl border border-rose-500/40 shadow-2xl space-y-2.5 my-2 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRandomize}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-xl border border-amber-500/40 transition active:scale-95 shadow-sm"
            title="Elegir ícono al azar"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Aleatorio</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition active:scale-95"
              title="Cerrar selector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
        {AVATARS.map((emoji) => {
          const isSelected = selectedAvatar === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelectAvatar(emoji);
                if (onClose) onClose();
              }}
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
    </motion.div>
  );
}
