import React from 'react';
import { motion } from 'motion/react';

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary Atmospheric Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 2 }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-nebula-purple/20 blur-[120px]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-nebula-cyan/10 blur-[100px]"
      />
      
      {/* Floating Particles/Orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            opacity: 0 
          }}
          animate={{ 
            x: [
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%'
            ],
            y: [
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%'
            ],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 20 + Math.random() * 10, 
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute w-32 h-32 rounded-full bg-nebula-purple/10 blur-[40px]"
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      <div className="absolute inset-0 bg-grid-slate-100/[0.03] bg-[bottom_1px_center] dark:bg-grid-slate-900/[0.05]" />
    </div>
  );
};

export const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  return (
    <motion.div
      animate={{ 
        y: [0, -15, 0],
        rotate: [0, 1, 0]
      }}
      transition={{ 
        duration: 5, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay 
      }}
    >
      {children}
    </motion.div>
  );
};
