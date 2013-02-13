Tested only in Chrome 20+, this application is for holding a multiplayer realtime competitive crosssword.

To run:

Enter your crossword in **crossword.json**

Put your IP in **serverConfig.js**

Run **node server.js**

Clients connect to **ip_of_server:8081** (If it is slow, check to see that the connection is not going through a proxy)

The admin connects to **ip_of_server:8081/admin**

To start the game, once the clients have registered, the admin enters the password (located in crosswordWSServer.js)

TODO: Styling

Have fun :)
