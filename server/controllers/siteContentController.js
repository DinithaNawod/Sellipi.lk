import SiteContent from '../models/SiteContent.js';
import { readFileSync } from 'node:fs';

export const contentCatalog = JSON.parse(readFileSync(new URL('../../shared/siteContent.json', import.meta.url), 'utf8'));
const allowed = new Map(contentCatalog.map(field => [field.key, field]));
export function validateContent(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).length > allowed.size) return 'Invalid content fields.';
  for (const [key, value] of Object.entries(values)) {
    const field = allowed.get(key);
    if (!field || typeof value !== 'string' || value.length > 15000) return 'Unknown content field or invalid text (maximum 15000 characters per field).';
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid contact email address.';
    if (['url', 'image'].includes(field.type) && value) {
      try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return 'Links and images must use an HTTP or HTTPS URL without credentials.'; }
      catch { return 'Enter a complete HTTP or HTTPS URL.'; }
    }
  }
  return '';
}
export async function getSiteContent(req, res, next) {
  try {
    const doc = await SiteContent.findById('site').lean();
    res.set('Cache-Control', 'no-store');
    res.json({ values: doc?.values || {}, revision: doc?.revision || 0, updatedAt: doc?.updatedAt || null });
  } catch (error) { next(error); }
}
export async function updateSiteContent(req, res, next) {
  try {
    const { values, revision } = req.body;
    const error = validateContent(values);
    if (error || !Number.isSafeInteger(revision) || revision < 0) return res.status(400).json({ message: error || 'Invalid content revision.' });
    // Establish the singleton first so concurrent first edits follow the same compare-and-swap rule.
    try { await SiteContent.updateOne({ _id: 'site' }, { $setOnInsert: { values: {}, revision: 0 } }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
    const doc = await SiteContent.findOneAndUpdate({ _id: 'site', revision }, { $set: { values, updatedBy: req.user._id }, $inc: { revision: 1 } }, { new: true, runValidators: true }).lean();
    if (!doc) return res.status(409).json({ message: 'Another administrator updated the site. Reload the editor before saving.' });
    res.json({ values: doc.values, revision: doc.revision, updatedAt: doc.updatedAt });
  } catch (error) { next(error); }
}
