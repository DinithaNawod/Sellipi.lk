// Isolated HTTP test harness. Real routes/controllers and schema validation run
// against in-memory model adapters; this module never connects to MongoDB.
import { mock } from 'node:test';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../../models/Admin.js';
import Note from '../../models/Note.js';
import SiteContent from '../../models/SiteContent.js';
import { getSiteContent } from '../../controllers/siteContentController.js';
import Inscription from '../../models/Inscription.js';
import authRoutes from '../../routes/authRoutes.js';
import adminRoutes from '../../routes/adminRoutes.js';
import inscriptionRoutes, { noteLimiter } from '../../routes/inscriptionRoutes.js';
import noteRoutes from '../../routes/noteRoutes.js';
import { errorHandler } from '../../middleware/errorHandler.js';

export const ids = { admin: '100000000000000000000001', user: '100000000000000000000002', academic: '100000000000000000000003', suspended: '100000000000000000000004', inscription: '200000000000000000000001' };
export const password = 'PreviewOnly2026!';
const secret = 'isolated-local-test-secret-not-for-production';
const copy = value => JSON.parse(JSON.stringify(value));
const tables = { accounts: [], notes: [], inscriptions: [] };
let siteContent = null;
let sequence = 100;

function matches(row, filter = {}) {
  return Object.entries(filter).every(([field, expected]) => {
    if (field === '$and') return expected.every(part => matches(row, part));
    if (field === '$or') return expected.some(part => matches(row, part));
    const actual = row[field];
    if (expected && typeof expected === 'object') {
      if ('$exists' in expected) return (actual !== undefined) === expected.$exists;
      if ('$ne' in expected) return String(actual) !== String(expected.$ne);
      if ('$regex' in expected) return new RegExp(expected.$regex, expected.$options).test(actual || '');
    }
    return String(actual) === String(expected);
  });
}
function project(row, fields) {
  const selected = copy(row);
  if (!fields) return selected;
  const tokens = fields.split(/\s+/);
  if (tokens.some(token => token.startsWith('-'))) {
    for (const field of tokens) if (field.startsWith('-')) delete selected[field.slice(1)];
    return selected;
  }
  return Object.fromEntries(Object.entries(selected).filter(([key]) => key === '_id' || tokens.includes(key)));
}
function query(table, filter) {
  let fields, ordering = {}, offset = 0, maximum = Infinity;
  const populated = [];
  const q = {
    select(value) { fields = value; return q; },
    sort(value) { ordering = value; return q; },
    skip(value) { offset = value; return q; },
    limit(value) { maximum = value; return q; },
    lean() { return q; },
    populate(field, selected) { populated.push([field, selected]); return q; },
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        const rows = table.filter(row => matches(row, filter)).sort((a, b) => {
          for (const [field, direction] of Object.entries(ordering)) {
            if (a[field] !== b[field]) return a[field] > b[field] ? direction : -direction;
          }
          return 0;
        }).slice(offset, offset + maximum).map(row => project(row, fields));
        for (const row of rows) for (const [field, selected] of populated) {
          const source = field === 'inscription' ? tables.inscriptions : tables.accounts;
          const value = source.find(item => String(item._id) === String(row[field]));
          row[field] = value ? project(value, selected) : null;
        }
        return rows;
      }).then(resolve, reject);
    },
  };
  return q;
}
function accountDocument(row) {
  if (!row) return null;
  return { ...copy(row), comparePassword: candidate => bcrypt.compare(candidate, row.password) };
}
async function validated(Model, fields) {
  const document = new Model(fields);
  await document.validate();
  return copy(document.toObject());
}

