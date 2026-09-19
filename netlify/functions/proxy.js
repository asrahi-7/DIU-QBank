const ALLOWED_PREFIXES = [
  'https://diuqbank.com/',
  'https://diuqbank-com.sgp1.cdn.digitaloceanspaces.com/',
  'https://firebasestorage.googleapis.com/',
  'https://storage.googleapis.com/',
];

exports.handler = async (event) => {
  const target = event.queryStringParameters && event.queryStringParameters.url;

  if (!target || !ALLOWED_PREFIXES.some((prefix) => target.startsWith(prefix))) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Unsupported proxy target',
    };
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 DIU-QBank-Netlify-Viewer',
        Referer: 'https://diuqbank.com/',
      },
    });

    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: `Proxy fetch failed: HTTP ${upstream.status}`,
      };
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    const lower = target.toLowerCase().split('?', 1)[0];
    const contentType = lower.endsWith('.pdf')
      ? 'application/pdf'
      : upstream.headers.get('content-type') || 'application/octet-stream';

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400',
      },
      body: bytes.toString('base64'),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: `Proxy fetch failed: ${error.message}`,
    };
  }
};
