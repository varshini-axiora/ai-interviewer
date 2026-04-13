export function scoreAnswer(answerText) {
  const normalizedLength = Math.min(answerText.trim().length, 400);
  const score = 40 + (normalizedLength / 400) * 60;
  const rounded = Math.round(score * 100) / 100;

  if (rounded >= 80) {
    return {
      score: rounded,
      feedback: 'Strong answer with good detail for MVP evaluation.',
    };
  }

  if (rounded >= 60) {
    return {
      score: rounded,
      feedback: 'Decent answer. Add more depth and concrete examples.',
    };
  }

  return {
    score: rounded,
    feedback: 'Answer is too short. Expand reasoning and examples.',
  };
}

