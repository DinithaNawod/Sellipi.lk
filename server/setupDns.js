// Optional per-process workaround for Windows/Node Atlas SRV lookup failures.
// Sets DNS before loading the server; does not modify OS network settings.
import { setServers } from 'node:dns';

setServers(['1.1.1.1', '8.8.8.8']);

await import('./index.js');
