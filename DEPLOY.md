# Deploy & Release

Standard procedure for shipping a new version of `ngx-digit-flow`.

---

## 1. Branch & PR

Create a feature/fix branch off `main`, do the work, push, and open a PR.

```bash
git checkout -b fix/my-change   # or feat/
# ... make changes ...
git push -u origin fix/my-change
gh pr create --title "..." --body "..."
```

Merge the PR to `main` when ready. Delete the branch after merge.

---

## 2. Pull latest main

```bash
git checkout main
git pull
```

---

## 3. Bump version

Edit `packages/package.json` — increment the patch/minor/major field:

```json
"version": "0.0.X"
```

---

## 4. Update CHANGELOG

Add a new entry at the top of `CHANGELOG.md`:

```md
## 0.0.X - YYYY-MM-DD

### Fixed
- ...

### Added
- ...

### Changed
- ...
```

---

## 5. Build the library

```bash
./node_modules/.bin/ng build ngx-digit-flow
```

Output goes to `dist/ngx-digit-flow/`.

---

## 6. Commit & push

```bash
git add CHANGELOG.md packages/package.json
git commit -m "chore: release 0.0.X"
git push
```

---

## 7. Tag

```bash
git tag v0.0.X
git push origin v0.0.X
```

---

## 8. GitHub release

Title: `ngx-digit-flow@0.0.X` — Tag: `v0.0.X`

```bash
gh release create v0.0.X \
  --title "ngx-digit-flow@0.0.X" \
  --notes "..."
```

Notes format (match existing releases):

```md
## What is new

### Fixed / Added / Changed
- ...

### Verification
- `./node_modules/.bin/ng build ngx-digit-flow`
- `npm publish ./dist/ngx-digit-flow --access public`
- `npm view ngx-digit-flow@0.0.X version --json`

Published to npm as `ngx-digit-flow@0.0.X`.
```

---

## 9. Publish to npm

```bash
npm publish ./dist/ngx-digit-flow --access public
```

> Always use `./dist/ngx-digit-flow` (with `./`) — without the prefix npm
> interprets the path as a GitHub shorthand and fails.

---

## Checklist

- [ ] PR merged to `main`
- [ ] `packages/package.json` version bumped
- [ ] `CHANGELOG.md` entry added
- [ ] Library built (`ng build ngx-digit-flow`)
- [ ] `chore: release 0.0.X` commit pushed
- [ ] Git tag `v0.0.X` pushed
- [ ] GitHub release created (`ngx-digit-flow@0.0.X`)
- [ ] `npm publish` completed — verify with `npm view ngx-digit-flow version`
