import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

interface Props {
  data: Record<string, any>;
  onNext: (d: Record<string, any>) => void;
}

const Screen2Recipe = ({ data, onNext }: Props) => {
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
            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">Recipe Name</label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Masala Oats, Grilled Paneer Salad" 
              className="py-6 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg"
            />
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">Main Ingredients</label>
            <Input 
              value={ingredients} 
              onChange={e => setIngredients(e.target.value)} 
              placeholder="e.g. oats, vegetables, olive oil..." 
              className="py-6 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">Prep Time</label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="h-[60px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Under 15 mins">Under 15 mins</SelectItem>
                  <SelectItem value="15–30 mins">15–30 mins</SelectItem>
                  <SelectItem value="30–60 mins">30–60 mins</SelectItem>
                  <SelectItem value="Over 1 hour">Over 1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">Meal Type</label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="h-[60px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">Instructions</label>
            <Textarea 
              value={instructions} 
              onChange={e => setInstructions(e.target.value)} 
              placeholder="e.g. Boiled oats, added sautéed vegetables..." 
              className="rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-lg min-h-[195px] resize-none"
            />
          </div>

          <Button 
            onClick={() => onNext({ name, ingredients, instructions, time, mealType })} 
            disabled={!isFormValid}
            className="w-full py-8 text-xl font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Screen2Recipe;


