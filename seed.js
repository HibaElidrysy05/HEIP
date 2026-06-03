const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');
const { User, Category, Product, Banner, Setting } = require('./models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced (force: true - all tables recreated)');

    // Admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@heip.com',
      password: adminPassword,
      fullName: 'Admin User',
      role: 'admin',
      isActive: true
    });
    console.log('Admin created: admin@heip.com / admin123');

    // Demo user
    const userPassword = await bcrypt.hash('user123', 10);
    await User.create({
      username: 'demo',
      email: 'demo@heip.com',
      password: userPassword,
      fullName: 'Demo User',
      role: 'user',
      isActive: true
    });
    console.log('Demo user created: demo@heip.com / user123');

    // Categories
    const categories = await Category.bulkCreate([
      { name: 'E-books', slug: 'ebooks', description: 'Digital books and guides', order: 1 },
      { name: 'Templates', slug: 'templates', description: 'Website and design templates', order: 2 },
      { name: 'Software', slug: 'software', description: 'Software and applications', order: 3 },
      { name: 'Graphics', slug: 'graphics', description: 'Graphics and design assets', order: 4 },
      { name: 'Courses', slug: 'courses', description: 'Online courses and tutorials', order: 5 }
    ]);
    console.log('Categories created');

    // Products
    await Product.bulkCreate([
      {
        title: 'Ultimate Design Bundle',
        slug: 'ultimate-design-bundle',
        description: 'A comprehensive collection of premium design templates, icons, and UI kits for web and mobile applications. Includes 500+ vector icons, 50 UI templates, and 20 complete website mockups.',
        shortDescription: '500+ icons, 50 templates, 20 mockups',
        price: 49.99,
        previousPrice: 99.99,
        categoryId: categories[1].id,
        featured: true,
        isActive: true,
        options: JSON.stringify([
          { name: 'License', type: 'select', values: ['Personal', 'Commercial', 'Extended'] }
        ]),
        salesCount: 127
      },
      {
        title: 'Mastering React - Complete Guide',
        slug: 'mastering-react-guide',
        description: 'Learn React from scratch to advanced. This comprehensive e-book covers hooks, context, Redux, Next.js, testing, and deployment. Includes 20 hours of video content and 100+ practical exercises.',
        shortDescription: '20h video, 100+ exercises, full e-book',
        price: 29.99,
        previousPrice: 59.99,
        categoryId: categories[0].id,
        featured: true,
        isActive: true,
        salesCount: 89
      },
      {
        title: 'Photo Editing Presets Pack',
        slug: 'photo-editing-presets',
        description: 'Professional photo editing presets for Lightroom and Photoshop. Includes 200 presets for portrait, landscape, wedding, and street photography. One-click application for stunning results.',
        shortDescription: '200 presets for Lightroom & Photoshop',
        price: 19.99,
        previousPrice: 39.99,
        categoryId: categories[3].id,
        featured: true,
        isActive: true,
        salesCount: 245
      },
      {
        title: 'SEO Mastery Course',
        slug: 'seo-mastery-course',
        description: 'Complete SEO course covering on-page, off-page, technical SEO, local SEO, and SEO analytics. Includes case studies, tools, and a certification upon completion.',
        shortDescription: 'Complete SEO course with certification',
        price: 39.99,
        previousPrice: 79.99,
        categoryId: categories[4].id,
        featured: true,
        isActive: true,
        options: JSON.stringify([
          { name: 'Access Level', type: 'select', values: ['Basic', 'Premium', 'Enterprise'] }
        ]),
        salesCount: 56
      },
      {
        title: 'Project Management Software',
        slug: 'project-management-software',
        description: 'Full-featured project management software solution. Includes task management, team collaboration, Gantt charts, time tracking, and reporting. Self-hosted with unlimited users.',
        shortDescription: 'Self-hosted PM software, unlimited users',
        price: 99.99,
        previousPrice: 199.99,
        categoryId: categories[2].id,
        featured: false,
        isActive: true,
        salesCount: 34
      },
      {
        title: 'Font Collection - 500 Premium Fonts',
        slug: 'font-collection-premium',
        description: 'A curated collection of 500 premium fonts for commercial use. Includes serif, sans-serif, script, display, and handwritten fonts. Perfect for branding, web design, and print.',
        shortDescription: '500 premium fonts, commercial license',
        price: 14.99,
        previousPrice: 29.99,
        categoryId: categories[3].id,
        featured: false,
        isActive: true,
        salesCount: 412
      },
      {
        title: 'JavaScript: The Advanced Concepts',
        slug: 'javascript-advanced-concepts',
        description: 'Deep dive into advanced JavaScript topics: closures, prototypes, async/await, event loop, memory management, design patterns, and functional programming.',
        shortDescription: 'Advanced JS concepts deep dive',
        price: 24.99,
        previousPrice: 49.99,
        categoryId: categories[0].id,
        featured: false,
        isActive: true,
        salesCount: 178
      },
      {
        title: 'WordPress Premium Theme',
        slug: 'wordpress-premium-theme',
        description: 'A modern, responsive WordPress theme optimized for speed and SEO. Includes page builder integration, WooCommerce support, one-click demo import, and lifetime updates.',
        shortDescription: 'Modern WP theme with page builder',
        price: 34.99,
        previousPrice: 69.99,
        categoryId: categories[1].id,
        featured: false,
        isActive: true,
        options: JSON.stringify([
          { name: 'License Type', type: 'select', values: ['Regular', 'Extended'] }
        ]),
        salesCount: 67
      }
    ]);
    console.log('Products created');

    // Banners
    await Banner.bulkCreate([
      {
        type: 'text',
        title: 'Welcome to HEIP',
        content: 'Premium digital products for creators and professionals. Get started with our curated collection.',
        link: '/search',
        linkText: 'Browse Products',
        bgColor: '#0a0a0a',
        textColor: '#ffffff',
        order: 1,
        isActive: true
      },
      {
        type: 'text',
        title: 'Summer Sale - 50% Off',
        content: 'Limited time offer on all digital products. Use code HEIP50 at checkout.',
        link: '/search',
        linkText: 'Shop Now',
        bgColor: '#1a1a1a',
        textColor: '#ffffff',
        order: 2,
        isActive: true
      }
    ]);
    console.log('Banners created');

    // Settings
    await Setting.bulkCreate([
      { key: 'site_name', value: 'HEIP' },
      { key: 'site_description', value: 'Premium digital products marketplace for creators and professionals.' },
      { key: 'footer_text', value: 'Made with passion for digital creators.' },
      { key: 'footer_email', value: 'support@heip.com' },
      { key: 'contact_email', value: 'hello@heip.com' },
      { key: 'currency', value: 'USD' }
    ]);
    console.log('Settings created');

    console.log('\n=========================');
    console.log('Seed completed!');
    console.log('Admin login: admin@heip.com / admin123');
    console.log('Demo login: demo@heip.com / user123');
    console.log('=========================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
