const pool = require('./db');

// Helper function untuk mengubah price bertipe numeric (string dari pg) menjadi Float
const formatProduct = (product) => {
  if (!product) return null;
  return {
    ...product,
    price: product.price !== null && product.price !== undefined ? parseFloat(product.price) : 0.0,
  };
};

const resolvers = {
  Query: {
    users: async () => {
      const res = await pool.query('SELECT * FROM users');
      return res.rows;
    },
    user: async (_, { id }) => {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    },
    products: async () => {
      const res = await pool.query('SELECT * FROM products');
      return res.rows.map(formatProduct);
    },
    product: async (_, { id }) => {
      const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return formatProduct(res.rows[0]);
    },
    orders: async () => {
      const res = await pool.query('SELECT * FROM orders');
      return res.rows;
    },
    order: async (_, { id }) => {
      const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      return res.rows[0] || null;
    },
  },
  User: {
    orders: async (parent) => {
      const res = await pool.query('SELECT * FROM orders WHERE user_id = $1', [parent.id]);
      return res.rows;
    },
  },
  Product: {
    orders: async (parent) => {
      const res = await pool.query('SELECT * FROM orders WHERE product_id = $1', [parent.id]);
      return res.rows;
    },
  },
  Order: {
    user: async (parent) => {
      if (!parent.user_id) return null;
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return res.rows[0] || null;
    },
    product: async (parent) => {
      if (!parent.product_id) return null;
      const res = await pool.query('SELECT * FROM products WHERE id = $1', [parent.product_id]);
      return formatProduct(res.rows[0]);
    },
  },
};

module.exports = resolvers;
