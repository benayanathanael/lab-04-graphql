require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { expressMiddleware } = require('@as-integrations/express5');
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

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      document: defaultQuery,
    }),
  ],
});

// Endpoint GET /auth/login: redirect ke https://github.com/login/oauth/authorize dengan client_id dan redirect_uri (dari env)
app.get('/auth/login', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const redirectUri = process.env.CALLBACK_URL || '';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// Endpoint GET /auth/callback: Tukar kode dengan access token GitHub, ambil profil, terbitkan JWT
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required',
      });
    }

    // Tukar code dengan access_token GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData || !tokenData.access_token) {
      return res.status(401).json({
        error: 'Unauthorized: Gagal memperoleh access token dari GitHub',
        details: tokenData?.error_description || tokenData?.error || 'Invalid code or credentials',
      });
    }

    // Ambil data profil user dari GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'lab-04-graphql-oauth-app',
      },
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({
        error: 'Gagal mengambil data profil dari GitHub API',
      });
    }

    const githubUser = await userResponse.json();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        error: 'JWT_SECRET belum dikonfigurasi di environment variable',
      });
    }

    // Terbitkan JWT sendiri dengan payload username GitHub
    const token = jwt.sign(
      { username: githubUser.login },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (error) {
    console.error('Error saat OAuth callback:', error);
    return res.status(500).json({
      error: 'Internal Server Error pada proses OAuth callback',
      message: error.message,
    });
  }
});

// Apollo Server Context: ekstrak Authorization header Bearer token dan verifikasi JWT
const context = async ({ req }) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return { user: null };
      const decoded = jwt.verify(token, jwtSecret);
      return { user: decoded };
    } catch (err) {
      return { user: null };
    }
  }
  return { user: null };
};

const PORT = process.env.PORT || 4000;

async function startServer() {
  await server.start();

  const apolloHandler = expressMiddleware(server, {
    context,
  });

  // Melayani endpoint GraphQL di /graphql dan root / untuk kompatibilitas penuh dengan Apollo Sandbox
  app.use('/graphql', cors(), express.json(), apolloHandler);
  app.use('/', cors(), express.json(), apolloHandler);

  httpServer.listen(Number(PORT), () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/`);
    console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🔑 OAuth login: http://localhost:${PORT}/auth/login`);
    console.log(`🔑 OAuth callback: http://localhost:${PORT}/auth/callback`);
  });
}

startServer();
