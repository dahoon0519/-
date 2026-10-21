import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import { createExpressApp } from '../../server/app';

const expressHandler = serverless(createExpressApp());

/**
 * Initialize Netlify Blobs from the Lambda event before serving requests.
 * The legacy serverless-http handler doesn't receive this context by default.
 * Initialize per invocation to accommodate reused Lambda processes.
 */
export const handler = async (
  event: Parameters<typeof expressHandler>[0],
  context: Parameters<typeof expressHandler>[1]
) => {
  connectLambda(event as Parameters<typeof connectLambda>[0]);
  return expressHandler(event, context);
};
