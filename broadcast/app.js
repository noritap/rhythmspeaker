(() => {
  const sendEvent = (name, detail = {}) => {
    const payload = {
      event: name,
      ...detail,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    window.dispatchEvent(new CustomEvent('rsb:analytics', { detail: payload }));

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-rsb-event]');
    if (!target) return;

    sendEvent(target.dataset.rsbEvent, {
      program_id: target.dataset.programId || null,
      episode_id: target.dataset.episodeId || null,
      person_id: target.dataset.personId || null,
      placement: target.dataset.placement || null,
      destination_type: target.dataset.destinationType || null,
      href: target.getAttribute('href') || null
    });
  });
})();
