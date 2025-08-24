Quick Start (Windows PowerShell)
--------------------------------
Requirements: Node.js 18+, MongoDB running locally

1) Backend
   cd backend
   copy .env.example .env
   # Open .env and set CORS_ORIGIN to include your FE origin(s)
   npm i
   node .\scripts\seedAdmin.js admin@yourshop.com "StrongPass#2025"
   node .\scripts\seedDemo.js
   npm run dev

2) Frontend
   cd ..\frontend
   copy .env.example .env
   npm i
   npm run dev

Open http://localhost:5173

Admin login: admin@yourshop.com / StrongPass#2025
Buyers: a@example.com / 123456, b@example.com / 123456
