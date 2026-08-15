import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
  Share2 
} from 'lucide-react';

// Generador de audio sintetizado Web Audio API
const playTone = (freq, duration = 0.1, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
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

const playRetoSound = () => {
  playTone(392.00, 0.1, 'triangle');
  setTimeout(() => playTone(523.25, 0.15, 'sawtooth'), 90);
  setTimeout(() => playTone(659.25, 0.35, 'sawtooth'), 180);
};

const playVerdadSound = () => {
  playTone(440.00, 0.12, 'sine');
  setTimeout(() => playTone(554.37, 0.15, 'sine'), 100);
  setTimeout(() => playTone(880.00, 0.4, 'sine'), 200);
};

export default function Room({ roomId, playerId, playerName, isHost, canCheat, onLeave }) {
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [newPlayerModal, setNewPlayerModal] = useState(false);
  const [extraPlayerName, setExtraPlayerName] = useState('');
  
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

  const spinInterval = useRef(null);

  // URL para compartir la sala por QR o enlace directo
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

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

  // Disparar Super Animación y Sonidos cuando cae el resultado
  useEffect(() => {
    if (roomData?.currentChallenge && !roomData?.isSpinning) {
      const challengeId = roomData.currentChallenge.id || roomData.currentChallenge.texto;
      if (lastRevealedChallengeId.current !== challengeId) {
        lastRevealedChallengeId.current = challengeId;
        const tipo = roomData.currentChallenge.tipo?.toLowerCase() || 'reto';
        
        setSplashReveal(tipo);
        if (tipo === 'reto') {
          playRetoSound();
        } else {
          playVerdadSound();
        }

        if (navigator.vibrate) navigator.vibrate([80, 40, 120, 40, 160]);

        const timer = setTimeout(() => {
          setSplashReveal(null);
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [roomData?.currentChallenge, roomData?.isSpinning]);

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

    // Aumento automático de nivel de picante cada 8 rondas
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
      const allChallenges = roomData.challenges || [];
      const filteredChallenges = allChallenges.filter(c => c.level === currentSpice);
      const pool = filteredChallenges.length > 0 ? filteredChallenges : allChallenges;

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
      nextChallenge: null
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

  // MODO TRAMPA: Fijar Reto/Verdad
  const handleSaveCheatChallenge = async (challengeObj) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { nextChallenge: challengeObj });
    setShowCheatChallengeModal(false);
    if (navigator.vibrate) navigator.vibrate([40, 40]);
  };

  const handleClearTrap = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { nextTarget: null, nextPair: null, nextChallenge: null });
  };

  // ELIMINAR JUGADOR (Host o Papito)
  const handleDeletePlayer = async (playerToDeleteId) => {
    if (!isHost && !canCheat) return;
    if (confirm('¿Seguro que querés eliminar a este jugador de la sala?')) {
      const roomRef = doc(db, 'rooms', roomId);
      const updatedPlayers = (roomData.players || []).filter(p => p.id !== playerToDeleteId);
      
      const updatePayload = { players: updatedPlayers };
      if (roomData.nextTarget === playerToDeleteId) updatePayload.nextTarget = null;
      if (roomData.nextPair === playerToDeleteId) updatePayload.nextPair = null;

      await updateDoc(roomRef, updatePayload);
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 relative pb-12 overflow-x-hidden">
      {/* Fondos */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================== */}
      {/* EFECTO DINÁMICO SEGÚN PICANTE (CUANDO TE TOCA A VOS O CON VOS) */}
      {/* ========================================================== */}
      {(isMeActor || isMeTarget) && roomData.currentResult && !roomData.isSpinning && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          
          {/* CASO 1: 🌶️ NIVEL SUAVE -> CAÍDA DE AJÍES PICANTES */}
          {currentSpice === 1 && (
            <>
              {/* Borde ámbar cálido */}
              <motion.div
                animate={{
                  opacity: [0.5, 0.85, 0.5],
                  boxShadow: [
                    "inset 0 0 25px rgba(245,158,11,0.4), inset 0 0 50px rgba(234,88,12,0.3)",
                    "inset 0 0 45px rgba(245,158,11,0.7), inset 0 0 80px rgba(234,88,12,0.5)",
                    "inset 0 0 25px rgba(245,158,11,0.4), inset 0 0 50px rgba(234,88,12,0.3)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                className="absolute inset-0 border-2 border-amber-500/40"
              />

              {/* Resplandor suave inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-amber-500/30 via-orange-500/15 to-transparent blur-xl" />

              {/* Lluvia / Caída de ajíes picantes 🌶️ */}
              <div className="absolute inset-0 flex justify-around">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -60, x: 0, opacity: 0 }}
                    animate={{
                      y: [ -40, 750 ],
                      x: [ 0, (i % 2 === 0 ? 30 : -30), (i % 2 === 0 ? -20 : 20) ],
                      rotate: [ 0, (i % 2 === 0 ? 360 : -360) ],
                      opacity: [ 0, 1, 1, 0 ],
                      scale: [ 0.7, 1.2, 1, 0.8 ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.6 + (i * 0.22),
                      delay: (i * 0.2),
                      ease: "easeIn"
                    }}
                    className="text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] select-none"
                  >
                    🌶️
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* CASO 2: 🔥 NIVEL CALIENTE -> FUEGO MÁS SUAVE Y BRASAS */}
          {currentSpice === 2 && (
            <>
              {/* Borde ardiente cálido */}
              <motion.div
                animate={{
                  opacity: [0.5, 0.9, 0.5],
                  boxShadow: [
                    "inset 0 0 30px rgba(244,63,94,0.5), inset 0 0 60px rgba(245,158,11,0.35)",
                    "inset 0 0 55px rgba(244,63,94,0.8), inset 0 0 95px rgba(245,158,11,0.6)",
                    "inset 0 0 30px rgba(244,63,94,0.5), inset 0 0 60px rgba(245,158,11,0.35)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="absolute inset-0 border-3 border-rose-500/50"
              />

              {/* Llamas cálidas suaves inferiores */}
              <motion.div
                animate={{
                  y: [10, -20, 10],
                  scaleY: [1, 1.3, 1],
                  opacity: [0.6, 0.85, 0.6]
                }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-rose-600/50 via-orange-500/30 to-transparent blur-xl"
              />

              {/* Brasas y Llamitas flotantes 🔥 */}
              <div className="absolute inset-0 flex justify-around items-end">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -550],
                      x: [0, (i % 2 === 0 ? 30 : -30), (i % 2 === 0 ? -15 : 15)],
                      opacity: [0, 0.9, 0.8, 0],
                      scale: [0.5, 1.2, 0.8, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2 + (i * 0.3),
                      delay: i * 0.25,
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

          {/* CASO 3: 💀 NIVEL FUEGO TOTAL -> ¡INFIERNO TOTAL QUE PRENDE FUEGO TODA LA PANTALLA! 💀 */}
          {currentSpice === 3 && (
            <>
              {/* Quemadura extrema de bordes en los 4 costados */}
              <motion.div
                animate={{
                  opacity: [0.85, 1, 0.9, 1, 0.85],
                  boxShadow: [
                    "inset 0 0 60px rgba(225,29,72,0.9), inset 0 0 120px rgba(249,115,22,0.8), inset 0 0 200px rgba(234,88,12,0.6)",
                    "inset 0 0 90px rgba(239,68,68,1), inset 0 0 160px rgba(245,158,11,0.9), inset 0 0 260px rgba(225,29,72,0.8)",
                    "inset 0 0 60px rgba(225,29,72,0.9), inset 0 0 120px rgba(249,115,22,0.8), inset 0 0 200px rgba(234,88,12,0.6)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                className="absolute inset-0 border-8 border-red-500/80 mix-blend-screen"
              />

              {/* Muralla de Fuego Infernal Gigante (cubre el 85% de la pantalla) */}
              <motion.div
                animate={{
                  y: [10, -35, 5, -45, 10],
                  scaleY: [1, 1.25, 1.05, 1.3, 1],
                  opacity: [0.75, 0.95, 0.8, 1, 0.75]
                }}
                transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 right-0 h-[80vh] bg-gradient-to-t from-red-600/80 via-orange-500/50 to-transparent blur-2xl pointer-events-none mix-blend-screen"
              />

              {/* Capa de fuego 2: Núcleo ardiente ultra brillante */}
              <motion.div
                animate={{
                  y: [0, -40, -10, -55, 0],
                  scaleX: [1, 1.2, 0.95, 1.25, 1],
                  opacity: [0.7, 1, 0.85, 1, 0.7]
                }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 0.15 }}
                className="absolute bottom-0 left-0 right-0 h-[65vh] bg-gradient-to-t from-amber-500/90 via-rose-600/70 to-transparent blur-xl pointer-events-none mix-blend-screen"
              />

              {/* Llamas laterales izquierda y derecha quemando los costados */}
              <motion.div
                animate={{
                  x: [-10, 15, -5, 10, -10],
                  opacity: [0.6, 0.9, 0.7, 0.95, 0.6]
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-red-600/70 via-orange-500/40 to-transparent blur-xl"
              />
              <motion.div
                animate={{
                  x: [10, -15, 5, -10, 10],
                  opacity: [0.6, 0.9, 0.7, 0.95, 0.6]
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-red-600/70 via-orange-500/40 to-transparent blur-xl"
              />

              {/* Fuego cayendo desde arriba (techo en llamas) */}
              <motion.div
                animate={{
                  y: [-10, 15, -5, 20, -10],
                  opacity: [0.5, 0.85, 0.6, 0.9, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
                className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-600/70 via-orange-500/35 to-transparent blur-xl"
              />

              {/* Lluvia ascendente de Calaveras 💀 y Fuegos 🔥 gigantes */}
              <div className="absolute inset-0 flex justify-around items-end overflow-hidden">
                {[...Array(14)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -780],
                      x: [0, (i % 2 === 0 ? 50 : -50), (i % 2 === 0 ? -35 : 35)],
                      rotate: [0, (i % 2 === 0 ? 45 : -45), 0],
                      opacity: [0, 1, 0.95, 0],
                      scale: [0.6, 1.8, 1.2, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.8 + (i * 0.2),
                      delay: i * 0.12,
                      ease: "easeOut"
                    }}
                    className="text-3xl sm:text-5xl drop-shadow-[0_0_25px_rgba(239,68,68,1)] select-none"
                  >
                    {i % 3 === 0 ? '💀' : i % 3 === 1 ? '🔥' : '💥'}
                  </motion.div>
                ))}
              </div>

              {/* Aviso Flotante Fuego Total */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 border-2 border-amber-300 shadow-[0_0_30px_#ef4444] z-40 text-xs sm:text-sm font-black uppercase tracking-widest text-white flex items-center gap-1.5"
              >
                <span>💀</span>
                <span>¡ESTÁS PRENDIDO FUEGO!</span>
                <span>🔥</span>
              </motion.div>
            </>
          )}

        </div>
      )}

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

      {/* Header con BOTÓN DE SALA Y BOTÓN DE QR */}
      <header className="w-full max-w-lg flex items-center justify-between pt-2 pb-3 z-10 border-b border-slate-800/80">
        <button
          onClick={onLeave}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition"
          title="Salir de la sala"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {/* Botón Código de Sala */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 border border-rose-500/30 rounded-xl text-xs font-mono font-bold tracking-widest text-rose-300 hover:border-rose-500 transition shadow-sm"
          >
            <span>SALA: {roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Botón QR para escanear y entrar de una */}
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 bg-slate-900/90 border border-rose-500/40 hover:border-rose-400 rounded-xl text-rose-400 hover:text-white transition shadow-sm flex items-center justify-center"
            title="Mostrar código QR de la sala"
          >
            <QrCode className="w-4 h-4" />
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

      {/* BARRA DE NIVEL DE PICANTE */}
      <div className="w-full max-w-lg z-10 my-2">
        <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-md">
          <button
            onClick={() => canCheat && handleChangeSpiceLevel(1)}
            disabled={!canCheat}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              currentSpice === 1
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-500 hover:text-slate-300'
            } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
          >
            <span>🌶️</span>
            <span className="truncate">1. Suave</span>
          </button>

          <button
            onClick={() => canCheat && handleChangeSpiceLevel(2)}
            disabled={!canCheat}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              currentSpice === 2
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'text-slate-500 hover:text-slate-300'
            } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
          >
            <span>🔥</span>
            <span className="truncate">2. Caliente</span>
          </button>

          <button
            onClick={() => canCheat && handleChangeSpiceLevel(3)}
            disabled={!canCheat}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              currentSpice === 3
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'text-slate-500 hover:text-slate-300'
            } ${!canCheat ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
          >
            <span>💀</span>
            <span className="truncate">3. Fuego</span>
          </button>
        </div>

        {/* Indicador de Ronda con Doble Toque Camuflaje */}
        <div className="flex justify-between items-center px-2 mt-1.5 text-[10px] text-slate-500 font-medium">
          <span 
            onClick={handleRondaDoubleTap}
            className="flex items-center gap-1 cursor-pointer select-none active:opacity-75"
            title={canCheat ? "Doble toque para ocultar/mostrar superpoderes de trampa" : ""}
          >
            <TrendingUp className="w-3 h-3 text-rose-500" /> Ronda #{roomData.roundCount || 0}
          </span>
          <span>
            {canCheat ? 'Podés cambiar el nivel cuando quieras' : 'El picante sube automáticamente cada 8 rondas'}
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ÁREA CENTRAL: RULETA CON CORONA SUPERIOR DE RETO/VERDAD    */}
      {/* ========================================================== */}
      <main className="w-full max-w-lg flex flex-col items-center justify-center my-auto z-10 py-1">
        
        {/* CORONA SUPERIOR DE LA RULETA (Diseño cautivante de RETO o VERDAD) */}
        <div className="h-10 flex items-center justify-center mb-1">
          <AnimatePresence>
            {currentChallenge && !roomData.isSpinning && (
              <motion.div
                initial={{ y: -15, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className={`px-5 py-1.5 rounded-full border-2 shadow-xl flex items-center gap-2 ${
                  currentChallenge.tipo === 'reto'
                    ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.6)] animate-pulse'
                }`}
              >
                {currentChallenge.tipo === 'reto' ? (
                  <>
                    <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
                    <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
                      🔥 RETO PICANTE
                    </span>
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-pink-200 fill-pink-200" />
                    <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
                      💜 VERDAD SIN FILTRO
                    </span>
                    <Eye className="w-3.5 h-3.5 text-fuchsia-200" />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RULETA CENTRAL */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-3">
          <motion.div
            animate={{
              rotate: roomData.isSpinning ? 720 : 0,
              borderColor: roomData.isSpinning 
                ? ['#f43f5e', '#d946ef', '#a855f7', '#f43f5e'] 
                : currentChallenge?.tipo === 'reto'
                ? '#f43f5e'
                : currentChallenge?.tipo === 'verdad'
                ? '#d946ef'
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
                {/* MENSAJE PERSONALIZADO SEGÚN QUIÉN SOS */}
                {isMeActor ? (
                  <div className="flex flex-col items-center">
                    <span className="px-2.5 py-0.5 bg-rose-500/30 text-rose-300 text-[11px] font-black uppercase rounded-full border border-rose-500/50 mb-1 animate-pulse">
                      🔥 ¡TE TOCA A VOS!
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] truncate max-w-full">
                      {roomData.currentResult.name}
                    </h2>
                    {roomData.currentPair && (
                      <span className="text-xs text-pink-300 font-bold mt-1">
                        Hacé el reto con: <strong className="underline">{roomData.currentPair.name}</strong>
                      </span>
                    )}
                  </div>
                ) : isMeTarget ? (
                  <div className="flex flex-col items-center">
                    <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-300 text-[11px] font-black uppercase rounded-full border border-purple-500/50 mb-1 animate-pulse">
                      💋 ¡LE TOCÓ A {roomData.currentResult.name.toUpperCase()} HACER CON VOS!
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-purple-200 truncate max-w-full">
                      {roomData.currentResult.name} ⚡ Vos
                    </h2>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
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

        {/* Tarjeta del Reto / Verdad con Diseño Cautivante */}
        <AnimatePresence>
          {currentChallenge && !roomData.isSpinning && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`w-full glass-card p-4 sm:p-5 rounded-2xl mb-3 text-center border shadow-2xl ${
                currentChallenge.tipo === 'reto'
                  ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)] bg-gradient-to-b from-slate-900/90 to-rose-950/40'
                  : 'border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.2)] bg-gradient-to-b from-slate-900/90 to-purple-950/40'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  {currentSpice === 1 ? '🌶️ Suave' : currentSpice === 2 ? '🔥 Caliente' : '💀 Fuego Total'}
                </span>
              </div>

              <p className="text-base sm:text-lg font-semibold text-slate-100 font-serif italic leading-relaxed">
                "{currentChallenge.texto}"
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

      {/* BARRA FLOTANTE DE TRAMPA COMPLETA (Víctima 1 + Víctima 2 + RETO FIJADO) */}
      {isCheatActiveVisual && (target1Player || target2Player || fixedChallenge) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mb-3 p-2.5 bg-slate-900/95 border border-rose-500/50 rounded-2xl flex flex-col gap-2 text-xs z-20 shadow-[0_0_15px_rgba(244,63,94,0.3)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> Trampa:
              </span>
              {target1Player ? (
                <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 truncate font-semibold">
                  🎯 {target1Player.name}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">🎯 (Toca 1º)</span>
              )}
              {target2Player ? (
                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 truncate font-semibold">
                  💋 con {target2Player.name}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">💋 (Toca 2º)</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCheatChallengeModal(true)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                  fixedChallenge 
                    ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]' 
                    : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30'
                }`}
              >
                <FileText className="w-3 h-3" />
                {fixedChallenge ? 'Reto Armado ✓' : '+ Fijar Reto'}
              </button>

              <button
                onClick={handleClearTrap}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                title="Limpiar toda la trampa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview del reto armado */}
          {fixedChallenge && (
            <div className="px-2 py-1 bg-slate-950/80 rounded-lg border border-pink-500/30 text-[11px] text-slate-300 flex items-center justify-between">
              <span className="truncate italic">"{fixedChallenge.texto}"</span>
              <span className="text-[9px] font-bold uppercase text-pink-400 ml-1.5">{fixedChallenge.tipo}</span>
            </div>
          )}
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
            {isCheatActiveVisual && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCheatChallengeModal(true)}
                  className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-0.5 font-bold bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/30"
                >
                  <FileText className="w-3 h-3" /> Reto Trampa
                </button>
                <span className="text-[10px] text-rose-400/90 font-medium">
                  (1º Le toca, 2º Con quién)
                </span>
              </div>
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
            const isTarget1 = isCheatActiveVisual && roomData.nextTarget === player.id;
            const isTarget2 = isCheatActiveVisual && roomData.nextPair === player.id;
            const isUnclaimed = player.isClaimed === false;

            return (
              <div
                key={player.id}
                onClick={() => canCheat && handleToggleCheatPlayer(player)}
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

                <div className="flex items-center gap-1">
                  {/* Badges de trampa */}
                  {isCheatActiveVisual && (
                    <>
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
                    </>
                  )}

                  {/* Botón eliminar jugador */}
                  {(isHost || canCheat) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlayer(player.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Eliminar jugador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </footer>

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

              {/* Gestión de Jugadores (Eliminar) */}
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-2">Eliminar Jugadores</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {playersList.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span>{p.name}</span>
                      <button
                        onClick={() => handleDeletePlayer(p.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  ))}
                </div>
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

              {isCheatActiveVisual && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-rose-400">
                    <EyeOff className="w-4 h-4" /> Modo Trampa Activo:
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    1. Tocá a un jugador para fijar <strong>🎯 1º (A quién le toca)</strong>.
                    <br />
                    2. Tocá a otro para fijar <strong>💋 2º (Con quién interactúa)</strong>.
                    <br />
                    3. Tocá <strong>+ Reto</strong> para elegir o redactar el reto exacto que saldrá.
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
