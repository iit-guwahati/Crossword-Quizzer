Crossword-Quizzer
=================

An application to allow a quiz between 2-8 participants on a crossword puzzle. Server-client architecture, where the clients require nothing more than a HTML5 capable browser. 

Requirements :

* Capable of handling 2-8 participants/teams
* Modes (at client side) :
  - Administrator (special privileges)
  - Participant (those competing to solve the crossword. Allowed to fill in words)
  - Spectator (Can only view; cannot make changes and/or participate)

* Fill a word if correctly answered by a participant/team based on First Come First Serve principle and disable it for further attempts.
* As soon as a word is filled, all involved clients (administrator, participant, spectator) should see the change.


Future Aims : 
* Given the words to be used in the crossword and the corresponding hints, the program should generate a crossword.

Appended different README.md :P:

Crossword-Quizzer

Tested only in Chrome 20+, this application is for holding a multiplayer realtime competitive crosssword.
Still in its making, the app runs on node.js, invoked by "node server.js" and plays the crossword in crossword.json.
It serves the necessary files and no apache server is required.
The IP of the server needs to be changed in static/crosswordsocket.js and static/admin/crosswordsocket.js.
Clients go to <ip of server>:8081. An admin goes to <ip of server>:8081/admin and starts the game by entering the password in crosswordWSServer.js.
crosswordWSServer.js also has the logic for assigning points to an answer, because it needs changing.

Have fun :)


