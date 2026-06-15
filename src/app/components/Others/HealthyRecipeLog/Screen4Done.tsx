import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Screen4Done = ({ onDone }: { onDone: (reflection: string) => void }) => {
    const { t } = useTranslation('HealthyRecipeLog');
  const [reflection, setReflection] = useState("");

  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-10">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-7xl mb-6"
      >
        🎉
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl lg:text-4xl font-black text-gray-900 mb-6"
      >
        {t('almost_finished')}
                    </motion.h2>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full space-y-8"
      >
        <div className="text-left">
          <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wider">
            {t('who_would_you_recommend_this_recipe_to')}
                                </label>
          <Textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder={t('e_g_my_sister_would_love_this_perfect_fo')}
            className="rounded-3xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg min-h-[150px] p-6 resize-none"
          />
        </div>

        <p className="text-gray-500 text-lg leading-relaxed italic">
          {t('every_healthy_recipe_you_save_is_a_gift_')}
                          </p>

        <Button 
          onClick={() => onDone(reflection)} 
          className="w-full max-w-sm py-8 text-xl font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
        >
          {t('finish_save')}
                          </Button>
      </motion.div>
    </div>
  );
};

export default Screen4Done;


