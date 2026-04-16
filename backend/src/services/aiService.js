// AI Service — handles LLM calls with demo fallback
// Supports OpenAI and Anthropic (Claude). Falls back to smart demo responses.

import {
  questionGenerationPrompt,
  answerEvaluationPrompt,
  finalResultsPrompt,
} from '../prompts/templates.js';

const provider = process.env.AI_PROVIDER || 'demo';

// ---- Demo question banks ----
const DEMO_QUESTIONS = {
  'software-engineer': [
    { q: 'Explain the difference between a stack and a queue. When would you use each?', type: 'technical', difficulty: 'easy' },
    { q: 'What is the time complexity of searching in a balanced binary search tree and why?', type: 'technical', difficulty: 'medium' },
    { q: 'Describe how you would design a URL shortening service like bit.ly. What components would you need?', type: 'technical', difficulty: 'hard' },
    { q: 'Tell me about a challenging bug you encountered and how you resolved it.', type: 'behavioral', difficulty: 'medium' },
    { q: 'What are SOLID principles? Can you give an example of the Single Responsibility Principle?', type: 'technical', difficulty: 'medium' },
    { q: 'How does garbage collection work in languages like Java or JavaScript?', type: 'technical', difficulty: 'medium' },
    { q: 'Explain the CAP theorem and its implications for distributed systems.', type: 'technical', difficulty: 'hard' },
    { q: 'How would you handle a disagreement with a team member about a technical decision?', type: 'behavioral', difficulty: 'easy' },
    { q: 'What is the difference between SQL and NoSQL databases? When would you choose one over the other?', type: 'technical', difficulty: 'medium' },
    { q: 'Describe the concept of microservices architecture. What are its advantages and challenges?', type: 'technical', difficulty: 'hard' },
  ],
  'data-analyst': [
    { q: 'What is the difference between INNER JOIN and LEFT JOIN? Provide an example use case for each.', type: 'technical', difficulty: 'easy' },
    { q: 'How would you handle missing data in a large dataset? What techniques would you use?', type: 'technical', difficulty: 'medium' },
    { q: 'Explain the concept of statistical significance and p-values in simple terms.', type: 'technical', difficulty: 'medium' },
    { q: 'Describe a data analysis project that had a significant business impact.', type: 'behavioral', difficulty: 'medium' },
    { q: 'What is the difference between correlation and causation? Give a real-world example.', type: 'technical', difficulty: 'easy' },
    { q: 'How would you design an A/B test to evaluate a new feature on a website?', type: 'technical', difficulty: 'hard' },
    { q: 'What data visualization tools have you used? How do you choose the right chart type?', type: 'technical', difficulty: 'easy' },
    { q: 'Explain window functions in SQL and provide a practical example.', type: 'technical', difficulty: 'hard' },
  ],
  'product-manager': [
    { q: 'How do you prioritize features when you have limited engineering resources?', type: 'situational', difficulty: 'medium' },
    { q: 'Describe your approach to writing a Product Requirements Document (PRD).', type: 'technical', difficulty: 'medium' },
    { q: 'Tell me about a product you launched that failed. What did you learn?', type: 'behavioral', difficulty: 'hard' },
    { q: 'How would you measure the success of a new feature launch?', type: 'technical', difficulty: 'medium' },
    { q: 'What frameworks do you use for product strategy (e.g., RICE, MoSCoW)?', type: 'technical', difficulty: 'easy' },
    { q: 'How do you communicate trade-offs between engineering effort and business value to stakeholders?', type: 'situational', difficulty: 'hard' },
    { q: 'Describe your approach to user research. What methods do you prefer?', type: 'technical', difficulty: 'medium' },
    { q: 'How would you handle a situation where the CEO wants a feature but data suggests otherwise?', type: 'behavioral', difficulty: 'hard' },
  ],
  'devops-engineer': [
    { q: 'Explain the concept of Infrastructure as Code (IaC). What tools have you used?', type: 'technical', difficulty: 'easy' },
    { q: 'How would you design a CI/CD pipeline for a microservices architecture?', type: 'technical', difficulty: 'hard' },
    { q: 'What is the difference between containers and virtual machines?', type: 'technical', difficulty: 'easy' },
    { q: 'Describe a production incident you handled. How did you diagnose and resolve it?', type: 'behavioral', difficulty: 'medium' },
    { q: 'Explain blue-green deployment and canary deployment strategies.', type: 'technical', difficulty: 'medium' },
    { q: 'How do you ensure high availability and disaster recovery for critical services?', type: 'technical', difficulty: 'hard' },
    { q: 'What monitoring and alerting tools have you worked with? How do you set up effective alerts?', type: 'technical', difficulty: 'medium' },
    { q: 'Explain the 12-factor app methodology and its relevance to cloud-native applications.', type: 'technical', difficulty: 'hard' },
  ],
  'frontend-developer': [
    { q: 'What is the Virtual DOM, and how does React use it to optimize rendering?', type: 'technical', difficulty: 'medium' },
    { q: 'Explain the CSS Box Model and how box-sizing: border-box changes the calculation.', type: 'technical', difficulty: 'easy' },
    { q: 'How would you improve the performance of a slow React application?', type: 'technical', difficulty: 'hard' },
    { q: 'What are Web Accessibility (a11y) best practices, and why do they matter?', type: 'technical', difficulty: 'medium' },
    { q: 'Describe the differences between useEffect and useLayoutEffect in React.', type: 'technical', difficulty: 'medium' },
    { q: 'How do you handle state management in a large-scale React application?', type: 'technical', difficulty: 'hard' },
    { q: 'Explain CORS and how you would troubleshoot CORS errors.', type: 'technical', difficulty: 'medium' },
    { q: 'What is your approach to responsive web design? What techniques do you use?', type: 'technical', difficulty: 'easy' },
  ],
  'backend-developer': [
    { q: 'Explain RESTful API design principles. What makes a good REST API?', type: 'technical', difficulty: 'easy' },
    { q: 'How do you handle authentication and authorization in a web application?', type: 'technical', difficulty: 'medium' },
    { q: 'What is database normalization? Explain up to Third Normal Form.', type: 'technical', difficulty: 'medium' },
    { q: 'How would you design a rate-limiting system for an API?', type: 'technical', difficulty: 'hard' },
    { q: 'Explain the event loop in Node.js and how it handles asynchronous operations.', type: 'technical', difficulty: 'medium' },
    { q: 'What are the differences between horizontal and vertical scaling?', type: 'technical', difficulty: 'medium' },
    { q: 'How do you handle database migrations in a production environment?', type: 'technical', difficulty: 'hard' },
    { q: 'Describe your approach to writing unit tests and integration tests.', type: 'technical', difficulty: 'easy' },
  ],
};

