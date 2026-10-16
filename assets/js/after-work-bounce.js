// The tennis ball: click, tap, Enter or Space gives it one bounce. No sound. Reduced motion skips the movement.
export function initBounce(ball) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const go = () => {
    if (reduce.matches) return;
    ball.classList.remove('is-bouncing');
    void ball.offsetWidth;
    ball.classList.add('is-bouncing');
  };
  ball.addEventListener('animationend', () => ball.classList.remove('is-bouncing'));
  ball.addEventListener('click', go);
  ball.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });
}
