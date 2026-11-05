import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, hashToken, sessionPolicy } from './auth.js';

test('password hashes are salted and verify only the original password', async () => {
  const first = await hashPassword('ISATS-strong-test-password');
  const second = await hashPassword('ISATS-strong-test-password');
  assert.notEqual(first, second, 'separate registrations should have different salts');
  assert.equal(await verifyPassword('ISATS-strong-test-password', first), true);
  assert.equal(await verifyPassword('incorrect-password', first), false);
});

test('session policy is seven days', () => {
  assert.equal(sessionPolicy.maxAgeDays, 7);
  assert.equal(sessionPolicy.maxAgeMs, 7 * 24 * 60 * 60 * 1000);
});

test('session tokens are represented by deterministic SHA-256 hashes', () => {
  assert.equal(hashToken('example-token'), hashToken('example-token'));
  assert.match(hashToken('example-token'), /^[a-f0-9]{64}$/);
  assert.notEqual(hashToken('example-token'), 'example-token');
});
