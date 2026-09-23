(() => {
  const scriptUrl = new URL(document.currentScript?.src || './app.js', window.location.href);
  const dataUrl = (file) => new URL(`./data/${file}`, scriptUrl).href;
  const jsonCache = new Map();

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

  const fetchJson = (file) => {
    if (!jsonCache.has(file)) {
      jsonCache.set(file, fetch(dataUrl(file), { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
          return response.json();
        }));
    }
    return jsonCache.get(file);
  };

  const episodeHref = (episode) => new URL(`./episodes/${episode.id}/`, scriptUrl).href;
  const programHref = (program) => new URL(`./programs/${program.id}/`, scriptUrl).href;

  const makeEpisodeCard = (episode, guestNames) => {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = episodeHref(episode);
    link.dataset.rsbEvent = 'program_episode_click';
    link.dataset.programId = episode.program;
    link.dataset.episodeId = episode.id;
    link.dataset.placement = 'archive';
    link.dataset.destinationType = 'episode';

    if (episode.thumbnail_url || episode.youtube_id) {
      const media = document.createElement('div');
      media.className = 'card-media';
      const image = document.createElement('img');
      image.src = episode.thumbnail_url || `https://i.ytimg.com/vi/${episode.youtube_id}/hqdefault.jpg`;
      image.alt = `${episode.title} のサムネイル`;
      image.loading = 'lazy';
      media.append(image);
      link.append(media);
    }

    const label = document.createElement('small');
    label.textContent = `EP.${String(episode.episode_number).padStart(2, '0')}${episode.duration ? ` / ${episode.duration}` : ''}`;
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

  const makeProgramCard = (program) => {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = programHref(program);
    link.dataset.rsbEvent = 'broadcast_program_click';
    link.dataset.programId = program.id;
    link.dataset.placement = 'program-grid';
    link.dataset.destinationType = 'program';

    const label = document.createElement('small');
    label.textContent = program.status || 'PROGRAM';
    const title = document.createElement('h3');
    title.textContent = program.name;
    const body = document.createElement('p');
    body.textContent = program.tagline || '番組ホームへ';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = '番組ホームへ →';

    link.append(label, title, body, arrow);
    return link;
  };

  const makeMoreProgramsCard = () => {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('aria-label', 'RS BROADCAST NETWORKの番組は順次追加予定');

    const label = document.createElement('small');
    label.textContent = 'NETWORK';
    const title = document.createElement('h3');
    title.textContent = 'MORE PROGRAMS';
    const body = document.createElement('p');
    body.textContent = '公開状態と権利確認が整った番組から順次追加します。';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = 'ON AIR 2026.09.23';

    article.append(label, title, body, arrow);
    return article;
  };

  const makePersonCard = (person) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.personId = person.id;

    const label = document.createElement('small');
    label.textContent = person.role || 'PERSON';
    const title = document.createElement('h3');
    title.textContent = person.name;
    const body = document.createElement('p');
    body.textContent = person.name_en || '';

    article.append(label, title, body);
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

  const renderProgramGrids = async () => {
    const containers = [...document.querySelectorAll('[data-rsb-program-grid]')];
    if (!containers.length) return;

    try {
      const programs = await fetchJson('programs.json');
      if (!programs.length) return;

      containers.forEach((container) => {
        const fragment = document.createDocumentFragment();
        programs.forEach((program) => fragment.append(makeProgramCard(program)));
        fragment.append(makeMoreProgramsCard());
        container.replaceChildren(fragment);
      });
    } catch (error) {
      console.warn('[RSB] Program grid fallback retained.', error);
    }
  };

  const renderPeopleGrids = async () => {
    const containers = [...document.querySelectorAll('[data-rsb-people]')]
      .filter((container) => container.dataset.rsbPeopleStatic !== 'true');
    if (!containers.length) return;

    try {
      const [programs, episodes, people] = await Promise.all([
        fetchJson('programs.json'),
        fetchJson('episodes.json'),
        fetchJson('people.json')
      ]);
      const peopleById = new Map(people.map((person) => [person.id, person]));

      containers.forEach((container) => {
        const programId = container.dataset.rsbPeople;
        const program = programs.find((item) => item.id === programId);
        if (!program) return;

        const ids = new Set([...(program.host_ids || []), ...(program.assistant_ids || [])]);
        episodes
          .filter((episode) => episode.program === programId)
          .forEach((episode) => (episode.guest_ids || []).forEach((id) => ids.add(id)));

        const programPeople = [...ids].map((id) => peopleById.get(id)).filter(Boolean);
        if (!programPeople.length) return;

        const fragment = document.createDocumentFragment();
        programPeople.forEach((person) => fragment.append(makePersonCard(person)));
        container.replaceChildren(fragment);
      });
    } catch (error) {
      console.warn('[RSB] People grid fallback retained.', error);
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
  renderProgramGrids();
  renderPeopleGrids();
})();
