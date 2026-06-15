import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ShoppingBag, CheckSquare, Flame, AlertTriangle, Plus, Search, Award, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logUserActivity } from '@/lib/db';
import { useTranslation } from "react-i18next";

interface DailyHabits {
  date: string;
  under_limit: boolean;
  electrolytes: boolean;
  moderate_protein: boolean;
  high_fat: boolean;
}

type TabType = 'education' | 'pantry' | 'habits';

// All foods database from CSV
const allFoods = [
  { name: 'Chicken Breast', category: 'Protein', netCarbs: 0 },
  { name: 'Beef Steak', category: 'Protein', netCarbs: 0 },
  { name: 'Salmon', category: 'Seafood', netCarbs: 0 },
  { name: 'Tuna', category: 'Seafood', netCarbs: 0 },
  { name: 'Shrimp', category: 'Seafood', netCarbs: 1 },
  { name: 'Egg Whole', category: 'Protein', netCarbs: 1 },
  { name: 'Bacon', category: 'Protein', netCarbs: 1 },
  { name: 'Cheddar Cheese', category: 'Dairy', netCarbs: 1 },
  { name: 'Mozzarella', category: 'Dairy', netCarbs: 2 },
  { name: 'Greek Yogurt Plain', category: 'Dairy', netCarbs: 4 },
  { name: 'Heavy Cream', category: 'Dairy', netCarbs: 3 },
  { name: 'Butter', category: 'Fats', netCarbs: 0 },
  { name: 'Olive Oil', category: 'Fats', netCarbs: 0 },
  { name: 'Coconut Oil', category: 'Fats', netCarbs: 0 },
  { name: 'Avocado Oil', category: 'Fats', netCarbs: 0 },
  { name: 'MCT Oil', category: 'Fats', netCarbs: 0 },
  { name: 'Almonds', category: 'Nuts', netCarbs: 10 },
  { name: 'Walnuts', category: 'Nuts', netCarbs: 7 },
  { name: 'Pecans', category: 'Nuts', netCarbs: 4 },
  { name: 'Macadamia Nuts', category: 'Nuts', netCarbs: 5 },
  { name: 'Cashews', category: 'Nuts', netCarbs: 27 },
  { name: 'Chia Seeds', category: 'Seeds', netCarbs: 8 },
  { name: 'Flax Seeds', category: 'Seeds', netCarbs: 2 },
  { name: 'Pumpkin Seeds', category: 'Seeds', netCarbs: 5 },
  { name: 'Broccoli', category: 'Vegetables', netCarbs: 4 },
  { name: 'Cauliflower', category: 'Vegetables', netCarbs: 3 },
  { name: 'Spinach', category: 'Vegetables', netCarbs: 1 },
  { name: 'Kale', category: 'Vegetables', netCarbs: 5 },
  { name: 'Lettuce', category: 'Vegetables', netCarbs: 2 },
  { name: 'Asparagus', category: 'Vegetables', netCarbs: 2 },
  { name: 'Zucchini', category: 'Vegetables', netCarbs: 3 },
  { name: 'Cucumber', category: 'Vegetables', netCarbs: 3 },
  { name: 'Bell Pepper Green', category: 'Vegetables', netCarbs: 3 },
  { name: 'Mushrooms White', category: 'Vegetables', netCarbs: 3 },
  { name: 'Tomato', category: 'Vegetables', netCarbs: 3 },
  { name: 'Avocado', category: 'Fruit', netCarbs: 2 },
  { name: 'Olives Black', category: 'Fruit', netCarbs: 3 },
  { name: 'Strawberries', category: 'Fruit', netCarbs: 6 },
  { name: 'Raspberries', category: 'Fruit', netCarbs: 5 },
  { name: 'Blackberries', category: 'Fruit', netCarbs: 5 },
  { name: 'Blueberries', category: 'Fruit', netCarbs: 12 },
  { name: 'Lemon', category: 'Fruit', netCarbs: 6 },
  { name: 'Coconut Meat', category: 'Fruit', netCarbs: 6 },
  { name: 'Apple', category: 'Fruit', netCarbs: 12 },
  { name: 'Banana', category: 'Fruit', netCarbs: 20 },
  { name: 'Grapes', category: 'Fruit', netCarbs: 17 },
  { name: 'Mango', category: 'Fruit', netCarbs: 14 },
  { name: 'Orange', category: 'Fruit', netCarbs: 9 },
  { name: 'Sweet Potato', category: 'Vegetables', netCarbs: 17 },
  { name: 'Potato White', category: 'Vegetables', netCarbs: 17 },
  { name: 'Carrot', category: 'Vegetables', netCarbs: 7 },
  { name: 'Corn Sweet', category: 'Vegetables', netCarbs: 16 },
  { name: 'Peas Green', category: 'Vegetables', netCarbs: 9 },
  { name: 'Chickpeas', category: 'Legumes', netCarbs: 20 },
  { name: 'Lentils', category: 'Legumes', netCarbs: 12 },
  { name: 'Black Beans', category: 'Legumes', netCarbs: 16 },
  { name: 'Peanut Butter', category: 'Spread', netCarbs: 8 },
  { name: 'Almond Butter', category: 'Spread', netCarbs: 9 },
  { name: 'Almond Flour', category: 'Baking', netCarbs: 10 },
  { name: 'Coconut Flour', category: 'Baking', netCarbs: 21 },
  { name: 'Dark Chocolate 90%', category: 'Dessert', netCarbs: 14 },
  { name: 'Ketchup', category: 'Sauce', netCarbs: 22 },
  { name: 'BBQ Sauce', category: 'Sauce', netCarbs: 30 },
  { name: 'Ranch Dressing', category: 'Sauce', netCarbs: 4 },
  { name: 'Coffee Black', category: 'Beverage', netCarbs: 0 },
  { name: 'Almond Milk Unsweetened', category: 'Beverage', netCarbs: 1 },
  { name: 'Oat Milk', category: 'Beverage', netCarbs: 7 },
  { name: 'Dry Wine Red', category: 'Beverage', netCarbs: 3 },
  { name: 'Beer', category: 'Beverage', netCarbs: 13 },
  { name: 'Stevia', category: 'Sweetener', netCarbs: 0 },
  { name: 'Erythritol', category: 'Sweetener', netCarbs: 0 },
  { name: 'Honey', category: 'Sweetener', netCarbs: 82 },
  { name: 'Sugar White', category: 'Sweetener', netCarbs: 100 },
  { name: 'Maple Syrup', category: 'Sweetener', netCarbs: 67 },
  { name: 'Quinoa', category: 'Grains', netCarbs: 57 },
  { name: 'White Rice', category: 'Grains', netCarbs: 28 },
  { name: 'Brown Rice', category: 'Grains', netCarbs: 23 },
  { name: 'Oats', category: 'Grains', netCarbs: 56 },
  { name: 'Bread White', category: 'Bakery', netCarbs: 49 },
  { name: 'Bread Whole Wheat', category: 'Bakery', netCarbs: 41 },
  { name: 'Bagel', category: 'Bakery', netCarbs: 53 },
  { name: 'Croissant', category: 'Bakery', netCarbs: 43 },
  { name: 'Donut', category: 'Bakery', netCarbs: 51 },
  { name: 'Pizza Crust', category: 'Bakery', netCarbs: 48 },
  { name: 'Pasta Cooked', category: 'Grains', netCarbs: 30 },
  { name: 'Spaghetti Cooked', category: 'Grains', netCarbs: 31 },
  { name: 'Potato Chips', category: 'Snacks', netCarbs: 49 },
  { name: 'Popcorn', category: 'Snacks', netCarbs: 58 },
  { name: 'Pretzels', category: 'Snacks', netCarbs: 71 },
  { name: 'Crackers Saltine', category: 'Snacks', netCarbs: 74 },
  { name: 'Pork Rinds', category: 'Snacks', netCarbs: 0 },
  { name: 'Cheese Crisps', category: 'Snacks', netCarbs: 3 },
  { name: 'Burger With Bun', category: 'Prepared Food', netCarbs: 28 },
  { name: 'Burrito', category: 'Prepared Food', netCarbs: 26 },
  { name: 'Sushi Roll', category: 'Prepared Food', netCarbs: 28 },
  { name: 'Fried Rice', category: 'Prepared Food', netCarbs: 32 },
  { name: 'Chicken Curry Indian', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Butter Chicken', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Tandoori Chicken', category: 'Prepared Food', netCarbs: 2 },
  { name: 'Chicken Tikka', category: 'Prepared Food', netCarbs: 3 },
  { name: 'Chicken Korma', category: 'Prepared Food', netCarbs: 7 },
  { name: 'Chicken Saag', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Mutton Curry', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Mutton Rogan Josh', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Mutton Seekh Kebab', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Lamb Keema', category: 'Prepared Food', netCarbs: 3 },
  { name: 'Fish Curry Indian', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Fish Tikka', category: 'Prepared Food', netCarbs: 2 },
  { name: 'Fish Fry Indian', category: 'Prepared Food', netCarbs: 8 },
  { name: 'Prawn Curry', category: 'Prepared Food', netCarbs: 7 },
  { name: 'Prawn Masala', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Egg Curry', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Egg Bhurji', category: 'Prepared Food', netCarbs: 3 },
  { name: 'Masala Omelette', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Paneer Tikka', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Paneer Butter Masala', category: 'Prepared Food', netCarbs: 8 },
  { name: 'Paneer Bhurji', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Paneer Korma', category: 'Prepared Food', netCarbs: 7 },
  { name: 'Paneer Do Pyaza', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Palak Paneer', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Shahi Paneer', category: 'Prepared Food', netCarbs: 9 },
  { name: 'Kadai Paneer', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Malai Kofta', category: 'Prepared Food', netCarbs: 12 },
  { name: 'Dal Makhani', category: 'Prepared Food', netCarbs: 14 },
  { name: 'Rajma Masala', category: 'Prepared Food', netCarbs: 16 },
  { name: 'Chole Masala', category: 'Prepared Food', netCarbs: 18 },
  { name: 'Chana Dal', category: 'Prepared Food', netCarbs: 13 },
  { name: 'Toor Dal', category: 'Prepared Food', netCarbs: 14 },
  { name: 'Moong Dal', category: 'Prepared Food', netCarbs: 12 },
  { name: 'Masoor Dal', category: 'Prepared Food', netCarbs: 13 },
  { name: 'Sambar', category: 'Prepared Food', netCarbs: 10 },
  { name: 'Rasam', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Vegetable Korma', category: 'Prepared Food', netCarbs: 9 },
  { name: 'Baingan Bharta', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Aloo Gobi', category: 'Prepared Food', netCarbs: 12 },
  { name: 'Bhindi Masala', category: 'Prepared Food', netCarbs: 7 },
  { name: 'Tinda Sabzi', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Lauki Sabzi', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Turai Sabzi', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Karela Sabzi', category: 'Prepared Food', netCarbs: 3 },
  { name: 'Cabbage Sabzi', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Beans Sabzi', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Methi Sabzi', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Spinach Curry', category: 'Prepared Food', netCarbs: 4 },
  { name: 'Mushroom Masala', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Mushroom Pepper Fry', category: 'Prepared Food', netCarbs: 5 },
  { name: 'Capsicum Masala', category: 'Prepared Food', netCarbs: 6 },
  { name: 'Tomato Curry Indian', category: 'Prepared Food', netCarbs: 7 },
  { name: 'Onion Pakora', category: 'Snacks', netCarbs: 25 },
  { name: 'Paneer Pakora', category: 'Snacks', netCarbs: 18 },
  { name: 'Vegetable Pakora', category: 'Snacks', netCarbs: 22 },
  { name: 'Samosa', category: 'Snacks', netCarbs: 28 },
  { name: 'Kachori', category: 'Snacks', netCarbs: 30 },
  { name: 'Aloo Tikki', category: 'Snacks', netCarbs: 26 },
  { name: 'Vada Pav', category: 'Snacks', netCarbs: 35 },
  { name: 'Pav Bhaji', category: 'Prepared Food', netCarbs: 20 },
  { name: 'Poha', category: 'Prepared Food', netCarbs: 23 },
  { name: 'Upma', category: 'Prepared Food', netCarbs: 22 },
  { name: 'Idli', category: 'Prepared Food', netCarbs: 28 },
  { name: 'Dosa Plain', category: 'Prepared Food', netCarbs: 30 },
  { name: 'Masala Dosa', category: 'Prepared Food', netCarbs: 35 },
  { name: 'Uttapam', category: 'Prepared Food', netCarbs: 27 },
  { name: 'Medu Vada', category: 'Snacks', netCarbs: 20 },
  { name: 'Sabudana Khichdi', category: 'Prepared Food', netCarbs: 40 },
  { name: 'Sabudana Vada', category: 'Snacks', netCarbs: 45 },
  { name: 'Khichdi', category: 'Prepared Food', netCarbs: 20 },
  { name: 'Curd Rice', category: 'Prepared Food', netCarbs: 23 },
  { name: 'Vegetable Pulao', category: 'Prepared Food', netCarbs: 25 },
  { name: 'Jeera Rice', category: 'Prepared Food', netCarbs: 28 },
  { name: 'Biryani Chicken', category: 'Prepared Food', netCarbs: 30 },
  { name: 'Biryani Veg', category: 'Prepared Food', netCarbs: 32 },
  { name: 'Roti', category: 'Flatbread', netCarbs: 45 },
  { name: 'Chapati', category: 'Flatbread', netCarbs: 44 },
  { name: 'Paratha', category: 'Flatbread', netCarbs: 50 },
  { name: 'Aloo Paratha', category: 'Flatbread', netCarbs: 55 },
  { name: 'Naan Butter', category: 'Flatbread', netCarbs: 49 },
  { name: 'Garlic Naan', category: 'Flatbread', netCarbs: 48 },
  { name: 'Kulcha', category: 'Flatbread', netCarbs: 50 },
  { name: 'Bhatura', category: 'Flatbread', netCarbs: 52 },
  { name: 'Puri', category: 'Flatbread', netCarbs: 48 },
  { name: 'Thepla', category: 'Flatbread', netCarbs: 46 },
  { name: 'Missi Roti', category: 'Flatbread', netCarbs: 40 },
  { name: 'Besan Chilla', category: 'Prepared Food', netCarbs: 20 },
  { name: 'Moong Dal Chilla', category: 'Prepared Food', netCarbs: 18 },
  { name: 'Rava Dhokla', category: 'Prepared Food', netCarbs: 25 },
  { name: 'Khaman Dhokla', category: 'Prepared Food', netCarbs: 27 },
  { name: 'Handvo', category: 'Prepared Food', netCarbs: 22 },
  { name: 'Fafda', category: 'Snacks', netCarbs: 35 },
  { name: 'Sev', category: 'Snacks', netCarbs: 30 },
  { name: 'Bhel Puri', category: 'Snacks', netCarbs: 40 },
  { name: 'Sev Puri', category: 'Snacks', netCarbs: 38 },
  { name: 'Pani Puri', category: 'Snacks', netCarbs: 45 },
  { name: 'Dahi Puri', category: 'Snacks', netCarbs: 35 },
  { name: 'Papdi Chaat', category: 'Snacks', netCarbs: 38 },
  { name: 'Aloo Chaat', category: 'Snacks', netCarbs: 30 },
  { name: 'Chole Bhature', category: 'Prepared Food', netCarbs: 50 },
  { name: 'Rajma Chawal', category: 'Prepared Food', netCarbs: 55 },
  { name: 'Dal Chawal', category: 'Prepared Food', netCarbs: 52 },
  { name: 'Kadhi Pakora', category: 'Prepared Food', netCarbs: 20 },
  { name: 'Kadhi Plain', category: 'Prepared Food', netCarbs: 10 },
  { name: 'Lassi Sweet', category: 'Beverage', netCarbs: 18 },
  { name: 'Lassi Salted', category: 'Beverage', netCarbs: 6 },
  { name: 'Buttermilk', category: 'Beverage', netCarbs: 4 },
  { name: 'Masala Chaas', category: 'Beverage', netCarbs: 3 },
  { name: 'Tea With Milk Sugar', category: 'Beverage', netCarbs: 10 },
  { name: 'Tea With Milk No Sugar', category: 'Beverage', netCarbs: 5 },
  { name: 'Filter Coffee', category: 'Beverage', netCarbs: 3 },
  { name: 'Cold Coffee', category: 'Beverage', netCarbs: 15 },
  { name: 'Sugarcane Juice', category: 'Beverage', netCarbs: 25 },
  { name: 'Jalebi', category: 'Dessert', netCarbs: 75 },
  { name: 'Gulab Jamun', category: 'Dessert', netCarbs: 60 },
  { name: 'Rasgulla', category: 'Dessert', netCarbs: 55 },
  { name: 'Rasmalai', category: 'Dessert', netCarbs: 45 },
  { name: 'Kheer Rice', category: 'Dessert', netCarbs: 30 },
  { name: 'Halwa Suji', category: 'Dessert', netCarbs: 50 },
  { name: 'Halwa Gajar', category: 'Dessert', netCarbs: 35 },
  { name: 'Ladoo Besan', category: 'Dessert', netCarbs: 55 },
  { name: 'Ladoo Motichoor', category: 'Dessert', netCarbs: 60 },
  { name: 'Barfi Kaju', category: 'Dessert', netCarbs: 30 },
  { name: 'Barfi Coconut', category: 'Dessert', netCarbs: 35 },
  { name: 'Peda', category: 'Dessert', netCarbs: 45 },
  { name: 'Kulfi', category: 'Dessert', netCarbs: 30 },
  { name: 'Ice Cream Indian', category: 'Dessert', netCarbs: 28 },
];

// Popular Green Light Foods (net carbs < 10g) - shown by default
const popularGreenLightFoods = [
  { name: 'Chicken Breast', category: 'Protein', netCarbs: 0 },
  { name: 'Beef Steak', category: 'Protein', netCarbs: 0 },
  { name: 'Salmon', category: 'Seafood', netCarbs: 0 },
  { name: 'Egg Whole', category: 'Protein', netCarbs: 1 },
  { name: 'Bacon', category: 'Protein', netCarbs: 1 },
  { name: 'Cheddar Cheese', category: 'Dairy', netCarbs: 1 },
  { name: 'Butter', category: 'Fats', netCarbs: 0 },
  { name: 'Olive Oil', category: 'Fats', netCarbs: 0 },
  { name: 'Avocado', category: 'Fruit', netCarbs: 2 },
  { name: 'MCT Oil', category: 'Fats', netCarbs: 0 },
  { name: 'Macadamia Nuts', category: 'Nuts', netCarbs: 5 },
  { name: 'Pecans', category: 'Nuts', netCarbs: 4 },
  { name: 'Broccoli', category: 'Vegetables', netCarbs: 4 },
  { name: 'Cauliflower', category: 'Vegetables', netCarbs: 3 },
  { name: 'Spinach', category: 'Vegetables', netCarbs: 1 },
  { name: 'Zucchini', category: 'Vegetables', netCarbs: 3 },
  { name: 'Heavy Cream', category: 'Dairy', netCarbs: 3 },
  { name: 'Coconut Oil', category: 'Fats', netCarbs: 0 },
];

// Popular Keto Killers (net carbs > 20g) - shown by default
const popularKetoKillers = [
  { name: 'Sugar White', category: 'Sweetener', netCarbs: 100 },
  { name: 'Honey', category: 'Sweetener', netCarbs: 82 },
  { name: 'Crackers Saltine', category: 'Snacks', netCarbs: 74 },
  { name: 'Pretzels', category: 'Snacks', netCarbs: 71 },
  { name: 'Maple Syrup', category: 'Sweetener', netCarbs: 67 },
  { name: 'Quinoa', category: 'Grains', netCarbs: 57 },
  { name: 'Bagel', category: 'Bakery', netCarbs: 53 },
  { name: 'Donut', category: 'Bakery', netCarbs: 51 },
  { name: 'Bread White', category: 'Bakery', netCarbs: 49 },
  { name: 'Potato Chips', category: 'Snacks', netCarbs: 49 },
];

export default function KetoBasicsGuide({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('KetoBasics');
  const [activeTab, setActiveTab] = useState<TabType>('education');
  const [dailyHabits, setDailyHabits] = useState<DailyHabits[]>([]);
  const [todayHabits, setTodayHabits] = useState({ under_limit: false, electrolytes: false, moderate_protein: false, high_fat: false });

  // Pantry search
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Load data from localStorage
  useEffect(() => {
    const savedHabits = localStorage.getItem('ketoHabits');

    if (savedHabits) {
      const habits: DailyHabits[] = JSON.parse(savedHabits);
      setDailyHabits(habits);
      const todayHabit = habits.find(h => h.date === today);
      if (todayHabit) {
        setTodayHabits(todayHabit);
      }
    }
  }, [today]);

  // Toggle habit
  const toggleHabit = (habit: keyof Omit<DailyHabits, 'date'>) => {
    const newHabits = { ...todayHabits, [habit]: !todayHabits[habit] };
    setTodayHabits(newHabits);

    const updatedHabits = dailyHabits.filter(h => h.date !== today);
    updatedHabits.push({ date: today, ...newHabits });
    setDailyHabits(updatedHabits);
    localStorage.setItem('ketoHabits', JSON.stringify(updatedHabits));

    logToDatabase('habits', {
      habits: {
        electrolytes_taken: newHabits.electrolytes,
        under_limit: newHabits.under_limit,
        moderate_protein: newHabits.moderate_protein,
        high_fat: newHabits.high_fat,
      },
    });
  };

  // Calculate ketosis probability based on habits
  const anyHabitsChecked = todayHabits.under_limit || todayHabits.electrolytes || todayHabits.moderate_protein || todayHabits.high_fat;
  const ketosisProb = todayHabits.under_limit ? 'High' : anyHabitsChecked ? 'Medium' : 'Low';

  // Get start date based on first logged habit, or today if none
  const getStartDate = () => {
    if (dailyHabits.length > 0) {
      return dailyHabits.reduce((min, p) => p.date < min ? p.date : min, dailyHabits[0].date);
    }
    return new Date().toISOString().split('T')[0];
  };

  // Get 30 days of habit tracking
  const getLast30DaysHabits = () => {
    const days = [];
    const startDateStr = getStartDate();
    const startDate = new Date(startDateStr);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const habitData = dailyHabits.find(h => h.date === dateStr);
      days.push({
        date: dateStr,
        dayNum: i + 1,
        habits: habitData || { under_limit: false, electrolytes: false, moderate_protein: false, high_fat: false },
        completionCount: habitData ?
          (habitData.under_limit ? 1 : 0) + (habitData.electrolytes ? 1 : 0) +
          (habitData.moderate_protein ? 1 : 0) + (habitData.high_fat ? 1 : 0) : 0
      });
    }
    return days;
  };

  // Database logging
  const logToDatabase = (action: string, data: any) => {
    logUserActivity('keto_basics', action, { ...data, timestamp: new Date().toISOString() });
  };

  // Filter all foods by search query
  const filteredGreenLightFoods = searchQuery
    ? allFoods.filter(food =>
        food.netCarbs < 10 &&
        (food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : popularGreenLightFoods;

  const filteredKetoKillers = searchQuery
    ? allFoods.filter(food =>
        food.netCarbs >= 20 &&
        (food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : popularKetoKillers;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 lg:mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm lg:text-base">{t('back_to_dashboard')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-2 lg:p-3">
              <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{t('keto_basics_guide')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('master_the_ketogenic_diet_with_science_b')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'education'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('ketosis_101')}
                                </button>
          <button
            onClick={() => setActiveTab('pantry')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'pantry'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('pantry')}
                                </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'habits'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('habits')}
                                </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'education' && (
            <motion.div
              key="education"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* What is Ketosis */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-yellow-200">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="bg-yellow-500 rounded-lg lg:rounded-xl p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('what_is_ketosis')}</h2>
                    <p className="text-sm lg:text-base text-gray-700 mb-2 lg:mb-4">
                      {t('ketosis_is_a_metabolic_state_where_your_')} <strong>{t('glucose_sugar')}</strong> {t('to_burning')} <strong>{t('fat')}</strong> {t('for_fuel')}
                                                              </p>
                    <p className="text-xs lg:text-base text-gray-600">
                      {t('when_carbohydrate_intake_is_very_low_typ')} <strong>{t('ketones')}</strong>{t('which_become_your_body_s_primary_energy_')}
                                                              </p>
                  </div>
                </div>
              </div>

              {/* The Keto Ratio */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('the_keto_macronutrient_ratio')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 lg:p-6 border border-yellow-200 text-center">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-yellow-500 rounded-full mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                      <span className="text-2xl lg:text-3xl font-bold text-white">70%</span>
                    </div>
                    <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-1 lg:mb-2">{t('fats')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('70_75_of_daily_calories')}</p>
                    <p className="text-xs text-gray-500 mt-1 lg:mt-2">{t('avocado_nuts_oils_butter_fatty_fish')}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 lg:p-6 border border-orange-200 text-center">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-orange-500 rounded-full mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                      <span className="text-2xl lg:text-3xl font-bold text-white">22%</span>
                    </div>
                    <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-1 lg:mb-2">{t('protein')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('20_25_of_daily_calories')}</p>
                    <p className="text-xs text-gray-500 mt-1 lg:mt-2">{t('meat_fish_eggs_moderate_portions')}</p>
                  </div>

                  <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-xl p-4 lg:p-6 border border-lime-200 text-center">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-lime-500 rounded-full mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                      <span className="text-2xl lg:text-3xl font-bold text-white">8%</span>
                    </div>
                    <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-1 lg:mb-2">{t('carbs')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('5_10_of_daily_calories')}</p>
                    <p className="text-xs text-gray-500 mt-1 lg:mt-2">{t('mostly_from_low_carb_vegetables')}</p>
                  </div>
                </div>
              </div>

              {/* Keto Flu Warning */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border-2 border-red-200">
                <div className="flex items-start gap-3 lg:gap-4">
                  <AlertTriangle className="w-8 h-8 lg:w-12 lg:h-12 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('the_keto_flu')}</h2>
                    <p className="text-sm lg:text-base text-gray-700 mb-3 lg:mb-4">
                      {t('during_the_first_week_of_keto_many_peopl')} <strong>{t('electrolyte_loss')}</strong>.
                    </p>
                    <div className="bg-white rounded-xl p-3 lg:p-4 mb-3 lg:mb-4">
                      <h4 className="font-semibold text-sm lg:text-base text-gray-900 mb-2">{t('common_symptoms')}</h4>
                      <ul className="space-y-1 text-xs lg:text-sm text-gray-600">
                        <li>{t('headaches')}</li>
                        <li>{t('fatigue_and_brain_fog')}</li>
                        <li>{t('muscle_cramps')}</li>
                        <li>{t('irritability')}</li>
                      </ul>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 lg:p-4 border border-emerald-200">
                      <h4 className="font-semibold text-sm lg:text-base text-emerald-900 mb-2">{t('the_solution')}</h4>
                      <ul className="space-y-1 text-xs lg:text-sm text-emerald-700">
                        <li>• <strong>{t('sodium')}</strong> {t('3000_5000mg_day_salt_your_food_liberally')}</li>
                        <li>• <strong>{t('potassium')}</strong> {t('1000_3500mg_day_avocado_spinach')}</li>
                        <li>• <strong>{t('magnesium')}</strong> {t('300_500mg_day_supplement_recommended')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Carb Rule */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border-2 border-indigo-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('the_net_carb_rule')}</h2>
                <p className="text-sm lg:text-base text-gray-700 mb-3 lg:mb-4">
                  {t('on_keto_we_count')} <strong>{t('net_carbs_2')}</strong>{t('not_total_carbs_here_s_why')}
                                                  </p>
                <div className="bg-white rounded-xl p-4 lg:p-6">
                  <p className="text-sm lg:text-lg font-semibold text-indigo-900 mb-3 lg:mb-4 text-center">
                    {t('net_carbs_total_carbs_fiber_sugar_alcoho')}
                                                        </p>
                  <div className="space-y-2 lg:space-y-3 text-xs lg:text-base text-gray-600">
                    <p className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">✓</span>
                      <span><strong>{t('fiber')}</strong> {t('doesn_t_raise_blood_sugar_and_passes_thr')}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">✓</span>
                      <span><strong>{t('sugar_alcohols')}</strong> {t('like_erythritol_have_minimal_impact_on_b')}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">✓</span>
                      <span><strong>{t('net_carbs')}</strong> {t('are_what_actually_affect_ketosis')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


          {activeTab === 'pantry' && (
            <motion.div
              key="pantry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search_keto_foods')}
                    className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm lg:text-lg"
                  />
                </div>
              </div>

              {/* Green Light Foods */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  {t('green_light_foods')}
                                                  </h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-4 lg:mb-6">
                  {t('net_carbs_per_100g_serving')} {!searchQuery && '(Popular items - use search to see more)'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {filteredGreenLightFoods.map(food => (
                    <div
                      key={food.name}
                      className="p-3 lg:p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1 lg:mb-2">
                        <span className="font-medium text-sm lg:text-base text-gray-900">{food.name}</span>
                        <span className="px-2 py-1 lg:px-3 lg:py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs lg:text-sm font-bold">
                          {food.netCarbs}{t('g')}
                                                          </span>
                      </div>
                      <span className="text-xs text-gray-500">{food.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keto Killers */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border-2 border-red-200">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  {t('keto_killers_avoid_these')}
                                                  </h3>
                <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">
                  {t('high_carb_foods_that_will_kick_you_out_o')} {!searchQuery && '(Popular items - use search to see more)'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {filteredKetoKillers.map(food => (
                    <div
                      key={food.name}
                      className="p-3 lg:p-4 bg-white border-2 border-red-300 rounded-xl hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1 lg:mb-2">
                        <span className="font-medium text-sm lg:text-base text-red-900">{food.name}</span>
                        <span className="px-2 py-1 lg:px-3 lg:py-1 bg-red-100 text-red-700 rounded-lg text-xs lg:text-sm font-bold">
                          {food.netCarbs}{t('g')}
                                                          </span>
                      </div>
                      <span className="text-xs text-gray-500">{food.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Ketosis Maintained Badge */}
              <AnimatePresence>
                {todayHabits.under_limit && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-center border-2 border-emerald-400 shadow-xl"
                  >
                    <Award className="w-12 h-12 lg:w-16 lg:h-16 text-white mx-auto mb-3 lg:mb-4" />
                    <h2 className="text-xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">{t('ketosis_maintained')}</h2>
                    <p className="text-sm lg:text-base text-emerald-100">
                      {t('great_job_staying_under_your_net_carb_li')}
                                                              </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ketosis Probability Meter */}
              <div className={`rounded-xl lg:rounded-2xl p-4 lg:p-8 border-2 transition-all ${
                ketosisProb === 'High'
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-500'
                  : ketosisProb === 'Medium'
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-500'
                  : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-500'
              }`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">{t('ketosis_probability')}</h3>
                    <p className="text-xs lg:text-base text-gray-600">
                      {ketosisProb === 'High'
                        ? '✓ You\'re on track for deep ketosis'
                        : ketosisProb === 'Medium'
                        ? '⚠️ Some habits checked - keep going!'
                        : '— Start checking off habits to enter ketosis'}
                    </p>
                  </div>
                  <div className={`text-4xl lg:text-6xl font-bold ${
                    ketosisProb === 'High' ? 'text-emerald-600' : ketosisProb === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {ketosisProb}
                  </div>
                </div>
              </div>

              {/* Daily Habits Checklist */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('keto_success_checklist')}</h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-4 lg:mb-6">
                  {t('complete_these_daily_for_optimal_ketosis')}
                                                  </p>

                <div className="space-y-3 lg:space-y-4">
                  <KetoHabitCheckbox
                    checked={todayHabits.under_limit}
                    onChange={() => toggleHabit('under_limit')}
                    icon={<Zap className="w-5 h-5 lg:w-6 lg:h-6" />}
                    label={t('stayed_under_20_50g_net_carbs')}
                    description="Critical for maintaining ketosis"
                    color="yellow"
                  />

                  <KetoHabitCheckbox
                    checked={todayHabits.electrolytes}
                    onChange={() => toggleHabit('electrolytes')}
                    icon={<span className="text-xl lg:text-2xl">⚡</span>}
                    label={t('hit_electrolyte_goals')}
                    description="Sodium, potassium, magnesium supplemented"
                    color="amber"
                  />

                  <KetoHabitCheckbox
                    checked={todayHabits.moderate_protein}
                    onChange={() => toggleHabit('moderate_protein')}
                    icon={<span className="text-xl lg:text-2xl">🥩</span>}
                    label={t('moderate_protein_intake')}
                    description="Not excessive - excess protein can convert to glucose"
                    color="orange"
                  />

                  <KetoHabitCheckbox
                    checked={todayHabits.high_fat}
                    onChange={() => toggleHabit('high_fat')}
                    icon={<span className="text-xl lg:text-2xl">🥑</span>}
                    label={t('high_fat_source_with_every_meal')}
                    description="70-75% of calories from healthy fats"
                    color="amber"
                  />
                </div>
              </div>

              {/* 30-Day Habit Log */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('30_day_habit_tracker')}</h3>
                <div className="grid grid-cols-6 lg:grid-cols-10 gap-2">
                  {getLast30DaysHabits().map((day) => {
                    const isToday = day.date === today;
                    const completionPercentage = (day.completionCount / 4) * 100;

                    return (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                          isToday
                            ? 'ring-2 ring-yellow-500 ring-offset-2'
                            : ''
                        } ${
                          completionPercentage === 100
                            ? 'bg-amber-500 text-white'
                            : completionPercentage >= 75
                            ? 'bg-yellow-400 text-gray-900'
                            : completionPercentage >= 50
                            ? 'bg-yellow-300 text-gray-900'
                            : completionPercentage > 0
                            ? 'bg-orange-300 text-gray-900'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={`Day ${day.dayNum}: ${day.completionCount}/4 habits`}
                      >
                        <span className="text-xs font-bold">{day.dayNum}</span>
                        <span className="text-xs">{day.completionCount}/4</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 lg:gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100"></div>
                    <span>{t('none')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-300"></div>
                    <span>1-2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-400"></div>
                    <span>2-3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-400"></div>
                    <span>3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500"></div>
                    <span>{t('all_4')}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-yellow-200">
                <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">{t('keto_essentials')}</h3>
                <div className="space-y-2 lg:space-y-3 text-xs lg:text-base text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span><strong>{t('track_net_carbs_not_total')}</strong> {t('fiber_and_sugar_alcohols_don_t_count')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span><strong>{t('don_t_fear_fat')}</strong> {t('it_s_your_primary_fuel_source_on_keto')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span><strong>{t('electrolytes_are_crucial')}</strong> {t('most_keto_flu_is_actually_electrolyte_de')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span><strong>{t('test_ketones_if_curious')}</strong> {t('blood_ketones_of_0_5_3_0_mmol_l_indicate')}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function KetoHabitCheckbox({
  checked,
  onChange,
  icon,
  label,
  description,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    yellow: 'border-yellow-500 bg-yellow-50',
    orange: 'border-orange-500 bg-orange-50',
    amber: 'border-amber-500 bg-amber-50',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onChange}
      className={`p-3 lg:p-6 rounded-xl border-2 cursor-pointer transition-all ${
        checked ? colorClasses[color as keyof typeof colorClasses] : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2 lg:gap-4">
        <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${checked ? `bg-${color}-100` : 'bg-gray-100'}`}>
          <div className={checked ? `text-${color}-600` : 'text-gray-400'}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm lg:text-base text-gray-900 mb-0.5 lg:mb-1">{label}</h4>
          <p className="text-xs lg:text-sm text-gray-500">{description}</p>
        </div>
        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? `border-${color}-500 bg-${color}-500` : 'border-gray-300'
        }`}>
          {checked && <Check className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
        </div>
      </div>
    </motion.div>
  );
}
