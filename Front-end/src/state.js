import { productById } from './catalog.js';
export const STORAGE_KEY = 'velvet-vogue-preview-v1';
export function normalizeState(raw) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const bag = [];
  for (const item of Array.isArray(value.bag) ? value.bag.slice(0, 50) : []) {
    if (!item || typeof item !== 'object') continue;
    const product = productById(item.id);
    if (!product || !product.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    const existing = bag.find(row => row.id === item.id && row.size === item.size);
    if (existing) existing.quantity = Math.min(9, existing.quantity + item.quantity);
    else bag.push({ id: item.id, size: item.size, quantity: Math.min(9, item.quantity) });
  }
  return { bag, saved: [...new Set((Array.isArray(value.saved) ? value.saved : []).filter(id => productById(id)))].slice(0, 50) };
}
export function addToBag(state, id, size) {
  const next = normalizeState(state);
  const product = productById(id);
  if (!product || !product.sizes.includes(size)) throw new Error('Choose a valid size.');
  const row = next.bag.find(item => item.id === id && item.size === size);
  if (row) row.quantity = Math.min(9, row.quantity + 1);
  else next.bag.push({ id, size, quantity: 1 });
  return next;
}
export const bagCount = state => state.bag.reduce((count, item) => count + item.quantity, 0);
export const bagTotal = state => state.bag.reduce((total, item) => total + productById(item.id).price * item.quantity, 0);
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
