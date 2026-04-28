# AI Code Reviewer and Security Analyzer

A full-stack MERN application for reviewing source code, running static analysis, and generating AI-assisted remediation guidance.

## Stack

- Frontend: React, Vite, Tailwind CSS, Monaco Editor, Recharts, Socket.IO client
- Backend: Node.js, Express, MongoDB with Mongoose, Socket.IO
- Analysis: ESLint, Semgrep, OpenAI API, simple-git
- Auth: JWT, bcrypt, GitHub OAuth

## Features

- JWT authentication with developer and admin roles
- GitHub OAuth login flow
- ZIP upload and GitHub repository analysis
- Project file explorer and Monaco-based code viewer
- ESLint and Semgrep integration with structured issue parsing
- AI-generated review suggestions with JSON-only prompting
- Deduplicated report engine with severity scoring
- Historical reports, security score, and dashboard charts
- Real-time analysis progress updates through Socket.IO

## Project Structure

```text
.
├── client
├── server
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB
- Semgrep installed and available on your PATH
- ESLint available through server dependencies
- OpenAI API key

## Environment Variables

Copy the examples before running:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Server

See [server/.env.example](/home/divneet/AI-Code Reviewer/server/.env.example).

### Client

See [client/.env.example](/home/divneet/AI-Code Reviewer/client/.env.example).

## Install

```bash
npm install
npm run install:all
```

## Run in Development

```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/github`
- `POST /api/projects/upload`
- `POST /api/projects/analyze`
- `GET /api/reports`
- `GET /api/reports/:reportId`
- `GET /api/reports/:reportId/issues`
- `GET /api/projects/:projectId/files`
- `GET /api/projects/:projectId/file`

## Security Notes

- ZIP uploads are restricted by MIME type and extension
- Repository URLs are validated against GitHub URL patterns
- Analysis only traverses text-based files and ignores unsafe directories
- Rate limiting and Helmet are enabled
- Child processes use argument arrays and controlled working directories

## Production Notes

- Store uploads and cloned repositories on persistent storage
- Replace memory-backed progress tracking with a durable queue if load increases
- Move analysis execution to background workers for large repositories
- Add object storage and antivirus scanning for uploads in high-security deployments
