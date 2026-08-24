import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080914]">

      {/* ================================================= */}
      {/* BASE */}
      {/* ================================================= */}

      <div className="absolute inset-0 bg-[#080914]" />

      {/* ================================================= */}
      {/* LARGE INDIGO AURORA */}
      {/* ================================================= */}

      <motion.div
        animate={{
          x: [0, 180, -100, 0],
          y: [0, -80, 100, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -left-32
          -top-32
          h-[650px]
          w-[650px]
          rounded-full
          bg-indigo-500/25
          blur-[140px]
        "
      />

      {/* ================================================= */}
      {/* PURPLE AURORA */}
      {/* ================================================= */}

      <motion.div
        animate={{
          x: [0, -160, 100, 0],
          y: [0, 100, -80, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -right-40
          top-[15%]
          h-[700px]
          w-[700px]
          rounded-full
          bg-purple-500/20
          blur-[160px]
        "
      />

      {/* ================================================= */}
      {/* BLUE LIGHT */}
      {/* ================================================= */}

      <motion.div
        animate={{
          x: [-100, 100, -50, -100],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-[-300px]
          left-[35%]
          h-[650px]
          w-[800px]
          rounded-full
          bg-blue-500/15
          blur-[170px]
        "
      />

      {/* ================================================= */}
      {/* PINK / VIOLET HIGHLIGHT */}
      {/* ================================================= */}

      <motion.div
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -50, 60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          left-[35%]
          top-[20%]
          h-[350px]
          w-[350px]
          rounded-full
          bg-fuchsia-500/10
          blur-[130px]
        "
      />

      {/* ================================================= */}
      {/* PREMIUM GRID */}
      {/* ================================================= */}

      <div
        className="
          absolute
          inset-0
          opacity-[0.055]
          [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)]
          [background-size:70px_70px]
        "
      />

      {/* ================================================= */}
      {/* RADIAL LIGHT */}
      {/* ================================================= */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.12),transparent_45%)]
        "
      />

      {/* ================================================= */}
      {/* TOP LIGHT */}
      {/* ================================================= */}

      <div
        className="
          absolute
          left-1/2
          top-0
          h-[2px]
          w-[70%]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-indigo-400/50
          to-transparent
          blur-sm
        "
      />

      {/* ================================================= */}
      {/* PARTICLES */}
      {/* ================================================= */}

      <motion.div
        animate={{
          opacity: [0.15, 0.6, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="
          absolute
          left-[20%]
          top-[25%]
          h-1
          w-1
          rounded-full
          bg-indigo-300
          shadow-[0_0_12px_rgba(129,140,248,0.9)]
        "
      />

      <motion.div
        animate={{
          opacity: [0.1, 0.5, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
        className="
          absolute
          left-[70%]
          top-[30%]
          h-1
          w-1
          rounded-full
          bg-purple-300
          shadow-[0_0_12px_rgba(192,132,252,0.9)]
        "
      />

      <motion.div
        animate={{
          opacity: [0.1, 0.45, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
        }}
        className="
          absolute
          left-[55%]
          top-[70%]
          h-1
          w-1
          rounded-full
          bg-blue-300
          shadow-[0_0_12px_rgba(96,165,250,0.9)]
        "
      />

      {/* ================================================= */}
      {/* CINEMATIC VIGNETTE */}
      {/* ================================================= */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,4,12,0.5)_100%)]
        "
      />

    </div>
  );
}