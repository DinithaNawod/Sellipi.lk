import { before, after, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createTestApp, resetFixtures, testToken, ids, password } from './support/testApp.js';
import SiteContent from '../models/SiteContent.js';
import { contentCatalog } from '../controllers/siteContentController.js';

let server, base, tables;
before(async () => {
  const fixture = createTestApp(); tables = fixture.tables;
  server = fixture.app.listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); mock.restoreAll(); });
beforeEach(() => resetFixtures());
async function request(path, { id, token, method = 'GET', body } = {}) {
  const response = await fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(id || token ? { Authorization: `Bearer ${token || testToken(id)}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
const notesPath = `/api/inscriptions/${ids.inscription}/notes`;
test('all editable content fields can be stored in the actual Mongoose schema', async () => {
  const values = Object.fromEntries(contentCatalog.map(field => [field.key, field.value]));
  const document = new SiteContent({ values });
  await document.validate();
  assert.equal(document.values.size, contentCatalog.length);
  assert.equal(document.values.get('contact_email'), 'admin@sellipi.lk');
});
test('administrators can edit ordinary account profiles without changing passwords or granting admin', async () => {
  const edited = await request(`/api/admin/users/${ids.user}`, { id: ids.admin, method: 'PATCH', body: { username: 'Updated Visitor', email: 'updated@example.com', institution: 'Research Centre', password: 'ignored-password' } });
  assert.equal(edited.status, 200); assert.equal(edited.body.user.username, 'Updated Visitor'); assert.equal(edited.body.user.email, 'updated@example.com'); assert.equal(edited.body.user.institution, 'Research Centre'); assert.equal(edited.body.user.password, undefined);
  const login = await request('/api/auth/login', { method: 'POST', body: { email: 'updated@example.com', password } });
  assert.equal(login.status, 200);
  for (const body of [{ email: 'bad' }, { username: '' }, { institution: 5 }]) assert.equal((await request(`/api/admin/users/${ids.user}`, { id: ids.admin, method: 'PATCH', body })).status, 400);
});
test('public site content starts with defaults and only administrators can publish overrides', async () => {
  assert.deepEqual((await request('/api/site-content')).body.values, {});
  for (const id of [undefined, ids.user, ids.academic, ids.suspended]) {
    const response = await request('/api/admin/site-content', { id, method: 'PUT', body: { revision: 0, values: { 'contact_email': 'hello@example.com' } } });
    assert.ok([401,403].includes(response.status));
  }
  const saved = await request('/api/admin/site-content', { id: ids.admin, method: 'PUT', body: { revision: 0, values: { 'contact_email': 'hello@example.com', 'contact_address': 'New visitor address' } } });
  assert.equal(saved.status, 200); assert.equal(saved.body.revision, 1);
  const visible = await request('/api/site-content');
  assert.equal(visible.body.values['contact_email'], 'hello@example.com');
  assert.equal(visible.body.updatedBy, undefined);
});
test('content editor validates fields and URLs, prevents stale saves, and restores defaults', async () => {
  for (const values of [{ role: 'admin' }, { 'contact_email': 'invalid' }, { 'contact_facebook': 'javascript:alert(1)' }, { 'image_home_hero': 'data:text/html,hi' }, { 'contact_address': 42 }, { 'contact_address': 'x'.repeat(15001) }]) {
    assert.equal((await request('/api/admin/site-content', { id: ids.admin, method: 'PUT', body: { revision: 0, values } })).status, 400);
  }
  assert.equal((await request('/api/admin/site-content', { id: ids.admin, method: 'PUT', body: { revision: 0, values: { 'contact_email': 'new@example.com' } } })).status, 200);
  assert.equal((await request('/api/admin/site-content', { id: ids.admin, method: 'PUT', body: { revision: 0, values: {} } })).status, 409);
  assert.equal((await request('/api/admin/site-content', { id: ids.admin, method: 'PUT', body: { revision: 1, values: {} } })).status, 200);
  assert.deepEqual((await request('/api/site-content')).body.values, {});
});
async function submit(text = 'A scholarly correction requiring review.') {
  return request(notesPath, { id: ids.academic, method: 'POST', body: { text } });
}
async function review(id, status, expectedStatus = 'pending') {
  return request(`/api/admin/notes/${id}`, { id: ids.admin, method: 'PATCH', body: { status, expectedStatus, moderationReason: 'Reviewed against the reference.' } });
}

test('registration offers normal and academic accounts but never public administrator access', async () => {
  const denied = await request('/api/auth/register', { method: 'POST', body: { username: 'Intruder', email: 'intruder@example.invalid', password, role: 'admin', status: 'active' } });
  assert.equal(denied.status, 400); assert.equal(tables.accounts.length, 4);
  const normal = await request('/api/auth/register', { method: 'POST', body: { username: 'New User', email: 'NEW@example.invalid', password } });
  assert.equal(normal.status, 201); assert.equal(normal.body.user.role, 'user'); assert.equal(normal.body.user.email, 'new@example.invalid'); assert.ok(!JSON.stringify(normal.body).includes('password'));
  const academic = await request('/api/auth/register', { method: 'POST', body: { username: 'New Academic', email: 'scholar@example.invalid', password, role: 'academic', institution: 'University' } });
  assert.equal(academic.status, 201); assert.equal(academic.body.user.institution, 'University');
});
test('academic registration requires an institution and validates identity types', async () => {
  assert.equal((await request('/api/auth/register', { method: 'POST', body: { username: 'Scholar', email: 'x@example.invalid', password, role: 'academic' } })).status, 400);
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: { $ne: null }, password } })).status, 400);
});
test('only active academics may submit notes', async () => {
  assert.equal((await request(notesPath, { method: 'POST', body: { text: 'Note' } })).status, 401);
  for (const id of [ids.user, ids.admin, ids.suspended]) assert.equal((await request(notesPath, { id, method: 'POST', body: { text: 'Note' } })).status, 403);
  assert.equal((await submit()).status, 201);
});
test('submission ignores forged authors, review fields and approved status', async () => {
  const result = await request(notesPath, { id: ids.academic, method: 'POST', body: { text: '  Correction  ', status: 'approved', author: ids.admin, authorName: 'Forged', reviewedBy: ids.admin, reviewedAt: new Date() } });
  assert.equal(result.status, 201);
  const note = tables.notes[0];
  assert.equal(note.status, 'pending'); assert.equal(note.author, ids.academic); assert.equal(note.authorName, 'Dr. Preview Researcher'); assert.equal(note.reviewedBy, null); assert.equal(note.text, 'Correction');
  assert.equal((await request(notesPath + '?status=pending')).body.notes.length, 0);
});
test('notes become public only after approval and disappear after unpublishing', async () => {
  const submitted = await submit(); const id = submitted.body.note._id;
  assert.equal((await request(notesPath)).body.notes.length, 0);
  assert.equal((await review(id, 'approved')).status, 200);
  const published = await request(notesPath);
  assert.equal(published.body.notes.length, 1);
  for (const field of ['author', 'reviewedBy', 'moderationReason', 'status']) assert.equal(field in published.body.notes[0], false);
  assert.equal(tables.notes[0].reviewedBy, ids.admin); assert.ok(tables.notes[0].reviewedAt);
  assert.equal((await review(id, 'rejected', 'approved')).status, 200);
  assert.equal((await request(notesPath)).body.notes.length, 0);
});
test('rejection remains private; authors can see only their own submissions and feedback', async () => {
  const first = await submit();
  await review(first.body.note._id, 'rejected');
  tables.notes.push({ ...tables.notes[0], _id: '300000000000000000000001', author: ids.suspended, text: 'Private note from another author' });
  const mine = await request('/api/notes/mine', { id: ids.academic });
  assert.equal(mine.body.notes.length, 1); assert.equal(mine.body.notes[0].status, 'rejected'); assert.equal(mine.body.notes[0].moderationReason, 'Reviewed against the reference.');
  assert.equal((await request(notesPath)).body.notes.length, 0);
});
test('academics and normal users cannot review notes or manage users, even with a forged role claim', async () => {
  const note = await submit();
  for (const id of [ids.user, ids.academic]) {
    const token = testToken(id, { role: 'admin' });
    assert.equal((await request('/api/admin/users', { token })).status, 403);
    assert.equal((await request(`/api/admin/notes/${note.body.note._id}`, { token, method: 'PATCH', body: { status: 'approved', expectedStatus: 'pending' } })).status, 403);
  }
  assert.equal(tables.notes[0].status, 'pending');
});
test('catalogue mutations and per-inscription AI endpoints require an administrator', async () => {
  for (const id of [ids.user, ids.academic]) {
    for (const [method, path] of [['POST', '/api/inscriptions'], ['PUT', `/api/inscriptions/${ids.inscription}`], ['DELETE', `/api/inscriptions/${ids.inscription}`], ['POST', `/api/inscriptions/${ids.inscription}/upload-image`], ['POST', `/api/inscriptions/${ids.inscription}/ocr`], ['POST', `/api/inscriptions/${ids.inscription}/translate`]]) {
      assert.equal((await request(path, { id, method, body: {} })).status, 403, `${method} ${path}`);
    }
  }
});
test('suspension and role changes immediately apply to previously issued tokens', async () => {
  const token = testToken(ids.academic);
  assert.equal((await request(`/api/admin/users/${ids.academic}`, { id: ids.admin, method: 'PATCH', body: { status: 'suspended' } })).status, 200);
  assert.equal((await request('/api/auth/me', { token })).body.code, 'ACCOUNT_SUSPENDED');
  await request(`/api/admin/users/${ids.academic}`, { id: ids.admin, method: 'PATCH', body: { status: 'active', role: 'user' } });
  assert.equal((await request(notesPath, { token, method: 'POST', body: { text: 'Denied' } })).status, 403);
});
test('administrators cannot change their own access, another administrator, or grant admin through the web API', async () => {
  assert.equal((await request(`/api/admin/users/${ids.admin}`, { id: ids.admin, method: 'PATCH', body: { status: 'suspended' } })).status, 400);
  assert.equal((await request(`/api/admin/users/${ids.user}`, { id: ids.admin, method: 'PATCH', body: { role: 'admin' } })).status, 400);
  tables.accounts.push({ ...tables.accounts[0], _id: '100000000000000000000099' });
  assert.equal((await request('/api/admin/users/100000000000000000000099', { id: ids.admin, method: 'PATCH', body: { role: 'user' } })).status, 404);
  const users = await request('/api/admin/users', { id: ids.admin });
  assert.equal(users.status, 200); assert.ok(!JSON.stringify(users.body).includes('password'));
});
test('legacy roleless accounts retain login but do not gain admin permissions', async () => {
  delete tables.accounts[1].role; delete tables.accounts[1].status;
  const login = await request('/api/auth/login', { method: 'POST', body: { email: 'USER@preview.invalid', password } });
  assert.equal(login.status, 200); assert.equal(login.body.user.role, 'user');
  assert.equal((await request('/api/admin/stats', { token: login.body.token })).status, 403);
});
test('conflicting review decisions are rejected rather than silently overwriting', async () => {
  const submitted = await submit(); const id = submitted.body.note._id;
  assert.equal((await review(id, 'approved')).status, 200);
  assert.equal((await review(id, 'rejected')).status, 409);
  assert.equal(tables.notes[0].status, 'approved');
});
test('missing inscriptions and suspended or downgraded authors cannot be approved', async () => {
  const submitted = await submit(); const id = submitted.body.note._id;
  tables.accounts.find(user => user._id === ids.academic).status = 'suspended';
  assert.equal((await review(id, 'approved')).status, 409);
  tables.accounts.find(user => user._id === ids.academic).status = 'active';
  tables.inscriptions = [];
  assert.equal((await review(id, 'approved')).status, 409);
  assert.equal((await request(notesPath)).status, 404);
});
test('invalid note text, IDs, pagination, and review decisions are rejected', async () => {
  for (const text of ['', '   ', 'x'.repeat(3001), { $ne: '' }]) assert.equal((await submit(text)).status, 400);
  assert.equal((await request('/api/inscriptions/not-an-id/notes')).status, 400);
  assert.equal((await request(notesPath + '?limit=100000')).status, 400);
  assert.equal((await request('/api/admin/users?page=-1', { id: ids.admin })).status, 400);
  const note = await submit();
  assert.equal((await request(`/api/admin/notes/${note.body.note._id}`, { id: ids.admin, method: 'PATCH', body: { status: 'pending', expectedStatus: 'pending' } })).status, 400);
});
