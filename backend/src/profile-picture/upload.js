const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { doccli } = require('../ddbconn');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

const BUCKET = process.env.PFP_BUCKET; // Bucket name
const MAIN_TABLE = process.env.MAIN_TABLE; // Main table

const s3 = new S3Client({ region: process.env.AWS_REGION }); // S3 client

module.exports.handler = async (event) => {
  try {
    //Authenticated userId from JWT claims
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    // If no authUserId return Unauthorized
    if (!authUserId) return sendResponse(401, { message: 'Unauthorized' });
    // Parse body to get file information
    const { fileName, fileType, fileContentBase64 } = JSON.parse(
      event.body || '{}'
    );
    if (!fileName || !fileType || !fileContentBase64) {
      return sendResponse(400, {
        message: 'fileName, fileType, and fileContentBase64 are required',
      });
    }

    // Strip Base64 prefix if present
    const base64Data = fileContentBase64.replace(/^data:.*;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    console.log(`Uploading ${fileName} (${fileBuffer.length} bytes) to S3`);

    // S3 key: user-specific folder
    const key = `profile-pictures/${authUserId}/${fileName}`;

    // Upload to S3 (public)
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // Permanent URL for user's profile pics
    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Update DynamoDB after successful upload
    await doccli.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${authUserId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET ProfilePicture = :url',
        ExpressionAttributeValues: { ':url': url },
      })
    );

    // Success message
    return sendResponse(200, {
      message: 'Profile picture uploaded successfully',
      url,
    });
  } catch (err) {
    //Error handling
    console.error('Upload PFP error:', err);
    return sendResponse(500, {
      message: 'Failed to upload profile picture',
      error: err.message,
    });
  }
};
