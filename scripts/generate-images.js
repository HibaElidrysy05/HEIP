const fs = require('fs');
const path = require('path');

const products = [
  { slug: 'ultimate-design-bundle', name: 'Design Bundle', bg: '#1a1a2e', cat: 'Templates' },
  { slug: 'mastering-react-guide', name: 'React Guide', bg: '#16213e', cat: 'E-books' },
  { slug: 'photo-editing-presets', name: 'Photo Presets', bg: '#0f3460', cat: 'Graphics' },
  { slug: 'seo-mastery-course', name: 'SEO Course', bg: '#533483', cat: 'Courses' },
  { slug: 'project-management-software', name: 'PM Software', bg: '#2d4059', cat: 'Software' },
  { slug: 'font-collection-premium', name: '500 Fonts', bg: '#222831', cat: 'Graphics' },
  { slug: 'javascript-advanced-concepts', name: 'JS Advanced', bg: '#1b1b2f', cat: 'E-books' },
  { slug: 'wordpress-premium-theme', name: 'WP Theme', bg: '#1a1a1a', cat: 'Templates' }
];

const dir = path.join(__dirname, '..', 'public', 'uploads', 'products');

products.forEach(p => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="${p.bg}"/>
  <rect x="0" y="0" width="600" height="400" fill="url(#g)" opacity="0.3"/>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.1"/>
      <stop offset="100%" style="stop-color:#000000;stop-opacity:0.3"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="160" r="60" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <path d="M280 160 L300 180 L340 140" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="300" y="270" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${p.name}</text>
  <text x="300" y="295" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.4)" letter-spacing="2">${p.cat}</text>
</svg>`;
  fs.writeFileSync(path.join(dir, p.slug + '.svg'), svg);
  console.log('Created: ' + p.slug + '.svg');
});

console.log('Done - ' + products.length + ' images generated');
