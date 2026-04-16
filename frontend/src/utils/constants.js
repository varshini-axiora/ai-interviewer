export const API_BASE = '/api';

export const ROLES = [
  { id: 'software-engineer', label: 'Software Engineer', icon: '💻' },
  { id: 'data-analyst', label: 'Data Analyst', icon: '📊' },
  { id: 'product-manager', label: 'Product Manager', icon: '📋' },
  { id: 'devops-engineer', label: 'DevOps Engineer', icon: '⚙️' },
  { id: 'frontend-developer', label: 'Frontend Developer', icon: '🎨' },
  { id: 'backend-developer', label: 'Backend Developer', icon: '🔧' },
];

export const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: 'var(--success)' },
  { id: 'medium', label: 'Medium', color: 'var(--warning)' },
  { id: 'hard', label: 'Hard', color: 'var(--danger)' },
];

export const QUESTIONS_PER_INTERVIEW = 8;
export const TIME_PER_QUESTION = 120; // seconds
