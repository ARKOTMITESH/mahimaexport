export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── GOOGLE SEARCH CONSOLE VERIFICATION ──
    if (url.pathname === '/google1c37080743a91ac9.html' || url.pathname === '/google1c37080743a91ac9') {
      return new Response('google-site-verification: google1c37080743a91ac9.html', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...securityHeaders,
    };

    const withSecurityHeaders = (res) => {
      const headers = new Headers(res.headers);
      for (const [key, value] of Object.entries(securityHeaders)) {
        headers.set(key, value);
      }
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    };

    // ── NEWSLETTER SUBSCRIPTION ──
    if (url.pathname === '/api/newsletter' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { email, name, consent } = body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return new Response(JSON.stringify({ error: 'Valid email required' }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        return new Response(
          JSON.stringify({ success: true, message: 'Successfully subscribed!' }),
          { status: 201, headers: corsHeaders }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    // ── INQUIRIES SUBMISSION ──
    if (url.pathname === '/api/inquiries' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(
          JSON.stringify({ success: true, message: 'Inquiry received successfully!' }),
          { status: 201, headers: corsHeaders }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    // ── HEALTH CHECK ──
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Pass through all static assets to Cloudflare Workers Assets
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404 && !url.pathname.includes('.')) {
        // Fallback for extensionless routes e.g. /about -> /about.html
        const fallbackReq = new Request(new URL(`${url.pathname}.html`, request.url), request);
        const fallbackRes = await env.ASSETS.fetch(fallbackReq);
        if (fallbackRes.status < 400) {
          return withSecurityHeaders(fallbackRes);
        }
      }
      return withSecurityHeaders(response);
    } catch (err) {
      return new Response('Not Found', { status: 404, headers: securityHeaders });
    }
  },
};
