declare const Buffer: any;
declare const process: any;
declare const console: any;

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const STAGE = (typeof process !== 'undefined' && process.env?.STAGE) || 'develop';

export interface InvokeResult {
  statusCode: number;
  body: any;
}

export const invokeLambda = async (functionName: string, payload: any): Promise<InvokeResult> => {
  const fullFunctionName = `taller-products-${STAGE}-${functionName}`;
  
  const command = new InvokeCommand({
    FunctionName: fullFunctionName,
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  const response = await lambdaClient.send(command);

  if (response.FunctionError) {
    throw new Error(`Lambda invoke error in ${fullFunctionName}: ${response.FunctionError}`);
  }

  const resultPayload = JSON.parse(Buffer.from(response.Payload || new Uint8Array()).toString());
  const body = typeof resultPayload.body === 'string' ? JSON.parse(resultPayload.body) : resultPayload.body;

  return {
    statusCode: resultPayload.statusCode || 200,
    body: body,
  };
};