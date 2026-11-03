// Optional, isolated UI QA server. Uses temporary fake users and in-memory data.
// Never imports dotenv, never connects to MongoDB, and binds to loopback only.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestApp, ids } from './support/testApp.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { app, tables } = createTestApp();
tables.notes.push({ _id: '300000000000000000000001', inscription: ids.inscription, author: ids.academic, authorName: 'Dr. Preview Researcher', authorInstitution: 'Heritage Research Institute', text: 'The final line appears to refer to the Sangha of the four quarters. I suggest comparing this reading with the published estampage before updating the transcription.', status: 'pending', createdAt: '2026-11-03T08:30:00.000Z', reviewedAt: null, reviewedBy: null, moderationReason: '' });
app.get('/uploads/fixture.jpg', (req, res) => res.sendFile(path.join(root, 'src/assets/reference/inscription-77.jpg')));
app.use(express.static(path.join(root, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
app.listen(6101, '127.0.0.1', () => console.log('Isolated UI preview: http://127.0.0.1:6101. Fake test users only; no MongoDB connection.'));