export function resetFixtures() {
  siteContent = null;
  noteLimiter.resetKey('127.0.0.1');
  sequence = 100;
  const hash = bcrypt.hashSync(password, 4);
  tables.accounts = [
    { _id: ids.admin, username: 'Archive Admin', email: 'admin@preview.invalid', password: hash, role: 'admin', status: 'active' },
    { _id: ids.user, username: 'Normal Visitor', email: 'user@preview.invalid', password: hash, role: 'user', status: 'active' },
    { _id: ids.academic, username: 'Dr. Preview Researcher', email: 'academic@preview.invalid', password: hash, role: 'academic', status: 'active', institution: 'Heritage Research Institute' },
    { _id: ids.suspended, username: 'Suspended Researcher', email: 'suspended@preview.invalid', password: hash, role: 'academic', status: 'suspended', institution: 'Research Institute' },
  ].map(row => ({ createdAt: '2026-11-01T10:00:00.000Z', institution: '', ...row }));
  tables.notes = [];
  tables.inscriptions = [{ _id: ids.inscription, title: 'Inscription no 77, Vessagiriya', description: '', imageUrl: '/uploads/fixture.jpg', imageProcessedUrl: '', location: { name: 'Vessagiri', district: 'Anuradhapura', province: '', coordinates: { lat: 8.323, lng: 80.396 } }, historicalPeriod: '3 CBC – 1 CCE', scriptType: 'Brahmi', contentRaw: 'Anikata-Sona-pitaha bariya [u]pasika-Ti[sa]ya lene', contentTranslated: 'The cave is given to the Sangha of the four quarters, present and absent.', createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z' }];
  return tables;
}
export function testToken(id, extra = {}) { return jwt.sign({ id, ...extra }, secret, { algorithm: 'HS256', expiresIn: '1h' }); }

export function createTestApp() {
  process.env.JWT_SECRET = secret;
  process.env.NODE_ENV = 'test';
  resetFixtures();
  mock.method(Admin, 'findById', async id => accountDocument(tables.accounts.find(row => row._id === String(id))));
  mock.method(Admin, 'findOne', async filter => accountDocument(tables.accounts.find(row => matches(row, filter))));
  mock.method(Admin, 'find', filter => query(tables.accounts, filter));
  mock.method(Admin, 'countDocuments', async filter => tables.accounts.filter(row => matches(row, filter)).length);
  mock.method(Admin, 'create', async fields => {
    const row = await validated(Admin, { ...fields, _id: (++sequence).toString(16).padStart(24, '0'), createdAt: new Date() });
    row.password = await bcrypt.hash(row.password, 4);
    tables.accounts.push(row); return accountDocument(row);
  });
  mock.method(Admin, 'findOneAndUpdate', async (filter, update) => {
    const row = tables.accounts.find(value => matches(value, filter));
    if (!row) return null;
    Object.assign(row, update.$set); return accountDocument(row);
  });
  mock.method(Note, 'create', async fields => {
    const row = await validated(Note, { ...fields, _id: (++sequence).toString(16).padStart(24, '0'), createdAt: new Date(), updatedAt: new Date() });
    tables.notes.push(row); return copy(row);
  });
  mock.method(Note, 'find', filter => query(tables.notes, filter));
  mock.method(Note, 'countDocuments', async filter => tables.notes.filter(row => matches(row, filter)).length);
  mock.method(Note, 'findById', async id => copy(tables.notes.find(row => row._id === String(id)) || null));
  mock.method(Note, 'findOneAndUpdate', async (filter, update) => {
    const row = tables.notes.find(value => matches(value, filter));
    if (!row) return null;
    Object.assign(row, copy(update.$set)); return copy(row);
  });
  mock.method(Inscription, 'exists', async filter => tables.inscriptions.find(row => matches(row, filter)) ? { _id: filter._id } : null);
  mock.method(Inscription, 'findById', async id => copy(tables.inscriptions.find(row => row._id === String(id)) || null));
  mock.method(Inscription, 'find', filter => query(tables.inscriptions, filter));
  mock.method(Inscription, 'countDocuments', async filter => tables.inscriptions.filter(row => matches(row, filter)).length);
  mock.method(Inscription, 'distinct', async field => field === 'location.name' ? ['Vessagiri'] : field === 'historicalPeriod' ? ['3 CBC – 1 CCE'] : ['Brahmi']);
  mock.method(SiteContent, 'findById', () => ({ lean: async () => copy(siteContent) }));
  mock.method(SiteContent, 'updateOne', async () => { siteContent ||= { _id: 'site', values: {}, revision: 0 }; });
  mock.method(SiteContent, 'findOneAndUpdate', (filter, update) => ({ lean: async () => {
    if (!siteContent || siteContent.revision !== filter.revision) return null;
    siteContent = { ...siteContent, ...copy(update.$set), revision: siteContent.revision + update.$inc.revision, updatedAt: new Date().toISOString() };
    return copy(siteContent);
  } }));
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/inscriptions', inscriptionRoutes);
  app.use('/api/notes', noteRoutes);
  app.get('/api/site-content', getSiteContent);
  app.use(errorHandler);
  return { app, tables };
}
