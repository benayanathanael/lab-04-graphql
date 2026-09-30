const { GraphQLError } = require('graphql');
const pool = require('./db');

let userOrdersResolverCallCount = 0;

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
      const targetId = id || '1';
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [targetId]);
      return res.rows[0] || null;
    },
    products: async (_, { status, minPrice, maxPrice }) => {
      let query = 'SELECT * FROM products WHERE 1=1';
      const values = [];
      let idx = 1;

      if (status !== undefined && status !== null) {
        query += ` AND status = $${idx++}`;
        values.push(status);
      }
      if (minPrice !== undefined && minPrice !== null) {
        query += ` AND price >= $${idx++}`;
        values.push(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        query += ` AND price <= $${idx++}`;
        values.push(maxPrice);
      }

      const res = await pool.query(query, values);
      return res.rows.map(formatProduct);
    },
    product: async (_, { id }) => {
      const targetId = id || '1';
      const res = await pool.query('SELECT * FROM products WHERE id = $1', [targetId]);
      return formatProduct(res.rows[0]);
    },
    orders: async () => {
      const res = await pool.query('SELECT * FROM orders');
      return res.rows;
    },
    order: async (_, { id }) => {
      const targetId = id || '1';
      const res = await pool.query('SELECT * FROM orders WHERE id = $1', [targetId]);
      return res.rows[0] || null;
    },
  },

  Mutation: {
    createProduct: async (_, { input }, context) => {
      if (!context || !context.user) {
        throw new Error('Unauthorized: silakan login terlebih dahulu');
      }

      const { name, price, stock, status } = input;
      const finalStatus = status || 'ACTIVE';

      const res = await pool.query(
        `INSERT INTO products (name, price, stock, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, price, stock, finalStatus]
      );

      return formatProduct(res.rows[0]);
    },

    updateProduct: async (_, { id, input }) => {
      const fields = [];
      const values = [];
      let idx = 1;

      if (input.name !== undefined && input.name !== null) {
        fields.push(`name = $${idx++}`);
        values.push(input.name);
      }
      if (input.price !== undefined && input.price !== null) {
        fields.push(`price = $${idx++}`);
        values.push(input.price);
      }
      if (input.stock !== undefined && input.stock !== null) {
        fields.push(`stock = $${idx++}`);
        values.push(input.stock);
      }
      if (input.status !== undefined && input.status !== null) {
        fields.push(`status = $${idx++}`);
        values.push(input.status);
      }

      // Tidak ada field yang dikirim -> tidak perlu UPDATE, cukup ambil data sekarang
      if (fields.length === 0) {
        const current = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (current.rows.length === 0) {
          throw new GraphQLError(`Product with id ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return formatProduct(current.rows[0]);
      }

      values.push(id);
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

      const res = await pool.query(query, values);

      // ID tidak ditemukan -> lempar error yang jelas, bukan data palsu / null
      if (res.rows.length === 0) {
        throw new GraphQLError(`Product with id ${id} not found`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return formatProduct(res.rows[0]);
    },

    deleteProduct: async (_, { id }) => {
      const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      return res.rowCount > 0;
    },
  },

  User: {
    orders: async (parent) => {
      userOrdersResolverCallCount++;

      console.log(
        `[N+1 TEST] User.orders dipanggil untuk user id=${parent.id} — total: ${userOrdersResolverCallCount}`
      );

      const res = await pool.query(
        'SELECT * FROM orders WHERE user_id = $1',
        [parent.id]
      );

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