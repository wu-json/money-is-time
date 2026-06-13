// Tiny fine-grained reactivity: signal / computed / effect.
//
// The whole app is "a few inputs fan out to many derived numbers," so we use
// pull-to-read / push-to-recompute reactivity instead of a framework. Reading a
// signal inside a running computation subscribes that computation; setting the
// signal re-runs its subscribers. That's the entire spine.

type Computation = {
  run: () => void;
  // Each entry is a subscriber-set we belong to, so we can detach on re-run.
  deps: Set<Set<Computation>>;
};

let active: Computation | null = null;

function unsubscribe(c: Computation): void {
  for (const subscribers of c.deps) subscribers.delete(c);
  c.deps.clear();
}

export type ReadSignal<T> = () => T;
export type Signal<T> = ReadSignal<T> & {
  set(next: T | ((prev: T) => T)): void;
};

export function signal<T>(initial: T): Signal<T> {
  let value = initial;
  const subscribers = new Set<Computation>();

  const read = (() => {
    if (active) {
      subscribers.add(active);
      active.deps.add(subscribers);
    }
    return value;
  }) as Signal<T>;

  read.set = (next) => {
    const newValue =
      typeof next === "function" ? (next as (prev: T) => T)(value) : next;
    if (Object.is(newValue, value)) return;
    value = newValue;
    // Copy first: a subscriber re-running mutates the set while we iterate.
    for (const c of [...subscribers]) c.run();
  };

  return read;
}

export function effect(fn: () => void): void {
  const c: Computation = {
    deps: new Set(),
    run: () => {
      unsubscribe(c);
      const prev = active;
      active = c;
      try {
        fn();
      } finally {
        active = prev;
      }
    },
  };
  c.run();
}

export function computed<T>(fn: () => T): ReadSignal<T> {
  const s = signal<T>(undefined as T);
  effect(() => s.set(fn()));
  return () => s();
}
