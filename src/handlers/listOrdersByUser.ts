declare const process: any;
declare const console: any;
declare const Buffer: any;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ok, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';

export const listOrdersByUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return ok([]);
    }

    const result = await docClient.send(new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: 'user-orders-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
    }));

    return ok(result.Items || []);
  } catch (error) {
    console.error('listOrdersByUser error:', error);
    return internalServerError('Internal Server Error');
  }
};