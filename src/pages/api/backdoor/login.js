import { sign } from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo } = req.body;

    if (!userInfo) {
      return res.status(400).json({ message: 'User info is required' });
    }

    const jwtSecret = process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret is not configured' });
    }

    const payload = {
      email: userInfo.email,
      partner: userInfo.partner,
      cost_center: userInfo.cost_center,
      name: userInfo.name,
      job_title: userInfo.jobTitle,
      listApplication: userInfo.listApplication
    };

    const jwtRefreshToken = sign(
      payload,
      jwtSecret,
      {
        expiresIn: parseInt(process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY || '3600'),
        algorithm: 'HS256'
      }
    );

    const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: userInfo.email, 
        refresh_token: jwtRefreshToken 
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('Failed to call login API');
    }

    const maxAge = parseInt(process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY || '3600');
    res.setHeader('Set-Cookie', [
      `refresh_token=${encodeURIComponent(jwtRefreshToken)}; `+
      `Path=/; `+
      `HttpOnly; `+
      `SameSite=Strict; `+
      (process.env.NEXT_PUBLIC_NODE_ENV === 'production' ? 'Secure; ' : '') +
      `Max-Age=${maxAge}`
    ]);

    return res.status(200).json({ 
      success: true, 
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error' 
    });
  }
}