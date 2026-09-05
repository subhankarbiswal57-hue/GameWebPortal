class EventBus {
  #m = new Map();
  on(ev, fn) { (this.#m.get(ev) ?? this.#m.set(ev, []).get(ev)).push(fn); }
  off(ev, fn) { this.#m.set(ev, (this.#m.get(ev) ?? []).filter(f => f !== fn)); }
  emit(ev, payload) { (this.#m.get(ev) ?? []).forEach(fn => fn(payload)); }
}
export const bus = new EventBus();
