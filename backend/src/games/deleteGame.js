const AWS = require('aws-sdk');
const { sendResponse } = require('../helpers');
const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
//DynamoDb document client import
const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    // Gets the gameId from the url
    const gameId = event.pathParameters?.gameId;

    // If no gameId in the url
    if (!gameId) {
      return sendResponse(400, { message: 'gameId is required' });
    }

    // Parameters for the dynamodb operation
    const params = {
      TableName: process.env.MAIN_TABLE,
      Key: {
        PK: `GAME#${gameId}`, // Partition key
        SK: 'DETAILS', // Sort key
      },
      ReturnValues: 'ALL_OLD', // returns the deleted game
    };

    // DynamoDB get command with the parameters
    const result = await doccli.send(new DeleteCommand(params));

    //If the query doesnt find the game
    if (!result.Attributes) {
      return sendResponse(404, { message: 'Game not found' });
    }

    //Success message
    return sendResponse(200, {
      message: 'Game deleted successfully',
      game: result.Attributes,
    });
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to delete game' });
  }
};
