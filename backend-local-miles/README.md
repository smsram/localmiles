/backend-local-miles
│
├── prisma/                  <-- DATABASE LAYER
│   ├── schema.prisma        <-- Your Tables (The Master Design)
│   └── migrations/          <-- SQL history files (Auto-generated)
│
├── src/
│   ├── config/              <-- CONFIGURATION
│   │   ├── env.js           <-- Loads .env variables safely
│   │   └── logger.js        <-- Setup for Winston/Morgan logs
│   │
│   ├── controllers/         <-- HTTP LAYER (Req/Res handling)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── order.controller.js
│   │   └── tracking.controller.js
│   │
│   ├── middlewares/         <-- SECURITY & CHECKS
│   │   ├── auth.middleware.js   <-- Verifies JWT tokens
│   │   ├── role.middleware.js   <-- Checks if User is 'COURIER'
│   │   ├── error.middleware.js  <-- Global Error Handler
│   │   └── validate.middleware.js <-- Input validation (Zod/Joi)
│   │
│   ├── routes/              <-- URL DEFINITIONS
│   │   └── v1/              <-- Versioning (Future proofing)
│   │       ├── auth.routes.js
│   │       ├── user.routes.js
│   │       ├── order.routes.js
│   │       └── index.js     <-- Combines all routes
│   │
│   ├── services/            <-- BUSINESS LOGIC (The Brain)
│   │   ├── auth.service.js  <-- Login/Signup logic
│   │   ├── otp.service.js   <-- SMS/WhatsApp logic
│   │   ├── order.service.js <-- Pricing & matching algorithms
│   │   └── socket.service.js <-- Real-time event emitters
│   │
│   ├── utils/               <-- HELPERS
│   │   ├── AppError.js      <-- Custom Error Class
│   │   ├── catchAsync.js    <-- Wrapper to avoid try-catch blocks
│   │   └── prisma.js        <-- Shared Prisma Client instance
│   │
│   ├── app.js               <-- Express App Setup (Middlewares)
│   └── server.js            <-- Entry Point (Starts Server + Socket.io)
│
├── .env                     <-- Secrets (DB URL, API Keys)
├── .gitignore
├── package.json
└── README.md