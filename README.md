# SketchLink — AI-Powered Collaborative Whiteboard

> Final Year Design Project (FYP-II) | Spring 2026

SketchLink is a real-time collaborative whiteboard platform with AI-powered sketch recognition, automated diagram conversion, and NLP-based task generation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 |
| Backend | Node.js + Express.js |
| Database | MongoDB (Atlas) |
| Real-Time | Socket.IO |
| Canvas | HTML5 Canvas API |
| AI/ML | TensorFlow.js (client-side CNN) |
| NLP | OpenAI GPT-4 API |
| Auth | JWT |

## Project Structure

```
sketchlink/
├── client/          → React frontend
├── server/          → Node.js + Express backend
└── README.md
```

## Quick Start

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Setup

```bash
# In /server — copy and fill in values
cp .env.example .env

# In /client — copy and fill in values
cp .env.example .env
```

### 3. Run Development

```bash
# Terminal 1 — Start backend (port 5000)
cd server
npm run dev

# Terminal 2 — Start frontend (port 3000)
cd client
npm start
```

### 4. Open Browser

```
http://localhost:3000
```

## Features

- ✅ Freehand drawing with pen, eraser, shapes, text
- ✅ Real-time multi-user collaboration via Socket.IO
- ✅ AI shape recognition (TensorFlow.js CNN, client-side)
- ✅ NLP diagram generation (GPT-4)
- ✅ Automated task generation from whiteboard content
- ✅ JWT authentication with role-based access
- ✅ Export PNG / SVG
- ✅ Version history & undo/redo
- ✅ Responsive design

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/boards | Get all boards |
| POST | /api/boards | Create board |
| GET | /api/boards/:id | Get board by ID |
| PUT | /api/boards/:id | Update board |
| DELETE | /api/boards/:id | Delete board |
| POST | /api/ai/tasks | Generate tasks from board |
| POST | /api/ai/diagram | Generate diagram from text |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join-board | Client → Server | Join a board session |
| draw-stroke | Client → Server | Broadcast stroke to peers |
| cursor-move | Client → Server | Broadcast cursor position |
| shape-added | Client → Server | Broadcast new shape |
| board-clear | Client → Server | Broadcast board clear |

## Team

- FYP-II | Spring 2026
- Supervisor: [Supervisor Name]
