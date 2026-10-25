/**
 * Fallback for the share target. Normally the service worker answers POST
 * /share on the device and this route is never reached. If the service
 * worker is not active yet, this handler redirects without reading or
 * logging the request body.
 */
export function POST(request: Request) {
  return Response.redirect(new URL("/?shared=unavailable", request.url), 303);
}

export function GET(request: Request) {
  return Response.redirect(new URL("/", request.url), 303);
}
