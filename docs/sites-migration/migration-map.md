# Migration map
| Sites route | GitHub branch route | State | Preserved dependency |
|---|---|---|---|
| #/ | / | Migrated | existing images, trial/apply, class detail URLs, services |
| #/trial | /trial/ | Migrated | /trial/apply/ unchanged, LINE/email handoff |
| #/schedule | /schedule/ | New | sample-only discovery, no real booking/Calendar writes |
| #/pricing | /pricing/ | New | source pricing preserved, Wallet remains external |
| #/classes | /classes/ | Migrated | six detailed /classes/{type}/ pages unchanged |
| #/instructors | /instructors/ | Migrated | canonical catalog, six profile pages, proposal contacts isolated |
| #/about | /about/ | Migrated | founder identity retained as an additional section |
| #/faq | /faq/ | Migrated | native details answers, trial/access/pricing routes |
| #/access | /access/ | Migrated | real studio image, Maps/video, structured metadata |
| #/services | /ecosystem/ | Migrated | existing service destinations and RSS/broadcast/workshops preserved |
| #/classes/{step,tap,stretch,isolation,bar-method,hiit} | /classes/{type}/ | Existing GitHub detail UI retained | curriculum, photos, teacher links, conversion |

No old URL deleted. Class detail visual migration is intentionally excluded to preserve richer existing functionality. New SPA transitions apply only to the 10 migrated canonical URLs; legacy #/ links are still understood. Class selection uses public occurrence ID in query; application text is never placed in the URL.

## Differences from Sites
- Real static URLs and asset bases replace hash-only routing.
- Initial HTML includes page content and metadata; JS enhances it.
- Existing global navigation entries remain, rather than losing workshops/RSS/SHOP.
- Header primary trial CTA continues to the existing first-party application form.
- Unverified classes for four contact-only instructors are removed from filters, not invented.
- Founder introduction/portrait retained from main. Class/profile detail pages keep their current UI.
- Existing photo QA now accepts the new static image markup while still enforcing exact canonical files and square fitting; existing legacy checks remain for non-migrated templates.
