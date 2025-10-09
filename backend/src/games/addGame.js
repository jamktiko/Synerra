const { v4: uuidv4 } = require('uuid');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli, ddbclient } = require('../ddbconn');
const { sendResponse, validateInput, verifyAdmin } = require('../helpers');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

// Table name from environment
const MAIN_TABLE = process.env.MAIN_TABLE;

// API for fetching game cover art
const IMG_API = 'https://api.twitch.tv/helix/games?name=';
const secretsClient = new SecretsManagerClient();

async function getApiSecrets() {
  // Secrets Manager secret name from environmental variables
  const secretName = process.env.SECRET_NAME;

  // Gets the secret values
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  // Parse the secrets from json
  const secret = JSON.parse(response.SecretString);
  return {
    clientId: secret.API_CLIENT_ID,
    bearerToken: secret.API_BEARER_TOKEN,
  };
}

module.exports.handler = async (event) => {
  // Get the clientId and Bearertoken
  const { clientId, bearerToken } = await getApiSecrets();
  try {
    // Check that the user is an Admin
    const { isAdmin, userId } = verifyAdmin(event);

    if (!isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required' });
    }
    let body;

    // Case 1: event.body exists (typical for POST with raw JSON)
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log(event.body);
      } catch (err) {
        return sendResponse(400, { message: 'Malformed JSON in request body' });
      }
    }
    // Case 2: API Gateway already parsed the JSON into event directly
    else if (event.Name || event.name) {
      body = event; // take event itself as body
    } else {
      return sendResponse(400, { message: 'Request body is missing' });
    }

    // Extract fields from body
    const { name, genre, img_name } = body;

    //Check that the fields actually exist
    if (!name || !genre || !img_name) {
      return sendResponse(400, { message: 'Missing required game fields' });
    }

    // url that the game cover art is fetched from
    let img_url;

    // Fetching the img url
    try {
      const response = await fetch(
        `${IMG_API}${encodeURIComponent(img_name)}`,
        {
          headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Image API failed with status ${response.status}`);
      }
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // Replace {width}x{height} with real values
        img_url = data.data[0].box_art_url.replace(
          '{width}x{height}',
          '600x800'
        );
      }
    } catch (err) {
      console.error('Image fetch failed:', err);
      return sendResponse(502, { message: 'Failed to fetch image URL' });
    }

    if (!img_url) {
      return sendResponse(404, {
        message: 'Image URL not found for this game',
      });
    }

    // Generate unique game ID
    const gameId = uuidv4();

    // Prepare DynamoDB item
    const gameItem = {
      PK: `GAME#${gameId}`, //partition key
      SK: 'DETAILS', // Sort key
      GSI4PK: 'GAME', // for GamesIndex
      Name: name, // Name of the game
      Name_lower: name.toLowerCase(), // Lowercase name for searching
      Genre: genre, // Genre of the Game
      Img_url: img_url, // Url of the img
      Img_name: img_name, // for the img fetch from API
    };

    // Put the item into DynamoDB
    await doccli.send(
      new PutCommand({
        TableName: MAIN_TABLE,
        Item: gameItem,
      })
    );

    // Success response
    return sendResponse(200, {
      message: 'Game added successfully',
      game: gameItem,
    });
  } catch (error) {
    console.error('Add game error:', error);
    return sendResponse(500, {
      message: 'Failed to add game',
      error: error.message,
    });
  }
};
