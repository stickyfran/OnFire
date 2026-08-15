import React from 'react';
import { Flame, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[OnFire ErrorBoundary] Error atrapado:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="p-6 sm:p-8 bg-slate-900 border-2 border-rose-500/60 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Flame className="w-9 h-9 fill-rose-500 animate-pulse" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">¡Ups! Algo se sobrecalentó 🔥</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                Hubo un inconveniente momentáneo con los efectos visuales. Podés recargar para seguir jugando en la misma sala.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <RefreshCw className="w-4 h-4" /> Recargar Previa
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
