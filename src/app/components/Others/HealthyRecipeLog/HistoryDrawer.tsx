import { Star } from "lucide-react";
import type { RecipeEntry } from "./HealthyRecipeLogExercise";
import { motion } from "framer-motion";

const HistoryDrawer = ({ entries }: { entries: RecipeEntry[]; onClose: () => void }) => (
  <div className="w-full">
    {entries.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl">
          📖
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No recipes yet</h3>
        <p className="text-gray-500">Your collection of healthy meals will appear here.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entries.map((e, idx) => (
          <motion.div 
            key={e.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col sm:flex-row h-full"
          >
            {e.photo ? (
              <div className="w-full sm:w-32 h-32 sm:h-auto overflow-hidden">
                <img src={e.photo} alt={e.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ) : (
              <div className="w-full sm:w-32 h-32 sm:h-auto bg-emerald-50 flex items-center justify-center text-3xl">
                🍲
              </div>
            )}
            
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">{e.name || "Untitled"}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{e.date}</span>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{e.mealType}</span>
                <span className="text-xs font-bold text-gray-400 italic">{e.time}</span>
              </div>

              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= e.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                ))}
              </div>

              {e.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {e.tags.map(t => (
                    <span key={t} className="text-[9px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-widest">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

export default HistoryDrawer;


