declare const process: any;
declare const console: any;
declare const Buffer: any;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ok, badRequest, notFound, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';

export const confirmOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return notFound('La orden no se pudo encontrar');
    }

    const existing = await docClient.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
    }));

    if (!existing.Item) {
      return notFound('La orden no se pudo encontrar');
    }

    if (existing.Item.status !== 'pending') {
      return badRequest(`No se puede confirmar una orden con el estatus ${existing.Item.status}`);
    }

    const now = new Date().toISOString();

    await docClient.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'confirmed',
        ':updatedAt': now,
      },
    }));

    return ok({ message: 'orden confirmada' });
  } catch (error) {
    console.error('confirmOrder error:', error);
    return internalServerError('Internal Server Error');
  }
};