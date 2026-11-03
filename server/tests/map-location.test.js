import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const exports = {};
const source = ts.transpileModule(readFileSync(new URL('../../src/utils/mapLocation.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText;
new Function('exports', source)(exports);
const { mapCoordinates, locationMapLinks } = exports;
test('site maps accept complete finite coordinates including zero and use them for directions', () => {
  const location = { name: 'Test site', coordinates: { lat: 8.323, lng: 80.396 } };
  assert.deepEqual(mapCoordinates(location), [8.323,80.396]);
  assert.match(locationMapLinks(location).directions, /destination=8\.323%2C80\.396$/);
  assert.deepEqual(mapCoordinates({ coordinates: { lat: 0, lng: 0 } }), [0,0]);
});
test('missing or invalid coordinates never produce a misleading map marker or directions', () => {
  for (const location of [null, {}, { coordinates: {} }, { coordinates: { lat: null, lng: 80 } }, { coordinates: { lat: 91, lng: 80 } }, { coordinates: { lat: 8, lng: 181 } }, { coordinates: { lat: NaN, lng: 80 } }, { coordinates: { lat: '8', lng: '80' } }]) {
    assert.equal(mapCoordinates(location), null); assert.equal(locationMapLinks(location).directions, '');
  }
  const result = locationMapLinks({ name: 'Rock & Cave', district: 'Anuradhapura', coordinates: { lat: null, lng: null } });
  assert.equal(new URL(result.search).searchParams.get('query'), 'Rock & Cave, Anuradhapura, Sri Lanka');
  assert.equal(locationMapLinks({}).search, '');
});
