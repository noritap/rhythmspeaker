(() => {
  const byId = id => document.getElementById(id);
  const getCurrentStyle = () => {
    const id = byId('styleSelect')?.value;
    return (window.styles || styles).find(s => s.id === id || s.short === id) || (window.styles || styles)[0];
  };
  const buildBrief = style => `UI STYLE IMPLEMENTATION BRIEF\n\nPrimary Style: ${style.id} — ${style.name}\nMood: ${style.mood}\n\nPage intent: [define before implementation]\nPrimary user goal: [define before implementation]\n\nPreserve:\n- existing information architecture\n- content meaning and required information\n- primary user task and primary CTA\n- required navigation / interaction behavior\n\nChange:\n- typography\n- color\n- spacing / density\n- layout composition\n- image treatment\n- component styling\n\nCanonical implementation sources:\n- design_reference/DESIGN_LIBRARY_INDEX.md\n- design_reference/UI_TRANSLATION_CONTRACT.md\n- 26_UI_STYLE_APPLICATION_RULE.md\n\nResponsive:\n- do not copy desktop composition literally to mobile\n- preserve information priority\n- prevent text clipping / horizontal overflow\n- keep CTA and controls tappable and visible\n\nAccessibility guardrails:\n- preserve semantic heading order\n- maintain readable contrast\n- keep visible interaction state / focus\n- do not let decorative elements hide content or controls\n\nAvoid:\n- pixel-copying the reference image\n- copying logos / people / proprietary mastheads\n- changing IA merely to imitate the reference\n- visual novelty that reduces task clarity\n\nRule: UX invariants override Style fidelity when they conflict.`;

  function addSpecimenBriefButton() {
    const row = document.querySelector('#specimen .actions');
    if (!row || byId('copyImplementationBrief')) return;
    const button = document.createElement('button');
    button.className = 'pill';
    button.id = 'copyImplementationBrief';
    button.type = 'button';
    button.textContent = 'Implementation Briefをコピー';
    row.appendChild(button);
    button.addEventListener('click', e => copy(buildBrief(getCurrentStyle()), e.currentTarget));
  }

  function addDecisionBriefButton() {
    const decision = byId('decision');
    if (!decision || !decision.classList.contains('show') || decision.querySelector('.brief-copy')) return;
    const adopted = new URLSearchParams(location.search).get('adopted');
    if (!adopted) return;
    const style = (window.styles || styles).find(s => s.id === adopted || s.short === adopted);
    if (!style) return;
    const button = document.createElement('button');
    button.className = 'pill brief-copy';
    button.type = 'button';
    button.textContent = 'Implementation Briefをコピー';
    button.addEventListener('click', e => copy(buildBrief(style), e.currentTarget));
    decision.appendChild(button);
  }

  addSpecimenBriefButton();
  addDecisionBriefButton();
  new MutationObserver(addDecisionBriefButton).observe(document.body, {subtree:true, childList:true, attributes:true});
})();
