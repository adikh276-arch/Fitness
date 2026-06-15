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
// Popular Green Light Foods (net carbs < 10g) - shown by default
// Popular Keto Killers (net carbs > 20g) - shown by default

export default function KetoBasicsGuide({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('KetoBasics');
    const popularKetoKillers = [
      { name: t('sugar_white', `Sugar White`), category: t('sweetener', `Sweetener`), netCarbs: 100 },
      { name: t('honey', `Honey`), category: t('sweetener', `Sweetener`), netCarbs: 82 },
      { name: t('crackers_saltine', `Crackers Saltine`), category: t('snacks', `Snacks`), netCarbs: 74 },
      { name: t('pretzels', `Pretzels`), category: t('snacks', `Snacks`), netCarbs: 71 },
      { name: t('maple_syrup', `Maple Syrup`), category: t('sweetener', `Sweetener`), netCarbs: 67 },
      { name: t('quinoa', `Quinoa`), category: t('grains', `Grains`), netCarbs: 57 },
      { name: t('bagel', `Bagel`), category: t('bakery', `Bakery`), netCarbs: 53 },
      { name: t('donut', `Donut`), category: t('bakery', `Bakery`), netCarbs: 51 },
      { name: t('bread_white', `Bread White`), category: t('bakery', `Bakery`), netCarbs: 49 },
      { name: t('potato_chips', `Potato Chips`), category: t('snacks', `Snacks`), netCarbs: 49 },
    ];
    const popularGreenLightFoods = [
      { name: t('chicken_breast', `Chicken Breast`), category: t('protein', `Protein`), netCarbs: 0 },
      { name: t('beef_steak', `Beef Steak`), category: t('protein', `Protein`), netCarbs: 0 },
      { name: t('salmon', `Salmon`), category: t('seafood', `Seafood`), netCarbs: 0 },
      { name: t('egg_whole', `Egg Whole`), category: t('protein', `Protein`), netCarbs: 1 },
      { name: t('bacon', `Bacon`), category: t('protein', `Protein`), netCarbs: 1 },
      { name: t('cheddar_cheese', `Cheddar Cheese`), category: t('dairy', `Dairy`), netCarbs: 1 },
      { name: t('butter', `Butter`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('olive_oil', `Olive Oil`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('avocado', `Avocado`), category: t('fruit', `Fruit`), netCarbs: 2 },
      { name: t('mct_oil', `MCT Oil`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('macadamia_nuts', `Macadamia Nuts`), category: t('nuts', `Nuts`), netCarbs: 5 },
      { name: t('pecans', `Pecans`), category: t('nuts', `Nuts`), netCarbs: 4 },
      { name: t('broccoli', `Broccoli`), category: t('vegetables', `Vegetables`), netCarbs: 4 },
      { name: t('cauliflower', `Cauliflower`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('spinach', `Spinach`), category: t('vegetables', `Vegetables`), netCarbs: 1 },
      { name: t('zucchini', `Zucchini`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('heavy_cream', `Heavy Cream`), category: t('dairy', `Dairy`), netCarbs: 3 },
      { name: t('coconut_oil', `Coconut Oil`), category: t('fats', `Fats`), netCarbs: 0 },
    ];
    const allFoods = [
      { name: t('chicken_breast', `Chicken Breast`), category: t('protein', `Protein`), netCarbs: 0 },
      { name: t('beef_steak', `Beef Steak`), category: t('protein', `Protein`), netCarbs: 0 },
      { name: t('salmon', `Salmon`), category: t('seafood', `Seafood`), netCarbs: 0 },
      { name: t('tuna', `Tuna`), category: t('seafood', `Seafood`), netCarbs: 0 },
      { name: t('shrimp', `Shrimp`), category: t('seafood', `Seafood`), netCarbs: 1 },
      { name: t('egg_whole', `Egg Whole`), category: t('protein', `Protein`), netCarbs: 1 },
      { name: t('bacon', `Bacon`), category: t('protein', `Protein`), netCarbs: 1 },
      { name: t('cheddar_cheese', `Cheddar Cheese`), category: t('dairy', `Dairy`), netCarbs: 1 },
      { name: t('mozzarella', `Mozzarella`), category: t('dairy', `Dairy`), netCarbs: 2 },
      { name: t('greek_yogurt_plain', `Greek Yogurt Plain`), category: t('dairy', `Dairy`), netCarbs: 4 },
      { name: t('heavy_cream', `Heavy Cream`), category: t('dairy', `Dairy`), netCarbs: 3 },
      { name: t('butter', `Butter`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('olive_oil', `Olive Oil`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('coconut_oil', `Coconut Oil`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('avocado_oil', `Avocado Oil`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('mct_oil', `MCT Oil`), category: t('fats', `Fats`), netCarbs: 0 },
      { name: t('almonds', `Almonds`), category: t('nuts', `Nuts`), netCarbs: 10 },
      { name: t('walnuts', `Walnuts`), category: t('nuts', `Nuts`), netCarbs: 7 },
      { name: t('pecans', `Pecans`), category: t('nuts', `Nuts`), netCarbs: 4 },
      { name: t('macadamia_nuts', `Macadamia Nuts`), category: t('nuts', `Nuts`), netCarbs: 5 },
      { name: t('cashews', `Cashews`), category: t('nuts', `Nuts`), netCarbs: 27 },
      { name: t('chia_seeds', `Chia Seeds`), category: t('seeds', `Seeds`), netCarbs: 8 },
      { name: t('flax_seeds', `Flax Seeds`), category: t('seeds', `Seeds`), netCarbs: 2 },
      { name: t('pumpkin_seeds', `Pumpkin Seeds`), category: t('seeds', `Seeds`), netCarbs: 5 },
      { name: t('broccoli', `Broccoli`), category: t('vegetables', `Vegetables`), netCarbs: 4 },
      { name: t('cauliflower', `Cauliflower`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('spinach', `Spinach`), category: t('vegetables', `Vegetables`), netCarbs: 1 },
      { name: t('kale', `Kale`), category: t('vegetables', `Vegetables`), netCarbs: 5 },
      { name: t('lettuce', `Lettuce`), category: t('vegetables', `Vegetables`), netCarbs: 2 },
      { name: t('asparagus', `Asparagus`), category: t('vegetables', `Vegetables`), netCarbs: 2 },
      { name: t('zucchini', `Zucchini`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('cucumber', `Cucumber`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('bell_pepper_green', `Bell Pepper Green`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('mushrooms_white', `Mushrooms White`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('tomato', `Tomato`), category: t('vegetables', `Vegetables`), netCarbs: 3 },
      { name: t('avocado', `Avocado`), category: t('fruit', `Fruit`), netCarbs: 2 },
      { name: t('olives_black', `Olives Black`), category: t('fruit', `Fruit`), netCarbs: 3 },
      { name: t('strawberries', `Strawberries`), category: t('fruit', `Fruit`), netCarbs: 6 },
      { name: t('raspberries', `Raspberries`), category: t('fruit', `Fruit`), netCarbs: 5 },
      { name: t('blackberries', `Blackberries`), category: t('fruit', `Fruit`), netCarbs: 5 },
      { name: t('blueberries', `Blueberries`), category: t('fruit', `Fruit`), netCarbs: 12 },
      { name: t('lemon', `Lemon`), category: t('fruit', `Fruit`), netCarbs: 6 },
      { name: t('coconut_meat', `Coconut Meat`), category: t('fruit', `Fruit`), netCarbs: 6 },
      { name: t('apple', `Apple`), category: t('fruit', `Fruit`), netCarbs: 12 },
      { name: t('banana', `Banana`), category: t('fruit', `Fruit`), netCarbs: 20 },
      { name: t('grapes', `Grapes`), category: t('fruit', `Fruit`), netCarbs: 17 },
      { name: t('mango', `Mango`), category: t('fruit', `Fruit`), netCarbs: 14 },
      { name: t('orange', `Orange`), category: t('fruit', `Fruit`), netCarbs: 9 },
      { name: t('sweet_potato', `Sweet Potato`), category: t('vegetables', `Vegetables`), netCarbs: 17 },
      { name: t('potato_white', `Potato White`), category: t('vegetables', `Vegetables`), netCarbs: 17 },
      { name: t('carrot', `Carrot`), category: t('vegetables', `Vegetables`), netCarbs: 7 },
      { name: t('corn_sweet', `Corn Sweet`), category: t('vegetables', `Vegetables`), netCarbs: 16 },
      { name: t('peas_green', `Peas Green`), category: t('vegetables', `Vegetables`), netCarbs: 9 },
      { name: t('chickpeas', `Chickpeas`), category: t('legumes', `Legumes`), netCarbs: 20 },
      { name: t('lentils', `Lentils`), category: t('legumes', `Legumes`), netCarbs: 12 },
      { name: t('black_beans', `Black Beans`), category: t('legumes', `Legumes`), netCarbs: 16 },
      { name: t('peanut_butter', `Peanut Butter`), category: t('spread', `Spread`), netCarbs: 8 },
      { name: t('almond_butter', `Almond Butter`), category: t('spread', `Spread`), netCarbs: 9 },
      { name: t('almond_flour', `Almond Flour`), category: t('baking', `Baking`), netCarbs: 10 },
      { name: t('coconut_flour', `Coconut Flour`), category: t('baking', `Baking`), netCarbs: 21 },
      { name: t('dark_chocolate_90', `Dark Chocolate 90%`), category: t('dessert', `Dessert`), netCarbs: 14 },
      { name: t('ketchup', `Ketchup`), category: t('sauce', `Sauce`), netCarbs: 22 },
      { name: t('bbq_sauce', `BBQ Sauce`), category: t('sauce', `Sauce`), netCarbs: 30 },
      { name: t('ranch_dressing', `Ranch Dressing`), category: t('sauce', `Sauce`), netCarbs: 4 },
      { name: t('coffee_black', `Coffee Black`), category: t('beverage', `Beverage`), netCarbs: 0 },
      { name: t('almond_milk_unsweetened', `Almond Milk Unsweetened`), category: t('beverage', `Beverage`), netCarbs: 1 },
      { name: t('oat_milk', `Oat Milk`), category: t('beverage', `Beverage`), netCarbs: 7 },
      { name: t('dry_wine_red', `Dry Wine Red`), category: t('beverage', `Beverage`), netCarbs: 3 },
      { name: t('beer', `Beer`), category: t('beverage', `Beverage`), netCarbs: 13 },
      { name: t('stevia', `Stevia`), category: t('sweetener', `Sweetener`), netCarbs: 0 },
      { name: t('erythritol', `Erythritol`), category: t('sweetener', `Sweetener`), netCarbs: 0 },
      { name: t('honey', `Honey`), category: t('sweetener', `Sweetener`), netCarbs: 82 },
      { name: t('sugar_white', `Sugar White`), category: t('sweetener', `Sweetener`), netCarbs: 100 },
      { name: t('maple_syrup', `Maple Syrup`), category: t('sweetener', `Sweetener`), netCarbs: 67 },
      { name: t('quinoa', `Quinoa`), category: t('grains', `Grains`), netCarbs: 57 },
      { name: t('white_rice', `White Rice`), category: t('grains', `Grains`), netCarbs: 28 },
      { name: t('brown_rice', `Brown Rice`), category: t('grains', `Grains`), netCarbs: 23 },
      { name: t('oats', `Oats`), category: t('grains', `Grains`), netCarbs: 56 },
      { name: t('bread_white', `Bread White`), category: t('bakery', `Bakery`), netCarbs: 49 },
      { name: t('bread_whole_wheat', `Bread Whole Wheat`), category: t('bakery', `Bakery`), netCarbs: 41 },
      { name: t('bagel', `Bagel`), category: t('bakery', `Bakery`), netCarbs: 53 },
      { name: t('croissant', `Croissant`), category: t('bakery', `Bakery`), netCarbs: 43 },
      { name: t('donut', `Donut`), category: t('bakery', `Bakery`), netCarbs: 51 },
      { name: t('pizza_crust', `Pizza Crust`), category: t('bakery', `Bakery`), netCarbs: 48 },
      { name: t('pasta_cooked', `Pasta Cooked`), category: t('grains', `Grains`), netCarbs: 30 },
      { name: t('spaghetti_cooked', `Spaghetti Cooked`), category: t('grains', `Grains`), netCarbs: 31 },
      { name: t('potato_chips', `Potato Chips`), category: t('snacks', `Snacks`), netCarbs: 49 },
      { name: t('popcorn', `Popcorn`), category: t('snacks', `Snacks`), netCarbs: 58 },
      { name: t('pretzels', `Pretzels`), category: t('snacks', `Snacks`), netCarbs: 71 },
      { name: t('crackers_saltine', `Crackers Saltine`), category: t('snacks', `Snacks`), netCarbs: 74 },
      { name: t('pork_rinds', `Pork Rinds`), category: t('snacks', `Snacks`), netCarbs: 0 },
      { name: t('cheese_crisps', `Cheese Crisps`), category: t('snacks', `Snacks`), netCarbs: 3 },
      { name: t('burger_with_bun', `Burger With Bun`), category: t('prepared_food', `Prepared Food`), netCarbs: 28 },
      { name: t('burrito', `Burrito`), category: t('prepared_food', `Prepared Food`), netCarbs: 26 },
      { name: t('sushi_roll', `Sushi Roll`), category: t('prepared_food', `Prepared Food`), netCarbs: 28 },
      { name: t('fried_rice', `Fried Rice`), category: t('prepared_food', `Prepared Food`), netCarbs: 32 },
      { name: t('chicken_curry_indian', `Chicken Curry Indian`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('butter_chicken', `Butter Chicken`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('tandoori_chicken', `Tandoori Chicken`), category: t('prepared_food', `Prepared Food`), netCarbs: 2 },
      { name: t('chicken_tikka', `Chicken Tikka`), category: t('prepared_food', `Prepared Food`), netCarbs: 3 },
      { name: t('chicken_korma', `Chicken Korma`), category: t('prepared_food', `Prepared Food`), netCarbs: 7 },
      { name: t('chicken_saag', `Chicken Saag`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('mutton_curry', `Mutton Curry`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('mutton_rogan_josh', `Mutton Rogan Josh`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('mutton_seekh_kebab', `Mutton Seekh Kebab`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('lamb_keema', `Lamb Keema`), category: t('prepared_food', `Prepared Food`), netCarbs: 3 },
      { name: t('fish_curry_indian', `Fish Curry Indian`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('fish_tikka', `Fish Tikka`), category: t('prepared_food', `Prepared Food`), netCarbs: 2 },
      { name: t('fish_fry_indian', `Fish Fry Indian`), category: t('prepared_food', `Prepared Food`), netCarbs: 8 },
      { name: t('prawn_curry', `Prawn Curry`), category: t('prepared_food', `Prepared Food`), netCarbs: 7 },
      { name: t('prawn_masala', `Prawn Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('egg_curry', `Egg Curry`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('egg_bhurji', `Egg Bhurji`), category: t('prepared_food', `Prepared Food`), netCarbs: 3 },
      { name: t('masala_omelette', `Masala Omelette`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('paneer_tikka', `Paneer Tikka`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('paneer_butter_masala', `Paneer Butter Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 8 },
      { name: t('paneer_bhurji', `Paneer Bhurji`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('paneer_korma', `Paneer Korma`), category: t('prepared_food', `Prepared Food`), netCarbs: 7 },
      { name: t('paneer_do_pyaza', `Paneer Do Pyaza`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('palak_paneer', `Palak Paneer`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('shahi_paneer', `Shahi Paneer`), category: t('prepared_food', `Prepared Food`), netCarbs: 9 },
      { name: t('kadai_paneer', `Kadai Paneer`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('malai_kofta', `Malai Kofta`), category: t('prepared_food', `Prepared Food`), netCarbs: 12 },
      { name: t('dal_makhani', `Dal Makhani`), category: t('prepared_food', `Prepared Food`), netCarbs: 14 },
      { name: t('rajma_masala', `Rajma Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 16 },
      { name: t('chole_masala', `Chole Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 18 },
      { name: t('chana_dal', `Chana Dal`), category: t('prepared_food', `Prepared Food`), netCarbs: 13 },
      { name: t('toor_dal', `Toor Dal`), category: t('prepared_food', `Prepared Food`), netCarbs: 14 },
      { name: t('moong_dal', `Moong Dal`), category: t('prepared_food', `Prepared Food`), netCarbs: 12 },
      { name: t('masoor_dal', `Masoor Dal`), category: t('prepared_food', `Prepared Food`), netCarbs: 13 },
      { name: t('sambar', `Sambar`), category: t('prepared_food', `Prepared Food`), netCarbs: 10 },
      { name: t('rasam', `Rasam`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('vegetable_korma', `Vegetable Korma`), category: t('prepared_food', `Prepared Food`), netCarbs: 9 },
      { name: t('baingan_bharta', `Baingan Bharta`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('aloo_gobi', `Aloo Gobi`), category: t('prepared_food', `Prepared Food`), netCarbs: 12 },
      { name: t('bhindi_masala', `Bhindi Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 7 },
      { name: t('tinda_sabzi', `Tinda Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('lauki_sabzi', `Lauki Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('turai_sabzi', `Turai Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('karela_sabzi', `Karela Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 3 },
      { name: t('cabbage_sabzi', `Cabbage Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('beans_sabzi', `Beans Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('methi_sabzi', `Methi Sabzi`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('spinach_curry', `Spinach Curry`), category: t('prepared_food', `Prepared Food`), netCarbs: 4 },
      { name: t('mushroom_masala', `Mushroom Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('mushroom_pepper_fry', `Mushroom Pepper Fry`), category: t('prepared_food', `Prepared Food`), netCarbs: 5 },
      { name: t('capsicum_masala', `Capsicum Masala`), category: t('prepared_food', `Prepared Food`), netCarbs: 6 },
      { name: t('tomato_curry_indian', `Tomato Curry Indian`), category: t('prepared_food', `Prepared Food`), netCarbs: 7 },
      { name: t('onion_pakora', `Onion Pakora`), category: t('snacks', `Snacks`), netCarbs: 25 },
      { name: t('paneer_pakora', `Paneer Pakora`), category: t('snacks', `Snacks`), netCarbs: 18 },
      { name: t('vegetable_pakora', `Vegetable Pakora`), category: t('snacks', `Snacks`), netCarbs: 22 },
      { name: t('samosa', `Samosa`), category: t('snacks', `Snacks`), netCarbs: 28 },
      { name: t('kachori', `Kachori`), category: t('snacks', `Snacks`), netCarbs: 30 },
      { name: t('aloo_tikki', `Aloo Tikki`), category: t('snacks', `Snacks`), netCarbs: 26 },
      { name: t('vada_pav', `Vada Pav`), category: t('snacks', `Snacks`), netCarbs: 35 },
      { name: t('pav_bhaji', `Pav Bhaji`), category: t('prepared_food', `Prepared Food`), netCarbs: 20 },
      { name: t('poha', `Poha`), category: t('prepared_food', `Prepared Food`), netCarbs: 23 },
      { name: t('upma', `Upma`), category: t('prepared_food', `Prepared Food`), netCarbs: 22 },
      { name: t('idli', `Idli`), category: t('prepared_food', `Prepared Food`), netCarbs: 28 },
      { name: t('dosa_plain', `Dosa Plain`), category: t('prepared_food', `Prepared Food`), netCarbs: 30 },
      { name: t('masala_dosa', `Masala Dosa`), category: t('prepared_food', `Prepared Food`), netCarbs: 35 },
      { name: t('uttapam', `Uttapam`), category: t('prepared_food', `Prepared Food`), netCarbs: 27 },
      { name: t('medu_vada', `Medu Vada`), category: t('snacks', `Snacks`), netCarbs: 20 },
      { name: t('sabudana_khichdi', `Sabudana Khichdi`), category: t('prepared_food', `Prepared Food`), netCarbs: 40 },
      { name: t('sabudana_vada', `Sabudana Vada`), category: t('snacks', `Snacks`), netCarbs: 45 },
      { name: t('khichdi', `Khichdi`), category: t('prepared_food', `Prepared Food`), netCarbs: 20 },
      { name: t('curd_rice', `Curd Rice`), category: t('prepared_food', `Prepared Food`), netCarbs: 23 },
      { name: t('vegetable_pulao', `Vegetable Pulao`), category: t('prepared_food', `Prepared Food`), netCarbs: 25 },
      { name: t('jeera_rice', `Jeera Rice`), category: t('prepared_food', `Prepared Food`), netCarbs: 28 },
      { name: t('biryani_chicken', `Biryani Chicken`), category: t('prepared_food', `Prepared Food`), netCarbs: 30 },
      { name: t('biryani_veg', `Biryani Veg`), category: t('prepared_food', `Prepared Food`), netCarbs: 32 },
      { name: t('roti', `Roti`), category: t('flatbread', `Flatbread`), netCarbs: 45 },
      { name: t('chapati', `Chapati`), category: t('flatbread', `Flatbread`), netCarbs: 44 },
      { name: t('paratha', `Paratha`), category: t('flatbread', `Flatbread`), netCarbs: 50 },
      { name: t('aloo_paratha', `Aloo Paratha`), category: t('flatbread', `Flatbread`), netCarbs: 55 },
      { name: t('naan_butter', `Naan Butter`), category: t('flatbread', `Flatbread`), netCarbs: 49 },
      { name: t('garlic_naan', `Garlic Naan`), category: t('flatbread', `Flatbread`), netCarbs: 48 },
      { name: t('kulcha', `Kulcha`), category: t('flatbread', `Flatbread`), netCarbs: 50 },
      { name: t('bhatura', `Bhatura`), category: t('flatbread', `Flatbread`), netCarbs: 52 },
      { name: t('puri', `Puri`), category: t('flatbread', `Flatbread`), netCarbs: 48 },
      { name: t('thepla', `Thepla`), category: t('flatbread', `Flatbread`), netCarbs: 46 },
      { name: t('missi_roti', `Missi Roti`), category: t('flatbread', `Flatbread`), netCarbs: 40 },
      { name: t('besan_chilla', `Besan Chilla`), category: t('prepared_food', `Prepared Food`), netCarbs: 20 },
      { name: t('moong_dal_chilla', `Moong Dal Chilla`), category: t('prepared_food', `Prepared Food`), netCarbs: 18 },
      { name: t('rava_dhokla', `Rava Dhokla`), category: t('prepared_food', `Prepared Food`), netCarbs: 25 },
      { name: t('khaman_dhokla', `Khaman Dhokla`), category: t('prepared_food', `Prepared Food`), netCarbs: 27 },
      { name: t('handvo', `Handvo`), category: t('prepared_food', `Prepared Food`), netCarbs: 22 },
      { name: t('fafda', `Fafda`), category: t('snacks', `Snacks`), netCarbs: 35 },
      { name: t('sev', `Sev`), category: t('snacks', `Snacks`), netCarbs: 30 },
      { name: t('bhel_puri', `Bhel Puri`), category: t('snacks', `Snacks`), netCarbs: 40 },
      { name: t('sev_puri', `Sev Puri`), category: t('snacks', `Snacks`), netCarbs: 38 },
      { name: t('pani_puri', `Pani Puri`), category: t('snacks', `Snacks`), netCarbs: 45 },
      { name: t('dahi_puri', `Dahi Puri`), category: t('snacks', `Snacks`), netCarbs: 35 },
      { name: t('papdi_chaat', `Papdi Chaat`), category: t('snacks', `Snacks`), netCarbs: 38 },
      { name: t('aloo_chaat', `Aloo Chaat`), category: t('snacks', `Snacks`), netCarbs: 30 },
      { name: t('chole_bhature', `Chole Bhature`), category: t('prepared_food', `Prepared Food`), netCarbs: 50 },
      { name: t('rajma_chawal', `Rajma Chawal`), category: t('prepared_food', `Prepared Food`), netCarbs: 55 },
      { name: t('dal_chawal', `Dal Chawal`), category: t('prepared_food', `Prepared Food`), netCarbs: 52 },
      { name: t('kadhi_pakora', `Kadhi Pakora`), category: t('prepared_food', `Prepared Food`), netCarbs: 20 },
      { name: t('kadhi_plain', `Kadhi Plain`), category: t('prepared_food', `Prepared Food`), netCarbs: 10 },
      { name: t('lassi_sweet', `Lassi Sweet`), category: t('beverage', `Beverage`), netCarbs: 18 },
      { name: t('lassi_salted', `Lassi Salted`), category: t('beverage', `Beverage`), netCarbs: 6 },
      { name: t('buttermilk', `Buttermilk`), category: t('beverage', `Beverage`), netCarbs: 4 },
      { name: t('masala_chaas', `Masala Chaas`), category: t('beverage', `Beverage`), netCarbs: 3 },
      { name: t('tea_with_milk_sugar', `Tea With Milk Sugar`), category: t('beverage', `Beverage`), netCarbs: 10 },
      { name: t('tea_with_milk_no_sugar', `Tea With Milk No Sugar`), category: t('beverage', `Beverage`), netCarbs: 5 },
      { name: t('filter_coffee', `Filter Coffee`), category: t('beverage', `Beverage`), netCarbs: 3 },
      { name: t('cold_coffee', `Cold Coffee`), category: t('beverage', `Beverage`), netCarbs: 15 },
      { name: t('sugarcane_juice', `Sugarcane Juice`), category: t('beverage', `Beverage`), netCarbs: 25 },
      { name: t('jalebi', `Jalebi`), category: t('dessert', `Dessert`), netCarbs: 75 },
      { name: t('gulab_jamun', `Gulab Jamun`), category: t('dessert', `Dessert`), netCarbs: 60 },
      { name: t('rasgulla', `Rasgulla`), category: t('dessert', `Dessert`), netCarbs: 55 },
      { name: t('rasmalai', `Rasmalai`), category: t('dessert', `Dessert`), netCarbs: 45 },
      { name: t('kheer_rice', `Kheer Rice`), category: t('dessert', `Dessert`), netCarbs: 30 },
      { name: t('halwa_suji', `Halwa Suji`), category: t('dessert', `Dessert`), netCarbs: 50 },
      { name: t('halwa_gajar', `Halwa Gajar`), category: t('dessert', `Dessert`), netCarbs: 35 },
      { name: t('ladoo_besan', `Ladoo Besan`), category: t('dessert', `Dessert`), netCarbs: 55 },
      { name: t('ladoo_motichoor', `Ladoo Motichoor`), category: t('dessert', `Dessert`), netCarbs: 60 },
      { name: t('barfi_kaju', `Barfi Kaju`), category: t('dessert', `Dessert`), netCarbs: 30 },
      { name: t('barfi_coconut', `Barfi Coconut`), category: t('dessert', `Dessert`), netCarbs: 35 },
      { name: t('peda', `Peda`), category: t('dessert', `Dessert`), netCarbs: 45 },
      { name: t('kulfi', `Kulfi`), category: t('dessert', `Dessert`), netCarbs: 30 },
      { name: t('ice_cream_indian', `Ice Cream Indian`), category: t('dessert', `Dessert`), netCarbs: 28 },
    ];
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
