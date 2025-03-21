import fs from "fs"
import path from 'path';
import http from 'http'
import process from "process";

const port = 5305;
const directoryPath = process.argv[2]||process.cwd();

http.createServer((req, res) => {
  const api=req.url.split('?')[0]
  const filePath = path.join(directoryPath, api === '/' ? 'SCAST.html' : api);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else {
      const extname = String(path.extname(filePath)).toLowerCase();
      let contentType = 'application/octet-stream';

      switch (extname) {
        case '.html':
          contentType = 'text/html';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}).listen(port, () => {
  console.log(`SCAST Server is running on http://localhost:${port}`);
  console.log('directoryPath',directoryPath);
});