/* global process */
/*
  Simple Tasks API for Vercel Serverless Functions (Node.js)

  Endpoints:
    GET    /api/tasks            -> returns array of tasks
    POST   /api/tasks            -> body: { text } -> create task
    PUT    /api/tasks/:id        -> body: { text?, completed? } -> update task
    DELETE /api/tasks/:id        -> delete task

  Storage behavior:
    - Uses an in-memory store for runtime (works on serverless but ephemeral)
    - If `USE_FILE_STORAGE=true` or running locally, it will try to read/write `./data/tasks.json` for local persistence
    - NOTE: Vercel serverless environments have an ephemeral filesystem. File persistence is not guaranteed in production.
      For reliable persistence across deployments and instances, use a managed DB (Supabase/Postgres/Firebase/Redis, or Vercel KV).

  Security & CORS:
    - Adds permissive CORS headers for development ease. In production, restrict origin as needed.

  To use on Vercel:
    - Add this file at `api/tasks.js` (already present)
    - Deploy to Vercel; the function will be available at https://<your-deployment>/api/tasks

  Example task shape:
    { id: 't1616..', text: 'Buy milk', completed: false }
*/

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');
const USE_FILE = process.env.USE_FILE_STORAGE === 'true' || process.env.NODE_ENV !== 'production';

let tasks = [
  { id: 't1', text: 'Go to school', completed: false },
  { id: 't2', text: 'Complete assignment', completed: true },
];
let initialized = false;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data directory', e.message);
  }
}

function loadFromFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) tasks = parsed;
  } catch (e) {
    console.warn('Failed to load tasks from file:', e.message);
  }
}

function saveToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write tasks to file:', e.message);
  }
}

function initStore() {
  if (initialized) return;
  if (USE_FILE) loadFromFile();
  initialized = true;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  cors(res);

  initStore();

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = req.url || '';
  // normalize path like /api/tasks or /api/tasks/:id
  const parts = url.split('/').filter(Boolean);

  // /api/tasks
  if (parts.length === 2 && parts[1] === 'tasks') {
    if (req.method === 'GET') {
      return res.status(200).json(tasks);
    }

    if (req.method === 'POST') {
      try {
        const body = req.body || {};
        // if body is sent as JSON string (some platforms), ensure parsing
        const payload = typeof body === 'string' ? JSON.parse(body) : body;
        if (!payload || !payload.text || typeof payload.text !== 'string') {
          return res.status(400).json({ error: 'Missing or invalid `text` in body' });
        }
        const id = `t${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const item = { id, text: payload.text.trim(), completed: !!payload.completed };
        tasks.push(item);
        if (USE_FILE) saveToFile();
        return res.status(201).json(item);
      } catch (err) {
        console.warn('Invalid JSON body while parsing POST:', err && err.message ? err.message : err);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // /api/tasks/:id
  if (parts.length === 3 && parts[1] === 'tasks') {
    const id = parts[2];
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    if (req.method === 'GET') {
      return res.status(200).json(tasks[idx]);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const body = req.body || {};
        const payload = typeof body === 'string' ? JSON.parse(body) : body;
        const updated = { ...tasks[idx] };
        if (payload.text !== undefined) updated.text = String(payload.text);
        if (payload.completed !== undefined) updated.completed = !!payload.completed;
        tasks[idx] = updated;
        if (USE_FILE) saveToFile();
        return res.status(200).json(updated);
      } catch (err) {
        console.warn('Invalid JSON body while parsing PUT/PATCH:', err && err.message ? err.message : err);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    if (req.method === 'DELETE') {
      const removed = tasks.splice(idx, 1)[0];
      if (USE_FILE) saveToFile();
      return res.status(200).json(removed);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(404).json({ error: 'Not Found' });
}
