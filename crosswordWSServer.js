var websocketServer = require('websocket').server;

var password="start";
var delay=5000;
var colours = ["red", "brown", "orange", "black", "green", "blue", "aqua", "maroon"];

var playByPlay=[];
var started = false;
var finished = false;
var players = [];
var allClients = [];

var messageHistory=[];

module.exports.attachNewCrosswordServer = function (httpServer, crosswordServerObject) {
	wsServer = new websocketServer({
		httpServer: httpServer
	});
	
	wsServer.on('request', function(request){
		var connection = request.accept(null, request.origin);
		allClients.push(connection);
	
		var playerIndex=false;
		var playerName=false;
		var playerColour=false;
		var admin=false;
	
		if(started){
			playerScores = players.map(function (x) { return { name: x.name, colour: x.colour, score: x.score }; });
			connection.sendUTF(JSON.stringify({ type:'updateScores', scores: playerScores }));
			connection.sendUTF(JSON.stringify(crosswordServerObject.clientCrossword));
			playByPlay.forEach(function(play){
				connection.sendUTF(JSON.stringify(play));
			});
		}
					
	
		connection.on('message', function(message){
			var messageParts;
			if(finished)	return false;
			messageHistory.push({ playerName: playerName, message:message });
			if(message.type === 'utf8'){
				messageParts = message.utf8Data.split(" ");
				if(messageParts[0] === 'startGame' && !started)
					if(messageParts[1] === password){
						startGame();
						admin=true;
					}
	
				//Message received from a person who is not (yet) a player. Only register is accepted.
				if(!playerName){
					if(messageParts[0] === 'register' && !started)
						handleRegisterRequest(message);
				} else if(!admin){
					if(messageParts[0] === 'guess'){
						handleGuess(messageParts[1],messageParts[2]);
					} else if(messageParts[0] === 'typing'){
						allClients.forEach(function (client){
							client.sendUTF(JSON.stringify({ type:'updateStatus', name: playerName, status: "Attempting "+messageParts[1] }));
						});
					} else if(messageParts[0] === 'thinking'){
						allClients.forEach(function (client){
							client.sendUTF(JSON.stringify({ type:'updateStatus', name: playerName, status: "Thinking" }));
						});
					}
				} else {
					if(messageParts[0]=="stopGame")
						stopGame();
					if(messageParts[0]=="broadcast")
						allClients.forEach(function (client){
							client.sendUTF(JSON.stringify({ type:'adminMessage', message: messageParts.slice(1).join(" ") }));
				}
			}
		});

		connection.on('close', function(connection){
			if(playerName){
				allClients.forEach(function (client){
					client.sendUTF(JSON.stringify({ type:'updateStatus', name: playerName, status: "Disconnected" }));
				});
			}
		});

		function startGame() {
			started = true;
			allClients.forEach(function (client){
				client.sendUTF(JSON.stringify({type: 'startCountdown', delay: delay}));
			});
			setTimeout(function () {
				allClients.forEach(function (client){
					client.sendUTF(JSON.stringify(crosswordServerObject.clientCrossword));
				});
			}, delay);
		}

		function handleRegisterRequest(message) {
			var playerScores;
			//If playername has not been registered
			playerName=message.utf8Data.split(" ").splice(1).join(" ").trim();
			if(playerName == ""){
				playerName=false;
				connection.sendUTF(JSON.stringify({ type:'registration', accept:'false', error:'Playername cannot be empty.'}));
				return;
			} else if(players.map(function (x) { return x.name; }).indexOf(playerName)==-1){
				//Register, send confirmation, send everyone updated scores with new player
				playerIndex = players.length;
				playerName = message.utf8Data.split(" ")[1];
				playerColour = colours[players.length];
				players.push({connection: connection, name: playerName, colour: playerColour, score: 0});
				connection.sendUTF(JSON.stringify({ type:'registration', accept:'true', name: playerName, colour: playerColour}));
				playerScores = players.map(function (x) { return { name: x.name, colour: x.colour, score: x.score }; });
				allClients.forEach(function (client){
					client.sendUTF(JSON.stringify({ type:'updateScores', scores: playerScores }));
				});
			} else {
				playerName=false;
				connection.sendUTF(JSON.stringify({ type:'registration', accept:'false', error:'Playername already registered.'}));
			}
		}

		function handleGuess(clueKey, guess) {
			var scoreDiff, playerScores;
			if(playByPlay.map(function(x){return x.clueKey;}).indexOf(clueKey)!=-1)	return;
			scoreDiff=crosswordServerObject.addAnswer(clueKey, guess.toUpperCase(), playerIndex);
			players[playerIndex].score+=scoreDiff;
			playerScores = players.map(function (x) { return { name: x.name, colour: x.colour, score: x.score }; });
			allClients.forEach(function (client){
				client.sendUTF(JSON.stringify({ type:'updateScores', scores: playerScores }));
			});
			if(scoreDiff>0){
				allClients.forEach(function (client){
					client.sendUTF(JSON.stringify({ type:'updateBoard', clueKey: clueKey, answer: guess.toUpperCase(), colour: playerColour }));
				});
				playByPlay.push({ type:'updateBoard', clueKey: clueKey, answer: guess.toUpperCase(), colour: playerColour });
				if(playByPlay.length == Object.keys(crosswordServerObject.clientCrossword.clues).length)
					stopGame();
			}
		}

		function stopGame() {
			var scores, i, l;
			finished=true;
			allClients.forEach(function (client){
				client.sendUTF(JSON.stringify({ type:'crosswordComplete' }));
			});
			players.sort(function (x,y) {return y.score - x.score;});
			scores = players.map(function(x){return x.score;});
			//Removing duplicates
			l=scores.length;
			for(i=0;i<l-1;i++){
				if(scores[i]==scores[i+1]){
					scores.splice(i,1);
					i-=1;
					l-=1;
				}
			}
			scores=scores.map(function(s){
				return players.filter(function(p){
					return p.score==s;
				});
			});
			scores.forEach(function (x, i){
				x.forEach(function (p){
					allClients.forEach(function(client) {
						client.sendUTF(JSON.stringify({ type:'updateStatus', name: p.name, status: getPlaceString(i+1,x.length>1) }));
					});
				});
			});
		}

		//Not guaranteed to work for place>20
		function getPlaceString(place, multiple){
			var placeStrings=["Winner", "Runner-up"];
			if(place<3){
				if(multiple)
					return "Joint "+placeStrings[place-1]+"s";
				else
					return placeStrings[place-1];
			} else {
				if(place==3)
					return (multiple?"Joint ":"")+"3rd";
				return (multiple?"Joint ":"")+place+"th";
			}
		}
	});
}
