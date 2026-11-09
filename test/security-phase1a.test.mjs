import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Set up mock localStorage and window on globalThis before loading application modules
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

const mockStorage = new LocalStorageMock();
globalThis.localStorage = mockStorage;
globalThis.window = {
  location: { hostname: 'localhost', reload: () => {} },
  dispatchEvent: () => true,
};

// Import actual production code functions directly
const {
  scrubLegacyStorageSessions,
  isSecurityAnswerConfigured,
  unlockAccountWithSecurityQuestion,
  getAccountLockInfo,
  saveUser,
  getUsers,
} = await import('../src/data/index.ts');

const {
  userFromDb,
  userToDb,
} = await import('../src/lib/supabaseSync.ts');

// ---------------------------------------------------------------------------
// 1. Behavior Test: Legacy Session & Storage Scrubbing
// ---------------------------------------------------------------------------
test('BEHAVIOR: scrubLegacyStorageSessions() rewrites legacy session to lean shape and removes secrets', () => {
  mockStorage.clear();

  // Seed with legacy pre-1A session containing full user object and secrets
  const legacySession = {
    token: 'legacy_tok_8888',
    expiresAt: Date.now() + 3600000,
    user: {
      username: 'pulper',
      pin: '1122',
      securityAnswer: 'blue',
      roles: ['PulpOperator'],
      role: 'PulpOperator',
      displayName: 'Pulper Operator',
    },
    pin: '1122',
    securityAnswer: 'blue',
  };

  const legacyActiveUser = {
    username: 'pulper',
    pin: '1122',
    securityAnswer: 'blue',
    role: 'PulpOperator',
    displayName: 'Pulper Operator',
  };

  mockStorage.setItem('saheb_session', JSON.stringify(legacySession));
  mockStorage.setItem('saheb_active_user', JSON.stringify(legacyActiveUser));

  // Run actual scrubber
  scrubLegacyStorageSessions();

  // Verify saheb_session in localStorage
  const scrubbedSession = JSON.parse(mockStorage.getItem('saheb_session'));
  assert.equal(scrubbedSession.token, 'legacy_tok_8888');
  assert.equal(scrubbedSession.username, 'pulper');
  assert.deepEqual(scrubbedSession.roles, ['PulpOperator']);
  assert.equal(typeof scrubbedSession.expiresAt, 'number');

  // Verify that secrets and full user object were completely removed
  assert.equal(scrubbedSession.pin, undefined, 'Session must not contain pin');
  assert.equal(scrubbedSession.securityAnswer, undefined, 'Session must not contain securityAnswer');
  assert.equal(scrubbedSession.user, undefined, 'Session must not contain user object');

  // Verify saheb_active_user in localStorage
  const scrubbedActiveUser = JSON.parse(mockStorage.getItem('saheb_active_user'));
  assert.equal(scrubbedActiveUser.username, 'pulper');
  assert.equal(scrubbedActiveUser.pin, undefined, 'Active user must not contain pin');
  assert.equal(scrubbedActiveUser.securityAnswer, undefined, 'Active user must not contain securityAnswer');
});

// ---------------------------------------------------------------------------
// 2. Behavior Test: isSecurityAnswerConfigured() Validation
// ---------------------------------------------------------------------------
test('BEHAVIOR: isSecurityAnswerConfigured() rejects "blue", empty, whitespace, and accepts real answers', () => {
  // Insecure legacy defaults
  assert.equal(isSecurityAnswerConfigured({ username: 'u1', securityAnswer: 'blue' }), false);
  assert.equal(isSecurityAnswerConfigured({ username: 'u2', securityAnswer: 'Blue' }), false);
  assert.equal(isSecurityAnswerConfigured({ username: 'u3', securityAnswer: 'BLUE' }), false);
  assert.equal(isSecurityAnswerConfigured({ username: 'u4', securityAnswer: '  blue  ' }), false);

  // Missing / empty
  assert.equal(isSecurityAnswerConfigured({ username: 'u5', securityAnswer: '' }), false);
  assert.equal(isSecurityAnswerConfigured({ username: 'u6', securityAnswer: '   ' }), false);
  assert.equal(isSecurityAnswerConfigured({ username: 'u7' }), false);
  assert.equal(isSecurityAnswerConfigured(null), false);
  assert.equal(isSecurityAnswerConfigured(undefined), false);

  // Valid configured answers
  assert.equal(isSecurityAnswerConfigured({ username: 'u8', securityAnswer: 'Ahmedabad' }), true);
  assert.equal(isSecurityAnswerConfigured({ username: 'u9', securityAnswer: 'My Golden Retriever 2026' }), true);
});

// ---------------------------------------------------------------------------
// 3. Behavior Test: unlockAccountWithSecurityQuestion() Fail-Safe Logic
// ---------------------------------------------------------------------------
test('BEHAVIOR: unlockAccountWithSecurityQuestion() fails safely when answer is legacy "blue" or missing', () => {
  // Register a test user with legacy 'blue' in storage
  const testUserLegacy = {
    username: 'test_legacy_user',
    role: 'Viewer',
    roles: ['Viewer'],
    pin: '1234',
    displayName: 'Test User',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
  };
  saveUser(testUserLegacy);

  // Attempt to unlock with 'blue'
  const res1 = unlockAccountWithSecurityQuestion('test_legacy_user', 'blue');
  assert.equal(res1.success, false);
  assert.match(res1.message, /No security question configured/);

  // Attempt to unlock with random text
  const res2 = unlockAccountWithSecurityQuestion('test_legacy_user', 'something');
  assert.equal(res2.success, false);
  assert.match(res2.message, /No security question configured/);

  // Register a user with a genuine secret answer
  const testUserConfigured = {
    username: 'test_secured_user',
    role: 'Viewer',
    roles: ['Viewer'],
    pin: '1234',
    displayName: 'Secured User',
    securityQuestion: 'What town were you born in?',
    securityAnswer: 'Vadodara Gujarat',
  };
  saveUser(testUserConfigured);

  // Attempt with wrong answer
  const resWrong = unlockAccountWithSecurityQuestion('test_secured_user', 'Ahmedabad');
  assert.equal(resWrong.success, false);
  assert.match(resWrong.message, /Incorrect security answer/);
  assert.ok(!resWrong.message.includes('Vadodara'));

  // Attempt with correct answer (case-insensitive)
  const resCorrect = unlockAccountWithSecurityQuestion('test_secured_user', 'vadodara gujarat');
  assert.equal(resCorrect.success, true);
  assert.match(resCorrect.message, /successfully unlocked/);
});

