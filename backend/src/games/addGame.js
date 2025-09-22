const { v4: uuidv4 } = require('uuid');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli, ddbclient } = require('../ddbconn');
const { sendResponse, validateInput, verifyAdmin } = require('../helpers');

// Table name from environment
const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    const { isAdmin, userId } = verifyAdmin(event);

    if (!isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required' });
    }
    let body;

    // Case 1: event.body exists (typical for POST with raw JSON)
    if (event.body) {
      try {
        body = JSON.parse(event.body);
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
    const { name, genre, img_url } = body;

    //Check that the fields actually exist
    if (!name || !genre || !img_url) {
      return sendResponse(400, { message: 'Missing required game fields' });
    }

    // Generate unique game ID
    const gameId = uuidv4();

    // Prepare DynamoDB item
    const gameItem = {
      PK: `GAME#${gameId}`, //partition key
      SK: 'DETAILS', // Sort key
      GSI4PK: 'GAME', // for GamesIndex
      Name: name, // Name of the game
      Genre: genre, // Genre of the Game
      Img_url: img_url, // Url of the img
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
