# AI Interviewer

An advanced AI-powered technical interview application built with React, Node.js, and Supabase. Currently running in Local Demo Mode.

## Features
- **OTP Based Authentication**: Secure passwordless login flow.
- **Adaptive AI Interviewing**: Questions dynamically scale in difficulty based on response quality.
- **Role-Based Practice**: Built-in mock questions for Software Engineering, Product Management, Data Analytics, and DevOps.
- **Instant Evaluation**: Receive immediate 0-100 scores across relevance, correctness, and confidence.
- **Cheating Detection**: Tracks tab-switching and limits copy/pasting.
- **Analytics & Dashboard**: Measure your performance over time.

---

## How to Run Locally in VS Code

Because the application has both a frontend (React/Vite) and a backend (Node.js/Express) application, you need to run **two separate development servers**. 

To do this, open VS Code to the root `AI-Interviewer` directory and open **two separate terminal instances** (you can split the terminal in VS Code using the split icon, or by pressing `Ctrl + Shift + 5`).

### 1. Start the Backend Server
In the **first terminal window**, navigate into the backend folder, install the packages, and run the dev server:
```bash
cd backend
npm install
npm run dev
```
> The backend will start on **http://localhost:3001**.
> 
> *Note: By default, the application is in `DEMO` mode. When you request an OTP during login, the 6-digit code will be printed here in the backend terminal console!*

### 2. Start the Frontend Server
In the **second terminal window**, navigate into the frontend folder, install the packages, and run the Vite server:
```bash
cd frontend
npm install
npm run dev
```
> The frontend will start on **http://localhost:5173** (or 5174 if 5173 is in use).

### 3. Open the App
In your web browser, navigate to the URL provided by the frontend terminal (e.g. `http://localhost:5173`). Have fun practicing!

---

## Environment Variables

If you wish to convert this from local DEMO mode to full Production mode, you must update the `.env` file located in the `backend/` directory:

```env
# Change from 'demo' to 'openai' or 'anthropic'
AI_PROVIDER=openai

# Provide your actual API keys
OPENAI_API_KEY=sk-your-real-key-here
```
