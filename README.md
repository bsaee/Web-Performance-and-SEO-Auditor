## Deployments: 
[![Frontend Portal](https://img.shields.io/badge/Live_Dashboard-Vercel-black?style=for-the-badge&logo=vercel)](https://web-performance-and-seo-auditor.vercel.app/)
[![Backend Engine](https://img.shields.io/badge/Production_API-Render-darkgreen?style=for-the-badge&logo=render)](https://web-performance-and-seo-auditor.onrender.com)

# Web Performance & SEO Diagnostic Suite
... (Keep the rest of your original README contents exactly the same here) ...

# Web Performance & SEO Diagnostic Suite

An enterprise-grade web auditing dashboard built with **FastAPI (Python)** and **React (Vite/Tailwind CSS)**. This application compiles critical SEO metrics, parses document hierarchies, evaluates structural image assets, monitors broken hyperlink pathways concurrently, and fetches live Core Web Vital performance scores directly from the **Google PageSpeed Insights API**.

## 🚀 Key Engineering Features

* **Asynchronous Parallel Task Pipeline:** Utilizes Python's `asyncio` engine to fire network connectivity validation and external API performance requests concurrently, slashing aggregate execution times.
* **Database Caching Layer:** Built using **SQLite** and **SQLAlchemy** to intercept incoming matching requests. Serves instantaneous cached metric sheets for redundant domains within 0.1 seconds, heavily reducing third-party API overhead.
* **Graceful Degradation Architecture:** Features a custom, highly responsive localized metric estimation engine that takes over smoothly if third-party APIs hit limits or time out.
* **Persistent Team History Log:** Features an inline pinning and unpinning history dashboard panel to let team members preserve or manage critical baseline audit results cleanly.

---

## 🛠️ Tech Stack & Systems

* **Frontend:** React (Vite ecosystem), Tailwind CSS, Native Fetch API
* **Backend:** FastAPI, HTTPX (Asynchronous HTTP Client), BeautifulSoup4 (HTML Parsing)
* **Database:** SQLite, SQLAlchemy ORM, Python-Dotenv

---

## 💻 Local Installation & Setup

### 1. Clone the Workspace
```bash
git clone <your-repository-url>
cd web-auditor-portal
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv

# Activate on Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install Dependencies:
pip install -r requirements.txt
```

Create a secure environment configuration file named .env inside the backend/ folder:

```Code snippet
PAGESPEED_API_KEY=your_free_google_pagespeed_api_key
```
Run the backend server development loop:

```Bash
uvicorn main:app --reload
The local API docs will be accessible at: http://127.0.0.1:8000/docs
```

### 3. Frontend Setup (React)
Open a separate terminal window at the project root:

```Bash
cd frontend
npm install
npm run dev
```
The dashboard interface will launch at: http://localhost:5173

## 🔍 System Architecture & Diagnostics
The application runs a clean decoupled architecture. The frontend transmits target domains to the FastAPI routing controller, which immediately executes isolated parallel async worker instances:

**1. SEO Parser:** Dissects <title>, <meta name="description">, and strict contextual limits.

**2. Structural Integrity:** Verifies <h1> document hierarchy boundaries.

**3. Image Auditor:** Detects omitted alt tracking indicators and flags legacy resource structures.

**4. Hyperlink Health:** Concurrently pings extracted anchors using lightweight HEAD methods.

**5. Performance Core Vitals:** Leverages the authenticated Google PageSpeed developer endpoint to profile performance metrics.