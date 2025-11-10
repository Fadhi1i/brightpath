##🧠 BrightPath – AI-Driven School Dashboard
##🌍 Live Deployments

Frontend: https://brightpath-six.vercel.app

Backend (API): https://brightpath-3.onrender.com

canvas pitch: https://www.canva.com/design/DAG4Tdod5d8/aUjIXYWnqW95j4SbJgjkKQ/edit?utm_content=DAG4Tdod5d8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

#🎯 Overview

BrightPath is an AI-powered school management system designed to simplify academic data handling for Administrators, Teachers, and Parents through intuitive dashboards, real-time updates, and intelligent insights.

It merges seamless UX with AI assistance — offering text summarization, AI tutoring, and question generation to enhance learning outcomes and administrative efficiency.

#👥 Test Accounts

Below are sample credentials for the instructor or testers to explore each user type.

Role	Email / Username	Password
Admin	fadhili@gmail.com	anicetus
Teacher	joyce@gmail.com	anicetus
Parent	faithmakumba@gmail.com	anicetus

you may feel free to sign up with your own username too

⚙️ Tech Stack
🖥️ Frontend

Vercel – Hosting and CI/CD

HTML, CSS, JavaScript (Vanilla)

Responsive Dashboard UI

AI Interaction Modules (Summarizer, Tutor, Question Generator)

🧩 Backend

FastAPI (Python)

Supabase – Database and Auth

Render – Deployment

Pydantic, Uvicorn, Passlib, Jinja2, Email Validator

🤖 AI-Powered Features
Feature	Description
🧾 Summarizer	Compress long text into concise summaries using AI.
🧠 AI Tutor	Explains concepts in simple, educational language.
❓ Question Generator	Creates exam-style questions from text input.

Each tool is integrated through /summarize, /explain, and /generate-questions API endpoints handled by the FastAPI backend.

🏫 Dashboard Modules
🧑‍💼 Admin Dashboard

Register students, teachers, and parents

Manage subjects and announcements

Release results to all users

Monitor uploaded marks in real time

👩‍🏫 Teacher Dashboard

Upload marks manually or via CSV

Generate and post class announcements

View summarized class performance

👨‍👩‍👧 Parent Dashboard

View child’s academic performance

Access teacher comments and announcements

Use AI tools for note summarization, tutoring, and question practice



#🚀 Deployment Notes
🔹 Frontend (Vercel)



🔹 Backend (Render)

Environment: Python 3.11+

Start command:

uvicorn main:app --host 0.0.0.0 --port 10000


CORS configured to allow Vercel domain.







AI boxes scale properly across viewports

🧭 Future Enhancements

AI-driven predictive analytics for student performance

Attendance and homework tracking

Role-based notification system

Admin-teacher chat integration

💡 Author

Fadhili – Developer, Alpha Researcher, and AI Integration Engineer

📫 Contact: fanicetus@gmail.com
