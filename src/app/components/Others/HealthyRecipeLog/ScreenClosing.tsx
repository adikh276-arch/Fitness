import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const ScreenClosing = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation('HealthyRecipeLog');
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 6000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto">
      <motion.span 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="text-8xl mb-8"
      >
        🌟
      </motion.span>
      
      <motion.h2 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-4xl font-black text-gray-900 mb-4"
      >
        {t('you_re_doing_amazing')}
                    </motion.h2>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-xl leading-relaxed mb-12 max-w-lg"
      >
        {t('one_recipe_at_a_time_you_re_building_a_h')}
                    </motion.p>
      
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-100 ease-linear shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm font-bold text-gray-400 mt-4 uppercase tracking-widest">{t('returning_to_menu')}</p>
      </motion.div>
    </div>
  );
};

export default ScreenClosing;


