import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Room from './components/Room';
import { ALL_CHALLENGES } from './data/challenges';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Sparkles, 
  UserPlus, 
  ShieldAlert, 
  Lock, 
  Plus, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Users,
  CheckCircle2, 
  UserCheck, 
  QrCode,
  Zap,
  Maximize,
  Minimize,
  Smartphone,
  Download
} from 'lucide-react';

import AvatarPicker from './components/AvatarPicker';
import { getRandomAvatar, AVATARS } from './data/avatars';

// Generador de ID único persistente en LocalStorage
const getOrCreatePlayerId = () => {
  let pid = localStorage.getItem('onfire_player_id');
  if (!pid) {
    pid = 'p_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('onfire_player_id', pid);
  }
  return pid;
};

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v1.00';

export default function App() {
  const [playerId] = useState(getOrCreatePlayerId);
  const [rawInputName, setRawInputName] = useState(() => localStorage.getItem('onfire_raw_name') || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('onfire_player_avatar') || getRandomAvatar();
  });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [canCheat, setCanCheat] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingVersion, setUpdatingVersion] = useState(null);

  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    localStorage.setItem('onfire_player_avatar', avatar);
  };

  // Nombres precargados por el anfitrión
  const [precreatedNames, setPrecreatedNames] = useState([]);
  const [newPreName, setNewPreName] = useState('');

  // Lista de todos los jugadores de la sala para elegir en 1 toque
  const [allRoomPlayers, setAllRoomPlayers] = useState([]);
  const [selectedMergeSlot, setSelectedMergeSlot] = useState(null);
  const [stepJoin, setStepJoin] = useState('input_code'); // 'input_code' | 'join_name' | 'join_merge'
  
  // Estado de Instalación PWA (Android / iOS / PC)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Detectar si ya se está ejecutando instalada como PWA
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();

    // Capturar evento nativo de instalación en Android / Chrome / Edge
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  // Estado de Pantalla Completa
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

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
        setShowIOSTip(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Auto-Actualización obligatoria a la última versión
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
        const url = `${basePath}version.json?_t=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version && data.version !== APP_VERSION) {
            console.log(`[Version Check] New version detected: ${data.version} (current: ${APP_VERSION})`);
            setUpdatingVersion(data.version);
            
            // Limpiar Service Worker y caché
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

            // Recargar automáticamente para aplicar la última versión
            setTimeout(() => {
              window.location.reload(true);
            }, 1000);
          }
        }
      } catch (err) {
        // Sin conexión o dev
      }
    };

    // Chequear al montar
    checkForUpdates();

    // Chequear periódicamente cada 20 segundos
    const interval = setInterval(checkForUpdates, 20000);

    // Chequear al recuperar foco
    window.addEventListener('focus', checkForUpdates);
    const handleVisChange = () => {
      if (document.visibilityState === 'visible') checkForUpdates();
    };
    document.addEventListener('visibilitychange', handleVisChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkForUpdates);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, []);

  // Estado para la tarjeta de reconexión rápida a la última sala
  const [reconnectPrompt, setReconnectPrompt] = useState(null);

  // Detectar sesión previa abierta al iniciar la app
  useEffect(() => {
    const checkLastSession = async () => {
      const saved = localStorage.getItem('onfire_active_session');
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.roomCode && (Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000)) {
          const roomSnap = await getDoc(doc(db, 'rooms', parsed.roomCode));
          if (roomSnap.exists()) {
            const rData = roomSnap.data();
            const hostPlayer = (rData.players || []).find(p => p.id === rData.hostId);
            const actualHostName = hostPlayer ? hostPlayer.name : parsed.hostName || 'el Creador';
            setReconnectPrompt({
              ...parsed,
              hostName: actualHostName
            });
          } else {
            localStorage.removeItem('onfire_active_session');
          }
        } else {
          localStorage.removeItem('onfire_active_session');
        }
      } catch (err) {
        localStorage.removeItem('onfire_active_session');
      }
    };

    checkLastSession();
  }, []);

  const handleAcceptReconnect = async () => {
    if (!reconnectPrompt) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const code = reconnectPrompt.roomCode;
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setErrorMsg('La sala anterior ya no existe o fue cerrada.');
        localStorage.removeItem('onfire_active_session');
        setReconnectPrompt(null);
        setLoading(false);
        return;
      }

      const rData = roomSnap.data();
      let updatedPlayers = [...(rData.players || [])];
      const playerIdx = updatedPlayers.findIndex(
        p => p.id === playerId || p.name.trim().toLowerCase() === reconnectPrompt.playerName.trim().toLowerCase()
      );

      if (playerIdx !== -1) {
        updatedPlayers[playerIdx] = {
          ...updatedPlayers[playerIdx],
          id: playerId,
          name: reconnectPrompt.playerName,
          isClaimed: true,
          claimedBy: playerId
        };
      } else {
        updatedPlayers.push({
          id: playerId,
          name: reconnectPrompt.playerName,
          isClaimed: true,
          claimedBy: playerId,
          joinedAt: new Date().toISOString()
        });
      }

      await updateDoc(roomRef, { players: updatedPlayers });

      setRoomCodeInput(reconnectPrompt.roomCode);
      setDisplayName(reconnectPrompt.playerName);
      setRawInputName(reconnectPrompt.rawName || reconnectPrompt.playerName);
      setIsHost(reconnectPrompt.isHost || rData.hostId === playerId);
      setCanCheat(reconnectPrompt.canCheat);
      setCurrentRoom(reconnectPrompt.roomCode);
      setReconnectPrompt(null);
    } catch (err) {
      console.error("Error al reconectar con la sala:", err);
      setErrorMsg('Error al reconectar con la sala.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReconnect = () => {
    localStorage.removeItem('onfire_active_session');
    setReconnectPrompt(null);
  };

  // Detectar código de sala por URL (al escanear código QR)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room') || urlParams.get('sala') || (window.location.hash.startsWith('#room=') ? window.location.hash.replace('#room=', '') : '');
    
    if (roomFromUrl && roomFromUrl.trim().length >= 4) {
      const code = roomFromUrl.trim().toUpperCase();
      setRoomCodeInput(code);
      checkRoomByCode(code);
    }
  }, []);

  // Detectar si el nombre tiene la palabra clave secreta "Papito"
  const processName = (input) => {
    const trimmed = input.trim();
    const isSecret = trimmed.toLowerCase().startsWith('papito');
    let clean = trimmed;
    if (isSecret) {
      clean = trimmed.replace(/^papito\s*/i, '');
      if (!clean) clean = 'Papito';
    }
    return { cleanName: clean, isSecret };
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Añadir nombre a la lista de invitados precreados
  const handleAddPreName = () => {
    const trimmed = newPreName.trim();
    if (trimmed && !precreatedNames.includes(trimmed)) {
      setPrecreatedNames([...precreatedNames, trimmed]);
      setNewPreName('');
    }
  };

  const handleRemovePreName = (nameToRemove) => {
    setPrecreatedNames(precreatedNames.filter(n => n !== nameToRemove));
  };

  // 1. CREAR SALA
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!rawInputName.trim()) {
      setErrorMsg('Por favor poné tu nombre.');
      return;
    }

    const { cleanName, isSecret } = processName(rawInputName);
    localStorage.setItem('onfire_raw_name', rawInputName);
    localStorage.setItem('onfire_player_name', cleanName);
    setDisplayName(cleanName);

    setLoading(true);
    setErrorMsg('');

    try {
      const newRoomCode = generateRoomCode();
      const roomRef = doc(db, 'rooms', newRoomCode);

      const initialPlayers = [
        {
          id: playerId,
          name: cleanName,
          avatar: selectedAvatar || '🔥',
          isClaimed: true,
          claimedBy: playerId,
          joinedAt: new Date().toISOString()
        }
      ];

      precreatedNames.forEach((name, idx) => {
        initialPlayers.push({
          id: `slot_${Date.now()}_${idx}`,
          name: name,
          avatar: AVATARS[(idx + 1) % AVATARS.length],
          isClaimed: false,
          claimedBy: null
        });
      });

      const initialData = {
        createdAt: new Date().toISOString(),
        hostId: playerId,
        isSpinning: false,
        currentResult: null,
        currentPair: null,
        currentChallenge: null,
        nextTarget: null,
        nextPair: null,
        spiceLevel: 1,
        roundCount: 0,
        challenges: ALL_CHALLENGES,
        players: initialPlayers
      };

      await setDoc(roomRef, initialData);
      
      localStorage.setItem('onfire_active_session', JSON.stringify({
        roomCode: newRoomCode,
        rawName: rawInputName,
        playerName: cleanName,
        playerAvatar: selectedAvatar || '🔥',
        hostName: cleanName,
        isHost: true,
        canCheat: isSecret,
        timestamp: Date.now()
      }));

      setCurrentRoom(newRoomCode);
      setIsHost(true);
      setCanCheat(isSecret);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error conectando con Firebase.');
    } finally {
      setLoading(false);
    }
  };

  // Función reutilizable para consultar sala
  const checkRoomByCode = async (codeToSearch) => {
    const code = codeToSearch.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Ingresá el código de 5 letras de la sala.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setErrorMsg('La sala no existe o le pifiaste al código.');
        setLoading(false);
        return;
      }

      const data = roomSnap.data();
      setAllRoomPlayers(data.players || []);
      setSelectedMergeSlot(null);
      setStepJoin('join_name');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al buscar la sala.');
    } finally {
      setLoading(false);
    }
  };

  // 2. BUSCAR SALA PARA UNIRSE
  const handleCheckRoom = async (e) => {
    e.preventDefault();
    await checkRoomByCode(roomCodeInput);
  };

  // Avanzar del Paso 1 (Nombre) al Paso 2 (Identidad/Merge) o entrar directo
  const handleNextFromJoinName = (e) => {
    e.preventDefault();
    if (!rawInputName.trim()) {
      setErrorMsg('Por favor poné tu nombre.');
      return;
    }

    const { cleanName } = processName(rawInputName);
    setErrorMsg('');

    // Buscar si hay coincidencia exacta de nombre en la lista de jugadores precargados
    const exactMatch = allRoomPlayers.find(
      p => p.name.trim().toLowerCase() === cleanName.trim().toLowerCase()
    );

    if (exactMatch) {
      setSelectedMergeSlot(exactMatch.name);
    }

    // Si hay miembros ya presentes en la sala, pasar al paso de elegir identidad/merge
    if (allRoomPlayers && allRoomPlayers.length > 0) {
      setStepJoin('join_merge');
    } else {
      // Si la sala no tiene slots precargados, unirse directamente
      handleClaimOrJoin(null);
    }
  };

  // 3. ELEGIR NOMBRE O INGRESAR UNO NUEVO (SIN BLOQUEOS NI DUPLICADOS)
  const handleClaimOrJoin = async (selectedSlotName = null) => {
    const finalRawName = selectedSlotName || rawInputName.trim();

    if (!finalRawName) {
      setErrorMsg('Elegí un nombre de la lista o escribí el tuyo.');
      return;
    }

    const { cleanName, isSecret } = processName(finalRawName);
    localStorage.setItem('onfire_raw_name', finalRawName);
    localStorage.setItem('onfire_player_name', cleanName);
    setDisplayName(cleanName);

    setLoading(true);
    setErrorMsg('');

    try {
      const code = roomCodeInput.trim().toUpperCase();
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setErrorMsg('La sala no existe.');
        setLoading(false);
        return;
      }

      const data = roomSnap.data();
      let updatedPlayers = [...(data.players || [])];

      if (selectedSlotName) {
        const slotIndex = updatedPlayers.findIndex(
          p => p.name.trim().toLowerCase() === selectedSlotName.trim().toLowerCase()
        );

        if (slotIndex !== -1) {
          // Reclamar el slot seleccionado
          updatedPlayers[slotIndex] = {
            ...updatedPlayers[slotIndex],
            id: playerId,
            name: selectedSlotName.trim(),
            avatar: selectedAvatar || updatedPlayers[slotIndex].avatar || '🔥',
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          };
          // Limpiar cualquier otro slot residual que tuviera este mismo playerId
          updatedPlayers = updatedPlayers.filter((p, idx) => idx === slotIndex || p.id !== playerId);
        } else {
          // Si no existía, remover posible duplicado y agregar nuevo
          updatedPlayers = updatedPlayers.filter(p => p.id !== playerId);
          updatedPlayers.push({
            id: playerId,
            name: cleanName,
            avatar: selectedAvatar || '🔥',
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          });
        }
      } else {
        const existingIndex = updatedPlayers.findIndex(
          p => p.name.trim().toLowerCase() === cleanName.trim().toLowerCase()
        );

        if (existingIndex !== -1) {
          updatedPlayers[existingIndex] = {
            ...updatedPlayers[existingIndex],
            id: playerId,
            name: cleanName,
            avatar: selectedAvatar || updatedPlayers[existingIndex].avatar || '🔥',
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          };
          updatedPlayers = updatedPlayers.filter((p, idx) => idx === existingIndex || p.id !== playerId);
        } else {
          updatedPlayers = updatedPlayers.filter(p => p.id !== playerId);
          updatedPlayers.push({
            id: playerId,
            name: cleanName,
            avatar: selectedAvatar || '🔥',
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          });
        }
      }

      await updateDoc(roomRef, { players: updatedPlayers });

      const hostPlayer = (data.players || []).find(p => p.id === data.hostId);
      const hostName = hostPlayer ? hostPlayer.name : 'el Creador';
      localStorage.setItem('onfire_active_session', JSON.stringify({
        roomCode: code,
        rawName: finalRawName,
        playerName: cleanName,
        hostName: hostName,
        isHost: data.hostId === playerId,
        canCheat: isSecret,
        timestamp: Date.now()
      }));

      setCurrentRoom(code);
      setIsHost(data.hostId === playerId);
      setCanCheat(isSecret);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al entrar a la sala.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem('onfire_active_session');
    setReconnectPrompt(null);
    setCurrentRoom(null);
    setIsHost(false);
    setCanCheat(false);
    setStepJoin('input_code');
    if (window.history.pushState) {
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  if (currentRoom) {
    return (
      <>
        {/* OVERLAY DE AUTO-ACTUALIZACIÓN */}
        <AnimatePresence>
          {updatingVersion && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto p-4 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.8)] border border-white/20 text-white flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 animate-spin text-amber-300" />
                <div>
                  <p className="font-black text-sm">¡Nueva versión {updatingVersion} detectada!</p>
                  <p className="text-xs text-white/90">Actualizando automáticamente...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Room
          roomId={currentRoom}
          playerId={playerId}
          playerName={displayName || rawInputName}
          isHost={isHost}
          canCheat={canCheat}
          onLeave={handleLeaveRoom}
          appVersion={APP_VERSION}
          onInstallApp={handleInstallApp}
          isInstalled={isInstalled}
        />
      </>
    );
  }

  const { isSecret } = processName(rawInputName);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      
      {/* ========================================================== */}
      {/* ANIMACIÓN DE FONDO: INCENDIO VIBRANTE QUE APARECE Y DESAPARECE */}
      {/* ========================================================== */}
      
      {/* Resplandor principal de fuego pulsante */}
      <motion.div
        animate={{
          opacity: [0.2, 0.75, 0.35, 0.85, 0.2],
          scale: [0.95, 1.2, 1.05, 1.25, 0.95],
          y: [0, -30, -10, -40, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut"
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[850px] h-[450px] bg-gradient-to-t from-rose-600/40 via-orange-500/25 to-transparent rounded-full blur-[100px] pointer-events-none"
      />

      {/* Llamaradas secundarias izquierda/derecha */}
      <motion.div
        animate={{
          opacity: [0.15, 0.6, 0.2, 0.7, 0.15],
          scale: [0.9, 1.15, 1, 1.2, 0.9]
        }}
        transition={{
          repeat: Infinity,
          duration: 4.8,
          ease: "easeInOut",
          delay: 0.7
        }}
        className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-amber-600/30 via-rose-600/25 to-transparent rounded-full blur-[90px] pointer-events-none"
      />

      <motion.div
        animate={{
          opacity: [0.15, 0.65, 0.25, 0.8, 0.15],
          scale: [0.9, 1.2, 0.95, 1.25, 0.9]
        }}
        transition={{
          repeat: Infinity,
          duration: 5.2,
          ease: "easeInOut",
          delay: 1.4
        }}
        className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-purple-600/30 via-pink-600/25 to-transparent rounded-full blur-[90px] pointer-events-none"
      />

      {/* Luz superior misteriosa */}
      <motion.div
        animate={{
          opacity: [0.1, 0.35, 0.1]
        }}
        transition={{
          repeat: Infinity,
          duration: 7,
          ease: "easeInOut"
        }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-rose-600/15 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Botones Flotantes Superiores en Welcome */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallApp}
            className="p-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl shadow-lg flex items-center gap-1.5 text-xs font-black backdrop-blur-md active:scale-95 transition"
            title="Instalar OnFire como App"
          >
            <Download className="w-4 h-4" />
            <span className="inline">Instalar App</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-2.5 bg-slate-900/90 border border-slate-800 hover:border-slate-600 rounded-2xl text-slate-300 hover:text-white transition shadow-lg flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md active:scale-95"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
        </button>
      </div>

      {/* Modal Instructivo de Instalación PWA (Android / iPhone) */}
      <AnimatePresence>
        {showInstallModal && (
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
              className="bg-slate-900 border-2 border-rose-500/50 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4 text-center flex flex-col items-center relative overflow-hidden"
            >
              <div className="p-3 bg-gradient-to-tr from-rose-600 to-pink-600 rounded-2xl text-white shadow-lg">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Instalar OnFire en tu Celular</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Jugá en pantalla completa sin barras del navegador y con carga instantánea.
                </p>
              </div>

              <div className="w-full space-y-3 text-left">
                {/* Paso a paso iPhone */}
                <div className="p-3.5 bg-slate-800/90 border border-slate-700/70 rounded-2xl">
                  <p className="text-xs font-black text-pink-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    🍏 En iPhone / iPad (Safari):
                  </p>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Tocá el botón <strong>Compartir (⎋)</strong> abajo en Safari.</li>
                    <li>Buscá y seleccioná <strong>"Agregar a Inicio" ➕</strong>.</li>
                    <li>Tocá <strong>"Agregar"</strong> arriba a la derecha.</li>
                  </ol>
                </div>

                {/* Paso a paso Android */}
                <div className="p-3.5 bg-slate-800/90 border border-slate-700/70 rounded-2xl">
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    🤖 En Android (Chrome / Brave):
                  </p>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Tocá los <strong>tres puntitos (⋮)</strong> arriba a la derecha.</li>
                    <li>Seleccioná <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                  </ol>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black rounded-xl text-sm transition shadow-lg active:scale-95"
              >
                ¡Listo, entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Instructivo iPhone Safari (desde botón fullscreen) */}
      <AnimatePresence>
        {showIOSTip && (
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
                type="button"
                onClick={() => setShowIOSTip(false)}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl text-sm transition shadow-lg active:scale-95"
              >
                ¡Entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENEDOR CENTRAL GRANDE Y ESPACIOSO */}
      <div className="w-full max-w-lg z-10 py-4">
        
        {/* HEADER LOGO GRANDE Y SALTARÍN */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 30px rgba(244,63,94,0.4)",
                "0 0 60px rgba(244,63,94,0.8)",
                "0 0 30px rgba(244,63,94,0.4)"
              ]
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut"
            }}
            className="inline-flex items-center justify-center p-5 sm:p-6 rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 border-2 border-rose-400/40 mb-4 cursor-pointer"
          >
            <Flame className="w-14 h-14 sm:w-16 sm:h-16 text-white fill-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
          </motion.div>

          <div className="flex flex-col items-center">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]">
              OnFire 🔥
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono font-bold text-rose-400 shadow-md mt-2">
              Versión {APP_VERSION}
            </span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base mt-2 font-semibold tracking-wide">
            Juego de Ruleta y +500 Retos Picantes en Vivo
          </p>
        </div>

        {/* ========================================================== */}
        {/* TARJETA DE RECONEXIÓN A SALA ANTERIOR                     */}
        {/* ========================================================== */}
        <AnimatePresence>
          {reconnectPrompt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              className="w-full mb-5 p-5 bg-gradient-to-br from-rose-950/90 via-slate-900 to-purple-950/90 border-2 border-rose-500/70 rounded-3xl shadow-[0_0_35px_rgba(244,63,94,0.35)] backdrop-blur-xl relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl text-rose-400 flex-shrink-0">
                  <Flame className="w-6 h-6 fill-rose-500 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    ⚡ Sesión previa abierta
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                    ¿Reconectarte a la sala de <span className="text-rose-400 font-extrabold underline">{reconnectPrompt.hostName}</span>?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Sala: <strong className="font-mono text-pink-300">{reconnectPrompt.roomCode}</strong> · Entrar como <strong className="text-white">{reconnectPrompt.playerName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={handleAcceptReconnect}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Sí, volver a entrar
                </button>
                <button
                  type="button"
                  onClick={handleDismissReconnect}
                  className="px-4 py-3 bg-slate-800/90 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold rounded-xl border border-slate-700/60 transition active:scale-95"
                >
                  Descartar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TARJETA PRINCIPAL CON PADDING Y TAMAÑO GENEROSO */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800/90 backdrop-blur-xl">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-sm font-semibold flex items-center gap-2.5 shadow-md"
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* VISTA 1: CREAR O BUSCAR SALA (PANTALLA DE INICIO)          */}
          {/* ========================================================== */}
          {stepJoin === 'input_code' ? (
            <div className="space-y-6">
              {/* Tu Nombre con Selector de Avatar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-200">
                    Tu Nombre o Apodo
                  </label>
                  {isSecret && (
                    <span className="text-xs font-black text-rose-400 flex items-center gap-1 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/40 animate-pulse">
                      <Lock className="w-3.5 h-3.5" /> Modo Trampa Activo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-br from-rose-500/30 to-purple-600/30 border-2 border-rose-500/60 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0">
                    <span>{selectedAvatar}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={25}
                    placeholder="Ej: Fran, Sofi, Lucas..."
                    value={rawInputName}
                    onChange={(e) => setRawInputName(e.target.value)}
                    className={`flex-1 px-4 py-3.5 bg-slate-900/90 border rounded-2xl text-white placeholder-slate-500 focus:outline-none transition text-base font-semibold ${
                      isSecret 
                        ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
                        : 'border-slate-700 focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* Selector de Ícono / Emoji */}
              <AvatarPicker 
                selectedAvatar={selectedAvatar} 
                onSelectAvatar={handleSelectAvatar} 
                label="Elegí tu ícono de ruleta:" 
              />

              {/* SECCIÓN OPCIONAL: PRECARGAR JUGADORES */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Precargar Jugadores de la Previa (Opcional):</span>
                  <span className="text-xs text-purple-400 font-bold">{precreatedNames.length} sumados</span>
                </label>
                
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Nombre de tu amigo/a..."
                    value={newPreName}
                    onChange={(e) => setNewPreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPreName())}
                    className="flex-1 px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreName}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-4 h-4" /> Sumar
                  </button>
                </div>

                {precreatedNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2.5 bg-slate-900/50 rounded-2xl border border-slate-800">
                    {precreatedNames.map((name, idx) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl shadow-sm"
                      >
                        <span>{AVATARS[(idx + 1) % AVATARS.length]}</span>
                        {name}
                        <button
                          type="button"
                          onClick={() => handleRemovePreName(name)}
                          className="hover:text-rose-400 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón Crear Sala */}
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-4 px-5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:via-pink-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2.5 text-base tracking-wide disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                {loading ? 'Creando Sala...' : 'Crear Sala'}
              </button>

              {/* Separador */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-widest">o unite a una sala</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Input Código para Unirse */}
              <div className="flex gap-2.5">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="CÓDIGO"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-1/2 px-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-white placeholder-slate-500 uppercase tracking-widest font-mono text-center text-base font-black focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  onClick={handleCheckRoom}
                  disabled={loading}
                  className="w-1/2 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-base disabled:opacity-50"
                >
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  {loading ? 'Buscando...' : 'Unite'}
                </button>
              </div>
            </div>
          ) : stepJoin === 'join_name' ? (
            /* ========================================================== */
            /* WIZARD PASO 1: ¿CÓMO TE LLAMÁS? (LANDING AMPLIO Y CLARO)   */
            /* ========================================================== */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                    <Flame className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Sala:</span>
                    <p className="font-mono text-sm sm:text-base font-black text-rose-400 tracking-wider">
                      {roomCodeInput}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white shadow-md">
                    1. Tu Nombre
                  </span>
                  <span className="text-slate-600">➜</span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-500">
                    2. Identidad
                  </span>
                </div>
              </div>

              <div className="text-center space-y-1.5 py-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ¡Te sumaste a la Previa! 👋
                </h2>
                <p className="text-sm text-slate-300">
                  Ingresá tu nombre y elegí tu ícono para la ruleta:
                </p>
              </div>

              <form onSubmit={handleNextFromJoinName} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                      Tu Nombre o Apodo:
                    </label>
                    {isSecret && (
                      <span className="text-xs font-black text-rose-400 flex items-center gap-1 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/40 animate-pulse">
                        <Lock className="w-3.5 h-3.5" /> Modo Trampa Activo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-500/30 to-purple-600/30 border-2 border-rose-500/60 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                      <span>{selectedAvatar}</span>
                    </div>
                    <input
                      type="text"
                      maxLength={25}
                      autoFocus
                      placeholder="Ej: Fran, Sofi, Lucas, Nico..."
                      value={rawInputName}
                      onChange={(e) => {
                        setRawInputName(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`flex-1 px-5 py-4 bg-slate-900/90 border rounded-2xl text-white placeholder-slate-500 focus:outline-none transition text-lg sm:text-xl font-bold ${
                        isSecret
                          ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                          : 'border-slate-700 focus:border-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Selector de Ícono */}
                <AvatarPicker
                  selectedAvatar={selectedAvatar}
                  onSelectAvatar={handleSelectAvatar}
                  label="Elegí tu ícono o emoji:"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStepJoin('input_code');
                      setErrorMsg('');
                    }}
                    className="px-4 sm:px-5 py-3.5 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-2xl border border-slate-700/60 text-sm flex items-center gap-1.5 transition active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>

                  <button
                    type="submit"
                    disabled={!rawInputName.trim() || loading}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 disabled:opacity-50 text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ========================================================== */
            /* WIZARD PASO 2: MERGEARSE O ENTRAR COMO NUEVO               */
            /* ========================================================== */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                    <Flame className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Sala:</span>
                    <p className="font-mono text-sm sm:text-base font-black text-rose-400 tracking-wider">
                      {roomCodeInput}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    1. Tu Nombre ✓
                  </span>
                  <span className="text-slate-600">➜</span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white shadow-md">
                    2. Identidad
                  </span>
                </div>
              </div>

              <div className="text-center space-y-1 py-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ¡Hola, {selectedAvatar} {processName(rawInputName).cleanName}! 🎉
                </h2>
                <p className="text-sm text-slate-300">
                  ¿Querés entrar como jugador nuevo o sumarte en el lugar de alguien?
                </p>
              </div>

              <div className="space-y-3">
                {/* Opción 1: Entrar como Nuevo Jugador */}
                <div
                  onClick={() => setSelectedMergeSlot(null)}
                  className={`p-4 sm:p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedMergeSlot === null
                      ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-1 ring-rose-500'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center ${selectedMergeSlot === null ? 'bg-rose-500 text-white' : 'bg-slate-800'}`}>
                        <span>{selectedAvatar}</span>
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                          Entrar como "{selectedAvatar} {processName(rawInputName).cleanName}"
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                            Nuevo
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Se agregará tu casillero individual a la ruleta.
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedMergeSlot === null ? 'border-rose-500 bg-rose-500' : 'border-slate-700'
                    }`}>
                      {selectedMergeSlot === null && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </div>

                {/* Opción 2: Mergearse con un jugador preexistente */}
                {allRoomPlayers.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-400" />
                      O mergearte / unirte como un miembro ya creado:
                    </label>

                    <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                      {allRoomPlayers.map((player) => {
                        const isSelected = selectedMergeSlot === player.name;
                        const isMatch = player.name.trim().toLowerCase() === processName(rawInputName).cleanName.toLowerCase();
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => setSelectedMergeSlot(player.name)}
                            className={`p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-purple-600/25 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500 text-white'
                                : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-base sm:text-lg leading-none">{player.avatar || '🔥'}</span>
                                <span className="font-bold text-sm sm:text-base truncate">{player.name}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 ml-1" />}
                            </div>
                            {isMatch && (
                              <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest mt-1">
                                ✨ Coincide tu nombre
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setStepJoin('join_name');
                    setErrorMsg('');
                  }}
                  className="px-4 sm:px-5 py-3.5 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-2xl border border-slate-700/60 text-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>

                <button
                  type="button"
                  onClick={() => handleClaimOrJoin(selectedMergeSlot)}
                  disabled={loading}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Entrando a la sala...</span>
                  ) : (
                    <>
                      <span>{selectedMergeSlot ? `Unirme como ${selectedMergeSlot}` : '¡Entrar a la Sala! 🔥'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Versión */}
        <div className="text-center mt-6 text-xs text-slate-400 font-medium flex flex-col items-center gap-1.5">
          {!isInstalled ? (
            <button
              type="button"
              onClick={handleInstallApp}
              className="text-pink-400 hover:text-pink-300 font-bold underline underline-offset-4 flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" /> Instalalo como App (PWA) en tu celular 📱
            </button>
          ) : (
            <p className="text-emerald-400 font-semibold flex items-center gap-1">
              ✓ App instalada correctamente 📱
            </p>
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            {APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}
