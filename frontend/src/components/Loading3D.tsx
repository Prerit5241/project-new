"use client";
import React from "react";

export default function Loading3D() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <div className="loader-shell">
        <div className="loader-glow" />
        <div className="spinner-ring">
          <span className="spinner-dot" />
        </div>
        <div className="loader-content">
          <span className="loader-badge">CodeShelf</span>
          <p className="loader-caption">Preparing your experience</p>
        </div>
      </div>

      {/* ===== Scoped styles ===== */}
      <style jsx>{`
        .loader-shell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.75rem;
          padding: 3.5rem 4rem;
          border-radius: 2rem;
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 60%);
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.5);
          overflow: hidden;
        }

        .loader-glow {
          position: absolute;
          inset: 40% -40% -40% -40%;
          background: radial-gradient(circle at center, rgba(99, 102, 241, 0.35), transparent 70%);
          filter: blur(60px);
          opacity: 0.6;
          animation: glow 6s ease-in-out infinite;
        }

        .spinner-ring {
          position: relative;
          width: clamp(6rem, 12vw, 9rem);
          aspect-ratio: 1;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.08);
          display: grid;
          place-items: center;
        }

        .spinner-ring::before,
        .spinner-ring::after {
          content: "";
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: rgba(129, 140, 248, 0.9);
          filter: drop-shadow(0 0 12px rgba(129, 140, 248, 0.6));
          animation: spin 2.8s linear infinite;
        }

        .spinner-ring::after {
          inset: -28%;
          border-top-color: rgba(244, 114, 182, 0.9);
          animation-duration: 3.6s;
        }

        .spinner-dot {
          width: 1.3rem;
          height: 1.3rem;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, #f97316, #fb7185 85%);
          box-shadow: 0 0 6px rgba(249, 115, 22, 0.8);
          animation: pulse 1.4s ease-in-out infinite;
        }

        .loader-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .loader-badge {
          display: inline-flex;
          padding: 0.35rem 0.9rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(12px);
          font-size: 0.85rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .loader-caption {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: rgba(226, 232, 240, 0.8);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }

        @media (max-width: 640px) {
          .loader-shell {
            width: min(92vw, 22rem);
            padding: 2.75rem 1.75rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner-ring::before,
          .spinner-ring::after,
          .spinner-dot,
          .loader-glow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
