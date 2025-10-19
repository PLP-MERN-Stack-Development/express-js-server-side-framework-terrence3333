// Hello World / Root route
app.get('/', (req, res) => {
  res.send('Hello World — Welcome to the Product API. Visit /api/products');
});

/*
  Task 2 routes (CRUD) and Task 5 (filtering, pagination, search, stats)
  - GET /api/products           => list (supports category filter, pagination)
  - GET /api/products/:id       => get by id
  - POST /api/products          => create (protected)
  - PUT /api/products/:id       => update (protected)
  - DELETE /api/products/:id    => delete (protected)
  - GET /api/products/search    => search by name
  - GET /api/products/stats     => statistics (count by category)
*/

// GET /api/products
// Supports:
//  - category filter: ?category=electronics
//  - pagination: ?page=1&limit=10
//  - optional sorting: ?sort=price_asc or price_desc (simple)
app.get('/api/products', asyncHandler((req, res) => {
  let { category, page = 1, limit = 10, sort } = req.query;
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  if (limit < 1) limit = 10;
  if (page < 1) page = 1;

  let result = products.slice(); // shallow copy

  if (category) {
    result = result.filter(p => String(p.category).toLowerCase() === String(category).toLowerCase());
  }

  if (sort) {
    if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } // else ignore unknown sort
  }

  const total = result.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = result.slice(start, end);

  res.json({
    total,
    page,
    limit,
    results: paginated
  });
}));

// GET /api/products/:id
app.get('/api/products/:id', asyncHandler((req, res, next) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  if (!product) return next(new NotFoundError(`Product with id "${id}" not found.`));
  res.json(product);
}));

// POST /api/products (protected)
app.post('/api/products', requireApiKey, validateProductPayload, asyncHandler((req, res) => {
  const { name, description = '', price, category, inStock = false } = req.body;

  const newProduct = {
    id: uuidv4(),
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    price,
    category: category.trim().toLowerCase(),
    inStock: Boolean(inStock)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
}));

// PUT /api/products/:id (protected)
app.put('/api/products/:id', requireApiKey, validateProductPayload, asyncHandler((req, res, next) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  if (!product) return next(new NotFoundError(`Product with id "${id}" not found.`));

  // Update allowed fields only
  const { name, description = '', price, category, inStock = false } = req.body;
  product.name = name.trim();
  product.description = typeof description === 'string' ? description.trim() : '';
  product.price = price;
  product.category = category.trim().toLowerCase();
  product.inStock = Boolean(inStock);

  res.json(product);
}));

// DELETE /api/products/:id (protected)
app.delete('/api/products/:id', requireApiKey, asyncHandler((req, res, next) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return next(new NotFoundError(`Product with id "${id}" not found.`));

  products.splice(index, 1);
  // 204 No Content is appropriate for successful deletion
  res.status(204).send();
}));

// GET /api/products/search?q=keyword
// Searches product name (case-insensitive substring)
app.get('/api/products/search', asyncHandler((req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  if (!q) {
    // If empty query, return empty array (or consider returning all — choose empty to avoid accidental heavy responses)
    return res.json([]);
  }

  const results = products.filter(p => p.name.toLowerCase().includes(q));
  res.json({ total: results.length, results });
}));

// GET /api/products/stats
// Example response: { electronics: 2, kitchen: 1 }
app.get('/api/products/stats', asyncHandler((req, res) => {
  const stats = products.reduce((acc, p) => {
    const cat = p.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  res.json(stats);
}));