// ---------------------------------------------------------------------------
// 4. Behavior Test: getAccountLockInfo() Hides Question for Unconfigured Users
// ---------------------------------------------------------------------------
test('BEHAVIOR: getAccountLockInfo() does not return a question for users with "blue" or empty answers', () => {
  const userNoAnswer = {
    username: 'no_answer_user',
    role: 'Viewer',
    roles: ['Viewer'],
    pin: '1234',
    displayName: 'No Answer',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: '',
  };
  saveUser(userNoAnswer);

  const lockInfo = getAccountLockInfo('no_answer_user');
  assert.equal(lockInfo.securityQuestion, undefined, 'securityQuestion must be undefined when no answer is set');

  const userRealAnswer = {
    username: 'real_answer_user',
    role: 'Viewer',
    roles: ['Viewer'],
    pin: '1234',
    displayName: 'Real Answer',
    securityQuestion: 'What is your pet name?',
    securityAnswer: 'Rocky',
  };
  saveUser(userRealAnswer);

  const lockInfoReal = getAccountLockInfo('real_answer_user');
  assert.equal(lockInfoReal.securityQuestion, 'What is your pet name?');
});

// ---------------------------------------------------------------------------
// 5. Behavior Test: Supabase Sync Path Sanitizes 'blue' Answers
// ---------------------------------------------------------------------------
test('BEHAVIOR: userFromDb and userToDb sanitize "blue" answers in Supabase sync path', () => {
  // DB record with 'blue'
  const dbRecordBlue = {
    username: 'sync_user_1',
    role: 'Admin',
    roles: ['Admin'],
    pin: '1234',
    display_name: 'Sync User 1',
    security_question: 'What is your favorite color?',
    security_answer: 'blue',
  };
  const appUser = userFromDb(dbRecordBlue);
  assert.equal(appUser.securityAnswer, '', 'userFromDb must strip "blue" and treat it as empty string');

  // DB record with uppercase 'BLUE'
  const dbRecordUpper = {
    username: 'sync_user_2',
    role: 'Admin',
    roles: ['Admin'],
    pin: '1234',
    display_name: 'Sync User 2',
    security_question: 'What is your favorite color?',
    security_answer: 'BLUE',
  };
  const appUserUpper = userFromDb(dbRecordUpper);
  assert.equal(appUserUpper.securityAnswer, '', 'userFromDb must strip uppercase "BLUE"');

  // DB record with custom answer
  const dbRecordCustom = {
    username: 'sync_user_3',
    role: 'Admin',
    roles: ['Admin'],
    pin: '1234',
    display_name: 'Sync User 3',
    security_question: 'What is your pet name?',
    security_answer: 'Shadow',
  };
  const appUserCustom = userFromDb(dbRecordCustom);
  assert.equal(appUserCustom.securityAnswer, 'Shadow');

  // Converting app user to DB record
  const dbPayloadBlue = userToDb({
    username: 'sync_user_4',
    role: 'Admin',
    displayName: 'Sync User 4',
    securityAnswer: 'blue',
  });
  assert.equal(dbPayloadBlue.security_answer, null, 'userToDb must map "blue" to null');

  const dbPayloadCustom = userToDb({
    username: 'sync_user_5',
    role: 'Admin',
    displayName: 'Sync User 5',
    securityAnswer: 'Shadow',
  });
  assert.equal(dbPayloadCustom.security_answer, 'Shadow');
});

// ---------------------------------------------------------------------------
// 6. Config & Integration Checks: Android, Capacitor, and Electron Production CSP
// ---------------------------------------------------------------------------
test('INTEGRATION: Android, Capacitor, and Electron configurations adhere to security hardening', () => {
  const manifestContent = fs.readFileSync(path.join(rootDir, 'android/app/src/main/AndroidManifest.xml'), 'utf-8');
  assert.ok(manifestContent.includes('android:allowBackup="false"'));
  assert.ok(manifestContent.includes('android:usesCleartextTraffic="false"'));

  const capacitorConfig = fs.readFileSync(path.join(rootDir, 'capacitor.config.ts'), 'utf-8');
  assert.ok(capacitorConfig.includes('cleartext: false'));
  assert.ok(!capacitorConfig.includes('thakordhruv097-spec.github.io'));

  for (const mainFile of ['main.js', 'main.cjs']) {
    const mainContent = fs.readFileSync(path.join(rootDir, mainFile), 'utf-8');
    assert.ok(mainContent.includes('sandbox: true'));
    assert.ok(mainContent.includes('devtools-opened'));
    assert.ok(mainContent.includes('will-navigate'));
    assert.ok(!mainContent.includes("'unsafe-eval'"));
    assert.ok(mainContent.includes("worker-src 'self' blob:"));
    assert.ok(mainContent.includes("media-src 'self' blob: data: mediastream:"));
    assert.ok(mainContent.includes("img-src 'self' data: blob: https:"));
  }
});
