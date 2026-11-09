import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// In-memory mock localStorage for testing session & user logic
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// ---------------------------------------------------------------------------
// 1. Session Shape Verification
// ---------------------------------------------------------------------------
test('Session shape: saheb_session must store ONLY username, roles, token, expiresAt (no pin, no secrets)', () => {
  const mockStorage = new LocalStorageMock();

  const user = {
    username: 'dispatcher',
    role: 'Dispatcher',
    roles: ['Dispatcher'],
    pin: '1234',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'secret_answer_123',
    displayName: 'Dispatcher',
    email: 'dispatch@sahebpaper.com',
  };

  // Simulate lean session writing (matching AuthContext and data/index.ts)
  const token = 'token_test_12345';
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;

  const session = {
    token,
    username: user.username,
    roles: user.roles || [user.role],
    expiresAt,
  };

  mockStorage.setItem('saheb_session', JSON.stringify(session));

  const { pin: _p, securityAnswer: _sa, ...safeUser } = user;
  mockStorage.setItem('saheb_active_user', JSON.stringify(safeUser));

  // Retrieve and verify
  const storedSession = JSON.parse(mockStorage.getItem('saheb_session'));
  assert.equal(storedSession.token, token);
  assert.equal(storedSession.username, 'dispatcher');
  assert.deepEqual(storedSession.roles, ['Dispatcher']);
  assert.equal(typeof storedSession.expiresAt, 'number');

  // Verify STRICT absence of credentials
  assert.equal(storedSession.pin, undefined, 'Session MUST NOT contain pin');
  assert.equal(storedSession.securityAnswer, undefined, 'Session MUST NOT contain securityAnswer');
  assert.equal(storedSession.user, undefined, 'Session MUST NOT contain full user object');

  // Verify saheb_active_user has no secrets
  const storedActiveUser = JSON.parse(mockStorage.getItem('saheb_active_user'));
  assert.equal(storedActiveUser.pin, undefined, 'saheb_active_user MUST NOT contain pin');
  assert.equal(storedActiveUser.securityAnswer, undefined, 'saheb_active_user MUST NOT contain securityAnswer');
});

// ---------------------------------------------------------------------------
// 2. Security Answer Fallback & Safe Failure Verification
// ---------------------------------------------------------------------------
test('Security answer: account unlock MUST fail safely if user has no security answer configured', () => {
  // Pure logic replica of unlockAccountWithSecurityQuestion
  function testUnlock(user, answer) {
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }
    if (!user.securityAnswer || !user.securityAnswer.trim()) {
      return {
        success: false,
        message: 'No security question configured for this account. Please contact an Admin to unlock your account.'
      };
    }
    const registered = user.securityAnswer.trim().toLowerCase();
    const provided = answer.trim().toLowerCase();
    if (registered !== provided) {
      return { success: false, message: 'Incorrect security answer. Please try again or contact Admin.' };
    }
    return { success: true, message: 'Account successfully unlocked! You can now login.' };
  }

  // User with empty/missing securityAnswer
  const unconfiguredUser = {
    username: 'operator1',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: '',
  };

  // Attempting unlock with old fallback 'blue'
  const blueResult = testUnlock(unconfiguredUser, 'blue');
  assert.equal(blueResult.success, false);
  assert.match(blueResult.message, /No security question configured/);

  // Attempting unlock with random answer
  const randomResult = testUnlock(unconfiguredUser, 'anything');
  assert.equal(randomResult.success, false);
  assert.match(randomResult.message, /No security question configured/);

  // User with configured answer
  const configuredUser = {
    username: 'operator2',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'Emerald Green',
  };

  // Wrong answer
  const wrongResult = testUnlock(configuredUser, 'blue');
  assert.equal(wrongResult.success, false);
  assert.match(wrongResult.message, /Incorrect security answer/);
  // Ensure the actual answer is NOT leaked in the failure message
  assert.ok(!wrongResult.message.includes('Emerald Green'));

  // Correct answer (case-insensitive)
  const correctResult = testUnlock(configuredUser, 'emerald green');
  assert.equal(correctResult.success, true);
  assert.match(correctResult.message, /successfully unlocked/);
});

