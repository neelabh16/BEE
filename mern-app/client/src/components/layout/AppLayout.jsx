import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ParticleField from './ParticleField';
import CommandPalette from './CommandPalette';

export default function AppLayout({ children }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="dv-app-shell">
      {/* Background Aurora Mesh */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* Floating Neon Particle Dust */}
      <ParticleField />

      {/* Floating Pill Dock Navigation */}
      <Navbar onOpenCmdk={() => setCmdkOpen(true)} />

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdkOpen} onClose={() => setCmdkOpen(false)} />

      {/* Main Full-Width Page View */}
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        {children}
      </main>

      {/* DevVerse Footer */}
      <Footer />
    </div>
  );
}
