import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Users, 
  Copy, 
  Check, 
  LogOut, 
  Settings, 
  Download, 
  Upload, 
  Sparkles, 
  Zap, 
  HeartHandshake, 
  X, 
  EyeOff, 
  Plus, 
  UserCheck,
  TrendingUp,
  Skull
} from 'lucide-react';

// Generador de audio sintetizado Web Audio API
const playTone = (freq, duration = 0.1, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio bloqueado
  }
};

const playTickSound = () => playTone(650, 0.04, 'triangle');
const playWinSound = () => {
  playTone(523.25, 0.12, 'sine');
  setTimeout(() => playTone(659.25, 0.12, 'sine'), 90);
  setTimeout(() => playTone(783.99, 0.25, 'sine'), 180);
};

export default function Room({ roomId, playerId, playerName, isHost, canCheat, onLeave }) {
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [newPlayerModal, setNewPlayerModal] = useState(false);
  const [extraPlayerName, setExtraPlayerName] = useState('');

  const spinInterval = useRef(null);

  // Sincronización en tiempo real con Firestore
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
      }
    });

    return () => {
      unsubscribe();
      if (spinInterval.current) clearInterval(spinInterval.current);
    };
  }, [roomId]);

  // Animación del giro sincronizada
  useEffect(() => {
    if (!roomData) return;

    if (roomData.isSpinning) {
      if (!spinInterval.current && roomData.players?.length > 0) {
        spinInterval.current = setInterval(() => {
          setDisplayIndex((prev) => (prev + 1) % roomData.players.length);
          playTickSound();
        }, 90);
      }
    } else {
      if (spinInterval.current) {
        clearInterval(spinInterval.current);
        spinInterval.current = null;
      }
    }
  }, [roomData?.isSpinning, roomData?.players]);

  // Sonido de victoria y vibración
  useEffect(() => {
    if (roomData?.currentResult && !roomData?.isSpinning) {
      playWinSound();
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
    }
  }, [roomData?.currentResult, roomData?.isSpinning]);

  // Reemplazar {target} y {actor} en retos
  const formatChallenge = (rawText, actorName, targetName) => {
    if (!rawText) return '';
    let formatted = rawText.replace(/\{target\}/gi, targetName || 'alguien');
    formatted = formatted.replace(/\{actor\}/gi, actorName || 'Vos');
    return formatted;
  };

  // Cambiar Nivel de Picante (Sincronizado para todos)
  const handleChangeSpiceLevel = async (newLevel) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { spiceLevel: newLevel });
  };

  // Girar Ruleta
  const handleSpin = async () => {
    if (!roomData || !roomData.players || roomData.players.length < 2) {
      alert('¡Hacen falta al menos 2 jugadores en la sala para girar!');
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    const newRoundCount = (roomData.roundCount || 0) + 1;

    // Aumento automático de nivel de picante cada 8 rondas (si no se cambió manualmente al máximo)
    let currentSpice = roomData.spiceLevel || 1;
    if (newRoundCount >= 16 && currentSpice < 3) {
      currentSpice = 3;
    } else if (newRoundCount >= 8 && currentSpice < 2) {
      currentSpice = 2;
    }

    // 1. Iniciar giro en Firestore
    await updateDoc(roomRef, {
      isSpinning: true,
      currentResult: null,
      currentPair: null,
      currentChallenge: null,
      roundCount: newRoundCount,
      spiceLevel: currentSpice
    });

    // 2. Determinar Víctima 1 (Actor)
    const players = roomData.players;
    let actor = null;
    let target = null;

    if (roomData.nextTarget) {
      actor = players.find(p => p.id === roomData.nextTarget);
    }
    if (!actor) {
      const randomIdx = Math.floor(Math.random() * players.length);
      actor = players[randomIdx];
    }

    // 3. Determinar Víctima 2 (Pareja)
    const otherPlayers = players.filter(p => p.id !== actor.id);
    if (roomData.nextPair) {
      target = players.find(p => p.id === roomData.nextPair);
    }
    if (!target && otherPlayers.length > 0) {
      const randomTargetIdx = Math.floor(Math.random() * otherPlayers.length);
      target = otherPlayers[randomTargetIdx];
    }

    // 4. Filtrar y Seleccionar Reto según Nivel de Picante Activo
    const allChallenges = roomData.challenges || [];
    const filteredChallenges = allChallenges.filter(c => c.level === currentSpice);
    const pool = filteredChallenges.length > 0 ? filteredChallenges : allChallenges;

    let challengeObj = null;
    if (pool.length > 0) {
      const cIdx = Math.floor(Math.random() * pool.length);
      const rawC = pool[cIdx];
      challengeObj = {
        ...rawC,
        texto: formatChallenge(rawC.texto, actor?.name, target?.name)
      };
    }

    // 5. Limpiar trampa en Firestore
    await updateDoc(roomRef, {
      nextTarget: null,
      nextPair: null
    });

    // 6. Publicar resultado sincronizado tras 3.2s
    setTimeout(async () => {
      await updateDoc(roomRef, {
        isSpinning: false,
        currentResult: actor,
        currentPair: target || null,
        currentChallenge: challengeObj
      });
    }, 3200);
  };

  // MODO TRAMPA: Fijar víctimas (EXCLUSIVO si canCheat = true)
  const handleToggleCheatPlayer = async (targetPlayer) => {
    if (!canCheat) return;
    const roomRef = doc(db, 'rooms', roomId);

    const isCurrentTarget1 = roomData.nextTarget === targetPlayer.id;
    const isCurrentTarget2 = roomData.nextPair === targetPlayer.id;

    if (isCurrentTarget1) {
      await updateDoc(roomRef, { nextTarget: null });
      if (navigator.vibrate) navigator.vibrate(40);
    } else if (isCurrentTarget2) {
      await updateDoc(roomRef, { nextPair: null });
      if (navigator.vibrate) navigator.vibrate(40);
    } else if (!roomData.nextTarget) {
      await updateDoc(roomRef, { nextTarget: targetPlayer.id });
      if (navigator.vibrate) navigator.vibrate(70);
    } else {
      await updateDoc(roomRef, { nextPair: targetPlayer.id });
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    }
  };

  const handleClearTrap = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { nextTarget: null, nextPair: null });
  };

  // Añadir un nuevo jugador manualmente desde la sala
  const handleAddExtraPlayer = async (e) => {
    e.preventDefault();
    if (!extraPlayerName.trim()) return;
    const roomRef = doc(db, 'rooms', roomId);
    const newPlayer = {
      id: `slot_${Date.now()}`,
      name: extraPlayerName.trim(),
      isClaimed: true,
      claimedBy: null,
      joinedAt: new Date().toISOString()
    };
    await updateDoc(roomRef, {
      players: [...(roomData.players || []), newPlayer]
    });
    setExtraPlayerName('');
    setNewPlayerModal(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportChallenges = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roomData.challenges || [], null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `onfire_retos_${roomId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportChallenges = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json)) {
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, { challenges: json });
          alert(`¡${json.length} retos importados de una!`);
        } else {
          alert('El archivo JSON tiene que ser un arreglo de retos.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  if (!roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Flame className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Sincronizando sala en tiempo real...</p>
      </div>
    );
  }

  const currentSpice = roomData.spiceLevel || 1;
  const playersList = roomData.players || [];
  const currentPlayerInAnimation = playersList[displayIndex] || { name: 'Girando...' };
  const target1Player = playersList.find(p => p.id === roomData.nextTarget);
  const target2Player = playersList.find(p => p.id === roomData.nextPair);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 relative pb-12 overflow-x-hidden">
      {/* Fondos */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between pt-2 pb-3 z-10 border-b border-slate-800/80">
        <button
          onClick={onLeave}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition"
          title="Salir de la sala"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 border border-rose-500/30 rounded-xl text-xs font-mono font-bold tracking-widest text-rose-300 hover:border-rose-500 transition"
          >
            <span>SALA: {roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isHost || canCheat ? (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="p-2.5 bg-slate-900 border border-purple-500/40 rounded-xl text-purple-400 hover:text-purple-300 transition"
            title="Ajustes de Sala"
          >
            <Settings className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* BARRA DE NIVEL DE PICANTE (Visible para todos e interactiva) */}
      <div className="w-full max-w-lg z-10 my-3">
        <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-md">
          <button
            onClick={() => handleChangeSpiceLevel(1)}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              currentSpice === 1
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>🌶️</span>
            <span className="truncate">1. Suave</span>
          </button>

          <button
            onClick={() => handleChangeSpiceLevel(2)}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              currentSpice === 2
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>🔥</span>
            <span className="truncate">2. Caliente</span>
          </button>

          <button
            onClick={() => handleChangeSpiceLevel(3)}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              currentSpice === 3
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>💀</span>
            <span className="truncate">3. Fuego</span>
          </button>
        </div>

        {/* Indicador de Ronda y Progreso */}
        <div className="flex justify-between items-center px-2 mt-1.5 text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-rose-500" /> Ronda #{roomData.roundCount || 0}
          </span>
          <span>El picante sube automáticamente cada 8 rondas</span>
        </div>
      </div>

      {/* RULETA CENTRAL */}
      <main className="w-full max-w-lg flex flex-col items-center justify-center my-auto z-10 py-2">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-4">
          <motion.div
            animate={{
              rotate: roomData.isSpinning ? 720 : 0,
              borderColor: roomData.isSpinning 
                ? ['#f43f5e', '#d946ef', '#a855f7', '#f43f5e'] 
                : currentSpice === 3 ? '#ec4899' : currentSpice === 2 ? '#f43f5e' : '#f59e0b'
            }}
            transition={{
              rotate: { repeat: roomData.isSpinning ? Infinity : 0, duration: 1.1, ease: "linear" },
              borderColor: { repeat: Infinity, duration: 1.4 }
            }}
            className="absolute inset-0 rounded-full border-4 border-dashed shadow-[0_0_35px_rgba(244,63,94,0.3)]"
          />

          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 flex flex-col items-center justify-center p-5 text-center shadow-inner relative overflow-hidden">
            {roomData.isSpinning ? (
              <motion.div
                key="spinning"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <Flame className="w-9 h-9 text-rose-500 animate-pulse mb-2" />
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-400 tracking-wide uppercase px-2 line-clamp-1">
                  {currentPlayerInAnimation.name}
                </span>
                <span className="text-xs text-slate-400 mt-1 font-medium">Buscando víctima...</span>
              </motion.div>
            ) : roomData.currentResult ? (
              <motion.div
                key="result"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 16 }}
                className="flex flex-col items-center w-full px-2"
              >
                <span className="text-[11px] uppercase font-bold tracking-widest text-rose-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ¡Le Toca A!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] truncate max-w-full">
                  {roomData.currentResult.name}
                </h2>

                {roomData.currentPair && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                    <HeartHandshake className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span className="truncate">Con: <strong className="text-pink-300">{roomData.currentPair.name}</strong></span>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Flame className="w-10 h-10 text-rose-500/60 mb-2" />
                <span className="text-sm font-semibold">Listo para jugar</span>
                <span className="text-xs text-slate-500 mt-0.5">Tocá girar ruleta</span>
              </div>
            )}
          </div>
        </div>

        {/* Reto Asignado */}
        <AnimatePresence>
          {roomData.currentChallenge && !roomData.isSpinning && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full glass-card p-4 sm:p-5 rounded-2xl mb-4 text-center border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.2)]"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                  roomData.currentChallenge.tipo === 'reto'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                }`}>
                  {roomData.currentChallenge.tipo}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  {currentSpice === 1 ? '🌶️ Suave' : currentSpice === 2 ? '🔥 Caliente' : '💀 Fuego Total'}
                </span>
              </div>

              <p className="text-base sm:text-lg font-semibold text-slate-100 font-serif italic leading-relaxed">
                "{roomData.currentChallenge.texto}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón de Giro */}
        <button
          onClick={handleSpin}
          disabled={roomData.isSpinning || playersList.length < 2}
          className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <Zap className="w-5 h-5 fill-white" />
          {roomData.isSpinning ? 'Eligiendo víctimas...' : 'Girar Ruleta'}
        </button>
      </main>

      {/* BARRA FLOTANTE DE TRAMPA (Visible SOLO si canCheat = true) */}
      {canCheat && (target1Player || target2Player) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mb-3 p-2.5 bg-slate-900/95 border border-rose-500/50 rounded-2xl flex items-center justify-between text-xs z-20 shadow-[0_0_15px_rgba(244,63,94,0.3)] backdrop-blur-md"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> Trampa:
            </span>
            {target1Player && (
              <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 truncate">
                🎯 {target1Player.name}
              </span>
            )}
            {target2Player && (
              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 truncate">
                💋 con {target2Player.name}
              </span>
            )}
          </div>
          <button
            onClick={handleClearTrap}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            title="Cancelar trampa"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* LISTA DE JUGADORES */}
      <footer className="w-full max-w-lg z-10">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            Jugadores ({playersList.length})
          </span>
          <div className="flex items-center gap-2">
            {canCheat && (
              <span className="text-[10px] text-rose-400/90 font-medium">
                (Tocá: 1º Le toca, 2º Con quién)
              </span>
            )}
            <button
              onClick={() => setNewPlayerModal(true)}
              className="text-[11px] text-purple-300 hover:text-purple-100 flex items-center gap-0.5 font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Sumar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
          {playersList.map((player) => {
            const isMe = player.claimedBy === playerId || player.id === playerId;
            const isTarget1 = canCheat && roomData.nextTarget === player.id;
            const isTarget2 = canCheat && roomData.nextPair === player.id;
            const isUnclaimed = player.isClaimed === false;

            return (
              <div
                key={player.id}
                onClick={() => handleToggleCheatPlayer(player)}
                className={`p-2.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all select-none ${
                  canCheat ? 'cursor-pointer' : ''
                } ${
                  isTarget1
                    ? 'bg-rose-950/70 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500'
                    : isTarget2
                    ? 'bg-purple-950/70 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-500'
                    : isUnclaimed
                    ? 'bg-slate-900/40 border-dashed border-slate-800 text-slate-400'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-emerald-400' : isUnclaimed ? 'bg-amber-500/50' : 'bg-slate-600'}`} />
                  <span className={`truncate ${isMe ? 'text-emerald-300 font-bold' : isUnclaimed ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                    {player.name} {isMe && '(Vos)'}
                  </span>
                </div>

                {canCheat && (
                  <div>
                    {isTarget1 && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-md">
                        🎯 1º
                      </span>
                    )}
                    {isTarget2 && (
                      <span className="px-1.5 py-0.5 bg-purple-500 text-white text-[10px] font-black rounded-md">
                        💋 2º
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </footer>

      {/* MODAL PARA SUMAR JUGADOR EXTRA EN VIVO */}
      <AnimatePresence>
        {newPlayerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" /> Sumar Jugador a la Sala
                </h3>
                <button
                  onClick={() => setNewPlayerModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddExtraPlayer} className="space-y-3">
                <input
                  type="text"
                  maxLength={20}
                  placeholder="Nombre del nuevo jugador..."
                  value={extraPlayerName}
                  onChange={(e) => setExtraPlayerName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPlayerModal(false)}
                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL DE ADMINISTRADOR (MODAL) */}
      <AnimatePresence>
        {showAdminPanel && (isHost || canCheat) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Panel de Sala
                </h3>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Base de Retos ({roomData.challenges?.length || 0})
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Usá <code className="text-pink-400">{'{target}'}</code> en tus retos para que se reemplace por la pareja seleccionada.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExportChallenges}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-purple-400" /> Exportar JSON
                  </button>

                  <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4 text-pink-400" /> Importar JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportChallenges}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {canCheat && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-rose-400">
                    <EyeOff className="w-4 h-4" /> Modo Trampa Activo:
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    1. Tocá a un jugador para fijar <strong>🎯 1º (A quién le toca)</strong>.
                    <br />
                    2. Tocá a otro para fijar <strong>💋 2º (Con quién interactúa)</strong>.
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowAdminPanel(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
