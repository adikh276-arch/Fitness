const fs = require('fs');
const path = require('path');

const updates = [
  {
    file: 'src/app/components/BMICalculator.tsx',
    ns: 'BMICalculator',
    replacements: [
      {
        from: `<span>{record.weight} {record.unit === 'metric' ? 'kg' : 'lbs'}</span>`,
        to: `<span>{record.weight} {record.unit === 'metric' ? t('kg', 'kg') : t('lbs', 'lbs')}</span>`,
        keys: { 'kg': 'kg', 'lbs': 'lbs' }
      }
    ]
  },
  {
    file: 'src/app/components/FlexibilityMobilityGuide.tsx',
    ns: 'FlexibilityMobility',
    replacements: [
      {
        from: `overall_status: totalPoints >= 6 ? 'Elite Mobility' : totalPoints >= 4 ? 'Good Mobility' : 'Limited Mobility',`,
        to: `overall_status: totalPoints >= 6 ? t('elite_mobility', 'Elite Mobility') : totalPoints >= 4 ? t('good_mobility', 'Good Mobility') : t('limited_mobility', 'Limited Mobility'),`,
        keys: { 'elite_mobility': 'Elite Mobility', 'good_mobility': 'Good Mobility', 'limited_mobility': 'Limited Mobility' }
      }
    ]
  },
  {
    file: 'src/app/components/KetoBasicsGuide.tsx',
    ns: 'KetoBasics',
    replacements: [
      {
        from: `const ketosisProb = todayHabits.under_limit ? 'High' : anyHabitsChecked ? 'Medium' : 'Low';`,
        to: `const ketosisProb = todayHabits.under_limit ? t('high', 'High') : anyHabitsChecked ? t('medium', 'Medium') : t('low', 'Low');`,
        keys: { 'high': 'High', 'medium': 'Medium', 'low': 'Low' }
      },
      {
        from: `{t('net_carbs_per_100g_serving')} {!searchQuery && '(Popular items - use search to see more)'}`,
        to: `{t('net_carbs_per_100g_serving')} {!searchQuery && t('popular_items_use_search_to_se', '(Popular items - use search to see more)')}`,
        keys: { 'popular_items_use_search_to_se': '(Popular items - use search to see more)' }
      },
      {
        from: `{t('high_carb_foods_that_will_kick_you_out_o')} {!searchQuery && '(Popular items - use search to see more)'}`,
        to: `{t('high_carb_foods_that_will_kick_you_out_o')} {!searchQuery && t('popular_items_use_search_to_se', '(Popular items - use search to see more)')}`,
        keys: {}
      }
    ]
  },
  {
    file: 'src/app/components/PostureCorrectionGuide.tsx',
    ns: 'PostureCorrection',
    replacements: [
      {
        from: `{selectedSymptoms.length > 0 ? 'Recommended Routines' : 'All Desk Break Routines'}`,
        to: `{selectedSymptoms.length > 0 ? t('recommended_routines', 'Recommended Routines') : t('all_desk_break_routines', 'All Desk Break Routines')}`,
        keys: { 'recommended_routines': 'Recommended Routines', 'all_desk_break_routines': 'All Desk Break Routines' }
      }
    ]
  },
  {
    file: 'src/app/components/StrengthTrainingGuide.tsx',
    ns: 'StrengthTraining',
    replacements: [
      {
        from: `{selectedExercise || 'Choose an exercise...'}`,
        to: `{selectedExercise || t('choose_an_exercise', 'Choose an exercise...')}`,
        keys: { 'choose_an_exercise': 'Choose an exercise...' }
      }
    ]
  },
  {
    file: 'src/app/components/YogaFlexibilityGuide.tsx',
    ns: 'YogaFlexibility',
    replacements: [
      {
        from: `{breathPhase === 'inhale' ? 'Breathe In...' : 'Breathe Out...'}`,
        to: `{breathPhase === 'inhale' ? t('breathe_in', 'Breathe In...') : t('breathe_out', 'Breathe Out...')}`,
        keys: { 'breathe_in': 'Breathe In...', 'breathe_out': 'Breathe Out...' }
      },
      {
        from: `{isPaused ? 'Paused - Press Play to continue' : activeFlow === 'desk-relief' ? 'Stretch changes every 2 minutes' : 'Focus on your breath and alignment'}`,
        to: `{isPaused ? t('paused_press_play', 'Paused - Press Play to continue') : activeFlow === 'desk-relief' ? t('stretch_changes_every_2_minut', 'Stretch changes every 2 minutes') : t('focus_on_your_breath_and_alig', 'Focus on your breath and alignment')}`,
        keys: { 'paused_press_play': 'Paused - Press Play to continue', 'stretch_changes_every_2_minut': 'Stretch changes every 2 minutes', 'focus_on_your_breath_and_alig': 'Focus on your breath and alignment' }
      }
    ]
  }
];

let filesToTranslate = new Set();

for (const update of updates) {
  const filePath = path.join(process.cwd(), update.file);
  let content = fs.readFileSync(filePath, 'utf-8');
  for (const rep of update.replacements) {
    if (content.includes(rep.from)) {
       content = content.replace(rep.from, rep.to);
    } else {
       console.log("Could not find string in", update.file, ":", rep.from);
    }
    
    // update json
    if (Object.keys(rep.keys).length > 0) {
      const jsonPath = path.join(process.cwd(), 'src/lib/locales/en', `${update.ns}.json`);
      const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      let added = false;
      for (const [k, v] of Object.entries(rep.keys)) {
        if (!json[k]) {
           json[k] = v;
           added = true;
        }
      }
      if (added) {
        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
        filesToTranslate.add(`${update.ns}.json`);
      }
    }
  }
  fs.writeFileSync(filePath, content);
}

// Write the files to translate so the next script knows what to process
fs.writeFileSync('files-to-translate.txt', Array.from(filesToTranslate).join('\n'));
console.log("Patch complete! Next, run translation on: ", Array.from(filesToTranslate).join(', '));
