(() => {
  const THRESHOLD = 3;
  if (!document.getElementById('reserveForm')) return;

  const publicSeatLabel = remaining => {
    const n = Number(remaining);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return '満席';
    if (n <= THRESHOLD) return `残り${n}名`;
    return '受付中';
  };

  const normalizeSeatNode = node => {
    if (!node) return;
    const text = String(node.textContent || '').trim();
    const match = text.match(/^(?:残席\s*)?(\d+)(?:席)?$/);
    if (!match) return;
    const next = publicSeatLabel(match[1]);
    if (next && text !== next) node.textContent = next;
  };

  const updateStaticLabels = () => {
    const remaining = document.getElementById('remaining');
    const label = remaining?.previousElementSibling;
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

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  scan();
})();
