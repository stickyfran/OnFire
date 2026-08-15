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
  HelpCircle,
  Zap,
  EyeOff
} from 'lucide-react';

// Sonidos sintetizados usando Web Audio API
const playTone = (freq, duration = 0.1, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio no soportado o bloqueado por interacción
  }
};

const playTickSound = () => playTone(600, 0.05, 'triangle');
const playWinSound = () => {
  playTone(523.25, 0.15, 'sine');
  setTimeout(() => playTone(659.25, 0.15, 'sine'), 100);
  setTimeout(() => playTone(783.99, 0.3, 'sine'), 200);
};

export default function Room({ roomId, playerId, playerName, isAdmin, onLeave }) {
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [secretFeedback, setSecretFeedback] = useState(null);
  const [displayIndex, setDisplayIndex] = useState(0);

  const pressTimer = useRef(null);
  const spinInterval = useRef(null);

  // Sincronización en tiempo real
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

  // Manejar la animación de la ruleta visual sincronizada
  useEffect(() => {
    if (!roomData) return;

    if (roomData.isSpinning) {
      if (!spinInterval.current && roomData.players?.length > 0) {
        spinInterval.current = setInterval(() => {
          setDisplayIndex((prev) => (prev + 1) % roomData.players.length);
          playTickSound();
        }, 100);
      }
    } else {
      if (spinInterval.current) {
        clearInterval(spinInterval.current);
        spinInterval.current = null;
      }
    }
  }, [roomData?.isSpinning, roomData?.players]);

  // Disparar sonido de victoria cuando termine el giro
  useEffect(() => {
    if (roomData?.currentResult && !roomData?.isSpinning) {
      playWinSound();
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
    }
  }, [roomData?.currentResult, roomData?.isSpinning]);

  // Girar Ruleta
  const handleSpin = async () => {
    if (!roomData || !roomData.players || roomData.players.length < 2) {
      alert('¡Se necesitan al menos 2 jugadores para girar!');
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);

    // 1. Iniciar giro en Firestore
    await updateDoc(roomRef, {
      isSpinning: true,
      currentResult: null,
      currentPair: null,
      currentChallenge: null
    });

    // 2. Determinar la víctima (LÓGICA DE TRAMPA O AZAR)
    let winner = null;
    let targetId = roomData.nextTarget;

    if (targetId) {
      // Víctima fijada por el admin en las sombras
      winner = roomData.players.find(p => p.id === targetId) || roomData.players[0];
      // Limpiar trampa en Firestore
      await updateDoc(roomRef, { nextTarget: null });
    } else {
      // 100% Aleatorio
      const randomIndex = Math.floor(Math.random() * roomData.players.length);
      winner = roomData.players[randomIndex];
    }

    // Opcional: Escoger un reto al azar si hay lista
    let randomChallenge = null;
    if (roomData.challenges && roomData.challenges.length > 0) {
      const cIndex = Math.floor(Math.random() * roomData.challenges.length);
      randomChallenge = roomData.challenges[cIndex];
    }

    // 3. Detener tras 3.5 segundos con el resultado final
    setTimeout(async () => {
      await updateDoc(roomRef, {
        isSpinning: false,
        currentResult: winner,
        currentChallenge: randomChallenge
      });
    }, 3200);
  };

  // MODO TRAMPA: Pulsación Larga (Admin Only)
  const handleTouchStart = (targetPlayer) => {
    if (!isAdmin) return;
    pressTimer.current = setTimeout(async () => {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { nextTarget: targetPlayer.id });
      
      // Feedback sutil / táctil para el admin
      if (navigator.vibrate) navigator.vibrate(80);
      setSecretFeedback(targetPlayer.id);
      setTimeout(() => setSecretFeedback(null), 1200);
    }, 1200); // 1.2 segundos
  };

  const handleTouchEnd = () => {
    if (!isAdmin) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  // Copiar código o link
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Exportar retos JSON
  const handleExportChallenges = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roomData.challenges || [], null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `onfire_retos_${roomId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar retos JSON
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
          alert(`¡${json.length} retos cargados con éxito!`);
        } else {
          alert('El archivo JSON debe contener un arreglo de retos [ { ... } ].');
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
        <p className="text-slate-400 font-medium">Sincronizando sala con Firestore...</p>
      </div>
    );
  }

  const playersList = roomData.players || [];
  const currentPlayerInAnimation = playersList[displayIndex] || { name: 'Preparando...' };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 relative pb-10 overflow-x-hidden">
      {/* Fondo Neón */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Barra Superior */}
      <header className="w-full max-w-lg flex items-center justify-between pt-2 pb-4 z-10 border-b border-slate-800/80">
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
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-rose-500/30 rounded-xl text-xs font-mono font-bold tracking-widest text-rose-300 hover:border-rose-500 transition"
          >
            <span>SALA: {roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="p-2.5 bg-slate-900 border border-purple-500/40 rounded-xl text-purple-400 hover:text-purple-300 transition"
            title="Panel de Administrador"
          >
            <Settings className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* ÁREA CENTRAL: RULETA / SELECTOR */}
      <main className="w-full max-w-lg flex flex-col items-center justify-center my-auto z-10 py-6">
        {/* Ruleta Esfera Neón */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
          {/* Anillo exterior animado */}
          <motion.div
            animate={{
              rotate: roomData.isSpinning ? 720 : 0,
              borderColor: roomData.isSpinning 
                ? ['#f43f5e', '#d946ef', '#a855f7', '#f43f5e'] 
                : '#334155'
            }}
            transition={{
              rotate: { repeat: roomData.isSpinning ? Infinity : 0, duration: 1.2, ease: "linear" },
              borderColor: { repeat: Infinity, duration: 1.5 }
            }}
            className="absolute inset-0 rounded-full border-4 border-dashed shadow-[0_0_30px_rgba(244,63,94,0.3)]"
          />

          {/* Núcleo de la Ruleta */}
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
            {roomData.isSpinning ? (
              <motion.div
                key="spinning"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <Flame className="w-8 h-8 text-rose-500 animate-pulse mb-2" />
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-400 tracking-wide uppercase">
                  {currentPlayerInAnimation.name}
                </span>
                <span className="text-xs text-slate-400 mt-1">Girando...</span>
              </motion.div>
            ) : roomData.currentResult ? (
              <motion.div
                key="result"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center"
              >
                <span className="text-xs uppercase font-bold tracking-widest text-rose-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ¡Elegido/a!
                </span>
                <h2 className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]">
                  {roomData.currentResult.name}
                </h2>
                {roomData.currentResult.id === playerId && (
                  <span className="mt-1 px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-full border border-rose-500/40">
                    ¡TE TOCA A TI! 🔥
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Flame className="w-10 h-10 text-rose-500/60 mb-2" />
                <span className="text-sm font-semibold">Listo para jugar</span>
                <span className="text-xs text-slate-500 mt-0.5">Pulsa girar ruleta</span>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de Reto Asignado */}
        <AnimatePresence>
          {roomData.currentChallenge && !roomData.isSpinning && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full glass-card p-4 rounded-2xl mb-6 text-center border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
            >
              <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                roomData.currentChallenge.tipo === 'reto'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              }`}>
                {roomData.currentChallenge.tipo}
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-100 font-serif italic">
                "{roomData.currentChallenge.texto}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón Principal de Girar */}
        <button
          onClick={handleSpin}
          disabled={roomData.isSpinning || playersList.length < 2}
          className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <Zap className="w-5 h-5 fill-white" />
          {roomData.isSpinning ? 'Eligiendo Víctima...' : 'Girar Ruleta'}
        </button>
      </main>

      {/* Lista de Jugadores */}
      <footer className="w-full max-w-lg z-10">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            Jugadores en Sala ({playersList.length})
          </span>
          {isAdmin && (
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> (Mantén presionado para fijar objetivo)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
          {playersList.map((player) => {
            const isTargeted = isAdmin && roomData.nextTarget === player.id;
            const isMe = player.id === playerId;
            const isSecretlySelected = secretFeedback === player.id;

            return (
              <div
                key={player.id}
                onMouseDown={() => handleTouchStart(player)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(player)}
                onTouchEnd={handleTouchEnd}
                className={`p-2.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all select-none cursor-pointer ${
                  isSecretlySelected
                    ? 'bg-rose-950/80 border-rose-500'
                    : isTargeted
                    ? 'bg-slate-900 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={`truncate ${isMe ? 'text-emerald-300 font-bold' : 'text-slate-200'}`}>
                    {player.name} {isMe && '(Tú)'}
                  </span>
                </div>

                {/* Marcador secreto para el admin (casi invisible para otros) */}
                {isTargeted && (
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" title="Objetivo fijado" />
                )}
              </div>
            );
          })}
        </div>
      </footer>

      {/* PANEL DE ADMIN MODAL */}
      <AnimatePresence>
        {showAdminPanel && isAdmin && (
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
                  <Settings className="w-5 h-5" /> Panel de Administrador
                </h3>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">Gestión de Retos ({roomData.challenges?.length || 0})</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Importa o exporta la base de datos de preguntas y retos en formato JSON.
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

              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                <p className="font-bold mb-1">🔥 Modo en las Sombras (Trampa):</p>
                <p className="text-rose-400/90 text-[11px]">
                  En la pantalla principal, mantén presionado el nombre de cualquier jugador durante 1.2 segundos para fijarlo como la próxima víctima de la ruleta.
                </p>
              </div>

              <button
                onClick={() => setShowAdminPanel(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition"
              >
                Cerrar Panel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
