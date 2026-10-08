# Instructor photo source of truth

**TOPページの「誰と踊るかも、選べます。」に表示する10名の承認済みエディトリアル写真を、サイト全体の講師紹介写真の正本とする。**

- Source files: `assets/instructors/instructor-*-editorial-*-960w.webp`
- Single CSS photo URL registry: `/style.css` の `--rs-instructor-photo-*`
- TOPページ: `.p-*`
- 講師一覧: `instructors/style.css` の `.person-photo--*`
- 講師個別: `instructors/profile.css` の `.profile-photo--*`
- TAPクラス詳細: `classes/detail.css` の `.tap-style-photo--*`
- STEPクラス詳細: `classes/step/index.html` の講師カード
- 教室紹介の代表写真: `about/index.html`

## Update procedure

1. Use only a user-approved, repository-owned real-person photo; never generate or alter a person's identity.
2. Add the approved optimized image under `assets/instructors/`.
3. Change its **single canonical CSS variable** in `style.css`. Do not hardcode a different portrait in any instructor-introduction page.
4. Update `instructors/instructor-catalog.json` when that person has a catalog entry. Update the `about/index.html` representative `<img>` source when Furusho's photo changes.
5. Run `python3 scripts/instructor_photo_contract.py`; the sitewide image regression CI runs the same check.
6. Verify crop and readability on mobile, tablet, desktop. Different aspect ratios may crop the same source photo, but never substitute a different photo.

This policy applies to instructor-introduction surfaces. Broadcast guest/episode photography may be separate when a person appears in a distinct editorial role.
