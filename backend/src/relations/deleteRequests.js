const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) return sendResponse(401, { message: 'Unauthorized' });

    const body = JSON.parse(event.body || '{}');
    const { targetUserId } = body;

    if (!targetUserId) {
      return sendResponse(400, { message: 'targetUserId is required' });
    }

    // Query all ACCEPTED or DECLINED friend requests from this sender
    const queryResult = await doccli.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        IndexName: 'OnlineStatusIndex',
        KeyConditionExpression:
          'GSI1PK = :userId AND begins_with(GSI1SK, :prefix)',
        FilterExpression: '#status = :accepted OR #status = :declined',
        ExpressionAttributeNames: {
          '#status': 'Status', // alias for reserved word
        },
        ExpressionAttributeValues: {
          ':userId': `USER#${authUserId}`,
          ':prefix': 'FRIEND_REQUEST#',
          ':accepted': 'ACCEPTED',
          ':declined': 'DECLINED',
        },
      })
    );

    const requestsToDelete = queryResult.Items || [];

    // Delete all matched requests
    for (const req of requestsToDelete) {
      console.log('DELETING: ', req);
      await doccli.send(
        new DeleteCommand({
          TableName: MAIN_TABLE,
          Key: {
            PK: req.PK,
            SK: req.SK,
          },
        })
      );
    }

    return sendResponse(200, {
      message: 'Accepted and declined friend requests deleted successfully',
      deletedCount: requestsToDelete.length,
    });
  } catch (err) {
    console.error('Error clearing requests:', err);
    return sendResponse(500, {
      message: 'Failed to clear friend requests',
      error: err.message,
    });
  }
};
