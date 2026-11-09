declare const process: any;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export const withCors = (handler: Handler) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o: string) => o.trim()).filter(Boolean);
    const requestOrigin = event.headers?.origin || event.headers?.Origin || '';
    
    const allowOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '*';

    const result = await handler(event);

    return {
      ...result,
      headers: {
        ...(result.headers || {}),
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      },
    };
  };
};