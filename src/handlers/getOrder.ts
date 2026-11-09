declare const process: any;
declare const console: any;
declare const Buffer: any;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ok, notFound, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';

export const getOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return notFound('La orden no se pudo encontrar');
    }

    const result = await docClient.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
    }));

    if (!result.Item) {
      return notFound('La orden no se pudo encontrar');
    }

    return ok(result.Item);
  } catch (error) {
    console.error('getOrder error:', error);
    return internalServerError('Internal Server Error');
  }
};