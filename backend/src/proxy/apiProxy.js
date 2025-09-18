const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

export const handler = async (event) => {
  try {
    //Extract HTTP-method
    const method = event.requestContext.http.method;
    //Extract request-path
    const path = event.rawPath.replace('/api', '');
    //Parse request body if there is one
    const body = event.body ? JSON.parse(event.body) : null;
    //Gets headers
    const headers = event.headers || {};

    // Forward request to actual backend using Axios
    const response = await axios({
      url: `${BASE_URL}${path}`, //Backend target
      method, //Method defined earlier
      headers, //Forwards headers
      data: body, //Passes request body
    });

    //Returns backend response to the client
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // adjust for prod , (Allow Cross Origin)
      },
      body: JSON.stringify(response.data),
    };
  } catch (err) {
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
