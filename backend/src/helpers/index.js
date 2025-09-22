/*
Helpperifunktiot, joita user-kansiossa olevat lambda-funktiot
käyttävät
*/

// Vastauksen lähetys asiakkaalle
const sendResponse = (statusCode, body) => {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
  return response;
};
const validateInput = (data) => {
  const body = JSON.parse(data);
  const { email, password } = body;
  if (!email || !password || password.length < 6) {
    return false;
  } else {
    return true;
  }
};

// Verifies that users can only update their own information, not others
const verifyUser = (event) => {
  // Get the authenticated userId from JWT claims
  const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  const userId = event.pathParameters?.userId;

  // If the user is an admin, skip other user verifications
  const { isAdmin } = verifyAdmin(event);
  if (isAdmin) {
    return userId;
  }

  if (!authUserId) {
    throw new Error('Unauthorized');
  }
  if (!userId) {
    throw new Error('userId is required');
  }
  if (authUserId !== userId) {
    throw new Error('Forbidden: cannot delete another user');
  }

  return userId;
};

// Verifies that the user belongs to admins-cognito user-group
const verifyAdmin = (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims || !claims.sub) {
    throw new Error('Unauthorized');
  }

  const userId = claims.sub;
  const groups = claims['cognito:groups'] || [];
  const isAdmin = groups.includes('admins');

  return { userId, isAdmin };
};

module.exports = {
  sendResponse,
  validateInput,
  verifyUser,
  verifyAdmin,
};
