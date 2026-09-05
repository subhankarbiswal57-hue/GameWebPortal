import { bus } from './event-bus.js';

export function initRouter() {
  window.addEventListener('hashchange', handle);
  handle();
}

function handle() {
  const id = location.hash.replace('#', '');
  bus.emit('route:change', id || null);
}

export function goTo(id) { location.hash = id ? `#${id}` : ''; }
