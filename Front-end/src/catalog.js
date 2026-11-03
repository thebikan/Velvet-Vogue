// Explicit design fixtures. These are not database products, prices, or stock claims.
export const products = [
  { id: 'relaxed-blazer', name: 'The Relaxed Blazer', category: 'Women', kind: 'Tailoring', price: 12900, image: 'blazer.jpg', images: ['blazer.jpg', 'blazer-alt.jpg'], color: 'Warm sand', swatch: '#c2b5a1', sizes: ['XS', 'S', 'M', 'L', 'XL'], label: 'THE NEW EDIT', description: 'Soft structure, a relaxed silhouette. The kind of layer that brings an entire look together, from slow mornings to late evenings.' },
  { id: 'soft-knit', name: 'The Everyday Knit', category: 'Women', kind: 'Knitwear', price: 8950, image: 'knit.png', images: ['knit.png'], color: 'Oat', swatch: '#d2c4ae', sizes: ['XS', 'S', 'M', 'L'], label: '', description: 'An easy, oversized knit with a tactile finish. Pair with tailored trousers, or keep things simple with your favourite denim.' },
  { id: 'city-overcoat', name: 'The City Overcoat', category: 'Men', kind: 'Outerwear', price: 18900, image: 'coat.jpg', images: ['coat.jpg'], color: 'Camel', swatch: '#a47d55', sizes: ['S', 'M', 'L', 'XL'], label: 'EDITOR’S PICK', description: 'Clean lines and an unhurried fit. A versatile outer layer that adds a little intention to the everyday.' },
  { id: 'daily-carry', name: 'The Daily Carry', category: 'Accessories', kind: 'Bags', price: 14900, image: 'bag.jpg', images: ['bag.jpg'], color: 'Black', swatch: '#252525', sizes: ['One size'], label: '', description: 'A structured shape, considered proportions, and room for the day ahead. An understated finishing touch to your wardrobe.' },
];
export const productById = id => products.find(product => product.id === id);
export const money = amount => `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(amount)}`;
export function selectProducts({ category = 'All', query = '', sort = 'featured', saved = null } = {}) {
  const term = String(query).trim().toLowerCase();
  const list = products.filter(p => (category === 'All' || p.category === category || p.kind === category)
    && (!saved || saved.includes(p.id))
    && `${p.name} ${p.category} ${p.kind} ${p.color}`.toLowerCase().includes(term));
  return [...list].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : 0);
}
