import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { port: { type: 'string', default: '3000' } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Indica una porta tra 1 e 65535.');
}

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
]);
const paths = ['index.html', 'stile.css', 'data.js', 'guida.js', 'manuale.pdf'];
const files = new Map(paths.map(path => [
  '/' + path,
  { url: new URL('./' + path, import.meta.url), type: contentTypes.get(path.slice(path.lastIndexOf('.'))) },
]));
files.set('/', files.get('/index.html'));

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const path = request.url.split('?', 1)[0];
  const file = /^\/immagini\/[a-z0-9-]+\.png$/i.test(path)
    ? { url: new URL('.' + path, import.meta.url), type: 'image/png' }
    : files.get(path);
  if (!file) {
    response.writeHead(404).end();
    return;
  }

  try {
    const { size } = await stat(file.url);
    response.writeHead(200, { 'Content-Type': file.type, 'Content-Length': size });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const stream = createReadStream(file.url);
    stream.on('error', error => response.destroy(error));
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Guida Panasonic: http://127.0.0.1:' + port);
});
