import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ALL_CHALLENGES } from '../data/challenges';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
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
  Trash2, 
  FileText, 
  Search, 
  PenTool, 
  Eye, 
  QrCode, 
  Share2,
  Maximize,
  Minimize,
  Smartphone,
  Clock,
  Timer,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';
import AvatarPicker from './AvatarPicker';
import { getRandomAvatar, AVATARS } from '../data/avatars';

// =========================================================
// GESTOR DE AUDIO ULTRA-COMPATIBLE (SAFARI IOS, FIREFOX ANDROID, CHROME)
// =========================================================
let globalAudioCtx = null;
let isAudioUnlocked = false;

const getAudioContext = () => {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
};

// Desbloquear audio en el primer toque de pantalla (crucial para iOS y Firefox Android)
export const unlockAudioContext = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!isAudioUnlocked) {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isAudioUnlocked = true;
    }
  } catch (e) {
    // Ignorar si aún no hay interacción
  }
};

// Auto-desbloqueo global en cualquier interacción de pantalla
if (typeof window !== 'undefined') {
  ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, unlockAudioContext, { passive: true });
  });
}

// Reproducción polifónica precisa sin setTimeout
const playTone = (freq, duration = 0.1, type = 'sine', startTimeOffset = 0, gainLevel = 0.15) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + startTimeOffset;
    const end = start + duration;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainLevel, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.05);
  } catch (e) {
    // Audio bloqueado
  }
};

const playTickSound = (muted = false) => {
  if (muted) return;
  playTone(650, 0.04, 'triangle', 0, 0.12);
};

const playRetoSound = (muted = false) => {
  if (muted) return;
  playTone(392.00, 0.12, 'triangle', 0.00, 0.18);
  playTone(523.25, 0.14, 'sawtooth', 0.08, 0.20);
  playTone(659.25, 0.45, 'sawtooth', 0.16, 0.25);
  playTone(783.99, 0.55, 'sine',     0.26, 0.22);
};

const playVerdadSound = (muted = false) => {
  if (muted) return;
  playTone(440.00, 0.14, 'sine', 0.00, 0.18);
  playTone(554.37, 0.16, 'sine', 0.09, 0.20);
  playTone(880.00, 0.50, 'sine', 0.18, 0.25);
  playTone(1108.73, 0.60, 'sine', 0.28, 0.20);
};

