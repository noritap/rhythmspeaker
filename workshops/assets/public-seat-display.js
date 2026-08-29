(() => {
  const configured = Number(window.RS_WORKSHOP_CONFIG?.publicSeatThreshold);
  const THRESHOLD = Number.isFinite(configured) && configured >= 0 ? configured : 3;
  const reserveForm = document.getElementById('reserveForm');
  if (!reserveForm) return;

  const publicSeatLabel = remaining => {
    const n = Number(remaining);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return '満席';
    if (n <= THRESHOLD) return `残り${n}名`;
    return '受付中';
  };

  const applyClassAvailability = (node, count) => {
    if (!node.classList.contains('seat')) return;
    const sessionId = node.dataset.seat;
    if (!sessionId) return;

    const chooseButton = document.querySelector(`[data-choose="${sessionId}"]`);
    const sessionSelect = document.getElementById('sessionId');
    const option = sessionSelect ? Array.from(sessionSelect.options).find(item => item.value === sessionId) : null;
    const card = node.closest('.class-card');
    const isFull = count <= 0;

    node.setAttribute('aria-live', count <= THRESHOLD ? 'polite' : 'off');
    if (chooseButton) {
      chooseButton.dataset.openLabel ||= chooseButton.textContent.trim() || 'このクラスを選ぶ';
      chooseButton.disabled = isFull;
      chooseButton.setAttribute('aria-disabled', String(isFull));
      chooseButton.textContent = isFull ? '満席' : chooseButton.dataset.openLabel;
    }
    if (option) option.disabled = isFull;
    if (card) {
      card.dataset.availability = isFull ? 'full' : count <= THRESHOLD ? 'low' : 'open';
      card.setAttribute('aria-label', `${card.querySelector('h3')?.textContent || 'クラス'} ${publicSeatLabel(count)}`);
    }
  };

  const normalizeSeatNode = node => {
    if (!node) return;
    const text = String(node.textContent || '').trim();
    const match = text.match(/^(?:残席\s*)?(\d+)(?:席)?$/);
    if (!match) return;
    const count = Number(match[1]);
    node.dataset.remaining = String(count);
    node.dataset.publicSeatState = count <= 0 ? 'full' : count <= THRESHOLD ? 'low' : 'open';
    applyClassAvailability(node, count);
    const next = publicSeatLabel(count);
    if (next && text !== next) node.textContent = next;
  };

  const updateStaticLabels = () => {
    const remaining = document.getElementById('remaining');
    const label = remaining?.previousElementSibling;
    if (remaining) remaining.setAttribute('aria-live', 'polite');
    if (label && label.textContent.trim() === '残席') label.textContent = '空き状況';

    const flowHelp = document.querySelector('.flow-step small');
    if (flowHelp && flowHelp.textContent.includes('残席')) {
      flowHelp.textContent = flowHelp.textContent.replace('残席', '受付状況');
    }
  };

  const scan = () => {
    updateStaticLabels();
    document.querySelectorAll('.seat, #remaining').forEach(normalizeSeatNode);
  };

  const sessionSelect = document.getElementById('sessionId');
  sessionSelect?.addEventListener('change', () => sessionSelect.setCustomValidity(''));
  reserveForm.addEventListener('submit', event => {
    const sessionId = sessionSelect?.value;
    if (!sessionId) return;
    const seatNode = document.querySelector(`.seat[data-seat="${sessionId}"]`);
    const knownRemaining = Number(seatNode?.dataset.remaining);
    if (Number.isFinite(knownRemaining) && knownRemaining <= 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sessionSelect.setCustomValidity('このクラスは満席です。別のクラスを選択してください。');
      sessionSelect.reportValidity();
    }
  }, true);

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  scan();
})();
