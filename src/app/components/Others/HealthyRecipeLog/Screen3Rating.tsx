import { useState } from "react";
import { Star, Camera } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const TAGS = ["High Protein", "Low Sugar", "Low Carb", "High Fibre", "Quick & Easy", "Kid Friendly", "Weight Loss", "Energy Boosting"];

interface Props {
  data: Record<string, any>;
  onNext: (d: Record<string, any>) => void;
}

const Screen3Rating = ({ data, onNext }: Props) => {
    const { t } = useTranslation('HealthyRecipeLog');
  const [rating, setRating] = useState<number>(data.rating || 0);
  const [healthiness, setHealthiness] = useState(data.healthiness || "");
  const [tags, setTags] = useState<string[]>(data.tags || []);
  const [photo, setPhoto] = useState<string | undefined>(data.photo);

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = rating > 0 && healthiness;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-4 block uppercase tracking-wider">{t('how_tasty_was_it')}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button 
                  key={i} 
                  onClick={() => setRating(i)} 
                  className="p-2 transition-all hover:scale-110 active:scale-90"
                >
                  <Star className={`w-12 h-12 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-4 block uppercase tracking-wider">{t('how_healthy_do_you_think_it_is')}</label>
            <Select value={healthiness} onValueChange={setHealthiness}>
              <SelectTrigger className="h-[60px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg">
                <SelectValue placeholder={t('select_health_level')} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Very Healthy">{t('very_healthy')}</SelectItem>
                <SelectItem value="Fairly Healthy">{t('fairly_healthy')}</SelectItem>
                <SelectItem value="Treat but Worth It">{t('treat_but_worth_it')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-4 block uppercase tracking-wider">{t('add_a_photo_optional')}</label>
            <div className="flex gap-4 items-center">
              <label className="cursor-pointer flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden group">
                {photo ? (
                  <img src={photo} alt={t('recipe')} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest group-hover:text-emerald-500">{t('upload')}</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
              <div className="flex-1">
                <p className="text-sm text-gray-500 italic">{t('we_eat_with_our_eyes_first_snap_a_photo_')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-4 block uppercase tracking-wider">{t('tag_your_recipe')}</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t, idx) => (
                <motion.button
                  key={t}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleTag(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    tags.includes(t) 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                      : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => onNext({ rating, healthiness, tags, photo })} 
            disabled={!isFormValid}
            className="w-full py-8 text-xl font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {t('continue')}
                                </Button>
        </div>
      </div>
    </div>
  );
};

export default Screen3Rating;


