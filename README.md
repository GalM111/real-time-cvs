# Real Time CSV

## Overview
Real Time CSV is a React + Vite front-end for monitoring CSV ingestion jobs exposed by a backend queue. Users can upload CSV files, trigger server-side processing, and watch status updates stream in via server-sent events (SSE) for near real-time visibility.

## Features
- Material UI dashboard highlighting total rows processed, success/failure counts, and job metadata.
- CSV upload form with toast feedback, same-file reselection support, and graceful error handling.
- Jobs table with progress bars, expandable error details, and SSE-powered live updates (no manual refresh needed).
- "Download Error Report" button for any job with failures, hitting `GET /api/jobs/:id/error-report` to fetch a CSV of problematic rows.

## Tech Stack
- React 19 + TypeScript, bootstrapped with Vite 7.
- Material UI 7 for layout, theming, and icons.
- Fetch-based API client targeting `/api/jobs` endpoints defined by your backend.

## Getting Started
1. Install dependencies: `npm install`
2. Configure the API base URL in `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:4000
   ```
3. Run the app locally: `npm run dev`
4. Build for production: `npm run build`
5. Preview the production bundle: `npm run preview`

## Expected API Contract
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | GET | Returns an array of job records sorted by `createdAt`.
| `/api/jobs/:id` | GET | Returns a single job with detailed stats.
| `/api/jobs/upload` | POST | Accepts multipart form data (field name `file`) and schedules processing. Returns `{ jobId }`.
| `/api/jobs/:id/error-report` | GET | Streams a downloadable error report blob.

Each job record should match `src/types/job.ts` and include progress counts plus an optional `errors` array. The frontend sorts jobs newest-first and maintains "Live" badges when any job status is `pending` or `processing`.

## Customization Tips
- Tailor Material UI theming or card layout via `src/App.css` and `src/components`.
- Extend `JobErrors` to show richer row-level context or pair the inline list with the downloadable CSV asset.
- Update `useJobs.ts` if you want to switch from SSE to web sockets or fall back to polling.

## Folder Highlights
- `src/components/UploadForm.tsx`: handles client-side CSV selection and POST upload flow.
- `src/components/JobsTable.tsx`: renders progress bars, metrics, and expandable error stacks.
- `src/hooks/useJobs.ts`: encapsulates fetch, SSE stream management, and error handling.
- `src/api/*.ts`: thin wrappers around the backend REST contract.
