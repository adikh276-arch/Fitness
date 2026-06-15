import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";

const Screen1Welcome = ({ onStart }: { onStart: () => void }) => (
  <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-12">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="text-7xl mb-6"
    >
      🍳
    </motion.div>

    <motion.h1
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4"
    >
      Your Healthy Cookbook
    </motion.h1>

    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-gray-500 text-lg lg:text-xl mb-12 leading-relaxed"
    >
      Welcome to your Healthy Recipe Log! Every time you cook or discover a healthy meal you love, log it here. Over time you'll build your very own collection of go-to healthy recipes that actually taste good!
    </motion.p>

    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-sm"
    >
      <Button 
        onClick={onStart} 
        size="lg"
        className="w-full py-7 text-xl font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
      >
        Start Logging →
      </Button>
    </motion.div>
  </div>
);

export default Screen1Welcome;


