import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ParticleField() {
  const { motion } = useTheme();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (motion === 'off') {
      setParticles([]);
      return;
    }

    const count = typeof window !== 'undefined' && window.innerWidth < 700 ? 14 : 26;
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 3,
      left: Math.random() * 100,
      bottom: -10 - Math.random() * 20,
      duration: 14 + Math.random() * 16,
      delay: Math.random() * 10,
    }));

    setParticles(generated);
  }, [motion]);

  if (motion === 'off') return null;

  return (
    <div id="particle-field" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            bottom: `${p.bottom}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
