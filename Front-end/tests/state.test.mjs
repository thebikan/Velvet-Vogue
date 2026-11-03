import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeState, addToBag, bagCount, bagTotal, escapeHtml } from '../src/state.js';
import { products, selectProducts } from '../src/catalog.js';

test('untrusted local state cannot inject products, sizes, prices or invalid quantities', () => {
  const state = normalizeState({ bag: [{ id: 'fake', size: 'M', quantity: 9 }, { id: products[0].id, size: '<script>', quantity: 1 }, { id: products[0].id, size: 'M', quantity: -5 }, { id: products[0].id, size: 'M', quantity: 100, price: 0 }, null], saved: ['fake', products[0].id, products[0].id] });
  assert.deepEqual(state.bag, [{ id: products[0].id, size: 'M', quantity: 9 }]);
  assert.equal(bagTotal(state), products[0].price * 9);
  assert.deepEqual(state.saved, [products[0].id]);
});
test('bag separates variants, merges identical variants, and uses bounded quantity', () => {
  let state = normalizeState(null);
  state = addToBag(state, products[0].id, 'M');
  state = addToBag(state, products[0].id, 'S');
  state = addToBag(state, products[0].id, 'M');
  assert.equal(bagCount(state), 3); assert.equal(state.bag.length, 2);
  assert.equal(bagTotal(state), products[0].price * 3);
  assert.throws(() => addToBag(state, products[0].id, 'Not a size'));
});
test('search, filters, sorting and saved selections compose without mutating catalogue', () => {
  assert.equal(selectProducts({ query: 'BLAZER', category: 'Women' }).length, 1);
  assert.equal(selectProducts({ query: 'blazer', category: 'Men' }).length, 0);
  const sorted = selectProducts({ sort: 'price-low' });
  assert.ok(sorted.every((product, i) => i === 0 || product.price >= sorted[i - 1].price));
  assert.equal(products[0].id, 'relaxed-blazer');
  assert.deepEqual(selectProducts({ saved: [] }), []);
});
test('HTML escaping preserves literal search input', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
