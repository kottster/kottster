import { JWTTokenPayload, User } from "@kottster/common";
import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose';
import { corsHeaders } from '../constants/corsHeaders'

const { APP_ID, SECRET_KEY } = process.env;

interface MiddlewareOptions {
  protectedPaths: string[];
}

/**
 * Next.js middleware to handle JWT token verification and user extraction
 * @param nextRequest NextRequest
 * @param options Options for the middleware
 */
export async function middleware(nextRequest: unknown, options: MiddlewareOptions) {
  // Cast the nextRequest
  const req = nextRequest as NextRequest;
  
  const url = req.nextUrl.clone();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Handle health check request
  if (options.protectedPaths.every(path => !url.pathname.startsWith(path))) {
    return NextResponse.next({ request: req });
  }

  // Get JWT token from Authorization header or cookie
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.cookies.get('jwtToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  
  try {
    const { user, appId } = await getDataFromToken(token);

    if (String(appId) !== String(APP_ID)) {
      return NextResponse.json({ error: 'Invalid token: wrong app id' }, { status: 401 });
    }

    // Clone the request and set the user
    const newRequest = req.clone();
    newRequest.headers.set('x-user', JSON.stringify(user));

    // Redirect all tRPC requests and Kottster API requests to app/route.ts
    url.pathname = '/';
    return NextResponse.rewrite(url, { request: newRequest });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
};

async function getDataFromToken(token: string) {
  const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
  const decodedToken = payload as unknown as JWTTokenPayload;

  // Set the user on the request object
  const user: User = {
    id: decodedToken.userId,
    email: decodedToken.userEmail,
  };

  return { 
    appId: decodedToken.appId,
    user 
  };
}