'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We log to the console, but in a real SV environment this sends an event to Sentry/Datadog
    console.error('Global Error Trap:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-gray-50 flex items-center justify-center min-h-screen font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan Sistem</h2>
          <p className="text-gray-500 mb-6">
            Sistem kami mendeteksi kesalahan yang tidak terduga. Tim teknis telah diberitahu mengenai masalah ini.
          </p>
          <button
            type="button"
            onClick={reset}
            className="w-full bg-[#FFC107] text-[#111111] font-bold py-3 px-4 rounded-xl hover:bg-yellow-400 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
