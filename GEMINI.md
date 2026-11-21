# Saheb Paper ERP - Antigravity Agent Directives

Refer to [AGENTS.md](./AGENTS.md) for complete architecture directives.

## 🔒 CRITICAL & STRICT RULE: Database & Environment Protection

### 1. Database Allocation Lock:
- **Localhost:** MUST ALWAYS connect to **`SAHEB-PAPER-ERP`** (`https://scyiwfqkknuphzhvklok.supabase.co`).
- **GitHub Live Link / CI Deploy:** MUST ALWAYS connect to **`Saheb-Paper-DEMO`** (`https://znyvmlwggwckjxxsxiwq.supabase.co`).

### 2. Protected Files:
The AI agent is **STRICTLY FORBIDDEN** from modifying, editing, swapping, or deleting database credentials, URLs, keys, or targets in:
- `.env`
- `.env.development`
- `src/lib/supabase.ts`
- `.github/workflows/deploy.yml`
- `.github/workflows/nightly-backup.yml`
- `.github/workflows/verify-web.yml`

### 3. Mandatory Explicit Permission Protocol:
- If any task touches or requires database settings modification:
  1. **DO NOT MODIFY** the files.
  2. **ASK the user (Rudra or Dhruv) explicitly first**.
  3. **SHOW the exact proposed code diff** and wait for explicit confirmation.
- **NEVER** edit or overwrite `.env` or database URLs silently.
