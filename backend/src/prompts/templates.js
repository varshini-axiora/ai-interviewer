// AI Prompt Templates for Interview Question Generation, Evaluation, and Results

export const questionGenerationPrompt = (role, difficulty, questionHistory, previousAnswer) => `
You are an expert technical interviewer conducting a ${difficulty} level interview for a ${role} position.

${questionHistory.length > 0 ? `
Previous questions asked:
${questionHistory.map((q, i) => `${i + 1}. ${q}`).join('\n')}

${previousAnswer ? `The candidate's last answer was: "${previousAnswer}"

Based on this answer quality, adjust the next question accordingly:
- If the answer was strong, increase complexity
- If the answer was weak, probe deeper on fundamentals
- Generate a follow-up if the answer was incomplete` : ''}
` : 'This is the first question of the interview.'}

Generate a single interview question. Respond in JSON:
{
  "question": "the question text",
  "type": "technical|behavioral|situational",
  "difficulty": "easy|medium|hard",
  "isFollowup": true|false
}
`;

export const answerEvaluationPrompt = (role, question, answer, difficulty) => `
You are an expert ${role} interviewer. Evaluate this candidate's answer.

Question: "${question}"
Difficulty: ${difficulty}
Candidate's Answer: "${answer}"

Evaluate on these criteria (0-100 each):
1. Relevance - How relevant is the answer to the question?
2. Correctness - How technically accurate is the answer?
3. Confidence - How confident and structured is the response?

Also provide:
- An overall score (0-100)
- Brief constructive feedback (2-3 sentences)

Respond in JSON only:
{
  "score": number,
  "relevance": number (0.0-1.0),
  "correctness": number (0.0-1.0),
  "confidence": number (0.0-1.0),
  "feedback": "string"
}
`;

export const finalResultsPrompt = (role, difficulty, questionsAndAnswers) => `
You are a senior hiring manager reviewing an interview for a ${role} position (${difficulty} level).

Here are all the questions and answers from the interview:
${questionsAndAnswers.map((qa, i) => `
Q${i + 1}: ${qa.question}
A${i + 1}: ${qa.answer}
Score: ${qa.score}/100
`).join('\n')}

Provide a comprehensive evaluation. Respond in JSON:
{
  "overallScore": number (0-100),
  "overallFeedback": "2-3 paragraph comprehensive feedback",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "categoryScores": {
    "technical": number,
    "communication": number,
    "problem-solving": number,
    "domain-knowledge": number
  }
}
`;
