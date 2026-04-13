# Expense Tracker App - Backend

This is the backend API for the Expense Tracker application.  
It handles authentication, expense management, budgeting logic, and database operations.

## Tech Stack

- Node.js
- Typescript
- Express
- MongoDB
- JWT Authentication
- Mongoose
- Rate Limiting & Security Middleware
- CORS

## Features

- User authentication & authorization (JWT)
- Create, update, delete expenses
- Categorized transactions
- Monthly budget tracking
- Secure protected routes
- Input validation & error handling
- Rate limiting for API protection

## API Structure

- `/api/auth` → User authentication (register/login)
- `/api/expenses` → Expense CRUD operations
- `/api/budgets` → Budget management
- `/api/categories` → Expense categories

## Security

- JWT-based authentication
- Password hashing (bcrypt)
- CORS protection
- Rate limiting to prevent abuse

## Frontend Repository

Frontend source code:  
[View Frontend Repo](https://github.com/NullUser3/expense-tracker-frontend)