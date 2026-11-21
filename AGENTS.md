# Instructions for Antigravity & Collaborators (Dhruv & Rudra)

## Saheb Paper ERP Core Rules

### 1. Single APK Architecture (No APK Building)
- The user uses a **single installed APK** on their mobile device.
- **NEVER** build APKs locally or in CI/CD.
- **NEVER** create GitHub release workflows that build or release APK files (`.github/workflows/build-apk.yml` and `build_apk.bat` are permanently removed).
- **NEVER** open Chrome browser or trigger external browser downloads (`window.open` with APK download links is forbidden).

### 2. Over-The-Air (OTA) Updates Only
- The installed Android APK loads from GitHub Pages (`https://sahebpaper.github.io/saheb-paper/`).
- Whenever changes are made (UI, PDF layout, formulas, reports):
  1. Test locally: `npm run build`
  2. Sync Capacitor assets: `npx cap sync android` (or run `sync_web.bat`)
  3. Commit and push to `main`
  4. GitHub Actions deploys the web build to GitHub Pages (`.github/workflows/deploy.yml`).
  5. The mobile app automatically receives the updates in-app without needing to install an APK or open Chrome.

### 3. Version Bump Guidelines
- Only bump version in `public/version.json` and `src/components/AppUpdateModal.tsx` when an explicit user-facing update release is requested.
- Keep `apkUrl` in `public/version.json` pointing to `https://sahebpaper.github.io/saheb-paper/#/` (internal app path) to prevent older clients from launching external browser intents.

### 4. GSD Development Framework (@opengsd/gsd-core)
- Always use the GSD (Git. Ship. Done.) framework (`@opengsd/gsd-core`) for developing and evolving the app.
- Follow disciplined spec-driven workflows (planning, task execution, verification loops, and atomic milestone commits) to ensure stable and consistent engineering.

---

## 🔒 STRICT RULE: Database & Environment Protection (DO NOT TOUCH)

### 1. Database Allocation Lock (NEVER SWAP OR ALTER AUTONOMOUSLY):
- **Localhost Environment:** MUST ALWAYS connect to **`SAHEB-PAPER-ERP`** (`https://scyiwfqkknuphzhvklok.supabase.co`).
- **GitHub Live Link / CI Build:** MUST ALWAYS connect to **`Saheb-Paper-DEMO`** (`https://znyvmlwggwckjxxsxiwq.supabase.co`).

### 2. Protected Files:
The AI agent is **STRICTLY FORBIDDEN** from modifying, editing, swapping, or deleting database credentials, URLs, keys, or targets in the following files:
1. `.env`
2. `.env.development`
3. `src/lib/supabase.ts` (specifically `PROD_SUPABASE_CONFIG`, `DEMO_SUPABASE_CONFIG`, and host auto-detect logic)
4. `.github/workflows/deploy.yml` (lines containing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
5. `.github/workflows/nightly-backup.yml`
6. `.github/workflows/verify-web.yml`

### 3. Mandatory Explicit Permission Protocol:
- If a task ever seems to require changing the database configuration or `.env`:
  1. The agent **MUST STOP IMMEDIATELY**.
  2. The agent **MUST ASK Rudra or Dhruv for explicit permission in plain text**.
  3. The agent **MUST SHOW the exact code/diff** and explain why before making any edit.
- **NEVER** edit or overwrite `.env` or database URLs silently.


