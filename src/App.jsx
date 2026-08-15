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
  CheckCircle2, 
  UserCheck, 
  QrCode,
  Zap
} from 'lucide-react';

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
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [canCheat, setCanCheat] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingVersion, setUpdatingVersion] = useState(null);

  // Nombres precargados por el anfitrión
  const [precreatedNames, setPrecreatedNames] = useState([]);
  const [newPreName, setNewPreName] = useState('');

  // Lista de todos los jugadores de la sala para elegir en 1 toque
  const [allRoomPlayers, setAllRoomPlayers] = useState([]);
  const [stepJoin, setStepJoin] = useState('input_code'); // 'input_code' | 'choose_name'
  const [roomDataCache, setRoomDataCache] = useState(null);

  // Auto-Actualización obligatoria a la última versión
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await fetch(`./version.json?_t=${Date.now()}`, { cache: 'no-store' });
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
            }, 1200);
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
          isClaimed: true,
          claimedBy: playerId,
          joinedAt: new Date().toISOString()
        }
      ];

      precreatedNames.forEach((name, idx) => {
        initialPlayers.push({
          id: `slot_${Date.now()}_${idx}`,
          name: name,
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
      setRoomDataCache(data);

      setAllRoomPlayers(data.players || []);
      setStepJoin('choose_name');
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

  // 3. ELEGIR NOMBRE O INGRESAR UNO NUEVO (SIN BLOQUEOS)
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
        setErrorMsg('La sala ya no existe.');
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
          updatedPlayers[slotIndex] = {
            ...updatedPlayers[slotIndex],
            id: playerId,
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          };
        } else {
          updatedPlayers.push({
            id: playerId,
            name: cleanName,
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
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          };
        } else {
          updatedPlayers.push({
            id: playerId,
            name: cleanName,
            isClaimed: true,
            claimedBy: playerId,
            joinedAt: new Date().toISOString()
          });
        }
      }

      await updateDoc(roomRef, { players: updatedPlayers });

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

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]">
            OnFire 🔥
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 font-semibold tracking-wide">
            Juego de Ruleta y +500 Retos Picantes en Vivo
          </p>
        </div>

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

          {/* VISTA 1: CREAR O BUSCAR SALA */}
          {stepJoin === 'input_code' ? (
            <div className="space-y-6">
              {/* Tu Nombre */}
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
                <input
                  type="text"
                  maxLength={25}
                  placeholder="Ej: Fran, Sofi, Lucas..."
                  value={rawInputName}
                  onChange={(e) => setRawInputName(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-slate-900/90 border rounded-2xl text-white placeholder-slate-500 focus:outline-none transition text-base font-semibold ${
                    isSecret 
                      ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
                      : 'border-slate-700 focus:border-rose-500'
                  }`}
                />
              </div>

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
                    {precreatedNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl shadow-sm"
                      >
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
          ) : (
            /* ========================================================== */
            /* VISTA 2: ELECCIÓN DE IDENTIDAD GRANDE, CÓMODA Y VISUAL     */
            /* ========================================================== */
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header de la Selección */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-rose-500" /> ¿Quién sos en esta sala?
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">Sala:</span>
                    <span className="text-xs font-mono font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                      {roomCodeInput}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStepJoin('input_code')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 transition"
                >
                  Cambiar código
                </button>
              </div>

              {/* Botones de Nombres GRANDES (1 solo toque) */}
              {allRoomPlayers.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-pink-400 uppercase tracking-wider mb-3">
                    Tocá tu nombre para entrar de una:
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {allRoomPlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleClaimOrJoin(player.name)}
                        className="p-4 sm:p-4.5 bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 border-2 border-purple-500/40 hover:border-pink-500 hover:bg-purple-900/30 rounded-2xl text-base sm:text-lg font-black text-purple-200 hover:text-white transition flex items-center justify-between group shadow-lg active:scale-95 text-left"
                      >
                        <span className="truncate">{player.name}</span>
                        <CheckCircle2 className="w-5 h-5 text-pink-400 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-1.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Escribir nombre personalizado GRANDE */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">
                  {allRoomPlayers.length > 0 ? 'O escribí otro nombre acá:' : 'Escribí tu nombre acá:'}
                </label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="Tu nombre o apodo..."
                    value={rawInputName}
                    onChange={(e) => setRawInputName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleClaimOrJoin(null))}
                    className="flex-1 px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-base font-semibold focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleClaimOrJoin(null)}
                    disabled={!rawInputName.trim() || loading}
                    className="px-5 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white text-sm font-black rounded-2xl flex items-center gap-1.5 transition shadow-lg active:scale-95"
                  >
                    Entrar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Versión */}
        <div className="text-center mt-6 text-xs text-slate-400 font-medium flex flex-col items-center gap-1.5">
          <p>Instalalo como App (PWA) o jugalo en pantalla completa 📱</p>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            {APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}
