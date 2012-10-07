var connection=false;
var crosswordCells=false;
var crossword=false;
var currentClue=false;
var players = {};

$(function () {
    // if user is running mozilla then use its built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    connection = new WebSocket('ws://127.0.0.1:8081');

    console.log(connection);
    connection.onopen = function () {
        $('#status').html("Enter your name to play or wait for the game to start to spectate.");
	$('#statusline2').html("<form action=\"javascript:register()\"><input type=\"text\" id=\"registername\"/><input type=\"button\" onclick=\"register()\" value=\"Register!\" /></form>")
    };

    connection.onerror = function (error) {
        // an error occurred when sending/receiving data
    };

    connection.onmessage = function (message) {
        // try to decode json (I assume that each message from server is json)
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like valid JSON: ', message.data);
            return;
        }
	console.log(message);
        if(json.type=="registration")	registration(json);
        if(json.type=="startCountdown")	startCountdown(json);
        if(json.type=="updateStatus")	updateStatus(json);
        if(json.type=="updateScores")	updateScores(json);
        if(json.type=="createCrossword")	createCrossword(json);
        if(json.type=="updateBoard")	updateBoard(json);
        if(json.type=="crosswordComplete")	finish();
    };
});

function register(){
	connection.send("register "+$('#registername').val());
	return false;
}

function registration(registrationData){
	if(registrationData.accept == "true"){
		$("#status").html("You are registered as "+registrationData.name+".");
		$("#statusline2").html("Please wait for the game to start.");
		$('#crossword').css("border-bottom","solid "+registrationData.colour+" 2px;");
	} else {
		$("#status").html("Registration failed. Try again. Error: "+registrationData.error);
	}
}

function startCountdown(countdownData){
	var temp = function(delay) { window.setTimeout(function (del){ del-=1000; if(del>=0){ $("#status").html("Game starting in "+del/1000); temp(del);} }, 1000, delay); }
	temp(countdownData.delay);
}

function updateScores(scoresData){
	var scores, diff;
	var scores = scoresData.scores;
	scores.forEach(function(x){
		if(players[x.name]){
			diff = x.score - players[x.name].score();
			//players[x.name].animateScoreChange(diff);
			players[x.name].score(x.score);
		} else {
			players[x.name]=playerItem(x.name, crosswordCells==false?"Ready":"Thinking", x.score, x.colour);
			document.getElementById('players').appendChild(players[x.name]);	
		}
	});
}

function updateStatus(statusData){
	if(players[statusData.name]){
		players[statusData.name].status(statusData.status);
	}
}

function createCrossword(crosswordData){
	var crosswordRow, crosswordCell, i, j, unansweredCells;
	crossword = crosswordData;
	crosswordCells = new Array();
	crosswordBoard = document.createElement('table');
	crosswordCell = document.createElement('td');
	crosswordCell.className="nonCell";
	for(i=0;i<crossword.height;i++){
		crosswordRow = document.createElement('tr');
		crosswordCells[i] = new Array();
		for(j=0;j<crossword.width;j++){
			crosswordCells[i][j] = crosswordCell.cloneNode();
			crosswordRow.appendChild(crosswordCells[i][j]);
		}
		crosswordBoard.appendChild(crosswordRow);
	}
	Object.keys(crossword.clues).sort(function(x,y){return parseInt(x)-parseInt(y);}).forEach(function(clueKey) {
		var clueNo, clueDir, i, j, clue, length;
		clueNo=parseInt(clueKey);
		clueDir=clueKey.slice(-1);
		i=crossword.startpos[clueNo][0];
		j=crossword.startpos[clueNo][1];
		clue=crossword.clues[clueKey];
		length=clue.length;
		while(length--){
			if(crosswordCells[i][j].className=="nonCell"){
				crosswordCells[i][j].className="unanswered "+clueKey+" ";
				crosswordCells[i][j].appendChild(document.createElement('div'));
			} else crosswordCells[i][j].classList.add(clueKey);
			if(clueDir=="a")	j+=1;
			else	i+=1;
		}
		if(clueDir=="a")
			$("#acrossClues")[0].appendChild(cluelistItem(clueKey, clue.q, clue.length));
		if(clueDir=="d")
			$("#downClues")[0].appendChild(cluelistItem(clueKey, clue.q, clue.length));
	});
	crossword.startpos.forEach(function (x, i){
		var smallNumberDiv;
		if(x[0]==-1)	return;
		smallNumberDiv = document.createElement('div');
		smallNumberDiv.className="smallNumber";
		crosswordCells[x[0]][x[1]].appendChild(smallNumberDiv);
		smallNumberDiv.innerHTML=""+i;
	});
	$('#board')[0].appendChild(crosswordBoard);
	unansweredCells=document.getElementsByClassName('unanswered');
	console.log(unansweredCells);
	for(i in unansweredCells){
		unansweredCells[i].onmouseover=onmouseoverCrosswordCell;	
		unansweredCells[i].onmouseout=onmouseoutCrosswordCell;
	}	
	$('#preGame').fadeOut(1000);
	for(i in players)
		if(players[i].status)
			players[i].status("Thinking");
}