// =========================================================
// COMPONENTE DE FUEGO EN PANTALLA MEMOIZADO (CON MODO SPECS BAJAS)
// =========================================================
const ScreenFireEffect = React.memo(function ScreenFireEffect({ currentSpice, isVisible, lowSpecsMode = false }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div
          key="screen-fire-overlay"
          className="fixed inset-0 pointer-events-none z-30 overflow-hidden will-change-transform"
        >
          {/* MODO SPECS BAJAS / RENDIMIENTO OPTIMIZADO */}
          {lowSpecsMode ? (
            <>
              {currentSpice === 1 && (
                <div className="absolute inset-0 border-2 border-amber-500/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.3)] pointer-events-none" />
              )}
              {currentSpice === 2 && (
                <div className="absolute inset-0 border-3 border-rose-500/60 shadow-[inset_0_0_30px_rgba(244,63,94,0.4)] pointer-events-none" />
              )}
              {currentSpice >= 3 && (
                <>
                  <div className="absolute inset-0 border-4 border-red-500/80 shadow-[inset_0_0_40px_rgba(239,68,68,0.5)] pointer-events-none" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600 border border-amber-300 z-40 text-xs font-black uppercase tracking-widest text-white flex items-center gap-1 shadow-md">
                    <span>💀</span>
                    <span>¡ESTÁS PRENDIDO FUEGO!</span>
                    <span>🔥</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* CASO 1: 🌶️ NIVEL SUAVE */}
              {currentSpice === 1 && (
                <>
                  <div className="absolute inset-0 border-2 border-amber-500/40 shadow-[inset_0_0_35px_rgba(245,158,11,0.4)] animate-pulse" />
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-amber-500/30 via-orange-500/15 to-transparent blur-lg" />
                  <div className="absolute inset-0 flex justify-around">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={`chili-${i}`}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{
                          y: [-30, 750],
                          x: [0, (i % 2 === 0 ? 25 : -25), (i % 2 === 0 ? -15 : 15)],
                          rotate: [0, (i % 2 === 0 ? 360 : -360)],
                          opacity: [0, 1, 1, 0],
                          scale: [0.7, 1.15, 1, 0.8]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.8 + (i * 0.2),
                          delay: i * 0.18,
                          ease: "easeIn"
                        }}
                        className="text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] select-none"
                      >
                        🌶️
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* CASO 2: 🔥 NIVEL CALIENTE */}
              {currentSpice === 2 && (
                <>
                  <div className="absolute inset-0 border-2 border-rose-500/50 shadow-[inset_0_0_45px_rgba(244,63,94,0.5)] animate-pulse" />
                  <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-rose-600/50 via-orange-500/30 to-transparent blur-lg" />
                  <div className="absolute inset-0 flex justify-around items-end">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`flame-${i}`}
                        animate={{
                          y: [0, -550],
                          x: [0, (i % 2 === 0 ? 25 : -25), 0],
                          opacity: [0, 0.9, 0.8, 0],
                          scale: [0.5, 1.2, 0.8, 0]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.2 + (i * 0.25),
                          delay: i * 0.2,
                          ease: "easeOut"
                        }}
                        className="text-xl sm:text-2xl drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] select-none"
                      >
                        🔥
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* CASO 3 & 4: 💀🔥 NIVEL FUEGO TOTAL & EXTREMO */}
              {currentSpice >= 3 && (
                <>
                  <div 
                    className="absolute inset-0 border-4 border-red-500/70 animate-pulse pointer-events-none"
                    style={{ boxShadow: "inset 0 0 50px rgba(239,68,68,0.8), inset 0 0 100px rgba(249,115,22,0.6)" }}
                  />

                  <motion.div
                    animate={{
                      y: [10, -20, 10],
                      scaleY: [1, 1.15, 1],
                      opacity: [0.75, 0.95, 0.75]
                    }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 right-0 h-[65vh] bg-gradient-to-t from-red-600/80 via-orange-500/40 to-transparent blur-xl pointer-events-none"
                  />

                  <motion.div
                    animate={{
                      y: [0, -25, 0],
                      opacity: [0.7, 0.95, 0.7]
                    }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 h-[45vh] bg-gradient-to-t from-amber-500/80 via-rose-600/60 to-transparent blur-lg pointer-events-none"
                  />

                  <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-red-600/50 via-orange-500/25 to-transparent blur-lg pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-red-600/50 via-orange-500/25 to-transparent blur-lg pointer-events-none" />

                  <div className="absolute inset-0 flex justify-around items-end overflow-hidden pointer-events-none">
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={`skull-fire-${i}`}
                        animate={{
                          y: [30, -650],
                          x: [0, (i % 2 === 0 ? 25 : -25), 0],
                          rotate: [0, (i % 2 === 0 ? 20 : -20), 0],
                          opacity: [0, 1, 0.9, 0],
                          scale: [0.6, 1.3, 1, 0.4]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.3 + (i * 0.22),
                          delay: i * 0.18,
                          ease: "easeOut"
                        }}
                        className="text-2xl sm:text-4xl drop-shadow-[0_0_16px_rgba(239,68,68,0.9)] select-none"
                      >
                        {i % 3 === 0 ? '💀' : i % 3 === 1 ? '🔥' : '💥'}
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 border-2 border-amber-300 shadow-[0_0_25px_#ef4444] z-40 text-xs sm:text-sm font-black uppercase tracking-widest text-white flex items-center gap-1.5"
                  >
                    <span>💀</span>
                    <span>¡ESTÁS PRENDIDO FUEGO!</span>
                    <span>🔥</span>
                  </motion.div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </AnimatePresence>
  );
});

// =========================================================
// ANILLO DE FUEGO DE LA RULETA MEMOIZADO (GIRO CONTINUO 60FPS)
// =========================================================
const RouletteFireRing = React.memo(function RouletteFireRing({ isSpinning, lowSpecsMode = false }) {
  if (lowSpecsMode) {
    return (
      <div className="absolute -inset-2 rounded-full border-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.5)] pointer-events-none" />
    );
  }

  return (
    <>
      <div className="absolute -inset-4 sm:-inset-6 rounded-full bg-gradient-to-tr from-red-600 via-orange-500 to-amber-300 blur-xl opacity-80 pointer-events-none animate-pulse" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: isSpinning ? 2.5 : 8,
          ease: "linear"
        }}
        className="absolute -inset-3 sm:-inset-4 pointer-events-none"
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div
            key={deg}
            style={{ transform: `rotate(${deg}deg)` }}
            className="absolute inset-0 flex items-start justify-center"
          >
            <span className="text-lg sm:text-xl drop-shadow-[0_0_12px_#f97316] select-none -translate-y-2.5">
              🔥
            </span>
          </div>
        ))}
      </motion.div>
    </>
  );
});

export default function Room({ 
  roomId, 
  playerId, 
  playerName, 
  isHost, 
  canCheat, 
  onLeave, 
  appVersion = 'v1.00',
  onInstallApp,
  isInstalled = false
}) {
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [newPlayerModal, setNewPlayerModal] = useState(false);
  const [extraPlayerName, setExtraPlayerName] = useState('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState(() => getRandomAvatar());
  
  // Modal de acción al tocar jugador en la ruleta (Admin / Trampa)
  const [selectedPlayerForAction, setSelectedPlayerForAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estado para ocultar/mostrar superpoderes de trampa con doble toque en #Ronda N
  const [cheatUIVisible, setCheatUIVisible] = useState(true);
  const lastTapRef = useRef(0);

  // Super Animación de Revelación de Pantalla Completa (Reto vs Verdad)
  const [splashReveal, setSplashReveal] = useState(null); // 'reto' | 'verdad' | null
  const lastRevealedChallengeId = useRef(null);

  // Modal para fijar Reto o Verdad en la trampa
  const [showCheatChallengeModal, setShowCheatChallengeModal] = useState(false);
  const [customChallengeInput, setCustomChallengeInput] = useState('');
  const [customChallengeType, setCustomChallengeType] = useState('reto');
  const [challengeSearchTerm, setChallengeSearchTerm] = useState('');
  const [activeTabModal, setActiveTabModal] = useState('custom'); // 'custom' | 'search'

  // Estado de Pantalla Completa
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIOSTipModal, setShowIOSTipModal] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (!isFull) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (isIOS) {
        setShowIOSTipModal(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const spinInterval = useRef(null);
  const spinTimeoutRef = useRef(null);
  const isSpinningLockRef = useRef(false);

  // Estado de Sonido (Persistente con desbloqueo para iOS y Firefox Android)
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('onfire_muted') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleMute = () => {
    unlockAudioContext();
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('onfire_muted', next.toString());
      } catch {}
      if (!next) {
        // Sonido de confirmación al activar audio
        playTone(587.33, 0.12, 'sine', 0, 0.15);
      }
      return next;
    });
  };

  // Modo Rendimiento / Animaciones Reducidas para teléfonos lentos / bajo rendimiento
  const [lowSpecsMode, setLowSpecsMode] = useState(() => {
    try {
      return localStorage.getItem('onfire_low_specs') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleLowSpecs = () => {
    setLowSpecsMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('onfire_low_specs', next.toString());
      } catch {}
      return next;
    });
  };

  // URL para compartir la sala por QR o enlace directo
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  // Sincronización en tiempo real con Firestore
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(
      roomRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomData(data);
        } else {
          // La sala fue cerrada o eliminada por el anfitrión
          alert('La sala ya no existe o fue cerrada.');
          onLeave();
        }
      },
      (err) => {
        console.error("Error sincronizando sala en tiempo real:", err);
      }
    );

    return () => {
      unsubscribe();
      if (spinInterval.current) clearInterval(spinInterval.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, [roomId, onLeave]);

  // Animación del giro sincronizada
  useEffect(() => {
    if (!roomData) return;

    if (roomData.isSpinning) {
      if (!spinInterval.current && roomData.players?.length > 0) {
        spinInterval.current = setInterval(() => {
          setDisplayIndex((prev) => (prev + 1) % roomData.players.length);
          playTickSound(isMuted);
        }, 90);
      }
    } else {
      isSpinningLockRef.current = false;
      if (spinInterval.current) {
        clearInterval(spinInterval.current);
        spinInterval.current = null;
      }
    }
  }, [roomData?.isSpinning, roomData?.players, isMuted]);

  // Disparar Super Animación y Sonidos cuando cae el resultado
  useEffect(() => {
    if (roomData?.currentChallenge && !roomData?.isSpinning) {
      const challengeId = roomData.currentChallenge.id || roomData.currentChallenge.texto;
      if (lastRevealedChallengeId.current !== challengeId) {
        lastRevealedChallengeId.current = challengeId;
        const tipo = roomData.currentChallenge.tipo?.toLowerCase() || 'reto';
        
        setSplashReveal(tipo);
        if (tipo === 'reto') {
          playRetoSound(isMuted);
        } else {
          playVerdadSound(isMuted);
        }

        if (navigator.vibrate) navigator.vibrate([80, 40, 120, 40, 160]);

        const timer = setTimeout(() => {
          setSplashReveal(null);
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [roomData?.currentChallenge, roomData?.isSpinning, isMuted]);

  // Temporizador de 10 segundos para cumplir el reto con desvanecimiento de fuego
  const [countdown, setCountdown] = useState(10);
  const [isFireActive, setIsFireActive] = useState(true);

  useEffect(() => {
    if (roomData?.currentChallenge && !roomData?.isSpinning) {
      setCountdown(10);
      setIsFireActive(true);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsFireActive(false);
            return 0;
          }
          if (prev <= 4) {
            if (navigator.vibrate) navigator.vibrate(35);
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(0);
      setIsFireActive(false);
    }
  }, [roomData?.currentChallenge?.id || roomData?.currentChallenge?.texto, roomData?.isSpinning]);

  // =========================================================
  // RETENER PANTALLA EN CELULARES (INTERCEPTAR BOTÓN ATRÁS)
  // =========================================================
  // Al tocar Atrás en el celular/navegador, abre el Menú de Juego o cierra el modal activo,
  // evitando que la persona se salga por accidente de la previa.
  const modalsRef = useRef({
    showCheatChallengeModal,
    showQRModal,
    newPlayerModal,
    showAdminPanel,
    selectedPlayerForAction
  });

  useEffect(() => {
    modalsRef.current = {
      showCheatChallengeModal,
      showQRModal,
      newPlayerModal,
      showAdminPanel,
      selectedPlayerForAction
    };
  }, [showCheatChallengeModal, showQRModal, newPlayerModal, showAdminPanel, selectedPlayerForAction]);

  useEffect(() => {
    // Empujar estado inicial para que haya historial disponible para capturar
    window.history.pushState({ onfire_room: roomId, ts: Date.now() }, '', window.location.href);

    const handlePopState = () => {
      // Re-empujar inmediatamente para retener la pantalla permanentemente dentro del juego
      window.history.pushState({ onfire_room: roomId, ts: Date.now() }, '', window.location.href);

      const {
        showCheatChallengeModal: isCheatOpen,
        showQRModal: isQROpen,
        newPlayerModal: isNewPlayerOpen,
        showAdminPanel: isMenuOpen,
        selectedPlayerForAction: isPlayerActionOpen
      } = modalsRef.current;

      if (isCheatOpen) {
        setShowCheatChallengeModal(false);
        return;
      }
      if (isQROpen) {
        setShowQRModal(false);
        return;
      }
      if (isNewPlayerOpen) {
        setNewPlayerModal(false);
        return;
      }
      if (isPlayerActionOpen) {
        setSelectedPlayerForAction(null);
        setShowDeleteConfirm(false);
        return;
      }
      if (isMenuOpen) {
        setShowAdminPanel(false);
        return;
      }

      // Si no hay ningún modal abierto, abrir el Menú de Juego / Ajustes
      setShowAdminPanel(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [roomId]);

  // Doble toque en #Ronda para ocultar/mostrar superpoderes de trampa
  const handleRondaDoubleTap = () => {
    if (!canCheat) return;
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setCheatUIVisible(prev => !prev);
      if (navigator.vibrate) navigator.vibrate(40);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Reemplazar {target} y {actor} en retos
  const formatChallenge = (rawText, actorName, targetName) => {
    if (!rawText) return '';
    let formatted = rawText.replace(/\{target\}/gi, targetName || 'alguien');
    formatted = formatted.replace(/\{actor\}/gi, actorName || 'Vos');
    return formatted;
  };

  // Cambiar Nivel de Picante (Exclusivo Papito)
  const handleChangeSpiceLevel = async (newLevel) => {
    if (!canCheat) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { spiceLevel: newLevel });
    } catch (err) {
      console.error("Error al cambiar nivel de picante:", err);
    }
  };

  // Girar Ruleta
  const handleSpin = async () => {
    unlockAudioContext();
    if (isSpinningLockRef.current || roomData?.isSpinning) return;
    if (!roomData || !roomData.players || roomData.players.length < 2) {
      alert('¡Hacen falta al menos 2 jugadores en la sala para girar!');
      return;
    }

    isSpinningLockRef.current = true;
    const roomRef = doc(db, 'rooms', roomId);
    const newRoundCount = (roomData.roundCount || 0) + 1;

    // Aumento automático de nivel de picante cada 8 rondas
    let currentSpice = roomData.spiceLevel || 1;
    if (newRoundCount >= 24 && currentSpice < 4) {
      currentSpice = 4;
    } else if (newRoundCount >= 16 && currentSpice < 3) {
      currentSpice = 3;
    } else if (newRoundCount >= 8 && currentSpice < 2) {
      currentSpice = 2;
    }

    try {
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
      const players = roomData.players || [];
      let actor = null;
      let target = null;

      if (roomData.nextTarget) {
        actor = players.find(p => p.id === roomData.nextTarget);
      }
      if (!actor && players.length > 0) {
        const randomIdx = Math.floor(Math.random() * players.length);
        actor = players[randomIdx];
      }

      // 3. Determinar Víctima 2 (Pareja)
      const otherPlayers = players.filter(p => p.id !== actor?.id);
      if (roomData.nextPair) {
        target = players.find(p => p.id === roomData.nextPair);
      }
      if (!target && otherPlayers.length > 0) {
        const randomTargetIdx = Math.floor(Math.random() * otherPlayers.length);
        target = otherPlayers[randomTargetIdx];
      }

      // 4. Determinar Reto (Fijado por Trampa o Aleatorio según Nivel de Picante)
      let challengeObj = null;

      if (roomData.nextChallenge) {
        // RETO TRAMPA FIJADO POR PAPITO
        challengeObj = {
          tipo: roomData.nextChallenge.tipo || 'reto',
          texto: formatChallenge(roomData.nextChallenge.texto, actor?.name, target?.name)
        };
      } else {
        // Aleatorio según Nivel de Picante
        const allChallenges = (roomData.challenges && roomData.challenges.length > 0) 
          ? roomData.challenges 
          : ALL_CHALLENGES;
        let filteredChallenges = allChallenges.filter(c => c.level === currentSpice);
        if (filteredChallenges.length === 0) filteredChallenges = allChallenges;

        // Si Papito forzó Reto o Verdad (nextType)
        if (roomData.nextType) {
          const byType = filteredChallenges.filter(c => c.tipo?.toLowerCase() === roomData.nextType?.toLowerCase());
          if (byType.length > 0) {
            filteredChallenges = byType;
          }
        }

        const pool = filteredChallenges;

        if (pool.length > 0) {
          const cIdx = Math.floor(Math.random() * pool.length);
          const rawC = pool[cIdx];
          challengeObj = {
            ...rawC,
            texto: formatChallenge(rawC.texto, actor?.name, target?.name)
          };
        }
      }

      // 5. Limpiar toda la trampa en Firestore para la siguiente ronda
      await updateDoc(roomRef, {
        nextTarget: null,
        nextPair: null,
        nextChallenge: null,
        nextType: null
      });

      // 6. Publicar resultado sincronizado tras 3.2s
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(async () => {
        try {
          await updateDoc(roomRef, {
            isSpinning: false,
            currentResult: actor,
            currentPair: target || null,
            currentChallenge: challengeObj
          });
        } catch (err) {
          console.error("Error publicando resultado del giro:", err);
        } finally {
          isSpinningLockRef.current = false;
        }
      }, 3200);
    } catch (err) {
      console.error("Error al girar ruleta:", err);
      isSpinningLockRef.current = false;
    }
  };

  // MODO TRAMPA: Fijar víctimas 1 y 2
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

  // MODO TRAMPA: Forzar Tipo (Reto vs Verdad)
  const handleToggleCheatType = async (type) => {
    if (!canCheat) return;
    const roomRef = doc(db, 'rooms', roomId);
    const newType = roomData.nextType === type ? null : type;
    await updateDoc(roomRef, { nextType: newType });
    if (navigator.vibrate) navigator.vibrate(35);
  };

  // MODO TRAMPA: Fijar Reto/Verdad
  const handleSaveCheatChallenge = async (challengeObj) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { nextChallenge: challengeObj });
    setShowCheatChallengeModal(false);
    if (navigator.vibrate) navigator.vibrate([40, 40]);
  };

  const handleClearTrap = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { nextTarget: null, nextPair: null, nextChallenge: null, nextType: null });
  };

  // CLIC EN CÁPSULA DE JUGADOR ALREDEDOR DE LA RULETA (Admin / Trampa)
  const handlePlayerChipClick = (player) => {
    if (isHost || canCheat) {
      setSelectedPlayerForAction(player);
      setShowDeleteConfirm(false);
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  // CONFIRMAR ELIMINACIÓN DE JUGADOR
  const handleConfirmDeletePlayer = async () => {
    if (!selectedPlayerForAction) return;
    const playerToDeleteId = selectedPlayerForAction.id;
    const roomRef = doc(db, 'rooms', roomId);
    const updatedPlayers = (roomData.players || []).filter(p => p.id !== playerToDeleteId);
    
    const updatePayload = { players: updatedPlayers };
    if (roomData.nextTarget === playerToDeleteId) updatePayload.nextTarget = null;
    if (roomData.nextPair === playerToDeleteId) updatePayload.nextPair = null;

    await updateDoc(roomRef, updatePayload);
    setSelectedPlayerForAction(null);
    setShowDeleteConfirm(false);
    if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
  };

  // ELIMINAR JUGADOR DESDE EL PANEL (Host o Papito)
  const handleDeletePlayer = async (playerToDeleteId) => {
    if (!isHost && !canCheat) return;
    const player = (roomData.players || []).find(p => p.id === playerToDeleteId);
    if (player) {
      setSelectedPlayerForAction(player);
      setShowDeleteConfirm(true);
    }
  };

  // Añadir un nuevo jugador manualmente desde la sala
  const handleAddExtraPlayer = async (e) => {
    e.preventDefault();
    if (!extraPlayerName.trim()) return;
    const roomRef = doc(db, 'rooms', roomId);
    const newPlayer = {
      id: `slot_${Date.now()}`,
      name: extraPlayerName.trim(),
      avatar: newPlayerAvatar || getRandomAvatar(),
      isClaimed: true,
      claimedBy: null,
      joinedAt: new Date().toISOString()
    };
    await updateDoc(roomRef, {
      players: [...(roomData.players || []), newPlayer]
    });
    setExtraPlayerName('');
    setNewPlayerAvatar(getRandomAvatar());
    setNewPlayerModal(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unite a mi sala en OnFire 🔥',
          text: `Entrá a la previa en OnFire con el código de sala ${roomId}`,
          url: shareUrl
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
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

  // Forzar limpieza completa de caché y Service Worker
  const handleForcePurgeCache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const r of registrations) {
          await r.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      localStorage.removeItem('onfire_active_session');
      window.location.reload(true);
    } catch (e) {
      window.location.reload(true);
    }
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
  const fixedChallenge = roomData.nextChallenge;
  const currentChallenge = roomData.currentChallenge;

  // Identificación personalizada de la interacción en pantalla
  const isMeActor = roomData.currentResult && (
    roomData.currentResult.id === playerId || 
    roomData.currentResult.claimedBy === playerId ||
    roomData.currentResult.name === playerName
  );

  const isMeTarget = roomData.currentPair && (
    roomData.currentPair.id === playerId || 
    roomData.currentPair.claimedBy === playerId ||
    roomData.currentPair.name === playerName
  );

  // Determinar si los superpoderes de trampa están activos visualmente
  const isCheatActiveVisual = canCheat && cheatUIVisible;

  // Lista filtrada para el buscador de retos del Papito
  const filteredSearchChallenges = (roomData.challenges || []).filter(c => 
    c.texto.toLowerCase().includes(challengeSearchTerm.toLowerCase()) ||
    c.tipo.toLowerCase().includes(challengeSearchTerm.toLowerCase())
  ).slice(0, 30);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between p-2 sm:p-3 relative overflow-hidden select-none">
      {/* Fondos */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================== */}
      {/* EFECTO DINÁMICO SEGÚN PICANTE (MEMOIZADO, FLUIDO 60FPS)     */}
      {/* ========================================================== */}
      <ScreenFireEffect 
        currentSpice={currentSpice}
        isVisible={(isMeActor || isMeTarget) && !!roomData?.currentResult && !roomData?.isSpinning && isFireActive}
        lowSpecsMode={lowSpecsMode}
      />

      {/* ========================================================== */}
      {/* SUPER ANIMACIÓN DE PANTALLA COMPLETA (RETO vs VERDAD)     */}
      {/* ========================================================== */}
      <AnimatePresence>
        {splashReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            {/* Halo de luz expansivo */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.5, 3], opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`absolute w-80 h-80 rounded-full blur-3xl ${
                splashReveal === 'reto'
                  ? 'bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400'
                  : 'bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500'
              }`}
            />

            {/* Tarjeta de impacto central */}
            <motion.div
              initial={{ scale: 0.2, rotate: -15, opacity: 0 }}
              animate={{ scale: [0.2, 1.2, 1], rotate: [-15, 3, 0], opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
              className={`relative px-8 py-6 rounded-3xl border-4 shadow-2xl flex flex-col items-center justify-center text-center ${
                splashReveal === 'reto'
                  ? 'bg-gradient-to-b from-slate-900/95 to-rose-950/95 border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.8)]'
                  : 'bg-gradient-to-b from-slate-900/95 to-purple-950/95 border-fuchsia-500 shadow-[0_0_60px_rgba(217,70,239,0.8)]'
              }`}
            >
              {splashReveal === 'reto' ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="p-4 rounded-full bg-rose-500/20 border-2 border-rose-500/60 shadow-[0_0_30px_#f43f5e] mb-3"
                  >
                    <Flame className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-[0_0_15px_#f43f5e]" />
                  </motion.div>
                  <span className="text-xs uppercase font-black tracking-widest text-amber-300 drop-shadow-md">
                    ¡PREPARATE PARA ACCIÓN!
                  </span>
                  <h1 className="text-5xl sm:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-pink-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)] mt-1">
                    🔥 RETO
                  </h1>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="p-4 rounded-full bg-purple-500/20 border-2 border-fuchsia-500/60 shadow-[0_0_30px_#d946ef] mb-3"
                  >
                    <Sparkles className="w-16 h-16 text-fuchsia-400 fill-fuchsia-400 drop-shadow-[0_0_15px_#d946ef]" />
                  </motion.div>
                  <span className="text-xs uppercase font-black tracking-widest text-purple-300 drop-shadow-md">
                    ¡SIN FILTRO NI VERGÜENZA!
                  </span>
                  <h1 className="text-5xl sm:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-400 to-pink-400 drop-shadow-[0_0_20px_rgba(217,70,239,0.9)] mt-1">
                    💜 VERDAD
                  </h1>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header con BOTÓN DE SALA, QR, SONIDO, PANTALLA COMPLETA Y MODO RENDIMIENTO (SIEMPRE VISIBLE) */}
      <header className="w-full max-w-lg flex items-center justify-between z-30 pt-1 pb-1.5 border-b border-slate-800/80 mb-0.5 flex-shrink-0">
        <button
          onClick={onLeave}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition active:scale-95"
          title="Salir de la sala"
        >
          <LogOut className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Botón Código de Sala */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-rose-500/30 rounded-xl text-xs font-mono font-bold tracking-widest text-rose-300 hover:border-rose-500 transition shadow-sm active:scale-95"
          >
            <span>SALA: {roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Botón QR para escanear y entrar de una */}
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 bg-slate-900/90 border border-rose-500/40 hover:border-rose-400 rounded-xl text-rose-400 hover:text-white transition shadow-sm flex items-center justify-center active:scale-95"
            title="Mostrar código QR de la sala"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Botón Sonido (Activar / Silenciar) */}
          <button
            onClick={handleToggleMute}
            className="p-2 bg-slate-900/90 border border-slate-700/70 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition shadow-sm flex items-center justify-center active:scale-95"
            title={isMuted ? "Sonido silenciado - Tocá para activar" : "Sonido activo - Tocá para silenciar"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Botón Pantalla Completa */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 bg-slate-900/90 border border-slate-700/70 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition shadow-sm flex items-center justify-center active:scale-95"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Botón Modo Rendimiento / Animaciones Reducidas */}
          <button
            onClick={handleToggleLowSpecs}
            className={`p-2 rounded-xl text-xs transition shadow-sm flex items-center justify-center border active:scale-95 ${
              lowSpecsMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/70 hover:border-slate-500'
            }`}
            title={
              lowSpecsMode
                ? "Modo Rendimiento ACTIVO (Animaciones reducidas)"
                : "Modo Rendimiento DESACTIVADO (Tocá para acelerar la app)"
            }
          >
            <Zap className={`w-4 h-4 ${lowSpecsMode ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* BARRA DE NIVEL DE PICANTE Y TRAMPA INTEGRADA */}
      <div className="w-full max-w-lg z-10 my-0.5 sm:my-1 flex-shrink-0">
        <div className="p-1.5 sm:p-2 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-md space-y-1.5">
          
          {/* Fila 1: Botones de Nivel de Picante (1 a 4) GRANDES Y LEGIBLES */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              onClick={() => canCheat && handleChangeSpiceLevel(1)}
              disabled={!canCheat}
              className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 ${
                currentSpice === 1
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                  : 'text-slate-400 hover:text-slate-200'
              } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            >
              <span>🌶️</span>
              <span className="truncate">1. Suave</span>
            </button>

            <button
              onClick={() => canCheat && handleChangeSpiceLevel(2)}
              disabled={!canCheat}
              className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 ${
                currentSpice === 2
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.5)] font-black'
                  : 'text-slate-400 hover:text-slate-200'
              } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            >
              <span>🔥</span>
              <span className="truncate">2. Caliente</span>
            </button>

            <button
              onClick={() => canCheat && handleChangeSpiceLevel(3)}
              disabled={!canCheat}
              className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 ${
                currentSpice === 3
                  ? 'bg-purple-600/35 text-purple-300 border border-purple-500/70 shadow-[0_0_14px_rgba(168,85,247,0.6)] font-black'
                  : 'text-slate-400 hover:text-slate-200'
              } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            >
              <span>💀</span>
              <span className="truncate">3. Fuego</span>
            </button>

            <button
              onClick={() => canCheat && handleChangeSpiceLevel(4)}
              disabled={!canCheat}
              className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1 ${
                currentSpice === 4
                  ? 'bg-red-600/35 text-red-300 border border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.8)] font-black'
                  : 'text-slate-400 hover:text-slate-200'
              } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            >
              <span className="flex items-center -space-x-0.5">💀🔥</span>
              <span className="truncate">4. Extremo</span>
            </button>
          </div>

          {/* Fila 2: Forzar Reto o Verdad (Modo Trampa) */}
          {isCheatActiveVisual && (
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1 flex-shrink-0">
                <EyeOff className="w-3.5 h-3.5" /> Forzar:
              </span>

              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => handleToggleCheatType('reto')}
                  className={`py-1 px-3 rounded-xl text-xs font-black transition flex items-center gap-1 active:scale-95 ${
                    roomData.nextType === 'reto'
                      ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.8)] border border-rose-400'
                      : 'bg-slate-800/90 text-slate-400 hover:text-rose-300 border border-slate-700/70'
                  }`}
                >
                  <span>🔥 Reto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCheatType('verdad')}
                  className={`py-1 px-3 rounded-xl text-xs font-black transition flex items-center gap-1 active:scale-95 ${
                    roomData.nextType === 'verdad'
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.8)] border border-purple-400'
                      : 'bg-slate-800/90 text-slate-400 hover:text-purple-300 border border-slate-700/70'
                  }`}
                >
                  <span>💜 Verdad</span>
                </button>

                {roomData.nextType && (
                  <button
                    type="button"
                    onClick={() => handleToggleCheatType(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    title="Desactivar forzar tipo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Indicador de Ronda y Botones Sumar Jugador + Ajustes Flotante */}
        <div className="w-full max-w-lg flex justify-between items-center px-1 mt-1 text-xs text-slate-400 font-medium flex-shrink-0">
          <span 
            onClick={handleRondaDoubleTap}
            className="flex items-center gap-1.5 cursor-pointer select-none active:opacity-75 font-bold text-slate-200"
            title={canCheat ? "Doble toque para ocultar/mostrar superpoderes de trampa" : ""}
          >
            <TrendingUp className="w-4 h-4 text-rose-500" /> Ronda #{roomData.roundCount || 0}
          </span>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-300 font-bold text-xs">
              <Users className="w-3.5 h-3.5 text-purple-400" /> {playersList.length}
            </span>

            {/* Botón Sumar Jugador */}
            <button
              onClick={() => setNewPlayerModal(true)}
              className="px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Sumar
            </button>

            {/* Botón Ajustes integrado y siempre accesible */}
            <button
              onClick={() => setShowAdminPanel(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
              title="Ajustes de la sala"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span>Ajustes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ÁREA CENTRAL: RULETA GRANDE CON JUGADORES EN ÓRBITA         */}
      {/* ========================================================== */}
      <main className="w-full max-w-lg flex-1 flex flex-col items-center justify-around my-auto z-10 py-1 min-h-0">
        
        {/* CORONA SUPERIOR DE LA RULETA (Diseño cautivante de RETO o VERDAD) */}
        <div className="h-7 flex items-center justify-center mb-0.5 flex-shrink-0">
          <AnimatePresence>
            {currentChallenge && !roomData.isSpinning && (
              <motion.div
                initial={{ y: -10, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className={`px-3.5 py-0.5 rounded-full border shadow-lg flex items-center gap-1.5 ${
                  currentChallenge.tipo === 'reto'
                    ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.6)] animate-pulse'
                }`}
              >
                {currentChallenge.tipo === 'reto' ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                    <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
                      🔥 RETO PICANTE
                    </span>
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-pink-200 fill-pink-200" />
                    <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
                      💜 VERDAD SIN FILTRO
                    </span>
                    <Eye className="w-3 h-3 text-fuchsia-200" />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTENEDOR DE RULETA GRANDE CON JUGADORES DISTRIBUIDOS ALREDEDOR */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center my-auto flex-shrink-0">
          
          {/* Anillo de órbita decorativo */}
          <div className="absolute inset-4 sm:inset-5 rounded-full border border-dashed border-slate-800/90 pointer-events-none" />

          {/* FUEGO RADIAL GIGANTE ENVOLVIENDO LA RULETA (NIVEL 3 y 4) */}
          {currentSpice >= 3 && (roomData.isSpinning || isFireActive) && (
            <RouletteFireRing isSpinning={roomData.isSpinning} lowSpecsMode={lowSpecsMode} />
          )}

          {/* Borde exterior giratorio de la ruleta */}
          <motion.div
            animate={{
              rotate: roomData.isSpinning ? 720 : 0
            }}
            transition={{
              duration: roomData.isSpinning ? 2.8 : 0.4,
              ease: roomData.isSpinning ? "easeInOut" : "easeOut"
            }}
            className={`absolute w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full border-4 transition-colors duration-500 ${
              currentSpice >= 3
                ? 'border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.7)]'
                : roomData.isSpinning
                ? 'border-pink-500 shadow-[0_0_22px_rgba(244,63,94,0.5)]'
                : currentChallenge?.tipo === 'reto'
                ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)]'
                : currentChallenge?.tipo === 'verdad'
                ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.7)]'
                : 'border-slate-800'
            }`}
          />

          {/* Círculo central de la ruleta */}
          <div className={`w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border flex flex-col items-center justify-center p-2 text-center relative overflow-hidden z-10 transition-all ${
            currentSpice >= 3
              ? 'bg-gradient-to-b from-red-950 via-slate-950 to-red-950 border-amber-500/80 shadow-[inset_0_0_30px_rgba(239,68,68,0.8)]'
              : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/80 shadow-inner'
          }`}>
            
            {/* Núcleo de lava ardiente para nivel 3 y 4 */}
            {currentSpice >= 3 && (
              <div className="absolute inset-0 bg-radial-gradient from-orange-600/30 via-red-600/20 to-transparent pointer-events-none animate-pulse" />
            )}
            {roomData.isSpinning ? (
              <motion.div
                key="spinning"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center px-1"
              >
                <div className="text-2xl sm:text-3xl mb-0.5 animate-bounce">
                  {currentPlayerInAnimation.avatar || '🔥'}
                </div>
                <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-400 tracking-wide uppercase truncate max-w-[100px] sm:max-w-[120px]">
                  {currentPlayerInAnimation.name}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold">Girando...</span>
              </motion.div>
            ) : roomData.currentResult ? (
              <motion.div
                key="result"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 16 }}
                className="flex flex-col items-center w-full px-1"
              >
                {/* MENSAJE PERSONALIZADO SEGÚN QUIÉN SOS */}
                {isMeActor ? (
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-rose-500/30 text-rose-300 text-[9px] sm:text-[10px] font-black uppercase rounded-full border border-rose-500/50 mb-0.5 animate-pulse">
                      🔥 ¡TE TOCA!
                    </span>
                    <h2 className="text-sm sm:text-base md:text-lg font-black text-white drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] truncate max-w-[115px] sm:max-w-[135px] flex items-center justify-center gap-1">
                      <span className="text-base sm:text-lg">{roomData.currentResult.avatar || '🔥'}</span>
                      <span className="truncate">{roomData.currentResult.name}</span>
                    </h2>
                    {roomData.currentPair && (
                      <span className="text-[9px] sm:text-[10px] text-pink-300 font-bold mt-0.5 truncate max-w-[115px] flex items-center justify-center gap-1">
                        <span>Con:</span>
                        <span>{roomData.currentPair.avatar || '💋'}</span>
                        <span className="truncate">{roomData.currentPair.name}</span>
                      </span>
                    )}
                  </div>
                ) : isMeTarget ? (
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-[9px] sm:text-[10px] font-black uppercase rounded-full border border-purple-500/50 mb-0.5 animate-pulse">
                      💋 ¡CON VOS!
                    </span>
                    <h2 className="text-xs sm:text-sm md:text-base font-black text-purple-200 truncate max-w-[115px] sm:max-w-[135px] flex items-center justify-center gap-1">
                      <span className="text-sm sm:text-base">{roomData.currentResult.avatar || '🔥'}</span>
                      <span className="truncate">{roomData.currentResult.name}</span>
                      <span>⚡ Vos</span>
                    </h2>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-rose-400 mb-0.5 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> ¡Le Toca!
                    </span>
                    <h2 className="text-sm sm:text-base md:text-lg font-black text-white drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] truncate max-w-[115px] sm:max-w-[135px] flex items-center justify-center gap-1">
                      <span className="text-base sm:text-lg">{roomData.currentResult.avatar || '🔥'}</span>
                      <span className="truncate">{roomData.currentResult.name}</span>
                    </h2>
                    {roomData.currentPair && (
                      <div className="mt-0.5 pt-0.5 border-t border-slate-800 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-purple-300 font-bold">
                        <HeartHandshake className="w-3 h-3 text-pink-400 flex-shrink-0" />
                        <span className="truncate max-w-[100px] flex items-center gap-1">
                          <span>Con:</span>
                          <span>{roomData.currentPair.avatar || '💋'}</span>
                          <span className="truncate">{roomData.currentPair.name}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500/80 mb-0.5 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-slate-200">Ruleta</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500">Tocá girar</span>
              </div>
            )}
          </div>

          {/* JUGADORES DISTRIBUIDOS EN ÓRBITA ALREDEDOR DE LA RULETA */}
          {playersList.map((player, idx) => {
            const total = playersList.length;
            const angleRad = ((idx * (360 / Math.max(1, total))) - 90) * (Math.PI / 180);
            const radiusPercent = 43; // Distancia radial en %
            const leftPercent = 50 + radiusPercent * Math.cos(angleRad);
            const topPercent = 50 + radiusPercent * Math.sin(angleRad);

            const isSpinningSelected = roomData.isSpinning && displayIndex === idx;
            const isResultWinner = !roomData.isSpinning && (roomData.currentResult?.id === player.id || roomData.currentResult?.claimedBy === player.id);
            const isResultPair = !roomData.isSpinning && (roomData.currentPair?.id === player.id || roomData.currentPair?.claimedBy === player.id);
            const isMe = player.claimedBy === playerId || player.id === playerId;
            const isTarget1 = isCheatActiveVisual && roomData.nextTarget === player.id;
            const isTarget2 = isCheatActiveVisual && roomData.nextPair === player.id;

            return (
              <div
                key={player.id}
                onClick={() => handlePlayerChipClick(player)}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-20 transition-all duration-200 select-none ${
                  (isHost || canCheat) ? 'cursor-pointer active:scale-95' : ''
                }`}
              >
                <div
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border-2 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg whitespace-nowrap transition-all duration-150 ${
                    isSpinningSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_25px_#f59e0b] scale-125 font-black ring-2 ring-amber-400 z-30'
                      : isResultWinner
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-200 shadow-[0_0_25px_rgba(244,63,94,1)] ring-2 ring-rose-400 scale-120 font-black z-25 animate-pulse'
                      : isResultPair
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-200 shadow-[0_0_25px_rgba(168,85,247,1)] ring-2 ring-purple-400 scale-115 font-black z-25 animate-pulse'
                      : isTarget1
                      ? 'bg-rose-950 border-rose-500 text-rose-200 ring-2 ring-rose-500 shadow-md scale-105'
                      : isTarget2
                      ? 'bg-purple-950 border-purple-500 text-purple-200 ring-2 ring-purple-500 shadow-md scale-105'
                      : isMe
                      ? 'bg-slate-900/95 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-900/90 border-slate-700/80 text-slate-100 hover:border-slate-500'
                  }`}
                >
                  {isSpinningSelected ? (
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  ) : isResultWinner ? (
                    <span>🔥</span>
                  ) : isResultPair ? (
                    <span>💋</span>
                  ) : isTarget1 ? (
                    <span>🎯</span>
                  ) : isTarget2 ? (
                    <span>💋</span>
                  ) : (
                    <span className="text-sm sm:text-base leading-none">{player.avatar || '🔥'}</span>
                  )}

                  <span className="max-w-[75px] sm:max-w-[100px] truncate">{player.name}</span>
                  {isMe && !isSpinningSelected && !isResultWinner && !isResultPair && (
                    <span className="text-[9px] text-emerald-400 font-extrabold">(Vos)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tarjeta del Reto / Verdad con Diseño Cautivante y Grande */}
        <AnimatePresence>
          {currentChallenge && !roomData.isSpinning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`w-full glass-card p-3 sm:p-4 rounded-2xl my-1 text-center border-2 shadow-2xl flex-shrink-0 max-h-36 sm:max-h-40 overflow-y-auto ${
                currentChallenge.tipo === 'reto'
                  ? 'border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-rose-950/60'
                  : 'border-fuchsia-500/60 shadow-[0_0_30px_rgba(217,70,239,0.35)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-purple-950/60'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-slate-800 border border-slate-700 text-slate-200 uppercase">
                  {currentSpice === 1 ? '🌶️ Suave' : currentSpice === 2 ? '🔥 Caliente' : currentSpice === 3 ? '💀 Fuego' : '💀🔥 Extremo'}
                </span>
              </div>

              <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white font-fun tracking-wide leading-tight sm:leading-snug drop-shadow-md px-1 my-1">
                "{currentChallenge.texto}"
              </p>

              {/* COUNTDOWN DE 10 SEGUNDOS CON BARRA ARDIENTE */}
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-center gap-2">
                {countdown > 0 ? (
                  <span className="px-3 py-0.5 bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-purple-500/25 border border-amber-500/50 rounded-full text-xs font-black text-amber-300 flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    ⏱️ TIEMPO: {countdown}s
                  </span>
                ) : (
                  <span className="px-3 py-0.5 bg-slate-800/90 border border-slate-700 text-slate-400 rounded-full text-xs font-bold flex items-center gap-1">
                    ⏰ ¡TIEMPO CUMPLIDO!
                  </span>
                )}

                {countdown > 0 && (
                  <div className="w-28 sm:w-40 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <motion.div
                      animate={{ width: `${Math.max(0, (countdown / 10) * 100)}%` }}
                      transition={{ duration: 0.9, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 rounded-full"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BARRA FLOTANTE DE TRAMPA COMPLETA */}
        {isCheatActiveVisual && (target1Player || target2Player || fixedChallenge || roomData.nextType) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mb-1 p-2 bg-slate-900/95 border border-rose-500/50 rounded-xl flex flex-col gap-1.5 text-xs z-20 shadow-[0_0_15px_rgba(244,63,94,0.3)] backdrop-blur-md flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Trampa:
                </span>
                {target1Player ? (
                  <span className="px-1.5 py-0.2 bg-rose-500/20 border border-rose-500/40 rounded text-rose-300 truncate font-semibold text-[10px]">
                    🎯 {target1Player.name}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500">🎯 (1º)</span>
                )}
                {target2Player ? (
                  <span className="px-1.5 py-0.2 bg-purple-500/20 border border-purple-500/40 rounded text-purple-300 truncate font-semibold text-[10px]">
                    💋 {target2Player.name}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500">💋 (2º)</span>
                )}
                {roomData.nextType && (
                  <span className="px-1.5 py-0.2 bg-pink-500/20 border border-pink-500/40 rounded text-pink-300 truncate font-semibold text-[10px]">
                    {roomData.nextType === 'reto' ? '🔥 Reto' : '💜 Verdad'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCheatChallengeModal(true)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition ${
                    fixedChallenge 
                      ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]' 
                      : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30'
                  }`}
                >
                  <FileText className="w-2.5 h-2.5" />
                  {fixedChallenge ? 'Reto Armado ✓' : '+ Fijar Reto'}
                </button>

                <button
                  onClick={handleClearTrap}
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Limpiar toda la trampa"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Preview del reto armado */}
            {fixedChallenge && (
              <div className="px-1.5 py-0.5 bg-slate-950/80 rounded border border-pink-500/30 text-[10px] text-slate-300 flex items-center justify-between">
                <span className="truncate italic">"{fixedChallenge.texto}"</span>
                <span className="text-[9px] font-bold uppercase text-pink-400 ml-1">{fixedChallenge.tipo}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Botón de Giro GRANDE Y PROMINENTE */}
        <button
          onClick={handleSpin}
          disabled={roomData.isSpinning || playersList.length < 2}
          className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-black text-base sm:text-lg md:text-xl rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.5)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider flex-shrink-0"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          {roomData.isSpinning ? 'Eligiendo víctimas...' : 'Girar Ruleta'}
        </button>
      </main>

      {/* ========================================================== */}
      {/* MODAL QR CODE DE LA SALA PARA ESCANEAR CON EL CELULAR      */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 text-center flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-rose-500" /> Escanear Sala
                </span>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Código QR Generado */}
              <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)] my-1 border-4 border-rose-500/40">
                <QRCodeSVG
                  value={shareUrl}
                  size={200}
                  level="Q"
                  includeMargin={false}
                />
              </div>

              {/* Información de Sala */}
              <div>
                <span className="text-xs text-slate-400">Código de Sala:</span>
                <h2 className="text-3xl font-mono font-black tracking-widest text-rose-400">
                  {roomId}
                </h2>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                  Apuntá con la cámara de tu celular para entrar a la sala al instante sin escribir el código.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="w-full flex gap-2 pt-2">
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" /> Compartir Link
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* MODAL INSTRUCTIVO PANTALLA COMPLETA IPHONE (IOS SAFARI)    */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showIOSTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border-2 border-rose-500/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 text-center flex flex-col items-center relative overflow-hidden"
            >
              <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Pantalla Completa en iPhone</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed text-left bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                  En Safari de iOS, para jugar sin barras del navegador:
                  <br /><br />
                  1. Tocá el botón <strong>Compartir (⎋)</strong> abajo en Safari.
                  <br />
                  2. Seleccioná <strong>"Agregar a Inicio" ➕</strong>.
                  <br />
                  3. Abrí el icono <strong>OnFire 🔥</strong> desde tu inicio y listo.
                </p>
              </div>

              <button
                onClick={() => setShowIOSTipModal(false)}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl text-sm transition shadow-lg active:scale-95"
              >
                ¡Entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA FIJAR RETO O VERDAD TRAMPA (Exclusivo Papito) */}
      <AnimatePresence>
        {showCheatChallengeModal && isCheatActiveVisual && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-md shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-pink-400 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Fijar Reto o Verdad en las Sombras
                </h3>
                <button
                  onClick={() => setShowCheatChallengeModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Tabs: Escribir Propio vs Buscar de la Base de 500 */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTabModal('custom')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTabModal === 'custom'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" /> Escribir Personalizado
                </button>
                <button
                  onClick={() => setActiveTabModal('search')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTabModal === 'search'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" /> Elegir de los 500
                </button>
              </div>

              {activeTabModal === 'custom' ? (
                /* TAB 1: ESCRIBIR RETO PROPIO */
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomChallengeType('reto')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                        customChallengeType === 'reto'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      🔥 RETO
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomChallengeType('verdad')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                        customChallengeType === 'verdad'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      💜 VERDAD
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Texto del Reto / Verdad:
                    </label>
                    <textarea
                      rows={3}
                      value={customChallengeInput}
                      onChange={(e) => setCustomChallengeInput(e.target.value)}
                      placeholder="Ej: Dale un beso apasionado de 15 segundos en la boca a {target}..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500 resize-none font-medium"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <button
                        type="button"
                        onClick={() => setCustomChallengeInput(prev => prev + ' {target}')}
                        className="text-[10px] text-pink-400 hover:text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/30"
                      >
                        + Insertar {'{target}'} (Nombre Pareja)
                      </button>
                      <span className="text-[10px] text-slate-500">{customChallengeInput.length} chars</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!customChallengeInput.trim()) return;
                      handleSaveCheatChallenge({
                        tipo: customChallengeType,
                        texto: customChallengeInput.trim()
                      });
                    }}
                    disabled={!customChallengeInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Armar este Reto para la Ruleta
                  </button>
                </div>
              ) : (
                /* TAB 2: BUSCADOR DE LOS 500 RETOS */
                <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por palabra (ej: beso, trago, labio, hotel)..."
                      value={challengeSearchTerm}
                      onChange={(e) => setChallengeSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1 flex-1">
                    {filteredSearchChallenges.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSaveCheatChallenge(c)}
                        className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/50 rounded-xl text-left text-xs transition flex items-center justify-between group"
                      >
                        <div className="truncate pr-2">
                          <span className={`text-[9px] font-bold uppercase mr-1.5 px-1.5 py-0.5 rounded ${
                            c.tipo === 'reto' ? 'bg-rose-500/20 text-rose-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {c.tipo}
                          </span>
                          <span className="text-slate-200">{c.texto}</span>
                        </div>
                        <Check className="w-3.5 h-3.5 text-pink-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

              <form onSubmit={handleAddExtraPlayer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nombre del Jugador:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-2xl flex-shrink-0">
                      <span>{newPlayerAvatar}</span>
                    </div>
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="Ej: Fran, Lucas..."
                      value={extraPlayerName}
                      onChange={(e) => setExtraPlayerName(e.target.value)}
                      autoFocus
                      className="flex-1 px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Selector de Avatar */}
                <AvatarPicker
                  selectedAvatar={newPlayerAvatar}
                  onSelectAvatar={setNewPlayerAvatar}
                  label="Ícono del jugador:"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewPlayerModal(false)}
                    className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!extraPlayerName.trim()}
                    className="w-1/2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-md"
                  >
                    Sumar a la Sala
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE ACCIÓN Y ELIMINACIÓN DE JUGADOR AL TOCARLO EN LA RULETA (ADMIN / TRAMPA) */}
      <AnimatePresence>
        {selectedPlayerForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4"
            >
              {showDeleteConfirm ? (
                /* Vista de Confirmación de Eliminación */
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-3xl shadow-lg animate-pulse">
                    <span>{selectedPlayerForAction.avatar || '🔥'}</span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      ¿Eliminar a "{selectedPlayerForAction.name}"?
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Se quitará su casillero de la ruleta y ya no participará en los retos de la previa.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeletePlayer}
                      className="w-1/2 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-rose-900/40 transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, Eliminar</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Vista de Acciones del Jugador */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-500/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                        <span>{selectedPlayerForAction.avatar || '🔥'}</span>
                      </div>
                      <div className="truncate">
                        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{selectedPlayerForAction.name}</span>
                          {(selectedPlayerForAction.id === playerId || selectedPlayerForAction.claimedBy === playerId) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex-shrink-0">
                              Vos
                            </span>
                          )}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Opciones de jugador</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPlayerForAction(null)}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Superpoderes de Trampa si está activo */}
                  {canCheat && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" /> Superpoderes de Trampa:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleCheatPlayer(selectedPlayerForAction);
                            setSelectedPlayerForAction(null);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                            roomData.nextTarget === selectedPlayerForAction.id
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-500/60'
                          }`}
                        >
                          <span>🎯 1º (Actor)</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const roomRef = doc(db, 'rooms', roomId);
                            if (roomData.nextPair === selectedPlayerForAction.id) {
                              await updateDoc(roomRef, { nextPair: null });
                            } else {
                              await updateDoc(roomRef, { nextPair: selectedPlayerForAction.id });
                            }
                            setSelectedPlayerForAction(null);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                            roomData.nextPair === selectedPlayerForAction.id
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-purple-500/60'
                          }`}
                        >
                          <span>💋 2º (Pareja)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botón Eliminar Jugador para el Anfitrión */}
                  {(isHost || canCheat) && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 px-4 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Eliminar de la Ruleta</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPlayerForAction(null)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition active:scale-95"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENÚ DE JUEGO / AJUSTES (MODAL DE PAUSA) */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header del Menú */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Menú de Juego</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Sala: <strong className="text-rose-400">{roomId}</strong></p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition active:scale-95"
                >
                  ✕
                </button>
              </div>

              {/* Botones de Control Rápido */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Controles Rápidos</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-200 transition active:scale-95"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                    <span>{isMuted ? 'Activar Audio' : 'Silenciar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-200 transition active:scale-95"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-purple-400" />}
                    <span>{isFullscreen ? 'Ventana' : 'Pantalla Completa'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleLowSpecs}
                    className={`p-2.5 border rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
                      lowSpecsMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${lowSpecsMode ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <span>{lowSpecsMode ? 'Modo Rápido: ON' : 'Acelerar Celular'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPanel(false);
                      setShowQRModal(true);
                    }}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-300 transition active:scale-95"
                  >
                    <QrCode className="w-4 h-4 text-rose-400" />
                    <span>Código QR / Invitar</span>
                  </button>
                </div>
              </div>

              {/* Sección Exclusiva de Anfitrión o Trampa */}
              {(isHost || canCheat) && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  {/* Gestión de Jugadores (Eliminar) */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Administrar Jugadores</h4>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {playersList.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-base">{p.avatar || '🔥'}</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeletePlayer(p.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1 flex-shrink-0 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Base de Retos */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Base de Retos ({roomData.challenges?.length || 0})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleExportChallenges}
                        className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-300"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" /> Exportar JSON
                      </button>

                      <label className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-slate-300">
                        <Upload className="w-3.5 h-3.5 text-pink-400" /> Importar JSON
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportChallenges}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Info Modo Trampa */}
                  {isCheatActiveVisual && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-rose-400">
                        <EyeOff className="w-3.5 h-3.5" /> Modo Trampa Activo:
                      </p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        1. Tocá a un jugador para fijar <strong>🎯 1º (A quién le toca)</strong>.
                        <br />
                        2. Tocá a otro para fijar <strong>💋 2º (Con quién interactúa)</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Jugadores en la Sala (Para no-hosts) */}
              {!isHost && !canCheat && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Jugadores en la Ronda ({playersList.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {playersList.map((p) => (
                      <span
                        key={p.id}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold flex items-center gap-1"
                      >
                        <span>{p.avatar || '🔥'}</span>
                        <span>{p.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Instalar App (PWA) */}
              {!isInstalled && onInstallApp && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onInstallApp();
                      setShowAdminPanel(false);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Instalar OnFire en tu Celular (App PWA)
                  </button>
                </div>
              )}

              {/* Sección de Versión y Limpieza de Caché */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Versión de la App:</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 font-mono font-bold text-rose-400 text-[11px]">
                    {appVersion}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleForcePurgeCache}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className="w-3 h-3 text-pink-400" /> Limpiar Caché y Actualizar
                </button>
              </div>

              {/* Botones de Acción: Continuar y Salir */}
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Seguro que querés salir de la sala?')) {
                      onLeave();
                    }
                  }}
                  className="w-1/3 py-3 bg-slate-800/80 hover:bg-rose-950 hover:border-rose-600 border border-slate-700 text-slate-300 hover:text-rose-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Salir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdminPanel(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-black rounded-2xl text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition active:scale-95"
                >
                  Continuar Jugando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
