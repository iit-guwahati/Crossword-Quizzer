var http = require('http');
var fs = require('fs');

module.exports.server = http.createServer(function (req, res) {
  //Finding required file from request url and headers
  fileReq = req.url;
  if(req.headers["user-agent"].substr(0,5)=="Links" || req.headers["user-agent"].substr(0,4)=="Lynx")	fileReq="/links_support";
  if(req.headers.referer)
    if(req.headers.referer.split("/").reverse()[0]=="admin")
      fileReq="/admin"+fileReq;
  if(fileReq=="/")	fileReq="/crossword.html";
  if(fileReq=="/admin")	fileReq="/crossword.html";
  if(fileReq.search("\\\.\\\.") != -1)	fileReq="/sdgbhjhfj";

  //Fetching and sending file
  exists = fs.existsSync('static'+fileReq);
  if(!exists){
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('<html><head><title>Oops!</title></head><body>Sorry, but that file doesn\'t exist. (Or you\'re trying to access a file that we specifically blocked you from accesing. Not cool.)</body></html>');
    return;
  }
  data = fs.readFileSync('static'+fileReq,'utf8');
  extension=fileReq.substr(fileReq.lastIndexOf("."));
  res.writeHead(200, {'Content-Type': extension==".html"?'text/html':extension==".css"?'text/css':extension==".js"?'text/javascript':'text/plain'});
  res.write(data);
  res.end();
});