// Default questions for unknown roles
const DEFAULT_QUESTIONS = DEMO_QUESTIONS['software-engineer'];

// ---- Demo evaluation logic ----
function demoEvaluate(question, answer) {
  const len = answer.length;
  const wordCount = answer.trim().split(/\s+/).length;

  // Score based on answer length and word count
  let score = Math.min(95, Math.max(20, Math.round(30 + wordCount * 1.5 + len * 0.05)));
  // Add some randomness
  score = Math.min(98, Math.max(15, score + Math.floor(Math.random() * 20) - 10));

  const relevance = Math.min(1, Math.max(0.3, 0.5 + wordCount * 0.01 + Math.random() * 0.3));
  const correctness = Math.min(1, Math.max(0.2, 0.4 + wordCount * 0.008 + Math.random() * 0.35));
  const confidence = Math.min(1, Math.max(0.3, 0.45 + wordCount * 0.006 + Math.random() * 0.3));

  const feedbackOptions = [
    `Your answer demonstrates a solid understanding of the concept. You could strengthen it by providing more specific examples or referencing real-world scenarios where this knowledge applies.`,
    `Good explanation with clear reasoning. Consider diving deeper into edge cases and potential pitfalls to show a more comprehensive understanding.`,
    `You've covered the main points well. To improve, try structuring your answer with a clear introduction, detailed explanation, and concrete example.`,
    `Nice attempt, but the answer could be more detailed. Try to include technical specifics, trade-offs, and practical implications to show deeper expertise.`,
    `Strong answer showing practical knowledge. Adding comparisons with alternative approaches would demonstrate a broader perspective.`,
  ];

  return {
    score,
    relevance: Math.round(relevance * 100) / 100,
    correctness: Math.round(correctness * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    feedback: feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)],
  };
}

