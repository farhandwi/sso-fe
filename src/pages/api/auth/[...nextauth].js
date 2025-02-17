import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const env = process.env;

const handleApiError = (error) => {
  if (error.response?.status === 500 || error.status === 500) {
    throw new Error('REDIRECT_TO_VPN');
  }
  throw error;
};

async function callLoginApi(email, refreshToken) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, refresh_token: refreshToken }),
    });
    if (!response.ok) {
      console.error('Failed to call login API');
    }
  } catch (error) {
    console.error('Error calling login API:', error);
  }
}

async function fetchUserInfo(accessToken) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch user info from Microsoft Graph');
    throw new Error('Failed to fetch user info from Microsoft Graph');
  }

  const data = await response.json();

  let photoUrl = null;
  let photoBase64 = null;
  try {
    const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (photoResponse.ok) {
      const photoArrayBuffer = await photoResponse.arrayBuffer();
      const photoUint8Array = new Uint8Array(photoArrayBuffer);
      photoBase64 = btoa(String.fromCharCode.apply(null, photoUint8Array));
      photoUrl = `data:image/jpeg;base64,${photoBase64}`;
    }
  } catch (error) {
    console.error('Failed to fetch user photo', error);
  }

  let partner = '';
  let cost_center = '';
  let listApplication = [];
  try {
    const email = data.mail || data.userPrincipalName;
    const bpEmployeeResponse = await fetch(`${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/bp/email/${email}`, {
      method: 'GET',
    });
    
    if (bpEmployeeResponse.ok) {
      const bpData = await bpEmployeeResponse.json();
      console.log(bpData.data[0]);
      partner = bpData.data[0].BP;
      cost_center = bpData.data[0].cost_center;

      listApplication = await axios({
        method: 'GET',
        url: `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/list-application/${email}`,
      });


      
      if (partner && photoBase64) {
        try {
          const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bp: partner,
              image_data: photoBase64,
            }),
          });

          if (!imageResponse.ok) {
            console.error('Failed to post image to API');
          } else {
            console.log('Image posted successfully');
          }
        } catch (error) {
          console.error('Error posting image to API:', error);
        }
      }
    } else if (bpEmployeeResponse.status === 404) {
      console.warn('Data not found, filling partner and cost_center with empty strings');
      partner = '';
      cost_center = '';
    } else {
      handleApiError(bpEmployeeResponse);
      console.error('Failed to fetch partner and cost center from local API with status:', bpEmployeeResponse.status);
    }
  } catch (error) {
    handleApiError(error);
    console.error('Error fetching partner, cost center, or user roles', error);
  }

  return {
    email: data.mail || data.userPrincipalName,
    name: data.displayName,
    jobTitle: data.jobTitle || '',
    partner: partner || '',
    cost_center: cost_center || '',
    photoUrl: photoUrl,
    listApplication: listApplication.data.listApplication || ''
  };
}



export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
      clientSecret: env.NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET,
      tenantId: env.NEXT_PUBLIC_AZURE_AD_TENANT_ID,
      authorization: {
        params: { scope: 'openid email profile User.Read offline_access' },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        const refreshTokenExpiration = parseInt(env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY, 10) || 604800; // 7 days
        token.refreshTokenExpires = Date.now() + refreshTokenExpiration * 1000;
        token.refreshToken = account.refresh_token;
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      session.refreshToken = token.refreshToken;
      session.refreshTokenExpires = token.refreshTokenExpires;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return url;
      } else if (url.startsWith("/")) {
        return new URL(url, baseUrl).toString();
      }
      else if (url.startsWith("http://") || url.startsWith("https://")) {
        if (new URL(url).hostname === 'localhost') {
          const path = new URL(url).pathname;
          return `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}${path}`;
        }
        return url;
      }
      return baseUrl;
    }
  },
  events: {
    async signIn({ user, account }) {
      if (account) {
        const userInfo = await fetchUserInfo(account.access_token);

        const jwtRefreshToken = jwt.sign(
          {
            email: userInfo.email,
            partner: userInfo.partner,
            cost_center: userInfo.cost_center,
            name: userInfo.name,
            job_title: userInfo.jobTitle,
            listApplication: userInfo.listApplication
          },
          process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN,
          { expiresIn: `${env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY}s`, algorithm: 'HS256' }
        );

        user.accessTokenData = {
          email: userInfo.email,
          name: userInfo.name,
          jobTitle: userInfo.jobTitle,
          jwtRefreshToken,
        };

        await callLoginApi(userInfo.email, jwtRefreshToken);
      }
    },
  },
  pages: {
    signIn: '/login',
  },
};

const Auth = async (req, res) => {
  const { events } = authOptions;
  const originalSignIn = events.signIn;

  events.signIn = async (message) => {
    if (originalSignIn) {
      await originalSignIn(message);
    }
    if (message.user?.accessTokenData) {
      res.setHeader('Set-Cookie', [
        `refresh_token=${encodeURIComponent(message.user?.accessTokenData.jwtRefreshToken)}; Path=/; HttpOnly; SameSite=Lax; ${
          process.env.NEXT_PUBLIC_NODE_ENV === 'production' ? 'Secure;' : ''
        } Max-Age=${env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY};`,
      ]);
    }
  };

  return await NextAuth(req, res, authOptions);
};

export default Auth;
