(() => {
  const scriptUrl = new URL(document.currentScript?.src || './home-v3.js', window.location.href);
  const dataUrl = (file) => new URL(`./data/${file}`, scriptUrl).href;
  const fetchJson = (file) => fetch(dataUrl(file), { credentials: 'same-origin' }).then((response) => {
    if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
    return response.json();
  });
  const episodeHref = (episode) => new URL(`./episodes/${episode.id}/`, scriptUrl).href;
  const chapterHref = (episode, chapter) => {
    const url = new URL(episodeHref(episode));
    url.searchParams.set('start', Number(chapter.seconds || 0));
    url.hash = `chapter-${String(chapter.time || '00:00').replace(':', '-')}`;
    return url.href;
  };
  const topicLabels = {
    improvisation: 'IMPROVISATION',
    shuffle: 'SHUFFLE',
    groove: 'GROOVE',
    'live-music': 'LIVE MUSIC',
    'band-ensemble': 'ENSEMBLE',
    metronome: 'METRONOME',
    twist: 'TWIST',
    'studio-history': 'HISTORY',
    AABA: 'AABA',
    'blue-note-dream': 'DREAM / STAGE'
  };

  const renderV3 = async () => {
    const chapterGrid = document.querySelector('[data-rsb-network-chapters]');
    const topicGrid = document.querySelector('[data-rsb-network-topics]');
    const cornerGrid = document.querySelector('[data-rsb-network-corners]');
    const picksGrid = document.querySelector('[data-rsb-network-picks]');
    if (![chapterGrid, topicGrid, cornerGrid, picksGrid].some(Boolean)) return;

    try {
      const episodes = await fetchJson('episodes.json');
      const orderedEpisodes = [...episodes].sort((a, b) => Number(b.episode_number || 0) - Number(a.episode_number || 0));
      const featuredEpisode = orderedEpisodes[0] || null;
      if (!featuredEpisode) return;

      if (chapterGrid) {
        const meaningful = (featuredEpisode.chapters || []).filter((chapter) => !/オープニング|エンディング/.test(chapter.label || ''));
        const preferred = meaningful.filter((chapter) => /シャッフル|インプロ|生演奏|夢|バンド|セッション/.test(chapter.label || ''));
        const selected = [...preferred, ...meaningful]
          .filter((chapter, index, list) => list.findIndex((item) => item.time === chapter.time) === index)
          .slice(0, 3);
        const fragment = document.createDocumentFragment();
        selected.forEach((chapter) => {
          const link = document.createElement('a');
          link.className = 'chapter-feature';
          link.href = chapterHref(featuredEpisode, chapter);
          link.style.setProperty('--chapter-image', `url("${featuredEpisode.thumbnail_url || ''}")`);
          link.dataset.rsbEvent = 'episode_chapter_click';
          link.dataset.programId = featuredEpisode.program;
          link.dataset.episodeId = featuredEpisode.id;
          link.dataset.placement = 'network-featured-chapters';
          link.dataset.destinationType = 'episode_chapter';
          const time = document.createElement('span');
          time.className = 'chapter-time';
          time.textContent = chapter.time;
          const title = document.createElement('strong');
          title.textContent = chapter.label;
          const meta = document.createElement('small');
          meta.textContent = `EP.${String(featuredEpisode.episode_number).padStart(2, '0')} から見る`;
          link.append(time, title, meta);
          fragment.append(link);
        });
        if (fragment.childNodes.length) chapterGrid.replaceChildren(fragment);
      }

      if (topicGrid) {
        const stats = new Map();
        orderedEpisodes.forEach((episode) => (episode.topics || []).forEach((topic) => {
          const current = stats.get(topic) || { count: 0, latest: episode };
          current.count += 1;
          if (Number(episode.episode_number || 0) > Number(current.latest?.episode_number || -1)) current.latest = episode;
          stats.set(topic, current);
        }));
        const fragment = document.createDocumentFragment();
        [...stats.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8).forEach(([topic, stat]) => {
          const link = document.createElement('a');
          link.className = 'topic-card';
          link.href = episodeHref(stat.latest);
          link.dataset.rsbEvent = 'broadcast_topic_click';
          link.dataset.episodeId = stat.latest.id;
          link.dataset.placement = 'network-topics';
          link.dataset.destinationType = 'episode';
          const label = document.createElement('small');
          label.textContent = `${stat.count} EPISODE${stat.count > 1 ? 'S' : ''}`;
          const title = document.createElement('strong');
          title.textContent = topicLabels[topic] || String(topic).replaceAll('-', ' ').toUpperCase();
          const arrow = document.createElement('span');
          arrow.textContent = '関連Episodeを見る →';
          link.append(label, title, arrow);
          fragment.append(link);
        });
        if (fragment.childNodes.length) topicGrid.replaceChildren(fragment);
      }

      if (cornerGrid) {
        const definitions = [
          { key: /俺のシャッフル/, name: '俺のシャッフル', description: '同じShuffleでも、音・身体・打点は人によって違う。' },
          { key: /あやこのインプロ講座/, name: 'あやこのインプロ講座 プチ', description: '即興をルールと音の会話としてほどいていく。' }
        ];
        const fragment = document.createDocumentFragment();
        definitions.forEach((definition) => {
          const matches = [];
          orderedEpisodes.forEach((episode) => (episode.chapters || []).forEach((chapter) => {
            if (definition.key.test(chapter.label || '')) matches.push({ episode, chapter });
          }));
          if (!matches.length) return;
          const latest = matches[0];
          const link = document.createElement('a');
          link.className = 'corner-v3-card';
          link.href = chapterHref(latest.episode, latest.chapter);
          link.dataset.rsbEvent = 'broadcast_corner_click';
          link.dataset.episodeId = latest.episode.id;
          link.dataset.placement = 'network-corners';
          link.dataset.destinationType = 'episode_chapter';
          const small = document.createElement('small');
          small.textContent = `REGULAR / ${matches.length} EPISODES`;
          const title = document.createElement('strong');
          title.textContent = definition.name;
          const body = document.createElement('p');
          body.textContent = definition.description;
          link.append(small, title, body);
          fragment.append(link);
        });
        if (fragment.childNodes.length) cornerGrid.replaceChildren(fragment);
      }

      if (picksGrid) {
        const meaningful = (featuredEpisode.chapters || []).filter((chapter) => !/オープニング|エンディング|ライブ情報/.test(chapter.label || ''));
        const candidates = [
          meaningful.find((chapter) => /シャッフル/.test(chapter.label || '')),
          meaningful.find((chapter) => /インプロ|生演奏|バンド|セッション/.test(chapter.label || '')),
          meaningful.find((chapter) => /夢|原点|出会い|舞台/.test(chapter.label || ''))
        ].filter(Boolean);
        const selected = [...candidates, ...meaningful]
          .filter((chapter, index, list) => list.findIndex((item) => item.time === chapter.time) === index)
          .slice(0, 3);
        const fragment = document.createDocumentFragment();
        selected.forEach((chapter, index) => {
          const link = document.createElement('a');
          link.className = 'route-card';
          link.href = chapterHref(featuredEpisode, chapter);
          link.dataset.rsbEvent = 'broadcast_editorial_pick_click';
          link.dataset.episodeId = featuredEpisode.id;
          link.dataset.placement = 'network-editorial-route';
          link.dataset.destinationType = 'episode_chapter';
          const number = document.createElement('span');
          number.textContent = String(index + 1).padStart(2, '0');
          const title = document.createElement('strong');
          title.textContent = `${chapter.time}　${chapter.label}`;
          link.append(number, title);
          fragment.append(link);
        });
        if (fragment.childNodes.length) picksGrid.replaceChildren(fragment);
      }
    } catch (error) {
      console.warn('[RSB] HOME v3 enhancement fallback retained.', error);
    }
  };

  renderV3();
})();
