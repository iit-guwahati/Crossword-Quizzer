var crosswordServerObject = require('./crosswordServerObject');
var crosswordHTTPServer = require('./crosswordHTTPServer');
var crosswordWSServer = require('./crosswordWSServer') 

crosswordServerObject.init();

httpServer = crosswordHTTPServer.server;
httpServer.listen(8081);

wsServer = crosswordWSServer.attachNewCrosswordServer(httpServer, crosswordServerObject);

console.log('Server running at http://127.0.0.1:8081/');
