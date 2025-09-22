const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    // Parse query params for filtering
    const queryParams = event.queryStringParameters || {};
    const nameFilter = queryParams.name?.toLowerCase();
    const genreFilter = queryParams.genre?.toLowerCase();

    // Gets all the game items for filtering
    const scanResult = await doccli.send(
      new ScanCommand({
        TableName: MAIN_TABLE,
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :details',
        ExpressionAttributeValues: {
          ':prefix': 'GAME#', // this ensures only games are filtered
          ':details': 'DETAILS', // game-details items, not relations
        },
      })
    );

    let games = scanResult.Items || [];

    // Filter by name and genre if provided
    if (nameFilter) {
      games = games.filter((g) => g.Name?.toLowerCase().includes(nameFilter));
    }
    if (genreFilter) {
      games = games.filter((g) => g.Genre?.toLowerCase().includes(genreFilter));
    }

    // Include popularity from game item
    const gamesWithPopularity = games.map((game) => ({
      ...game,
      Popularity: game.Popularity || 0,
    }));

    // Sort by popularity descending
    gamesWithPopularity.sort((a, b) => b.Popularity - a.Popularity);

    //Successful response
    return sendResponse(200, { games: gamesWithPopularity });
  } catch (err) {
    console.error('Filter games error:', err);
    return sendResponse(500, {
      message: 'Failed to filter games',
      error: err.message,
    });
  }
};
