import fs from "fs"
import path from 'path';
import http from 'http'
import process from "process";
import url from 'url';
import multiparty from'multiparty';
import {exec} from 'child_process'

const port = 5305;
const directoryPath = process.argv[2]||process.cwd();

const TYPE_MINE={
  '.html':'text/html',
  '.css':'text/css',
  '.js':'application/javascript',
  '.json': 'application/json',
}

http.createServer((req, res) => {
  var u=url.parse(req.url)
  var filePath = path.join(directoryPath, u.pathname === '/' ? 'SCAST.html' : u.pathname);
  if(u.pathname=='/rawtext'){
    filePath=path.join(directoryPath,u.query.replace('file=',''))
  }
  if(u.pathname=='/save'&&req.method=='POST'){
    
    var form=new multiparty.Form();
    form.parse(req,function(err,fields,files){
      console.log('save',fields.file)
      try{
        fs.writeFileSync(path.join(directoryPath,fields.file[0]),fields.content[0])
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('save ok');
      }catch(err){
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('save file error');
      }
    })
    return;
  }
  console.log(u.pathname,u.query,filePath)
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
      let contentType = TYPE_MINE[extname]||'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
  
  
}).listen(port, () => {
  console.log(`SCAST Server is running on http://localhost:${port}`);
  console.log('directoryPath',directoryPath);
  exec(`start http://localhost:${port}`)
});