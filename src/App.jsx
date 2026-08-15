import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import Room from './components/Room';
import { Flame, Sparkles, UserPlus, Play, KeyRound, ShieldAlert } from 'lucide-react';

// Generador de ID único para el jugador en LocalStorage
const getOrCreatePlayerId = () => {
  let pid = localStorage.getItem('onfire_player_id');
  if (!pid) {
    pid = 'p_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('onfire_player_id', pid);
  }
  return pid;
};

// Retos por defecto picantes y divertidos
const DEFAULT_CHALLENGES = [
  { id: 1, tipo: "verdad", texto: "¿Quién de los presentes te parece más atractivo/a y por qué?" },
  { id: 2, tipo: "reto", texto: "Dale un beso suave en el cuello o la mejilla a la persona elegida." },
  { id: 3, tipo: "verdad", texto: "¿Cuál ha sido tu fantasía erótica o sueño más atrevido?" },
  { id: 4, tipo: "reto", texto: "Haz un baile sensual de 20 segundos frente a quien elija el grupo." },
  { id: 5, tipo: "verdad", texto: "¿Qué es lo más prohibido o secreto que has hecho en una fiesta?" },
  { id: 6, tipo: "reto", texto: "Susúrrale al oído algo sucio o seductor al jugador de tu izquierda." },
  { id: 7, tipo: "reto", texto: "Quítate una prenda de ropa o toma un shot doble." },
  { id: 8, tipo: "verdad", texto: "¿Qué parte del cuerpo te excita más de la persona a tu derecha?" }
];

export default function App() {
  const [playerId] = useState(getOrCreatePlayerId);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('onfire_player_name') || '');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Persistir nombre
  useEffect(() => {
    if (playerName) {
      localStorage.setItem('onfire_player_name', playerName);
    }
  }, [playerName]);

  // Generar código de sala de 5 letras
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Crear Sala
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre o apodo.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const newRoomCode = generateRoomCode();
      const roomRef = doc(db, 'rooms', newRoomCode);

      const initialData = {
        createdAt: new Date().toISOString(),
        adminId: playerId,
        isSpinning: false,
        currentResult: null,
        currentPair: null,
        nextTarget: null,
        challenges: DEFAULT_CHALLENGES,
        currentChallenge: null,
        players: [
          {
            id: playerId,
            name: playerName.trim(),
            isAdmin: true,
            joinedAt: new Date().toISOString()
          }
        ]
      };

      await setDoc(roomRef, initialData);
      setCurrentRoom(newRoomCode);
      setIsAdmin(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error conectando a Firebase. Verifica la configuración en firebase.js.');
    } finally {
      setLoading(false);
    }
  };

  // Unirse a Sala
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre o apodo.');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMsg('Ingresa el código de la sala.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const code = roomCodeInput.trim().toUpperCase();
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setErrorMsg('La sala no existe o el código es incorrecto.');
        setLoading(false);
        return;
      }

      const data = roomSnap.data();
      const isAlreadyIn = data.players?.some(p => p.id === playerId);
      const isRoomAdmin = data.adminId === playerId;

      if (!isAlreadyIn) {
        await updateDoc(roomRef, {
          players: arrayUnion({
            id: playerId,
            name: playerName.trim(),
            isAdmin: isRoomAdmin,
            joinedAt: new Date().toISOString()
          })
        });
      }

      setCurrentRoom(code);
      setIsAdmin(isRoomAdmin);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al unirse. Revisa tu conexión a Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setIsAdmin(false);
  };

  if (currentRoom) {
    return (
      <Room
        roomId={currentRoom}
        playerId={playerId}
        playerName={playerName}
        isAdmin={isAdmin}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo ambientadas */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 shadow-[0_0_35px_rgba(244,63,94,0.5)] mb-4 animate-bounce">
            <Flame className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
            OnFire 🔥
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">
            Juego de Ruleta y Retos Picantes Multijugador
          </p>
        </div>

        {/* Formulario Principal */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800/80">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tu Nombre o Apodo
              </label>
              <input
                type="text"
                maxLength={20}
                placeholder="Ej: Alex, Sam, Bebé..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Crear Sala */}
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Creando...' : 'Crear Nueva Sala (Admin)'}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-medium text-slate-500 uppercase">o únete</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Unirse a Sala */}
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="CÓDIGO"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-1/2 px-3 py-3 bg-slate-900/90 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 uppercase tracking-widest font-mono text-center font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
              />
              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-1/2 py-3 px-4 bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>Disfrútalo en pantalla completa o instálalo como App (PWA) 📱</p>
        </div>
      </div>
    </div>
  );
}
