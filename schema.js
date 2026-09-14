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

  """
  Input untuk membuat product baru.
  """
  input CreateProductInput {
    name: String!
    price: Float!
    stock: Int!
    status: String
  }

  """
  Input untuk mengubah product yang sudah ada.
  Semua field opsional: field yang tidak dikirim tidak akan diubah.
  """
  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
    status: String
  }

  type Query {
    users: [User!]!
    user(id: ID = "1"): User
    products(status: String, minPrice: Float, maxPrice: Float): [Product!]!
    product(id: ID = "1"): Product
    orders: [Order!]!
    order(id: ID = "1"): Order
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;