import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Dumbbell, Plus, Check, Trash2, Trophy, TrendingUp, Search, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';
import { logUserActivity } from '@/lib/db';
import { useTranslation } from "react-i18next";

interface Set {
  setNum: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface Exercise {
  name: string;
  sets: Set[];
  estimated1RM: number;
}

interface WorkoutSession {
  id: string;
  exercises: Exercise[];
  totalVolume: number;
  timestamp: string;
  date: string;
}

interface StrengthData {
  sessions: WorkoutSession[];
  personalRecords: Record<string, number>;
}

interface ExerciseInfo {
  name: string;
  targetMuscles: string[];
  setRepRange: string;
  formTip: string;
  commonMistakes: string[];
}

export default function StrengthTrainingGuide({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('StrengthTraining');
    const exerciseLibrary: ExerciseInfo[] = [
      {
        name: t('squat', `Squat`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('hamstrings', `Hamstrings`), t('core', `Core`)],
        setRepRange: t('3_5_sets_x_3_8_reps', `3-5 sets x 3-8 reps`),
        formTip: t('keep_chest_up_brace_core_weight_on_mid_f', `Keep chest up, brace core, weight on mid-foot, knees track over toes`),
        commonMistakes: [t('knees_cave_inward', `Knees cave inward`), t('lower_back_rounds', `Lower back rounds`), t('weight_shifts_to_toes', `Weight shifts to toes`)],
      },
      {
        name: t('deadlift', `Deadlift`),
        targetMuscles: [t('glutes', `Glutes`), t('hamstrings', `Hamstrings`), t('lower_back', `Lower Back`), t('core', `Core`), t('lats', `Lats`)],
        setRepRange: t('3_5_sets_x_3_6_reps', `3-5 sets x 3-6 reps`),
        formTip: t('keep_bar_close_hinge_at_hips_neutral_spi', `Keep bar close, hinge at hips, neutral spine, push floor away`),
        commonMistakes: [t('rounded_back', `Rounded back`), t('bar_drifts_forward', `Bar drifts forward`), t('hips_rise_too_fast', `Hips rise too fast`)],
      },
      {
        name: t('bench_press', `Bench Press`),
        targetMuscles: [t('chest', `Chest`), t('triceps', `Triceps`), t('front_delts', `Front Delts`)],
        setRepRange: t('3_5_sets_x_4_8_reps', `3-5 sets x 4-8 reps`),
        formTip: t('retract_shoulders_feet_planted_touch_low', `Retract shoulders, feet planted, touch lower chest with control`),
        commonMistakes: [t('elbows_flare_too_much', `Elbows flare too much`), t('bouncing_bar', `Bouncing bar`), t('lifting_hips_off_bench', `Lifting hips off bench`)],
      },
      {
        name: t('overhead_press', `Overhead Press`),
        targetMuscles: [t('shoulders', `Shoulders`), t('triceps', `Triceps`), t('core', `Core`), t('upper_chest', `Upper Chest`)],
        setRepRange: t('3_5_sets_x_4_8_reps', `3-5 sets x 4-8 reps`),
        formTip: t('brace_core_squeeze_glutes_press_bar_over', `Brace core, squeeze glutes, press bar overhead in straight path`),
        commonMistakes: [t('overarching_lower_back', `Overarching lower back`), t('pressing_forward', `Pressing forward`), t('incomplete_lockout', `Incomplete lockout`)],
      },
      {
        name: t('barbell_row', `Barbell Row`),
        targetMuscles: [t('lats', `Lats`), t('rhomboids', `Rhomboids`), t('rear_delts', `Rear Delts`), t('biceps', `Biceps`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_6_10_reps', `3-4 sets x 6-10 reps`),
        formTip: t('hinge_torso_pull_elbows_back_keep_spine_', `Hinge torso, pull elbows back, keep spine neutral`),
        commonMistakes: [t('jerking_weight', `Jerking weight`), t('rounded_back', `Rounded back`), t('standing_too_upright', `Standing too upright`)],
      },
      {
        name: t('pull_up', `Pull Up`),
        targetMuscles: [t('lats', `Lats`), t('biceps', `Biceps`), t('upper_back', `Upper Back`), t('core', `Core`)],
        setRepRange: t('3_5_sets_x_5_10_reps', `3-5 sets x 5-10 reps`),
        formTip: t('start_from_dead_hang_drive_elbows_down_c', `Start from dead hang, drive elbows down, chest toward bar`),
        commonMistakes: [t('kipping_excessively', `Kipping excessively`), t('half_reps', `Half reps`), t('shrugged_shoulders', `Shrugged shoulders`)],
      },
      {
        name: t('chin_up', `Chin Up`),
        targetMuscles: [t('lats', `Lats`), t('biceps', `Biceps`), t('upper_back', `Upper Back`)],
        setRepRange: t('3_5_sets_x_5_10_reps', `3-5 sets x 5-10 reps`),
        formTip: t('use_full_range_keep_chest_tall_control_l', `Use full range, keep chest tall, control lowering phase`),
        commonMistakes: [t('swinging_body', `Swinging body`), t('short_reps', `Short reps`), t('neck_reaching_upward', `Neck reaching upward`)],
      },
      {
        name: t('lat_pulldown', `Lat Pulldown`),
        targetMuscles: [t('lats', `Lats`), t('biceps', `Biceps`), t('mid_back', `Mid Back`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('pull_bar_to_upper_chest_keep_torso_sligh', `Pull bar to upper chest, keep torso slightly leaned back`),
        commonMistakes: [t('pulling_behind_neck', `Pulling behind neck`), t('using_momentum', `Using momentum`), t('shrugging_shoulders', `Shrugging shoulders`)],
      },
      {
        name: t('seated_cable_row', `Seated Cable Row`),
        targetMuscles: [t('mid_back', `Mid Back`), t('lats', `Lats`), t('biceps', `Biceps`), t('rear_delts', `Rear Delts`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('sit_tall_pull_handle_to_torso_squeeze_sh', `Sit tall, pull handle to torso, squeeze shoulder blades`),
        commonMistakes: [t('rounding_shoulders', `Rounding shoulders`), t('leaning_back_too_much', `Leaning back too much`), t('using_arms_only', `Using arms only`)],
      },
      {
        name: t('dumbbell_row', `Dumbbell Row`),
        targetMuscles: [t('lats', `Lats`), t('rhomboids', `Rhomboids`), t('biceps', `Biceps`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('keep_hips_square_pull_elbow_to_hip_contr', `Keep hips square, pull elbow to hip, control descent`),
        commonMistakes: [t('twisting_torso', `Twisting torso`), t('shrugging_shoulder', `Shrugging shoulder`), t('jerking_weight', `Jerking weight`)],
      },
      {
        name: t('romanian_deadlift', `Romanian Deadlift`),
        targetMuscles: [t('hamstrings', `Hamstrings`), t('glutes', `Glutes`), t('lower_back', `Lower Back`)],
        setRepRange: t('3_4_sets_x_6_10_reps', `3-4 sets x 6-10 reps`),
        formTip: t('soft_knees_hinge_hips_back_keep_dumbbell', `Soft knees, hinge hips back, keep dumbbells close`),
        commonMistakes: [t('turning_into_squat', `Turning into squat`), t('rounded_back', `Rounded back`), t('going_too_low', `Going too low`)],
      },
      {
        name: t('hip_thrust', `Hip Thrust`),
        targetMuscles: [t('glutes', `Glutes`), t('hamstrings', `Hamstrings`), t('core', `Core`)],
        setRepRange: t('3_5_sets_x_8_12_reps', `3-5 sets x 8-12 reps`),
        formTip: t('chin_tucked_ribs_down_squeeze_glutes_at_', `Chin tucked, ribs down, squeeze glutes at top`),
        commonMistakes: [t('overarching_back', `Overarching back`), t('pushing_through_toes', `Pushing through toes`), t('incomplete_lockout', `Incomplete lockout`)],
      },
      {
        name: t('lunge', `Lunge`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('hamstrings', `Hamstrings`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_8_12_reps_each_leg', `3-4 sets x 8-12 reps each leg`),
        formTip: t('step_long_enough_torso_tall_front_foot_p', `Step long enough, torso tall, front foot planted`),
        commonMistakes: [t('front_knee_collapsing_inward', `Front knee collapsing inward`), t('tiny_step_length', `Tiny step length`), t('leaning_forward', `Leaning forward`)],
      },
      {
        name: t('bulgarian_split_squat', `Bulgarian Split Squat`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('hamstrings', `Hamstrings`)],
        setRepRange: t('3_4_sets_x_8_12_reps_each_leg', `3-4 sets x 8-12 reps each leg`),
        formTip: t('front_foot_far_enough_forward_descend_st', `Front foot far enough forward, descend straight down`),
        commonMistakes: [t('pushing_off_rear_leg', `Pushing off rear leg`), t('wobbling_stance', `Wobbling stance`), t('knee_cave', `Knee cave`)],
      },
      {
        name: t('leg_press', `Leg Press`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('hamstrings', `Hamstrings`)],
        setRepRange: t('3_4_sets_x_10_15_reps', `3-4 sets x 10-15 reps`),
        formTip: t('keep_lower_back_on_pad_control_depth_dri', `Keep lower back on pad, control depth, drive evenly`),
        commonMistakes: [t('locking_knees_hard', `Locking knees hard`), t('butt_lifting_off_seat', `Butt lifting off seat`), t('shallow_reps', `Shallow reps`)],
      },
      {
        name: t('leg_extension', `Leg Extension`),
        targetMuscles: [t('quadriceps', `Quadriceps`)],
        setRepRange: t('3_4_sets_x_10_15_reps', `3-4 sets x 10-15 reps`),
        formTip: t('control_tempo_squeeze_quads_at_top', `Control tempo, squeeze quads at top`),
        commonMistakes: [t('swinging_weight', `Swinging weight`), t('slamming_stack', `Slamming stack`), t('partial_reps', `Partial reps`)],
      },
      {
        name: t('leg_curl', `Leg Curl`),
        targetMuscles: [t('hamstrings', `Hamstrings`)],
        setRepRange: t('3_4_sets_x_10_15_reps', `3-4 sets x 10-15 reps`),
        formTip: t('keep_hips_down_curl_smoothly_pause_at_co', `Keep hips down, curl smoothly, pause at contraction`),
        commonMistakes: [t('using_momentum', `Using momentum`), t('hips_lifting', `Hips lifting`), t('fast_negatives', `Fast negatives`)],
      },
      {
        name: t('calf_raise', `Calf Raise`),
        targetMuscles: [t('calves', `Calves`)],
        setRepRange: t('4_5_sets_x_10_20_reps', `4-5 sets x 10-20 reps`),
        formTip: t('full_stretch_at_bottom_pause_at_top', `Full stretch at bottom, pause at top`),
        commonMistakes: [t('bouncing_reps', `Bouncing reps`), t('short_range', `Short range`), t('leaning_excessively', `Leaning excessively`)],
      },
      {
        name: t('glute_bridge', `Glute Bridge`),
        targetMuscles: [t('glutes', `Glutes`), t('hamstrings', `Hamstrings`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_12_15_reps', `3-4 sets x 12-15 reps`),
        formTip: t('drive_through_heels_ribs_down_squeeze_gl', `Drive through heels, ribs down, squeeze glutes`),
        commonMistakes: [t('overarching_back', `Overarching back`), t('knees_flaring_too_much', `Knees flaring too much`), t('rushing_reps', `Rushing reps`)],
      },
      {
        name: t('push_up', `Push Up`),
        targetMuscles: [t('chest', `Chest`), t('triceps', `Triceps`), t('shoulders', `Shoulders`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_8_20_reps', `3-4 sets x 8-20 reps`),
        formTip: t('body_straight_hands_under_shoulders_ches', `Body straight, hands under shoulders, chest to floor`),
        commonMistakes: [t('sagging_hips', `Sagging hips`), t('flaring_elbows', `Flaring elbows`), t('half_reps', `Half reps`)],
      },
      {
        name: t('incline_dumbbell_press', `Incline Dumbbell Press`),
        targetMuscles: [t('upper_chest', `Upper Chest`), t('shoulders', `Shoulders`), t('triceps', `Triceps`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('shoulders_back_lower_dumbbells_with_cont', `Shoulders back, lower dumbbells with control`),
        commonMistakes: [t('bouncing_weights', `Bouncing weights`), t('excessive_arch', `Excessive arch`), t('elbows_too_wide', `Elbows too wide`)],
      },
      {
        name: t('dips', `Dips`),
        targetMuscles: [t('chest', `Chest`), t('triceps', `Triceps`), t('front_delts', `Front Delts`)],
        setRepRange: t('3_4_sets_x_6_12_reps', `3-4 sets x 6-12 reps`),
        formTip: t('lean_slightly_forward_shoulders_packed_f', `Lean slightly forward, shoulders packed, full control`),
        commonMistakes: [t('shrugging_shoulders', `Shrugging shoulders`), t('going_too_deep_painfully', `Going too deep painfully`), t('swinging', `Swinging`)],
      },
      {
        name: t('chest_fly', `Chest Fly`),
        targetMuscles: [t('chest', `Chest`), t('front_delts', `Front Delts`)],
        setRepRange: t('3_4_sets_x_10_15_reps', `3-4 sets x 10-15 reps`),
        formTip: t('soft_elbows_wide_arc_squeeze_chest_toget', `Soft elbows, wide arc, squeeze chest together`),
        commonMistakes: [t('too_much_elbow_bend', `Too much elbow bend`), t('dropping_too_low', `Dropping too low`), t('using_momentum', `Using momentum`)],
      },
      {
        name: t('lateral_raise', `Lateral Raise`),
        targetMuscles: [t('side_delts', `Side Delts`)],
        setRepRange: t('3_5_sets_x_12_20_reps', `3-5 sets x 12-20 reps`),
        formTip: t('raise_to_shoulder_height_lead_with_elbow', `Raise to shoulder height, lead with elbows`),
        commonMistakes: [t('swinging_torso', `Swinging torso`), t('shrugging_traps', `Shrugging traps`), t('going_too_heavy', `Going too heavy`)],
      },
      {
        name: t('rear_delt_fly', `Rear Delt Fly`),
        targetMuscles: [t('rear_delts', `Rear Delts`), t('upper_back', `Upper Back`)],
        setRepRange: t('3_4_sets_x_12_20_reps', `3-4 sets x 12-20 reps`),
        formTip: t('hinge_slightly_arms_wide_control_motion', `Hinge slightly, arms wide, control motion`),
        commonMistakes: [t('jerking_reps', `Jerking reps`), t('using_traps_only', `Using traps only`), t('neck_tension', `Neck tension`)],
      },
      {
        name: t('face_pull', `Face Pull`),
        targetMuscles: [t('rear_delts', `Rear Delts`), t('rotator_cuff', `Rotator Cuff`), t('upper_back', `Upper Back`)],
        setRepRange: t('3_4_sets_x_12_15_reps', `3-4 sets x 12-15 reps`),
        formTip: t('pull_rope_to_face_elbows_high_rotate_out', `Pull rope to face, elbows high, rotate outward`),
        commonMistakes: [t('lower_back_lean', `Lower back lean`), t('too_heavy', `Too heavy`), t('pulling_to_chest', `Pulling to chest`)],
      },
      {
        name: t('bicep_curl', `Bicep Curl`),
        targetMuscles: [t('biceps', `Biceps`), t('forearms', `Forearms`)],
        setRepRange: t('3_4_sets_x_8_15_reps', `3-4 sets x 8-15 reps`),
        formTip: t('keep_elbows_pinned_full_stretch_and_sque', `Keep elbows pinned, full stretch and squeeze`),
        commonMistakes: [t('swinging_body', `Swinging body`), t('elbows_drifting_forward', `Elbows drifting forward`), t('partial_reps', `Partial reps`)],
      },
      {
        name: t('hammer_curl', `Hammer Curl`),
        targetMuscles: [t('biceps', `Biceps`), t('brachialis', `Brachialis`), t('forearms', `Forearms`)],
        setRepRange: t('3_4_sets_x_8_15_reps', `3-4 sets x 8-15 reps`),
        formTip: t('neutral_grip_control_both_directions', `Neutral grip, control both directions`),
        commonMistakes: [t('using_momentum', `Using momentum`), t('shrugging_shoulders', `Shrugging shoulders`), t('fast_lowering', `Fast lowering`)],
      },
      {
        name: t('tricep_pushdown', `Tricep Pushdown`),
        targetMuscles: [t('triceps', `Triceps`)],
        setRepRange: t('3_4_sets_x_10_15_reps', `3-4 sets x 10-15 reps`),
        formTip: t('elbows_fixed_at_sides_full_extension', `Elbows fixed at sides, full extension`),
        commonMistakes: [t('elbows_moving_forward', `Elbows moving forward`), t('leaning_bodyweight', `Leaning bodyweight`), t('half_reps', `Half reps`)],
      },
      {
        name: t('skull_crusher', `Skull Crusher`),
        targetMuscles: [t('triceps', `Triceps`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('lower_behind_forehead_elbows_steady', `Lower behind forehead, elbows steady`),
        commonMistakes: [t('flaring_elbows', `Flaring elbows`), t('dropping_too_fast', `Dropping too fast`), t('excessive_weight', `Excessive weight`)],
      },
      {
        name: t('plank', `Plank`),
        targetMuscles: [t('core', `Core`), t('shoulders', `Shoulders`), t('glutes', `Glutes`)],
        setRepRange: t('3_4_sets_x_20_60_sec', `3-4 sets x 20-60 sec`),
        formTip: t('brace_abs_squeeze_glutes_body_straight_l', `Brace abs, squeeze glutes, body straight line`),
        commonMistakes: [t('sagging_hips', `Sagging hips`), t('holding_breath', `Holding breath`), t('looking_forward', `Looking forward`)],
      },
      {
        name: t('hanging_leg_raise', `Hanging Leg Raise`),
        targetMuscles: [t('lower_abs', `Lower Abs`), t('hip_flexors', `Hip Flexors`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_8_15_reps', `3-4 sets x 8-15 reps`),
        formTip: t('posteriorly_tilt_pelvis_control_swing', `Posteriorly tilt pelvis, control swing`),
        commonMistakes: [t('using_momentum', `Using momentum`), t('short_range', `Short range`), t('shrugged_shoulders', `Shrugged shoulders`)],
      },
      {
        name: t('russian_twist', `Russian Twist`),
        targetMuscles: [t('obliques', `Obliques`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_15_20_reps_each_side', `3-4 sets x 15-20 reps each side`),
        formTip: t('rotate_torso_keep_chest_lifted', `Rotate torso, keep chest lifted`),
        commonMistakes: [t('only_moving_arms', `Only moving arms`), t('rounded_back', `Rounded back`), t('going_too_fast', `Going too fast`)],
      },
      {
        name: t('farmer_carry', `Farmer Carry`),
        targetMuscles: [t('grip', `Grip`), t('traps', `Traps`), t('core', `Core`), t('glutes', `Glutes`)],
        setRepRange: t('3_5_sets_x_20_40_meters', `3-5 sets x 20-40 meters`),
        formTip: t('stand_tall_walk_controlled_shoulders_dow', `Stand tall, walk controlled, shoulders down`),
        commonMistakes: [t('leaning_sideways', `Leaning sideways`), t('tiny_steps_rushed', `Tiny steps rushed`), t('looking_down', `Looking down`)],
      },
      {
        name: t('shrug', `Shrug`),
        targetMuscles: [t('traps', `Traps`)],
        setRepRange: t('3_4_sets_x_10_15_reps', `3-4 sets x 10-15 reps`),
        formTip: t('lift_shoulders_straight_up_pause_briefly', `Lift shoulders straight up, pause briefly`),
        commonMistakes: [t('rolling_shoulders', `Rolling shoulders`), t('jerking_weight', `Jerking weight`), t('neck_jutting', `Neck jutting`)],
      },
      {
        name: t('arnold_press', `Arnold Press`),
        targetMuscles: [t('shoulders', `Shoulders`), t('triceps', `Triceps`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('rotate_smoothly_keep_core_tight', `Rotate smoothly, keep core tight`),
        commonMistakes: [t('overarching_back', `Overarching back`), t('too_heavy', `Too heavy`), t('inconsistent_path', `Inconsistent path`)],
      },
      {
        name: t('front_squat', `Front Squat`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('core', `Core`), t('upper_back', `Upper Back`)],
        setRepRange: t('3_5_sets_x_3_8_reps', `3-5 sets x 3-8 reps`),
        formTip: t('elbows_high_chest_proud_sit_between_hips', `Elbows high, chest proud, sit between hips`),
        commonMistakes: [t('elbows_dropping', `Elbows dropping`), t('heels_lifting', `Heels lifting`), t('rounded_upper_back', `Rounded upper back`)],
      },
      {
        name: t('sumo_deadlift', `Sumo Deadlift`),
        targetMuscles: [t('glutes', `Glutes`), t('hamstrings', `Hamstrings`), t('adductors', `Adductors`), t('core', `Core`)],
        setRepRange: t('3_5_sets_x_3_6_reps', `3-5 sets x 3-6 reps`),
        formTip: t('wide_stance_chest_tall_push_knees_out', `Wide stance, chest tall, push knees out`),
        commonMistakes: [t('hips_too_high', `Hips too high`), t('knees_collapsing', `Knees collapsing`), t('bar_far_from_body', `Bar far from body`)],
      },
      {
        name: t('goblet_squat', `Goblet Squat`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('core', `Core`)],
        setRepRange: t('3_4_sets_x_8_12_reps', `3-4 sets x 8-12 reps`),
        formTip: t('hold_weight_close_elbows_down_torso_upri', `Hold weight close, elbows down, torso upright`),
        commonMistakes: [t('falling_forward', `Falling forward`), t('heels_lifting', `Heels lifting`), t('shallow_depth', `Shallow depth`)],
      },
      {
        name: t('step_up', `Step Up`),
        targetMuscles: [t('quadriceps', `Quadriceps`), t('glutes', `Glutes`), t('hamstrings', `Hamstrings`)],
        setRepRange: t('3_4_sets_x_8_12_reps_each_leg', `3-4 sets x 8-12 reps each leg`),
        formTip: t('drive_through_top_foot_stand_fully_tall', `Drive through top foot, stand fully tall`),
        commonMistakes: [t('pushing_off_rear_foot', `Pushing off rear foot`), t('knee_cave', `Knee cave`), t('unstable_box', `Unstable box`)],
      },
    ];
    const exercises = [
      t('squat', `Squat`),
      t('deadlift', `Deadlift`),
      t('bench_press', `Bench Press`),
      t('overhead_press', `Overhead Press`),
      t('barbell_row', `Barbell Row`),
      t('pull_up', `Pull Up`),
      t('chin_up', `Chin Up`),
      t('lat_pulldown', `Lat Pulldown`),
      t('seated_cable_row', `Seated Cable Row`),
      t('dumbbell_row', `Dumbbell Row`),
      t('romanian_deadlift', `Romanian Deadlift`),
      t('hip_thrust', `Hip Thrust`),
      t('lunge', `Lunge`),
      t('bulgarian_split_squat', `Bulgarian Split Squat`),
      t('leg_press', `Leg Press`),
      t('leg_extension', `Leg Extension`),
      t('leg_curl', `Leg Curl`),
      t('calf_raise', `Calf Raise`),
      t('glute_bridge', `Glute Bridge`),
      t('push_up', `Push Up`),
      t('incline_dumbbell_press', `Incline Dumbbell Press`),
      t('dips', `Dips`),
      t('chest_fly', `Chest Fly`),
      t('lateral_raise', `Lateral Raise`),
      t('rear_delt_fly', `Rear Delt Fly`),
      t('face_pull', `Face Pull`),
      t('bicep_curl', `Bicep Curl`),
      t('hammer_curl', `Hammer Curl`),
      t('tricep_pushdown', `Tricep Pushdown`),
      t('skull_crusher', `Skull Crusher`),
      t('plank', `Plank`),
      t('hanging_leg_raise', `Hanging Leg Raise`),
      t('russian_twist', `Russian Twist`),
      t('farmer_carry', `Farmer Carry`),
      t('shrug', `Shrug`),
      t('arnold_press', `Arnold Press`),
      t('front_squat', `Front Squat`),
      t('sumo_deadlift', `Sumo Deadlift`),
      t('goblet_squat', `Goblet Squat`),
      t('step_up', `Step Up`),
    ];
  const [activeTab, setActiveTab] = useState<'log' | 'library' | 'progress'>('log');
  const [strengthData, setStrengthData] = useState<StrengthData>(() => {
    const saved = localStorage.getItem('strength-training-data');
    return saved ? JSON.parse(saved) : {
      sessions: [],
      personalRecords: {},
    };
  });

  // Current session state
  const [currentSession, setCurrentSession] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [currentExerciseSets, setCurrentExerciseSets] = useState<Set[]>([{ setNum: 1, weight: 0, reps: 0, completed: false }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('strength-training-data', JSON.stringify(strengthData));
  }, [strengthData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('strength_training');
      const sessions = dbLogs
        .filter(log => log.action_type === 'finish_workout')
        .map(log => {
          const p = log.payload;
          return {
            id: p.session_id,
            exercises: p.exercises.map((ex: any) => ({
              name: ex.name,
              sets: ex.sets.map((s: any) => ({ setNum: s.set_num, weight: s.weight, reps: s.reps, completed: true })),
              estimated1RM: ex.estimated_1rm,
            })),
            totalVolume: p.total_volume_kg,
            timestamp: p.timestamp,
            date: new Date(p.timestamp).toISOString().split('T')[0],
          } as WorkoutSession;
        });

      if (sessions.length > 0) {
        const personalRecords: Record<string, number> = {};
        sessions.forEach(session => {
          session.exercises.forEach(ex => {
            const currentPR = personalRecords[ex.name] || 0;
            if (ex.estimated1RM > currentPR) {
              personalRecords[ex.name] = ex.estimated1RM;
            }
          });
        });

        setStrengthData({
          sessions,
          personalRecords,
        });
      }
    };
    loadDbLogs();
  }, []);

  // Click outside dropdown to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps >= 37) return weight; // Formula breaks down at high reps
    return Math.round(weight * (36 / (37 - reps)));
  };

  const addSet = () => {
    setCurrentExerciseSets(prev => [
      ...prev,
      { setNum: prev.length + 1, weight: 0, reps: 0, completed: false }
    ]);
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    setCurrentExerciseSets(prev => prev.map((set, i) =>
      i === index ? { ...set, [field]: value } : set
    ));
  };

  const toggleSetCompletion = (index: number) => {
    setCurrentExerciseSets(prev => prev.map((set, i) =>
      i === index ? { ...set, completed: !set.completed } : set
    ));
  };

  const removeSet = (index: number) => {
    setCurrentExerciseSets(prev => prev.filter((_, i) => i !== index));
  };

  const completeExercise = () => {
    if (!selectedExercise || currentExerciseSets.length === 0) return;

    const completedSets = currentExerciseSets.filter(set => set.completed && set.weight > 0 && set.reps > 0);
    if (completedSets.length === 0) return;

    // Calculate max 1RM from completed sets
    const estimated1RM = Math.max(...completedSets.map(set => calculate1RM(set.weight, set.reps)));

    const exercise: Exercise = {
      name: selectedExercise,
      sets: completedSets,
      estimated1RM,
    };

    setCurrentSession(prev => [...prev, exercise]);

    // Check for PR
    const currentPR = strengthData.personalRecords[selectedExercise] || 0;
    if (estimated1RM > currentPR) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#475569', '#64748B', '#94A3B8'],
      });
    }

    // Reset for next exercise
    setSelectedExercise('');
    setCurrentExerciseSets([{ setNum: 1, weight: 0, reps: 0, completed: false }]);
  };

  const finishWorkout = () => {
    if (currentSession.length === 0) return;

    const totalVolume = currentSession.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exTotal, set) => {
        return exTotal + (set.weight * set.reps);
      }, 0);
    }, 0);

    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      exercises: currentSession,
      totalVolume,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    // Update PRs
    const newPRs = { ...strengthData.personalRecords };
    currentSession.forEach(exercise => {
      const currentPR = newPRs[exercise.name] || 0;
      if (exercise.estimated1RM > currentPR) {
        newPRs[exercise.name] = exercise.estimated1RM;
      }
    });

    setStrengthData(prev => ({
      sessions: [newSession, ...prev.sessions],
      personalRecords: newPRs,
    }));

    // Log to console for database integration
    logUserActivity('strength_training', 'finish_workout', {
      session_id: newSession.id,
      exercises: currentSession.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ set_num: s.setNum, weight: s.weight, reps: s.reps })),
        estimated_1rm: ex.estimated1RM,
      })),
      total_volume_kg: totalVolume,
      timestamp: newSession.timestamp,
    });

    // Celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#64748B', '#94A3B8', '#CBD5E1'],
    });

    // Reset session
    setCurrentSession([]);
  };

  const getWeeklyVolumeData = () => {
    const weeks: Record<string, number> = {};

    strengthData.sessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weeks[weekKey] = (weeks[weekKey] || 0) + session.totalVolume;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, volume]) => ({
        week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume),
      }));
  };

  const get1RMProgressionData = (exerciseName: string) => {
    return strengthData.sessions
      .filter(session => session.exercises.some(ex => ex.name === exerciseName))
      .slice(-10)
      .reverse()
      .map(session => {
        const exercise = session.exercises.find(ex => ex.name === exerciseName);
        return {
          date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          oneRM: exercise?.estimated1RM || 0,
        };
      });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back_to_dashboard')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl p-3">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t('strength_training')}</h1>
              <p className="text-sm text-gray-500">{t('track_your_lifts_and_build_progressive_s')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('log_workout')}
                                </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('exercise_library')}
                                </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('strength_progress')}
                                </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: Log Workout */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Exercise Selector */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t('select_exercise')}</h3>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 flex items-center justify-between bg-white"
                  >
                    <span className={selectedExercise ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedExercise || t('choose_an_exercise', 'Choose an exercise...')}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-slate-500 shadow-lg"
                      >
                        {/* Search Input Inside Dropdown */}
                        <div className="p-3 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={t('search_exercises')}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-slate-500 focus:outline-none focus:border-slate-600"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Exercise List (Max 5 visible with scroll) */}
                        <div className="max-h-[240px] overflow-y-auto">
                          {exercises
                            .filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((ex, index) => (
                              <button
                                key={ex}
                                onClick={() => {
                                  setSelectedExercise(ex);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-gray-900">{ex}</span>
                              </button>
                            ))}
                          {exercises.filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-500">
                              {t('no_exercises_found')}
                                                                                      </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Set Entry */}
              {selectedExercise && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-6 border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">{selectedExercise}</h3>
                  <div className="space-y-3">
                    {currentExerciseSets.map((set, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl ${
                          set.completed ? 'bg-green-50 border-2 border-green-400' : 'bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        <div className="col-span-1 text-center font-semibold text-gray-700">
                          {set.setNum}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                            placeholder={t('weight_kg')}
                            disabled={set.completed}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                            placeholder={t('reps')}
                            disabled={set.completed}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleSetCompletion(index)}
                            className={`p-2 rounded-lg transition-all ${
                              set.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            <Check className="w-5 h-5" />
                          </motion.button>
                          <button
                            onClick={() => removeSet(index)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        {set.completed && set.weight > 0 && set.reps > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-12 text-sm text-gray-600 text-center"
                          >
                            {t('est_1rm')} <span className="font-bold text-slate-700">{calculate1RM(set.weight, set.reps)}{t('kg')}</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={addSet}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {t('add_set')}
                                                              </button>
                    <button
                      onClick={completeExercise}
                      disabled={currentExerciseSets.filter(s => s.completed).length === 0}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {t('complete_exercise')}
                                                              </button>
                  </div>
                </motion.div>
              )}

              {/* Current Session Summary */}
              {currentSession.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('today_s_session')}</h3>
                  <div className="space-y-3 mb-4">
                    {currentSession.map((exercise, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                          <span className="text-sm font-bold text-slate-700">
                            {t('1rm')} {exercise.estimated1RM}{t('kg')}
                                                              </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {exercise.sets.length} {t('sets')} {exercise.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0)}{t('kg_total_volume')}
                                                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={finishWorkout}
                    className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    {t('finish_workout')}
                                                        </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 2: Exercise Library */}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('exercise_library')}</h2>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={librarySearchQuery}
                    onChange={(e) => {
                      setLibrarySearchQuery(e.target.value);
                      setShowAllExercises(false);
                    }}
                    placeholder={t('search_exercises')}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-6">
                  {exerciseLibrary
                    .filter(exercise =>
                      exercise.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                      exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                    )
                    .slice(0, showAllExercises ? undefined : 5)
                    .map((exercise, index) => (
                    <motion.div
                      key={exercise.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-50 rounded-xl p-6 border border-slate-200"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{exercise.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {exercise.targetMuscles.map(muscle => (
                              <span
                                key={muscle}
                                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                          <div className="mb-3">
                            <span className="text-sm font-semibold text-slate-700">{t('recommended')} </span>
                            <span className="text-sm text-gray-600">{exercise.setRepRange}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <span className="text-blue-600">✓</span> {t('form_tip')}
                                                            </h4>
                        <p className="text-sm text-gray-700">{exercise.formTip}</p>
                      </div>

                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {t('common_mistakes')}
                                                            </h4>
                        <ul className="space-y-1">
                          {exercise.commonMistakes.map((mistake, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-red-600 mt-0.5">•</span>
                              <span>{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Show More Button */}
                {!showAllExercises && exerciseLibrary.filter(exercise =>
                  exercise.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                  exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                ).length > 5 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllExercises(true)}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                      {t('show_more_exercises')}{exerciseLibrary.filter(exercise =>
                        exercise.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                        exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                      ).length - 5} {t('more')}
                                                              </button>
                  </div>
                )}

                {showAllExercises && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllExercises(false)}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                      {t('show_less')}
                                                              </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 3: Strength Progress */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Personal Records */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t('personal_records_1rm')}</h3>
                {Object.keys(strengthData.personalRecords).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(strengthData.personalRecords).map(([exercise, pr]) => (
                      <div
                        key={exercise}
                        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-6 h-6 text-yellow-600" />
                          <h4 className="font-semibold text-gray-900">{exercise}</h4>
                        </div>
                        <p className="text-3xl font-bold text-slate-700">{pr}{t('kg')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">{t('complete_a_workout_to_see_your_prs')}</p>
                )}
              </div>

              {/* Volume Chart */}
              {getWeeklyVolumeData().length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-slate-600" />
                    <h3 className="font-semibold text-gray-900">{t('weekly_volume_progression')}</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getWeeklyVolumeData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar key="bar-volume" dataKey="volume" fill="#475569" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 1RM Progression for Main Lift */}
              {Object.keys(strengthData.personalRecords).length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('1rm_progression')}</h3>
                  {Object.keys(strengthData.personalRecords).slice(0, 1).map(exerciseName => {
                    const data = get1RMProgressionData(exerciseName);
                    if (data.length === 0) return null;

                    return (
                      <div key={exerciseName}>
                        <p className="text-sm text-gray-600 mb-4">{exerciseName}</p>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis label={{ value: '1RM (kg)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip />
                              <Legend />
                              <Line
                                key="line-1rm"
                                type="monotone"
                                dataKey="oneRM"
                                stroke="#475569"
                                strokeWidth={3}
                                name="Estimated 1RM"
                                dot={{ fill: '#475569', r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {strengthData.sessions.length === 0 && (
                <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                  <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{t('no_workouts_logged_yet')}</h3>
                  <p className="text-sm text-gray-600">{t('start_logging_your_lifts_to_track_your_p')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
