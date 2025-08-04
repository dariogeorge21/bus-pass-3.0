'use client';

import { motion } from 'framer-motion';
import { Bus } from 'lucide-react';

export function AnimatedBus() {
  return (
    <div className="flex justify-center items-center my-8">
      <motion.div
        className="relative"
        animate={{
          x: [0, 20, 0],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Bus className="w-24 h-24 text-blue-600" />
        <motion.div
          className="absolute -bottom-2 left-2 w-4 h-4 bg-gray-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-2 right-2 w-4 h-4 bg-gray-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
}