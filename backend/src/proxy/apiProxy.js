const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

module.exports.handler = async (event) => {
  try {
    //Extract HTTP-method
    const method =
      event.requestContext?.http?.method || // HTTP API v2
      event.httpMethod || // REST API v1
      'GET'; // default fallback
    console.log(method);
    //Extract request-path
    const path = (event.rawPath || event.path || '').replace('/api', '');
    console.log(path);
    //Gets headers
    const headers = event.headers || {};
    console.log(headers);

    //Parse request body if there is one
    let body = null;
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (err) {
        return { statusCode: 400, body: 'Invalid JSON body' };
      }
    }
    console.log(body);

    // Forward request to actual backend using Axios
    const response = await axios({
      url: `${BASE_URL}${path}`, //Backend target
      method, //Method defined earlier
      headers, //Forwards headers
      data: body, //Passes request body
    });

    console.log(response);
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
