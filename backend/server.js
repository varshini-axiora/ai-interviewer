import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`\n🧠 AI Interviewer Backend running on http://localhost:${PORT}\n`);
});
