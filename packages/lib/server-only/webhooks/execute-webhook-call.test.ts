import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const servers: Server[] = [];
const secret = 'disposable-webhook-test-secret';
const payload = { event: 'DOCUMENT_COMPLETED', payload: { id: 'release-canary' } };

const listen = async (handler: (request: IncomingMessage, response: ServerResponse) => void) => {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected a loopback HTTP listener');
  }
  return `http://127.0.0.1:${address.port}/webhook`;
};

const sender = async () => (await import('./execute-webhook-call')).executeWebhookCall;

describe('webhook receiver protocol compatibility', () => {
  beforeEach(() => {
    vi.resetModules();
    // Only this isolated loopback receiver is opted into the existing SSRF bypass.
    vi.stubEnv('NEXT_PRIVATE_WEBHOOK_SSRF_BYPASS_HOSTS', '127.0.0.1');
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    for (const server of servers.splice(0)) {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it('authenticates a real receiver using the documented header and preserves the fork alias', async () => {
    let receivedHeaders: IncomingMessage['headers'] = {};
    let receivedBody = '';
    let receivedMethod: string | undefined;
    const url = await listen((request, response) => {
      receivedHeaders = request.headers;
      receivedMethod = request.method;
      request.setEncoding('utf8');
      request.on('data', (chunk: string) => {
        receivedBody += chunk;
      });
      request.on('end', () => {
        const authorized = request.headers['x-documenso-secret'] === secret;
        response.writeHead(authorized ? 200 : 401, {
          'Content-Type': 'application/json',
          'X-Receiver': 'release-test',
        });
        response.end(JSON.stringify({ accepted: authorized }));
      });
    });

    const executeWebhookCall = await sender();
    const result = await executeWebhookCall({ url, body: payload, secret });
    expect(result).toMatchObject({ success: true, responseCode: 200, responseBody: { accepted: true } });
    expect(result.responseHeaders['x-receiver']).toBe('release-test');
    expect(receivedHeaders['x-documenso-secret']).toBe(secret);
    expect(receivedHeaders['x-0xmetalabs-secret']).toBe(secret);
    expect(receivedHeaders['content-type']).toBe('application/json');
    expect(receivedMethod).toBe('POST');
    expect(JSON.parse(receivedBody)).toEqual(payload);
  });

  it('sends empty protocol headers when no secret is configured', async () => {
    let headers: IncomingMessage['headers'] = {};
    const url = await listen((request, response) => {
      headers = request.headers;
      response.writeHead(204);
      response.end();
    });
    const executeWebhookCall = await sender();
    expect(await executeWebhookCall({ url, body: payload, secret: null })).toMatchObject({
      success: true,
      responseCode: 204,
      responseBody: '',
    });
    expect(headers['x-documenso-secret']).toBe('');
    expect(headers['x-0xmetalabs-secret']).toBe('');
  });

  it('does not follow redirects or leak secrets to a redirected receiver', async () => {
    let redirectedCalls = 0;
    const redirectedUrl = await listen((_request, response) => {
      redirectedCalls += 1;
      response.end('unexpected');
    });
    const url = await listen((_request, response) => {
      response.writeHead(302, { Location: redirectedUrl });
      response.end('redirect');
    });
    const executeWebhookCall = await sender();
    expect(await executeWebhookCall({ url, body: payload, secret })).toMatchObject({
      success: false,
      responseCode: 302,
      responseBody: 'redirect',
    });
    expect(redirectedCalls).toBe(0);
  });

  it('still blocks loopback receivers without an explicit SSRF bypass', async () => {
    vi.stubEnv('NEXT_PRIVATE_WEBHOOK_SSRF_BYPASS_HOSTS', undefined);
    let calls = 0;
    const url = await listen((_request, response) => {
      calls += 1;
      response.end('unexpected');
    });
    const executeWebhookCall = await sender();
    expect(await executeWebhookCall({ url, body: payload, secret })).toMatchObject({
      success: false,
      responseCode: 0,
      responseBody: 'Webhook URL resolves to a private or loopback address',
    });
    expect(calls).toBe(0);
  });
});
