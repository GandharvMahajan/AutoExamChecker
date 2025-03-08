# AutoExamChecker

A full-stack application for automated exam checking.

## Project Structure

- **Backend**: Node.js + Express (TypeScript)
- **Frontend**: React + TypeScript (Vite)
- **Database**: PostgreSQL (to be configured)

## Prerequisites

- Node.js (v16+ required, v18+ recommended)
- npm or yarn
- PostgreSQL

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5001
   DATABASE_URL=postgresql://postgres:password@localhost:5432/autoexamchecker
   NODE_ENV=development
   ```
   Note: Update the DATABASE_URL with your PostgreSQL credentials.

4. Start the development server:
   ```
   npm run dev
   ```
   The backend will be running at http://localhost:5001

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The frontend will be running at http://localhost:3000

## Development

- Backend code is in the `backend/src` directory
- Frontend code is in the `frontend/src` directory

## Building for Production

### Backend

```
cd backend
npm run build
npm start
```

### Frontend

```
cd frontend
npm run build
```
The build output will be in the `frontend/dist` directory, which can be served by any static file server. 