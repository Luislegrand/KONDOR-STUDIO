export function createRequestQueue({ concurrency = 5 } = {}) {
  const limit = Math.max(1, Number(concurrency) || 1);
  let activeCount = 0;
  const pending = [];

  const runNext = () => {
    if (activeCount >= limit) return;
    const next = pending.shift();
    if (!next) return;
    activeCount += 1;
    Promise.resolve()
      .then(next.fn)
      .then((result) => {
        activeCount -= 1;
        next.resolve(result);
        runNext();
      })
      .catch((err) => {
        activeCount -= 1;
        next.reject(err);
        runNext();
      });
  };

  return {
    add(fn) {
      return new Promise((resolve, reject) => {
        pending.push({ fn, resolve, reject });
        runNext();
      });
    },
  };
}
