(() => {
  const scriptUrl = new URL(document.currentScript?.src || './app.js', window.location.href);
  const dataUrl = (file) => new URL(`./data/${file}`, scriptUrl).href;

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

  const fetchJson = async (file) => {
    const response = await fetch(dataUrl(file), { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
    return response.json();
  };

  const episodeHref = (episode) => new URL(`./episodes/${episode.id}/`, scriptUrl).href;

  const makeEpisodeCard = (episode, guestNames) => {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = episodeHref(episode);
    link.dataset.rsbEvent = 'program_episode_click';
    link.dataset.programId = episode.program;
    link.dataset.episodeId = episode.id;
    link.dataset.placement = 'archive';
    link.dataset.destinationType = 'episode';

    const label = document.createElement('small');
    label.textContent = `EP.${String(episode.episode_number).padStart(2, '0')}`;

    const title = document.createElement('h3');
    title.textContent = guestNames.length ? guestNames.join(' / ') : episode.title;

    const summary = document.createElement('p');
    summary.textContent = episode.summary;

    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = 'Episodeを見る →';

    link.append(label, title, summary, arrow);
    return link;
  };

  const makeComingSoonCard = () => {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('aria-label', '次回エピソードは公開準備中');

    const label = document.createElement('small');
    label.textContent = 'NEXT';
    const title = document.createElement('h3');
    title.textContent = '次のEpisodeへ';
    const body = document.createElement('p');
    body.textContent = '公開状態と内容確認が整ったEpisodeから順次追加します。';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = 'COMING SOON';

    article.append(label, title, body, arrow);
    return article;
  };

  const renderEpisodeArchives = async () => {
    const containers = [...document.querySelectorAll('[data-rsb-episode-archive]')];
    if (!containers.length) return;

    try {
      const [episodes, people] = await Promise.all([
        fetchJson('episodes.json'),
        fetchJson('people.json')
      ]);
      const peopleById = new Map(people.map((person) => [person.id, person.name]));

      containers.forEach((container) => {
        const programId = container.dataset.rsbEpisodeArchive;
        const programEpisodes = episodes
          .filter((episode) => episode.program === programId)
          .sort((a, b) => b.episode_number - a.episode_number);

        if (!programEpisodes.length) return;

        const fragment = document.createDocumentFragment();
        programEpisodes.forEach((episode) => {
          const guestNames = (episode.guest_ids || [])
            .map((id) => peopleById.get(id))
            .filter(Boolean);
          fragment.append(makeEpisodeCard(episode, guestNames));
        });
        fragment.append(makeComingSoonCard());

        container.replaceChildren(fragment);
      });
    } catch (error) {
      console.warn('[RSB] Episode archive fallback retained.', error);
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

  renderEpisodeArchives();
})();
