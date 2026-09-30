const { NextResponse } = require('next/server');

async function GET(request) {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const redirectUri = process.env.CALLBACK_URL || '';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

module.exports = { GET };
