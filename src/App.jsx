import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import Room from './components/Room';
import { ALL_CHALLENGES } from './data/challenges';
import { 
  Flame, 
  Sparkles, 
  UserPlus, 
  ShieldAlert, 
  Lock, 
  Plus, 
  X, 
  ArrowRight,
  CheckCircle2
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

  // Nombres precargados por el anfitrión
  const [precreatedNames, setPrecreatedNames] = useState([]);
  const [newPreName, setNewPreName] = useState('');

  // Estado al unirse
  const [availableSlots, setAvailableSlots] = useState([]);
  const [stepJoin, setStepJoin] = useState('input_code'); // 'input_code' | 'choose_name'
  const [roomDataCache, setRoomDataCache] = useState(null);

  // Detectar si el nombre tiene la palabra clave "Papito"
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
        spiceLevel: 1, // Nivel 1: Suave/Previa, Nivel 2: Caliente, Nivel 3: Fuego
        roundCount: 0,
        challenges: ALL_CHALLENGES,
        players: initialPlayers
      };

      await setDoc(roomRef, initialData);
      setCurrentRoom(newRoomCode);
      setIsHost(true);
      setCanCheat(isSecret); // Solo si empieza con "Papito"
    } catch (err) {
      console.error(err);
      setErrorMsg('Error conectando con Firebase.');
    } finally {
      setLoading(false);
    }
  };

  // 2. BUSCAR SALA PARA UNIRSE
  const handleCheckRoom = async (e) => {
    e.preventDefault();
    const code = roomCodeInput.trim().toUpperCase();
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

      const existingPlayer = data.players?.find(p => p.claimedBy === playerId || p.id === playerId);
      if (existingPlayer) {
        const { isSecret } = processName(rawInputName || existingPlayer.name);
        setDisplayName(existingPlayer.name);
        setCurrentRoom(code);
        setIsHost(data.hostId === playerId);
        setCanCheat(isSecret);
        setLoading(false);
        return;
      }

      const unclaimed = data.players?.filter(p => !p.isClaimed) || [];
      setAvailableSlots(unclaimed);
      setStepJoin('choose_name');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al buscar la sala.');
    } finally {
      setLoading(false);
    }
  };

  // 3. ELEGIR NOMBRE DISPONIBLE O INGRESAR UNO NUEVO
  const handleClaimOrJoin = async (selectedSlotName = null) => {
    const finalName = selectedSlotName || rawInputName.trim();

    if (!finalName) {
      setErrorMsg('Elegí un nombre o escribí el tuyo.');
      return;
    }

    const { cleanName, isSecret } = processName(rawInputName || finalName);
    localStorage.setItem('onfire_raw_name', rawInputName || finalName);
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
        const slotIndex = updatedPlayers.findIndex(p => p.name === selectedSlotName && !p.isClaimed);
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
        updatedPlayers.push({
          id: playerId,
          name: cleanName,
          isClaimed: true,
          claimedBy: playerId,
          joinedAt: new Date().toISOString()
        });
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
  };

  if (currentRoom) {
    return (
      <Room
        roomId={currentRoom}
        playerId={playerId}
        playerName={displayName || rawInputName}
        isHost={isHost}
        canCheat={canCheat}
        onLeave={handleLeaveRoom}
      />
    );
  }

  const { isSecret } = processName(rawInputName);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 shadow-[0_0_35px_rgba(244,63,94,0.5)] mb-3 animate-bounce">
            <Flame className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
            OnFire 🔥
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium tracking-wide">
            Juego de Ruleta y +500 Retos Picantes en Tiempo Real
          </p>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-800/80">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VISTA 1: CREAR O UNIRSE A SALA */}
          {stepJoin === 'input_code' ? (
            <div className="space-y-5">
              {/* Tu Nombre */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Tu Nombre o Apodo
                  </label>
                  {isSecret && (
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                      <Lock className="w-3 h-3" /> Modo Trampa Activo
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="Ej: Fran, Sofi..."
                  value={rawInputName}
                  onChange={(e) => setRawInputName(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-900/90 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition text-sm font-medium ${
                    isSecret 
                      ? 'border-rose-500/60 ring-1 ring-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]' 
                      : 'border-slate-700/70 focus:border-rose-500'
                  }`}
                />
              </div>

              {/* SECCIÓN OPCIONAL: PRECARGAR JUGADORES */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Precargar Jugadores de la Previa (Opcional):</span>
                  <span className="text-[10px] text-slate-500">{precreatedNames.length} sumados</span>
                </label>
                
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Nombre de tu amigo/a..."
                    value={newPreName}
                    onChange={(e) => setNewPreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPreName())}
                    className="flex-1 px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreName}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Sumar
                  </button>
                </div>

                {precreatedNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-900/40 rounded-xl border border-slate-800/50">
                    {precreatedNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs rounded-lg font-medium"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => handleRemovePreName(name)}
                          className="hover:text-rose-400 ml-0.5"
                        >
                          <X className="w-3 h-3" />
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
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Creando Sala...' : 'Crear Sala'}
              </button>

              {/* Separador */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs font-medium text-slate-500 uppercase">o unite a una sala</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Input Código para Unirse */}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="CÓDIGO"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-1/2 px-3 py-3 bg-slate-900/90 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 uppercase tracking-widest font-mono text-center font-bold focus:outline-none focus:border-purple-500 transition text-sm"
                />
                <button
                  onClick={handleCheckRoom}
                  disabled={loading}
                  className="w-1/2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  {loading ? 'Buscando...' : 'Unite'}
                </button>
              </div>
            </div>
          ) : (
            /* VISTA 2: ELEGIR NOMBRE DISPONIBLE O ESCRIBIR */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Sala {roomCodeInput}</h3>
                  <p className="text-xs text-slate-400">Elegí quién sos o escribí tu nombre:</p>
                </div>
                <button
                  onClick={() => setStepJoin('input_code')}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cambiar sala
                </button>
              </div>

              {/* Nombres disponibles precargados */}
              {availableSlots.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">
                    Nombres Disponibles (1 toque):
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleClaimOrJoin(slot.name)}
                        className="p-3 bg-gradient-to-r from-purple-900/40 to-slate-900 border border-purple-500/40 hover:border-pink-500 rounded-xl text-sm font-bold text-purple-200 hover:text-white transition flex items-center justify-between group shadow-sm active:scale-95"
                      >
                        <span className="truncate">{slot.name}</span>
                        <CheckCircle2 className="w-4 h-4 text-pink-400 opacity-60 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                  No hay nombres precargados disponibles. Escribí tu nombre abajo:
                </div>
              )}

              {/* Escribir nombre manual */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  O escribí otro nombre:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="Tu nombre..."
                    value={rawInputName}
                    onChange={(e) => setRawInputName(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleClaimOrJoin(null)}
                    disabled={!rawInputName.trim() || loading}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition"
                  >
                    Entrar <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>Jugalo en pantalla completa o instalalo como App (PWA) 📱</p>
        </div>
      </div>
    </div>
  );
}
