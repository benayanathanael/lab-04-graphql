const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const typeDefs = require('../../../schema');
const resolvers = require('../../../resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
  ],
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => ({ req }),
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