// ---- Main AI Service ----
export async function generateQuestion(role, difficulty, questionHistory, previousAnswer) {
  if (provider !== 'demo') {
    // TODO: Call OpenAI/Claude API with questionGenerationPrompt
    // For now, fall through to demo
  }

  const bank = DEMO_QUESTIONS[role] || DEFAULT_QUESTIONS;
  const availableIdx = [];
  for (let i = 0; i < bank.length; i++) {
    if (!questionHistory.includes(bank[i].q)) {
      availableIdx.push(i);
    }
  }

  if (availableIdx.length === 0) {
    return null; // No more questions
  }

  const idx = availableIdx[Math.floor(Math.random() * availableIdx.length)];
  const q = bank[idx];

  // Simulate follow-up based on previous answer quality
  const isFollowup = previousAnswer && previousAnswer.length < 50 && Math.random() > 0.5;

  return {
    question: q.q,
    type: q.type,
    difficulty: q.difficulty || difficulty,
    isFollowup,
  };
}

export async function evaluateAnswer(role, question, answer, difficulty) {
  if (provider !== 'demo') {
    // TODO: Call OpenAI/Claude API with answerEvaluationPrompt
  }
  return demoEvaluate(question, answer);
}

export async function generateFinalResults(role, difficulty, questionsAndAnswers) {
  if (provider !== 'demo') {
    // TODO: Call OpenAI/Claude API with finalResultsPrompt
  }

  const scores = questionsAndAnswers.map((qa) => qa.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const strengths = [];
  const weaknesses = [];

  if (avg >= 70) strengths.push('Strong technical fundamentals');
  if (avg >= 60) strengths.push('Good communication skills');
  if (scores.some((s) => s >= 85)) strengths.push('Excellent problem-solving on complex questions');
  if (questionsAndAnswers.length >= 6) strengths.push('Consistency across multiple questions');

  if (avg < 70) weaknesses.push('Could improve depth of technical explanations');
  if (scores.some((s) => s < 50)) weaknesses.push('Some answers lacked sufficient detail');
  if (avg < 60) weaknesses.push('Consider reviewing core concepts for this role');

  if (strengths.length === 0) strengths.push('Willingness to attempt all questions');
  if (weaknesses.length === 0) weaknesses.push('Minor areas for improvement in edge cases');

  return {
    overallScore: avg,
    overallFeedback: `Overall, you demonstrated ${avg >= 70 ? 'strong' : avg >= 50 ? 'moderate' : 'developing'} competency for the ${role.replace(/-/g, ' ')} role at ${difficulty} level. ${avg >= 70 ? 'Your answers showed good depth and practical understanding.' : 'There is room for improvement in providing more detailed and structured responses.'} You answered ${questionsAndAnswers.length} questions with an average score of ${avg}%. ${avg >= 80 ? 'This is an excellent performance that would likely advance you to the next round.' : avg >= 60 ? 'With some focused preparation on weaker areas, you would be well-positioned for success.' : 'We recommend reviewing the fundamental concepts and practicing structured answer delivery.'}`,
    strengths,
    weaknesses,
    categoryScores: {
      technical: Math.min(100, avg + Math.floor(Math.random() * 15) - 5),
      communication: Math.min(100, avg + Math.floor(Math.random() * 20) - 8),
      'problem-solving': Math.min(100, avg + Math.floor(Math.random() * 18) - 7),
      'domain-knowledge': Math.min(100, avg + Math.floor(Math.random() * 16) - 6),
    },
  };
}
