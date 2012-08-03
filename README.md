Crossword-Quizzer
=================

An application to allow a quiz between 2-8 participants on a crossword puzzle. Server-client architecture, where the clients require nothing more than a HTML5 capable browser. 

Specifications :

* Capable of handling 2-8 participants/teams
* Modes (at client side) :
  - Administrator (special privileges)
  - Participant (those competing to solve the crossword. Allowed to fill in words)
  - Spectator (Can only view; cannot make changes and/or participate)

* Fill a word if correctly answered by a participant/team based on First Come First Serve principle and disable it for further attempts.
* As soon as a word is filled, all involved clients (administrator, participant, spectator) should see the change.
