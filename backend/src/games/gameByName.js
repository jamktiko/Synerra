const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    const search = event.pathParameters?.gamename.toLowerCase();

    if (!search) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Search query required' }),
      };
    }

    const params = {
      TableName: process.env.MAIN_TABLE,
      IndexName: 'GameNameLowerIndex',
      KeyConditionExpression:
        'GSI4PK = :pk AND begins_with(Name_lower, :search)',
      ExpressionAttributeValues: {
        ':pk': 'GAME',
        ':search': search,
      },
    };

    const data = await doccli.send(new QueryCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (err) {
    console.error('Search failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
