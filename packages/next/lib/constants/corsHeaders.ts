const {
  KOTTSTER_CORS_ALLOW_ORIGIN,
} = process.env;

export const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': KOTTSTER_CORS_ALLOW_ORIGIN ?? 'https://web.kottster.app',
  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};
