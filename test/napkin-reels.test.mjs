import test from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_REELS } from '../src/data/canonicalReels';

test('Napkin Tissue Production Stock: Group 1 exact verification', () => {
  const g1 = CANONICAL_REELS.filter(r => r.size === 37);
  assert.equal(g1.length, 30, 'Group 1 must contain exactly 30 reels');
  const totalWeight = g1.reduce((sum, r) => sum + r.weight, 0);
  assert.equal(totalWeight, 1812, 'Group 1 total weight must be exactly 1812 kg');

  for (const r of g1) {
    assert.equal(r.product, 'Napkin Tissue');
    assert.equal(r.gsm, 15);
    assert.equal(r.ply, 2);
    assert.equal(r.size, 37);
    assert.equal(r.status, 'IN_STOCK');
    assert.equal(r.qcGrade, 'A');
    assert.ok(r.weight > 0);
  }
});

test('Napkin Tissue Production Stock: Group 2 exact verification', () => {
  const g2 = CANONICAL_REELS.filter(r => r.size === 32);
  assert.equal(g2.length, 59, 'Group 2 must contain exactly 59 reels');
  const totalWeight = g2.reduce((sum, r) => sum + r.weight, 0);
  assert.equal(totalWeight, 2972, 'Group 2 total weight must be exactly 2972 kg');

  for (const r of g2) {
    assert.equal(r.product, 'Napkin Tissue');
    assert.equal(r.gsm, 15);
    assert.equal(r.ply, 2);
    assert.equal(r.size, 32);
    assert.equal(r.status, 'IN_STOCK');
    assert.equal(r.qcGrade, 'A');
    assert.ok(r.weight > 0);
  }
});

test('Napkin Tissue Production Stock: Grand Total and uniqueness', () => {
  assert.equal(CANONICAL_REELS.length, 89, 'Grand total must be exactly 89 reels');
  const grandWeight = CANONICAL_REELS.reduce((sum, r) => sum + r.weight, 0);
  assert.equal(grandWeight, 4784, 'Grand total weight must be exactly 4784 kg');

  const uniqueNos = new Set(CANONICAL_REELS.map(r => r.reelNo));
  assert.equal(uniqueNos.size, 89, 'All 89 reel numbers must be strictly unique');
});
