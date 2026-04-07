// Quiz Data - "Which TikTok Character Are You?"
// Maps directly to GDD Section 3

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    text: "Pick your vibe",
    answers: [
      { label: "A", text: "Chaos king/queen — wild energy", value: 1 },
      { label: "B", text: "Clean and aesthetic — curated perfection", value: 2 },
      { label: "C", text: "Comfy king — lounging content", value: 3 },
      { label: "D", text: "Drama llama — always something going on", value: 4 }
    ]
  },
  {
    id: 2,
    text: "Your ideal upload time",
    answers: [
      { label: "A", text: "3AM — no sleep, no filter", value: 1 },
      { label: "B", text: "Peak hours — 6-9PM for max views", value: 2 },
      { label: "C", text: "Golden hour — soft lighting aesthetic", value: 3 },
      { label: "D", text: "When the drama is hot — moment matters most", value: 4 }
    ]
  },
  {
    id: 3,
    text: "Sound matters because...",
    answers: [
      { label: "A", text: "The beat is the story", value: 1 },
      { label: "B", text: "It sets the aesthetic mood", value: 2 },
      { label: "C", text: "Good sound = cozy ASMR vibes", value: 3 },
      { label: "D", text: "It's the tea announcer", value: 4 }
    ]
  },
  {
    id: 4,
    text: "Pick a collaboration style",
    answers: [
      { label: "A", text: "Tag everyone, duel anyone", value: 1 },
      { label: "B", text: "Matching aesthetics only", value: 2 },
      { label: "C", text: "Duets only, I'm chill", value: 3 },
      { label: "D", text: "I start the trends they follow", value: 4 }
    ]
  },
  {
    id: 5,
    text: "Your comment section energy",
    answers: [
      { label: "A", text: "I'm in the replies starting discourse", value: 1 },
      { label: "B", text: "I reply to spread positivity", value: 2 },
      { label: "C", text: "I read every reply like a cozy newsletter", value: 3 },
      { label: "D", text: "I screenshot and react", value: 4 }
    ]
  }
];

export const RESULT_TYPES = {
  TYPE_1: {
    id: "algorithm_gambler",
    name: "The Algorithm Gambler",
    range: [5, 8],
    scoreRange: "5–8",
    description: "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
    visualTheme: {
      backgroundColor: "#FE2C55",
      particleColor: "#FF6B8A",
      emoji: "fire",
      accentColor: "#FF9EC4"
    }
  },
  TYPE_2: {
    id: "aesthetic_architect",
    name: "The Aesthetic Architect",
    range: [9, 12],
    scoreRange: "9–12",
    description: "Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand.",
    visualTheme: {
      backgroundColor: "#25F4EE",
      particleColor: "#7FFEFF",
      emoji: "sparkle",
      accentColor: "#FFE29A"
    }
  },
  TYPE_3: {
    id: "comfy_king",
    name: "The Comfy King/Queen",
    range: [13, 16],
    scoreRange: "13–16",
    description: "Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand.",
    visualTheme: {
      backgroundColor: "#FF8C42",
      particleColor: "#FFB347",
      emoji: "cloud",
      accentColor: "#FFD1DC"
    }
  },
  TYPE_4: {
    id: "drama_magnet",
    name: "The Drama Magnet",
    range: [17, 20],
    scoreRange: "17–20",
    description: "The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.",
    visualTheme: {
      backgroundColor: "#9B59B6",
      particleColor: "#D4A5FF",
      emoji: "star",
      accentColor: "#FF79C6"
    }
  }
};

export function calculateResult(totalScore) {
  for (const type of Object.values(RESULT_TYPES)) {
    if (totalScore >= type.range[0] && totalScore <= type.range[1]) {
      return type;
    }
  }
  // Fallback to middle
  return RESULT_TYPES.TYPE_2;
}
