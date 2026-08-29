(() => {
  const cache = new Map();

  async function loadChunkedImage(key, basePath, partCount, mime = 'image/jpeg') {
    if (cache.has(key)) return cache.get(key);
    const promise = (async () => {
      const urls = Array.from({ length: partCount }, (_, i) => `${basePath}/part-${String(i + 1).padStart(2, '0')}.txt`);
      const parts = await Promise.all(urls.map(async (url) => {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`image part failed: ${url}`);
        return (await res.text()).trim();
      }));
      const binary = atob(parts.join(''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    })();
    cache.set(key, promise);
    return promise;
  }

  async function hydrateFlyers(root = document) {
    const targets = [...root.querySelectorAll('[data-naoyuki-flyer]')];
    if (!targets.length) return;
    try {
      const src = await loadChunkedImage('naoyuki-original', './assets/naoyuki-flyer/base64', 8);
      targets.forEach((img) => {
        img.src = src;
        img.classList.remove('is-loading');
      });
    } catch (error) {
      console.error(error);
      targets.forEach((img) => {
        img.classList.remove('is-loading');
        img.closest('.flyer-frame')?.classList.add('has-error');
      });
    }
  }

  window.RSWorkshopUI = { hydrateFlyers };
})();
