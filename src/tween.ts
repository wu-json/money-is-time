// requestAnimationFrame number tween: animate `from` -> `to` over `ms`, calling
// `onFrame` each step with an eased value. Returns a cancel function so an
// in-flight tween can be interrupted (e.g. rapid preset clicks) and restarted
// from wherever it currently sits.

export function tweenNumber(
  from: number,
  to: number,
  ms: number,
  onFrame: (value: number) => void,
): () => void {
  if (from === to || ms <= 0) {
    onFrame(to);
    return () => {};
  }

  // easeOutCubic — quick out of the gate, gentle landing.
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  let raf = 0;
  let start = 0;
  const step = (now: number) => {
    if (!start) start = now;
    const t = Math.min(1, (now - start) / ms);
    onFrame(from + (to - from) * ease(t));
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  return () => cancelAnimationFrame(raf);
}
