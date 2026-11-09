import { APIGatewayProxyResult } from 'aws-lambda';

export const ok = (data: any): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(data),
});

export const created = (data: any): APIGatewayProxyResult => ({
  statusCode: 201,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(data),
});

export const badRequest = (message: string): APIGatewayProxyResult => ({
  statusCode: 400,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ message }),
});

export const forbidden = (message: string): APIGatewayProxyResult => ({
  statusCode: 403,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ message }),
});

export const notFound = (message: string): APIGatewayProxyResult => ({
  statusCode: 404,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ message }),
});

export const internalServerError = (message: string): APIGatewayProxyResult => ({
  statusCode: 500,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ message }),
});