const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    orders: [Order!]!
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    status: String!
    orders: [Order!]!
  }

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
    user(id: ID!): User
    products: [Product!]!
    product(id: ID!): Product
    orders: [Order!]!
    order(id: ID!): Order
  }
`;

module.exports = typeDefs;
