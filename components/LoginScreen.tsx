import React from 'react';
import { Button } from './ui/Button';
import { useAuth } from '../lib/auth-context';

export function LoginScreen() {
  const { signInWithGoogle, signInDev, loading } = useAuth();
  const enableDevLogin = (import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true') || (import.meta.env.MODE !== 'production');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              Royal Grid
            </h1>
            <p className="text-xl text-purple-200">Domination</p>
          </div>

          {/* Description */}
          <div className="text-center mb-8">
            <p className="text-white/80 text-sm leading-relaxed">
              A strategic multiplayer card game where you compete to dominate the grid.
              Place your cards wisely and outmaneuver your opponents!
            </p>
          </div>

          {/* Sign In Button */}
          <div className="space-y-4">
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>

            {enableDevLogin && (
              <Button
                onClick={signInDev}
                disabled={loading}
                className="w-full bg-gray-800 text-white hover:bg-gray-700 font-semibold py-3 rounded-xl shadow transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Temp user sign in'}
              </Button>
            )}

            <p className="text-xs text-white/60 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">2-4</div>
                <div className="text-xs text-white/60">Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">8×8</div>
                <div className="text-xs text-white/60">Grid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-xs text-white/60">Strategy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/40 text-xs">
            Multiplayer • Real-time • Competitive
          </p>
        </div>
      </div>
    </div>
  );
}
