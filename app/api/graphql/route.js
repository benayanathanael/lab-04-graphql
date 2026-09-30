const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const typeDefs = require('../../../schema');
const resolvers = require('../../../resolvers');

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

const jwt = require('jsonwebtoken');

const getUserFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return null;
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    return null;
  }
};

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    let authHeader = '';
    if (req.headers) {
      authHeader = typeof req.headers.get === 'function'
        ? (req.headers.get('authorization') || '')
        : (req.headers.authorization || '');
    }
    const user = getUserFromHeader(authHeader);
    return { req, user };
  },
});

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://studio.apollographql.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-apollo-tracing',
      },
    });
  }

  const response = await handler(request);
  response.headers.set('Access-Control-Allow-Origin', 'https://studio.apollographql.com');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

module.exports = {
  GET: handleRequest,
  POST: handleRequest,
  OPTIONS: handleRequest,
};
