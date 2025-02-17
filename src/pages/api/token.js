// pages/api/token.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const refreshTokenResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPLOYEE_BE_END_POINT}/api/get-token`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!refreshTokenResponse.ok) {
      return res.status(401).json({ error: 'Refresh token not available' });
    }

    const { refresh_token } = await refreshTokenResponse.json();

    if (!refresh_token) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    let decodedRefreshToken;
    try {
      decodedRefreshToken = jwt.verify(refresh_token, process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN);
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const cookies = req.headers.cookie || '';
    const cookieObj = cookies.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = decodeURIComponent(value);
      return acc;
    }, {});

    const accessToken = cookieObj['access_token'] || null;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing access token in cookies' });
    }

    let decodedAccessToken;
    try {
      decodedAccessToken = jwt.verify(accessToken, process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN);
    } catch (error) {
      console.error('Access token verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    const currentTime = Date.now() / 1000; 
    if (decodedAccessToken.exp < currentTime) {
      return res.status(401).json({ error: 'Access token expired' });
    }

    const newAccessToken = jwt.sign({ ...decodedAccessToken }, process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN, {
      expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY}s`,
    });

    res.setHeader('Set-Cookie', [
      `access_token=${encodeURIComponent(newAccessToken)}; Path=/; HttpOnly; SameSite=Lax; ${
        process.env.NODE_ENV === 'production' ? 'Secure;' : ''
      } Max-Age=${process.env.ACCESS_TOKEN_EXPIRY};`,
    ]);

    res.status(200).json({ access_token: newAccessToken });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