function updateBoard(newAnswer){
	var clueNo, clueDir, i, j, length, x, y, clues;
	clueNo=parseInt(newAnswer.clueKey);
	clueDir=newAnswer.clueKey.slice(-1);
	i=crossword.startpos[clueNo][0];
	j=crossword.startpos[clueNo][1];
	length=newAnswer.answer.length;
	while(length--){
		x=(clueDir=="d")?i+length:i;
		y=(clueDir=="a")?j+length:j;
		if(crosswordCells[x][y].classList.contains("unanswered")){
			crosswordCells[x][y].className="answered ";
			crosswordCells[x][y].children[0].innerHTML=newAnswer.answer.charAt(length);
			crosswordCells[x][y].style.backgroundColor=newAnswer.colour;
		}
	}
	clues = $(".cluelist ."+newAnswer.clueKey).removeClass();
	clues.addClass('answered');
}

function guess(){
	connection.send("guess "+currentClue+" "+$("#guessBox").val());
	clearGuess();
}

function enterGuess(clueKey){
	currentClue=clueKey;
	$(".guessStuff").attr("disabled",false);
	$("#guessHelper").html("Enter your guess for <b>"+clueKey+"</b>.");
	$("#guessBox").focus();
	connection.send("typing "+currentClue);
}
	
function clearGuess(){
	currentClue=false;
	$("#guessHelper").html("Click on a clue to enter your guess.");
	$("#guessBox").val("");
	$(".guessStuff").attr("disabled",true);
	connection.send("thinking");
}	

function cluelistItem(clueKey, q, length){
	var retVal = document.createElement('div');
	retVal.className=clueKey;
	retVal.innerHTML=parseInt(clueKey)+". "+q+" ("+length+")";
	retVal.onmouseover = function () {
		if(this.className!="answered")
			$("."+clueKey).addClass("highlighted");
	}
	retVal.onmouseout = function () {
		if(this.className!="answered")
			$("."+clueKey).removeClass("highlighted");
	}
	retVal.onclick = function () {
		enterGuess(clueKey);
	}
	return retVal;
}

function onmouseoverCrosswordCell() {
	var cellClues = this.classList.toLocaleString().split(" ").filter(function (x) { return x.match("[0-9]+[ad]")==x; });
	cellClues.forEach(function (y){ $("."+y).addClass('highlighted'); y});
	if(cellClues.length==1)
			this.onclick = function (){ enterGuess(cellClues[0]); }
}

function onmouseoutCrosswordCell() {
	this.classList.toLocaleString().split(" ").filter(function (x) { return x.match("[0-9]+[ad]")==x; }).forEach(function (y){ $("."+y).removeClass('highlighted'); });
}

function playerItem(name, status, score, colour){
	var retval, namediv, statusdiv, scorediv;
	retval = document.createElement('div');
	retval.className="playerBox";
	namediv = document.createElement('div');
	namediv.className="playerName";
	namediv.innerHTML=name;
	namediv.style.backgroundColor=colour;
	scorediv = document.createElement('div');
	scorediv.className="playerScore";
	scorediv.innerHTML=score;
	scorediv.style.backgroundColor=colour;
	statusdiv = document.createElement('div');
	statusdiv.className="playerStatus";
	statusdiv.innerHTML=status;
	statusdiv.style.backgroundColor=colour;
	retval.appendChild(namediv);
	retval.appendChild(statusdiv);
	retval.appendChild(scorediv);
	retval.score = function (score) {
		if(score!==undefined)
			this.children[2].innerHTML=score;
		return this.children[2].innerHTML;
	}
	retval.status = function (status) {
		if(status!==undefined)
			this.children[1].innerHTML=status;
		console.log("Setting status to"+status);
		return this.children[1].innerHTML;
	}
	return retval;
}

function finish(){
	var endScreen = document.createElement('div');
	endScreen.className="splash";
	endScreen.style.zIndex=200;
	endScreen.style.textAlign="center";
	endScreen.style.backgroundColor="black";
	endScreen.style.color="white";
	endScreen.style.opacity=0.3;
	endScreen.style.fontSize="100px";
	endScreen.innerHTML="CROSSWORD COMPLETE";
	document.body.appendChild(endScreen);
}
