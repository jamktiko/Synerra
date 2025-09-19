//DynamoDb document client import
const { doccli } = require('../ddbconn');
// Query command import
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

//handler export
exports.handler = async () => {
  try {
    //Parameters for the query
    const params = {
      TableName: process.env.MAIN_TABLE, //Correct table from the environmental variable
      IndexName: 'GamesIndex', // sort by the GamesIndex
      KeyConditionExpression: 'GSI4PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'GAME', //Gets all items that has GSI4PK as value 'GAME', so all games
      },
    };

    // send the query to DynamoDb with the correct parameters
    const result = await doccli.send(new QueryCommand(params));

    //returns the data
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    };
  } catch (err) {
    console.error('Error listing games:', err); //error handling
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to list games' }),
    };
  }
};
