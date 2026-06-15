import { pool, getSessionUserId } from './db';

// Food Diary Entry
export interface FoodDiaryEntry {
  id: string;
  meals: any[];
  feelings: string;
  reflection: string;
  date: string;
}

// Meal Plan Entry
export interface MealPlanEntry {
  id: string;
  meals: any;
  reflection: string;
  date: string;
}

// Sugar Entry
export interface SugarEntry {
  id: string;
  total: number;
  score: number;
  level: string;
  date: string;
}

// Recipe Entry
export interface RecipeEntry {
  id: string;
  name: string;
  ingredients: string;
  instructions: string;
  time: string;
  mealType: string;
  rating: number;
  healthiness: string;
  tags: string[];
  photo?: string;
  reflection: string;
  date: string;
}

/**
 * Persists Food Diary Entry
 */
export async function saveFoodDiaryEntry(entry: FoodDiaryEntry) {
  const userId = getSessionUserId() || 'anonymous';
  try {
    await pool.query(
      `INSERT INTO food_diary_entries (id, user_id, meals, feelings, reflection, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
       meals = EXCLUDED.meals, feelings = EXCLUDED.feelings, reflection = EXCLUDED.reflection`,
      [entry.id, userId, JSON.stringify(entry.meals), entry.feelings, entry.reflection, entry.date]
    );
  } catch (e) {
    console.error('Failed to save food diary entry to DB', e);
  }
}

export async function fetchFoodDiaryEntries(): Promise<FoodDiaryEntry[]> {
  const userId = getSessionUserId();
  if (!userId) return [];
  try {
    const res = await pool.query(
      'SELECT * FROM food_diary_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map(r => ({
      id: r.id,
      meals: r.meals,
      feelings: r.feelings,
      reflection: r.reflection,
      date: r.date.toISOString().split('T')[0]
    }));
  } catch (e) {
    console.error('Failed to fetch food diary entries', e);
    return [];
  }
}

/**
 * Persists Meal Plan Entry
 */
export async function saveMealPlanEntry(entry: MealPlanEntry) {
  const userId = getSessionUserId() || 'anonymous';
  try {
    await pool.query(
      `INSERT INTO meal_plan_entries (id, user_id, meals, reflection, date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
       meals = EXCLUDED.meals, reflection = EXCLUDED.reflection`,
      [entry.id, userId, JSON.stringify(entry.meals), entry.reflection, entry.date]
    );
  } catch (e) {
    console.error('Failed to save meal plan entry to DB', e);
  }
}

export async function fetchMealPlanEntries(): Promise<MealPlanEntry[]> {
  const userId = getSessionUserId();
  if (!userId) return [];
  try {
    const res = await pool.query(
      'SELECT * FROM meal_plan_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map(r => ({
      id: r.id,
      meals: r.meals,
      reflection: r.reflection,
      date: r.date.toISOString().split('T')[0]
    }));
  } catch (e) {
    console.error('Failed to fetch meal plan entries', e);
    return [];
  }
}

/**
 * Persists Sugar Entry
 */
export async function saveSugarEntry(entry: SugarEntry) {
  const userId = getSessionUserId() || 'anonymous';
  try {
    await pool.query(
      `INSERT INTO sugar_entries (id, user_id, total_sugar, score, level, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, userId, entry.total, entry.score, entry.level, entry.date]
    );
  } catch (e) {
    console.error('Failed to save sugar entry to DB', e);
  }
}

export async function fetchSugarEntries(): Promise<SugarEntry[]> {
  const userId = getSessionUserId();
  if (!userId) return [];
  try {
    const res = await pool.query(
      'SELECT * FROM sugar_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map(r => ({
      id: r.id,
      total: Number(r.total_sugar),
      score: Number(r.score),
      level: r.level,
      date: r.date.toISOString().split('T')[0]
    }));
  } catch (e) {
    console.error('Failed to fetch sugar entries', e);
    return [];
  }
}

/**
 * Persists Healthy Recipe
 */
export async function saveHealthyRecipe(entry: RecipeEntry) {
  const userId = getSessionUserId() || 'anonymous';
  try {
    await pool.query(
      `INSERT INTO healthy_recipes 
       (id, user_id, name, ingredients, instructions, prep_time, meal_type, rating, healthiness, tags, photo, reflection, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, ingredients = EXCLUDED.ingredients, instructions = EXCLUDED.instructions, 
       prep_time = EXCLUDED.prep_time, rating = EXCLUDED.rating, reflection = EXCLUDED.reflection`,
      [
        entry.id, userId, entry.name, entry.ingredients, entry.instructions, 
        entry.time, entry.mealType, entry.rating, entry.healthiness, 
        entry.tags, entry.photo, entry.reflection, entry.date
      ]
    );
  } catch (e) {
    console.error('Failed to save healthy recipe to DB', e);
  }
}

export async function fetchHealthyRecipes(): Promise<RecipeEntry[]> {
  const userId = getSessionUserId();
  if (!userId) return [];
  try {
    const res = await pool.query(
      'SELECT * FROM healthy_recipes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      ingredients: r.ingredients,
      instructions: r.instructions,
      time: r.prep_time,
      mealType: r.meal_type,
      rating: r.rating,
      healthiness: r.healthiness,
      tags: r.tags,
      photo: r.photo,
      reflection: r.reflection,
      date: r.date.toISOString().split('T')[0]
    }));
  } catch (e) {
    console.error('Failed to fetch healthy recipes', e);
    return [];
  }
}
