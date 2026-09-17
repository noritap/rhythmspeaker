# BEGINNER AGE PERSONA UX AUDIT

Date: 2026-09-18
Scope: official HP main → first-time visitor → trial decision
Purpose: make a completely new tap-dance visitor able to understand the next action from teens through 80s without assuming age equals ability.

## Current evidence

Current home already exposes: beginner welcome, Ikebukuro, trial ¥1,000, free shoes/wear, LINE trial CTA, class list, instructors, studio, beginner flow.

Current `/trial/` already explains: complete beginners, free shoes/wear, hand-free participation, 15-minute early arrival, 60-minute trial, post-trial guidance, and FAQ. It explicitly mentions 50s/60s but does not provide equivalent reassurance/navigation for teens, 20s, 30s, 40s, 70s, 80s.

## Persona walkthrough

| Persona | First question | Current HP result | Main friction | Correction |
|---|---|---|---|---|
| 10s | 初めてでもできる？保護者は何を確認する？ | beginner message is visible | minor/guardian path is not explicit | guardian consultation guidance |
| 20s | 未経験で一人でも浮かない？ | trial FAQ helps | benefit and fastest start path are dispersed | one-page beginner shortcut |
| 30s | 仕事と両立できる？ | hand-free/work-after-work copy helps | continuation pace is not immediately clear | explain trial-first, decide pace later |
| 40s | 今から始めても遅くない？ | generic beginner copy | no direct reassurance | age shortcut + no age stereotyping |
| 50s | 体力が心配 | explicit trial copy exists | useful content is lower in page | surface direct shortcut |
| 60s | 無理なく続けられる？ | explicit trial copy exists | pace/consultation path could be clearer | consultation-first option |
| 70s | どの程度動く？休みながらできる？ | not directly addressed | feels outside stated audience | pre-trial consultation guidance |
| 80s | 参加可能か誰に聞けばいい？ | not directly addressed | no safe decision path | consultation-first + health caution |

## Cross-age findings

### KEEP
- ¥1,000 first trial
- zero enrollment fee
- free tap shoes and wear
- LINE as one primary conversion route
- 15 min early → 60 min trial → optional guidance flow
- beginner-first language

### UPDATE
- Give every decade a recognizable entry point.
- Do not create eight disconnected conversion funnels; maintain one canonical trial action.
- Separate `age as navigation shortcut` from `ability/health as individual condition`.
- For 70s/80s, avoid unsupported promises that everyone can participate; provide consultation path.
- For minors, surface guardian confirmation rather than silently treating them as adult users.

## Architecture decision

Do NOT create eight independent pages in V1.

Reason:
- most factual information is shared;
- eight pages would duplicate price, access, equipment and flow and create source-of-truth drift;
- age is a useful navigation shortcut but not a sufficient service segmentation variable;
- one accessible `/beginner/` hub can serve all decades while preserving one canonical `/trial/` conversion source.

Create separate age pages later only if analytics/user interviews show materially different information needs that cannot be solved by anchors/sections.

## V1 success path

Home / search / shared link
→ `/beginner/`
→ recognize own decade or universal FAQ
→ understand equipment / cost / first-day flow
→ choose trial now OR consult first
→ LINE
→ actual trial

## Measurement recommendation

Track at minimum:
- beginner guide visits
- age shortcut clicks by decade
- `trial now` clicks
- `consult first` clicks
- completed inquiries where available

Use age-click data only to improve information architecture; do not infer health, ability, or suitability from age alone.

## V2 evidence gate

Create dedicated decade pages only when one or more is true:
- repeated decade-specific questions appear in real inquiries;
- a decade section has high traffic but materially lower conversion;
- content exceeds what can remain concise in the shared hub;
- a distinct guardian/accessibility/participation workflow becomes operationally necessary.
