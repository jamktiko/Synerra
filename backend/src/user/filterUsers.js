const { doccli } = require('../ddbconn'); // your DynamoDB client
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

module.exports.handler = async (event) => {
  try {
    //parse body from event
    const body = event.body ? JSON.parse(event.body) : {};

    //parameters in body
    const { languages, onlineStatus, games } = body;

    // Base query: all users
    let KeyConditionExpression = 'GSI3PK = :pk';
    let ExpressionAttributeValues = { ':pk': 'USER' };
    let ExpressionAttributeNames = {};
    let FilterExpressionParts = [];

    // Filter by onlineStatus
    if (onlineStatus) {
      ExpressionAttributeNames['#OnlineStatus'] = 'OnlineStatus';
      ExpressionAttributeValues[':onlineStatus'] = onlineStatus;
      FilterExpressionParts.push('#OnlineStatus = :onlineStatus');
    }

    // Filter by languages (array contains any of the requested languages)
    if (languages && Array.isArray(languages) && languages.length > 0) {
      ExpressionAttributeNames['#Languages'] = 'Languages';
      // DynamoDB does not allow "contains" with multiple values directly so combine with OR
      const languageFilters = languages.map((lang, idx) => {
        const key = `:lang${idx}`; //placeholder for each language
        ExpressionAttributeValues[key] = lang; //assigns value
        return `contains(#Languages, ${key})`; //checks if the languages-array contains the value
      });
      FilterExpressionParts.push(`(${languageFilters.join(' OR ')})`); //combines multiple languages
    }

    // Filter by games (array contains any of the requested games)
    if (games && Array.isArray(games) && games.length > 0) {
      ExpressionAttributeNames['#Games'] = 'Games';
      const gameFilters = games.map((game, idx) => {
        const key = `:game${idx}`; //placeholder for each language
        ExpressionAttributeValues[key] = game; //assigns value
        return `contains(#Games, ${key})`; //checks if the games-array contains the value
      });
      FilterExpressionParts.push(`(${gameFilters.join(' OR ')})`); //combines multiple games
    }

    const params = {
      TableName: process.env.MAIN_TABLE, //correct table from the environmental variables
      IndexName: 'UsernameIndex', // Global secondary index for all users
      KeyConditionExpression, //query by  GSI3PK (REQUIRED!!!)
      ExpressionAttributeValues, // all placeholders for values
    };

    //if any filters were provided add the filterExpression and attribute names
    if (FilterExpressionParts.length > 0) {
      params.FilterExpression = FilterExpressionParts.join(' AND ');
      params.ExpressionAttributeNames = ExpressionAttributeNames;
    }

    //send the query with the parameters to DynamoDb
    const result = await doccli.send(new QueryCommand(params));

    // if the query succeeds return status code 200 and the data
    return sendResponse(200, { users: result.Items });
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to fetch users' });
  }
};