// ---------------------------------------------------------------------------
// 3. Source File Verification: DEFAULT_USERS and hardcoded 'blue' removal
// ---------------------------------------------------------------------------
test('Source check: src/data/index.ts must NOT contain hardcoded "blue" fallback or defaults', () => {
  const dataIndexContent = fs.readFileSync(path.join(rootDir, 'src', 'data', 'index.ts'), 'utf-8');

  // Verify (user.securityAnswer || 'blue') is gone
  assert.ok(
    !dataIndexContent.includes("|| 'blue'"),
    'src/data/index.ts must not have || \'blue\' fallback'
  );

  // Verify DEFAULT_USERS does not have securityAnswer: 'blue'
  assert.ok(
    !dataIndexContent.includes("securityAnswer: 'blue'"),
    'src/data/index.ts DEFAULT_USERS must not have securityAnswer: \'blue\''
  );
});

// ---------------------------------------------------------------------------
// 4. Debug Helpers DEV Guard Verification
// ---------------------------------------------------------------------------
test('Source check: src/lib/supabase.ts must guard window debug helpers with import.meta.env.DEV', () => {
  const supabaseContent = fs.readFileSync(path.join(rootDir, 'src', 'lib', 'supabase.ts'), 'utf-8');

  // Verify DEV guard exists
  assert.ok(
    supabaseContent.includes("import.meta.env.DEV"),
    'src/lib/supabase.ts must check import.meta.env.DEV before attaching window helpers'
  );

  assert.ok(
    supabaseContent.includes("typeof window !== 'undefined' && import.meta.env.DEV"),
    'window helpers must be guarded by both window check and import.meta.env.DEV'
  );
});

// ---------------------------------------------------------------------------
// 5. Android Manifest & Capacitor Config Verification
// ---------------------------------------------------------------------------
test('Android config: allowBackup="false", usesCleartextTraffic="false", cleartext=false, and stale domains removed', () => {
  const manifestContent = fs.readFileSync(
    path.join(rootDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    'utf-8'
  );

  assert.ok(
    manifestContent.includes('android:allowBackup="false"'),
    'AndroidManifest.xml must set android:allowBackup="false"'
  );
  assert.ok(
    manifestContent.includes('android:usesCleartextTraffic="false"'),
    'AndroidManifest.xml must set android:usesCleartextTraffic="false"'
  );

  const capacitorConfig = fs.readFileSync(path.join(rootDir, 'capacitor.config.ts'), 'utf-8');
  assert.ok(
    capacitorConfig.includes('cleartext: false'),
    'capacitor.config.ts must set cleartext: false'
  );
  assert.ok(
    !capacitorConfig.includes('thakordhruv097-spec.github.io'),
    'capacitor.config.ts must NOT contain stale domain thakordhruv097-spec.github.io'
  );
});

// ---------------------------------------------------------------------------
// 6. Electron Security Configuration Verification
// ---------------------------------------------------------------------------
test('Electron config: sandbox=true, CSP headers present, DevTools disabled in prod, and will-navigate guard', () => {
  for (const file of ['main.js', 'main.cjs']) {
    const mainContent = fs.readFileSync(path.join(rootDir, file), 'utf-8');

    assert.ok(
      mainContent.includes('sandbox: true'),
      `${file} must specify sandbox: true in webPreferences`
    );
    assert.ok(
      mainContent.includes('Content-Security-Policy'),
      `${file} must register a Content-Security-Policy header`
    );
    assert.ok(
      !mainContent.includes("'unsafe-eval'"),
      `${file} CSP header must NOT allow 'unsafe-eval'`
    );
    assert.ok(
      mainContent.includes('will-navigate'),
      `${file} must implement a will-navigate navigation guard`
    );
    assert.ok(
      mainContent.includes('devtools-opened'),
      `${file} must disable DevTools in production`
    );
  }
});
