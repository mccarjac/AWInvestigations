// Polyfills for JSZip and other Node.js modules
import { Buffer } from 'buffer';
import process from 'process/browser';

global.Buffer = Buffer;

if (typeof global.process === 'undefined') {
  global.process = process;
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
