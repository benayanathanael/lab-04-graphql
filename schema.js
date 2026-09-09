const typeDefs = `#graphql
  """
  Tipe data User yang merepresentasikan pengguna sistem.
  """
  type User {
    id: ID!
    name: String!
    email: String!
    orders: [Order!]!
  }

  """
  Tipe data Product yang merepresentasikan barang/produk.
  """
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    status: String!
    orders: [Order!]!
  }

  """
  Tipe data Order yang merepresentasikan pesanan.
  """
  type Order {
    id: ID!
    user_id: ID!
    product_id: ID!
    quantity: Int!
    status: String!
    user: User
    product: Product
  }

  type Query {
    users: [User!]!
    user(id: ID = "1"): User
    products: [Product!]!
    product(id: ID = "1"): Product
    orders: [Order!]!
    order(id: ID = "1"): Order
  }
`;

module.exports = typeDefs;
