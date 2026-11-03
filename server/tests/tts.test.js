import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the real hook against a controlled browser speech engine without audio hardware.
const compiled = ts.transpileModule(readFileSync(new URL('../../src/hooks/useTTS.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText;
function fixture(supported = true) {
  const states = [], cleanups = [], queue = [];
  let cancellations = 0;
  const react = {
    useState(value) { const index = states.length; states.push(value); return [value, next => { states[index] = next; }]; },
    useRef(value) { return { current: value }; },
    useCallback(callback) { return callback; },
    useEffect(callback) { cleanups.push(callback()); },
  };
  class Utterance { constructor(text) { this.text = text; } }
  const voice = { lang: 'en-US', name: 'Test English' };
  const window = supported ? { SpeechSynthesisUtterance: Utterance, speechSynthesis: { getVoices: () => [voice], cancel: () => { cancellations++; }, resume() {}, speak: value => queue.push(value) } } : {};
  const exports = {};
  new Function('require', 'exports', 'window', 'SpeechSynthesisUtterance', compiled)(() => react, exports, window, Utterance);
  const hook = exports.useTTS();
  return { hook, states, queue, voice, cleanups, cancellations: () => cancellations };
}
test('translation speech reads all text in sequence using an English voice and finishes', () => {
  const f = fixture();
  const text = 'The cave is given to the Sangha of the four quarters, present and absent. '.repeat(12).trim();
  f.hook.speak(text);
  assert.equal(f.states[0], true);
  for (let i = 0; i < f.queue.length; i++) { assert.equal(f.queue[i].voice, f.voice); f.queue[i].onend(); }
  assert.equal(f.queue.map(item => item.text).join(''), text);
  assert.ok(f.queue.length > 1);
  assert.equal(f.states[0], false);
});
test('stop and unmount prevent stale speech events from continuing playback', () => {
  const f = fixture();
  f.hook.speak('A lengthy translation. '.repeat(30));
  const utterance = f.queue[0];
  f.hook.stop(); utterance.onend(); utterance.onerror({ error: 'interrupted' });
  assert.equal(f.queue.length, 1); assert.equal(f.states[0], false); assert.equal(f.states[2], '');
  f.hook.speak('Second reading. '.repeat(30));
  f.cleanups.forEach(cleanup => cleanup?.());
  f.queue[1].onend(); assert.equal(f.queue.length, 2);
  assert.ok(f.cancellations() >= 3);
});
test('unsupported browsers and speech engine failures produce visible error messages', () => {
  const unsupported = fixture(false); unsupported.hook.speak('Translation');
  assert.equal(unsupported.states[1], false); assert.match(unsupported.states[2], /not supported/);
  const f = fixture(); f.hook.speak('Translation'); f.queue[0].onerror({ error: 'voice-unavailable' });
  assert.equal(f.states[0], false); assert.match(f.states[2], /Voice playback could not start/);
});
