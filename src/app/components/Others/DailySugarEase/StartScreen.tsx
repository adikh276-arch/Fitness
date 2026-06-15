import { motion } from "framer-motion";

interface StartScreenProps {
  onStart: () => void;
  onBack: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-7xl mb-6"
      >
        🍬
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4"
      >
        Track Your Daily Sugar Intake
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-lg lg:text-xl mb-12 leading-relaxed"
      >
        Most people eat 3x more sugar than they realize. Let's log what you ate today and see where you stand!
      </motion.p>

      <motion.button
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="px-12 py-5 rounded-2xl bg-rose-500 text-white font-bold text-xl shadow-xl shadow-rose-500/30 hover:bg-rose-600 transition-all"
      >
        Start Log
      </motion.button>
    </div>
  );
};

export default StartScreen;


