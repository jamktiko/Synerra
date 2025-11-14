const axios = require('axios');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing code' }),
      };
    }

    const clientId = process.env.USER_CLIENT_ID;
    const redirectUri = process.env.REDIRECT_URI;
    const cognitoDomain = process.env.COGNITO_DOMAIN;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post(
      `${cognitoDomain}/oauth2/token`,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify(response.data),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to exchange code' }),
    };
  }
};
