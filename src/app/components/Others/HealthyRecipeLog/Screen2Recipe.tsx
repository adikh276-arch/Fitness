import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useTranslation } from "react-i18next";

interface Props {
  data: Record<string, any>;
  onNext: (d: Record<string, any>) => void;
}

const Screen2Recipe = ({ data, onNext }: Props) => {
    const { t } = useTranslation('HealthyRecipeLog');
  const [name, setName] = useState(data.name || "");
  const [ingredients, setIngredients] = useState(data.ingredients || "");
  const [instructions, setInstructions] = useState(data.instructions || "");
  const [time, setTime] = useState(data.time || "");
  const [mealType, setMealType] = useState(data.mealType || "");

  const isFormValid = name && ingredients && instructions && time && mealType;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">{t('recipe_name')}</label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder={t('e_g_masala_oats_grilled_paneer_salad')} 
              className="py-6 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg"
            />
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">{t('main_ingredients')}</label>
            <Input 
              value={ingredients} 
              onChange={e => setIngredients(e.target.value)} 
              placeholder={t('e_g_oats_vegetables_olive_oil')} 
              className="py-6 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">{t('prep_time')}</label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="h-[60px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all">
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Under 15 mins">{t('under_15_mins')}</SelectItem>
                  <SelectItem value="15–30 mins">{t('15_30_mins')}</SelectItem>
                  <SelectItem value="30–60 mins">{t('30_60_mins')}</SelectItem>
                  <SelectItem value="Over 1 hour">{t('over_1_hour')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">{t('meal_type')}</label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="h-[60px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all">
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Breakfast">{t('breakfast')}</SelectItem>
                  <SelectItem value="Lunch">{t('lunch')}</SelectItem>
                  <SelectItem value="Dinner">{t('dinner')}</SelectItem>
                  <SelectItem value="Snack">{t('snack')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">{t('instructions')}</label>
            <Textarea 
              value={instructions} 
              onChange={e => setInstructions(e.target.value)} 
              placeholder={t('e_g_boiled_oats_added_saut_ed_vegetables')} 
              className="rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg min-h-[195px] resize-none"
            />
          </div>

          <Button 
            onClick={() => onNext({ name, ingredients, instructions, time, mealType })} 
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

export default Screen2Recipe;


