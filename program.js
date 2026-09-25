const PROGRAM = {
  warmup: {
    title: "Warm-Up (do before every session)",
    items: [
      {
        name: "World's Greatest Stretch Walking (dynamic)",
        steps: [
          "Stand tall.",
          "Step out like stepping over a puddle.",
          "Elbow to instep.",
          "Twist away.",
          "Frame the foot: one hand on each side.",
          "Straighten front leg.",
          "Draw hands back toward heel, rock back on heel.",
          "Step forward, reach up tall, repeat.",
          "1-2 rounds, keep moving."
        ]
      },
      {
        name: "Kick Series (dynamic)",
        steps: [
          "Lie in Jesus pose, arms out, legs straight.",
          "Right leg up, kick straight up.",
          "Left leg up, kick straight up.",
          "Right leg folds over and back (never touches down).",
          "Left leg folds over and back.",
          "Right leg: kick up + fold over + back + down.",
          "Left leg: kick up + fold over + back + down.",
          "~12 reps each. 1 round."
        ]
      }
    ]
  },
  cooldown: {
    title: "Cool-Down (do after every session)",
    items: [
      {
        name: "World's Greatest Stretch Walking (slow)",
        steps: [
          "Same movement pattern as warm-up.",
          "Slower pace, longer holds.",
          "1 round. Breathe easily."
        ]
      },
      {
        name: "Kick Series (slow)",
        steps: [
          "Same sequence as warm-up.",
          "Slow and controlled.",
          "1 round. Focus on breathing and range."
        ]
      }
    ]
  },
  plans: {
    A: {
      name: "Plan A — Pulling Day",
      exercises: [
        {
          name: "Smith Machine Body Row",
          type: "main",
          notes: "Horizontal pull-up under the Smith bar. Keep body straight, pull chest to bar, lower controlled.",
          rampUp: [
            { label: "W1", reps: 12, note: "easiest variation" },
            { label: "W2", reps: 4,  note: "harder variation" },
            { label: "W3", reps: 4,  note: "harder variation" },
            { label: "W4", reps: 3,  note: "work position" }
          ],
          workSets: 4,
          workReps: "8-10"
        },
        { name: "Lat Pulldown",     type: "support", workSets: 4, workReps: "8-10" },
        { name: "Seated Cable Row", type: "support", workSets: 4, workReps: "8-10" },
        { name: "Face Pull",        type: "support", workSets: 4, workReps: "8-10" },
        { name: "Dumbbell Curl",    type: "support", workSets: 4, workReps: "8-10" },
        { name: "Wrist Curl",       type: "support", workSets: 4, workReps: "8-10",
          notes: "Forearms. Palms up, curl wrists toward you." }
      ]
    },
    B: {
      name: "Plan B — Pushing Day",
      exercises: [
        {
          name: "Push-Ups",
          type: "main",
          notes: "Keep body straight, full range, control the descent.",
          rampUp: [
            { label: "W1", reps: 12, note: "easiest variation (incline)" },
            { label: "W2", reps: 4,  note: "harder variation" },
            { label: "W3", reps: 4,  note: "harder variation" },
            { label: "W4", reps: 3,  note: "work variation" }
          ],
          workSets: 4,
          workReps: "8-10"
        },
        { name: "Seated Dumbbell Shoulder Press", type: "support", workSets: 4, workReps: "8-10" },
        { name: "Machine Chest Press",            type: "support", workSets: 4, workReps: "8-10" },
        { name: "Triceps Pushdown",               type: "support", workSets: 4, workReps: "8-10" },
        { name: "Reverse Wrist Curl",             type: "support", workSets: 4, workReps: "8-10",
          notes: "Palms face down. Roll knuckles back toward you." }
      ]
    },
    C: {
      name: "Plan C — Squat / Leg Day",
      exercises: [
        {
          name: "Split Squat",
          type: "main",
          notes: "No barbell. Dumbbells or bodyweight. Front foot flat, back foot behind. Back knee toward floor, front knee tracks over toes. Drive up through front foot.",
          rampUp: [
            { label: "W1", reps: 8, note: "bodyweight, each leg" },
            { label: "W2", reps: 6, note: "~50% working load, each leg" },
            { label: "W3", reps: 4, note: "~85-90% working load, each leg" }
          ],
          workSets: 4,
          workReps: "6 each leg"
        },
        { name: "Leg Press",     type: "support", workSets: 4, workReps: "8-10" },
        { name: "Leg Curl",      type: "support", workSets: 4, workReps: "8-10" },
        { name: "Leg Extension", type: "support", workSets: 4, workReps: "8-10" },
        { name: "Calf Raise",    type: "support", workSets: 4, workReps: "8-10" }
      ]
    }
  }
};
