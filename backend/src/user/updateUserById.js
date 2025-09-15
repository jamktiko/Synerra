const AWS = require('aws-sdk');
const { sendResponse } = require('../helpers');

//Create DynamoDb document-client
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
  try {
    //get the userId from the url
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return sendResponse(400, { message: 'userId is required in path' });
    }

    //eventin body
    const body = JSON.parse(event.body);
    //fields that are allowed to be updated
    const allowedFields = ['username', 'profilePicUrl', 'bio', 'languages'];

    //variables for ddb update
    let updateExp = []; // pieces of update expression
    let expAttrNames = {}; // maps placeholders to actual ddb names
    let expAttrValues = {}; // maps placeholders to the request body

    //loops through the field to create update expression
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // only include fields actually sent
        const attrName = `#${field}`;
        const attrValue = `:${field}`;
        updateExp.push(`${attrName} = ${attrValue}`);
        expAttrNames[attrName] = field.charAt(0).toUpperCase() + field.slice(1); // match DynamoDB attribute
        expAttrValues[attrValue] = body[field];
      }
    }

    // if no field in the request return 400
    if (updateExp.length === 0) {
      return sendResponse(400, { message: 'No fields to update' });
    }

    const params = {
      TableName: process.env.MAIN_TABLE, //table that is changed
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' }, //partition key and sort key that defines the item
      UpdateExpression: 'SET ' + updateExp.join(', '),
      // A string telling DynamoDB which fields to update and how.
      // 'updateExp' is an array of expressions like "#username = :username"
      // Joining with ', ' turns it into a single UpdateExpression.
      ExpressionAttributeNames: expAttrNames,
      // Maps placeholders (like "#username") to actual attribute names in DynamoDB.
      // Needed in case attribute names are reserved words or have special characters.
      ExpressionAttributeValues: expAttrValues,
      // Maps placeholders (like ":username") to the actual values you want to write.
      // Only fields included in the request body are here.
      ReturnValues: 'ALL_NEW',
      // return the updated item and send it back to the client
    };

    //update the table via document client update-method
    const result = await docClient.update(params).promise();
    return sendResponse(200, result.Attributes);
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to update user' });
  }
};
