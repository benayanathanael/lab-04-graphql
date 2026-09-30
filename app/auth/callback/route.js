const { NextResponse } = require('next/server');
const jwt = require('jsonwebtoken');

async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        {
          error: 'Unauthorized: Gagal memperoleh access token dari GitHub',
          details: tokenData?.error_description || tokenData?.error || 'Invalid code or credentials',
        },
        { status: 401 }
      );
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'lab-04-graphql-oauth-app',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil data profil dari GitHub API' },
        { status: userResponse.status }
      );
    }

    const githubUser = await userResponse.json();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'JWT_SECRET belum dikonfigurasi di environment variable' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { username: githubUser.login },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error saat OAuth callback Next.js:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error pada proses OAuth callback',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

module.exports = { GET };
