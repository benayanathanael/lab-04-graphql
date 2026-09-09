require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { startStandaloneServer } = require('@apollo/server/standalone');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const defaultQuery = `query GetUsersWithOrdersAndProducts {
  users {
    id
    name
    email
    orders {
      id
      quantity
      status
      product {
        id
        name
        price
        stock
        status
      }
    }
  }
}`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      document: defaultQuery,
    }),
  ],
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(PORT) },
  });
  console.log(`🚀 Server ready at: ${url}`);
}

startServer();
