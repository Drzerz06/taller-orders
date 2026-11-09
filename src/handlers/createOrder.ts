declare const process: any;
declare const console: any;
declare const Buffer: any;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { OrderItemInput, OrderItem, Order } from '../types/order';
import { created, badRequest, internalServerError } from '../utils/response';
import { invokeLambda } from '../utils/lambdaInvoke';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';

export const createOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { items, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest('Items es requerido para poder hacer la orden');
    }

    const finalUserId = userId || 'usuario-123';
    const resolvedItems: OrderItem[] = [];

    for (const item of items as OrderItemInput[]) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return badRequest('Los ítems no cumplen con las validaciones para ser ordenados');
      }

      const productRes = await invokeLambda('getProduct', {
        pathParameters: { id: item.productId }
      });

      if (productRes.statusCode !== 200 || !productRes.body) {
        return badRequest(`El producto ${item.productId} no existe`);
      }

      const product = productRes.body;

      if (product.stock < item.quantity) {
        return badRequest(`Insuficiente producto para el ítem ${item.productId}, solo hay disponibles: ${product.stock}`);
      }

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const total = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const now = new Date().toISOString();
    const orderId = uuidv4();

    const newOrder: Order = {
      orderId,
      userId: finalUserId,
      items: resolvedItems,
      total,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: ORDERS_TABLE,
      Item: newOrder,
    }));

    for (const item of resolvedItems) {
      const stockRes = await invokeLambda('updateStock', {
        pathParameters: { id: item.productId },
        body: JSON.stringify({ quantity: item.quantity })
      });

      if (stockRes.statusCode !== 200) {
        await docClient.send(new UpdateCommand({
          TableName: ORDERS_TABLE,
          Key: { orderId },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'canceled',
            ':updatedAt': new Date().toISOString(),
          },
        }));

        return internalServerError('No se pudo reservar el stock para uno o más productos. La orden ha sido cancelada.');
      }
    }

    return created(newOrder);
  } catch (error) {
    console.error('createOrder error:', error);
    return internalServerError('Internal Server Error');
  }
};