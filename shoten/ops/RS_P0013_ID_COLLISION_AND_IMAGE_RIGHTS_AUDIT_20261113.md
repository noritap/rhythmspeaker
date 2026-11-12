# 商品準備監査｜RS-P0013 商品ID衝突・画像権利証拠不足
Date: 2026-11-13
Scope: read-only audit + preparation branch record; no main/upstream mutation

## Verified records
1. Upstream canonical `noritap/AMAZON_COMMERCE_DATA_OS/data/products.json` identifies RS-P0013 as **Shokz OpenFit Pro ホワイト**. `data/affiliate_links.json` already contains owner-provided official shortened affiliate link for that product.
2. Public-site main `noritap/rhythmspeaker/shoten/ops/candidates/RS-P0013-anker-solix-c300.json` identifies the SAME RS-P0013 as **Anker Solix C300 Portable Power Station ブラック** (model A1722511). This is a conflicting *legacy candidate record*, not authoritative permission to repurpose the ID.
3. That Anker candidate asserts `photo_rights_confirmed: true` based on `ユーザーよりネット上の商品写真の掲載許可を包括的に確認済み`. User approval does not establish ownership or third-party manufacturer copyright clearance. The manufacturer image URL may be useful as a visual reference but is **not a cleared reusable asset** on this evidence alone.

## Safe resolution
- Preserve canonical RS-P0013 for Shokz; do NOT assign to Anker.
- Mark legacy Anker candidate as `ID_COLLISION_HOLD / COMPARISON_ONLY` in preparation tracking; do not remove or overwrite main candidate without separate scoped instruction.
- Do not accept blanket permission note as image license. Require either genuine owner-original photograph, manufacturer reuse rights for shop affiliate placement, or appropriately licensed dynamic Amazon-provided image.
- No user reassessment of previously submitted affiliate short links.
- Keep Anker power products outside current priority lineup, because EcoFlow is preferred for batteries.
- Product image is NOT ready and no new READY_FOR_AFFILIATE_LINK entry is created.

## Sources reviewed
- `noritap/AMAZON_COMMERCE_DATA_OS/data/products.json`
- `noritap/AMAZON_COMMERCE_DATA_OS/data/affiliate_links.json`
- `noritap/rhythmspeaker/shoten/ops/candidates/RS-P0013-anker-solix-c300.json` (main)
- `noritap/rhythmspeaker/shoten/ops/PRODUCT_OPERATIONS_V1.md`
- https://affiliate.amazon.co.jp/help/node/topic/GKT6X2R3NGW5V23K
- https://affiliate.amazon.co.jp/help/operating/policies

## Implementation boundary
This audit document does not constitute change to canonical approvals, product IDs, main branch, commerce data, image licenses or production site.
