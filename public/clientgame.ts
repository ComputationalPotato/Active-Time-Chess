import { Game } from './gamelogic.js'
import { BoardConfig, BoardPositionType, Callback, ChessBoardInstance, OrientationType, Piece, Square } from "./cbt.js"
import { Socket } from 'socket.io';
//this file handles the game on the side of the clients. it uses predictive networking,
//as each client has a copy of the game locally that they can act upon, but the server
//has the master copy of the game so clients will regularly replace their local game
//with an up to date copy of the server's to prevent desynchronization
var ranked: boolean = (document.getElementsByName('isranked')[0] as HTMLMetaElement)?.content === "true";
console.log(ranked);
let game: Game = new Game();
let board:ChessBoardInstance = null;
let squareSize = 0;
type pColor = OrientationType;
let playerColor: pColor = 'white'; // Default color
//while logged in, userId is stored in sessionStorage, it is what determines whether you
//are logged in or not
let userId = sessionStorage.getItem("userId");
// this is the config for chessboard.js, see chessboardjs.com for more information
var config: BoardConfig = {
    draggable: true,
    //position is usually an object acting like a dict, with squares as properties
    //and pieces as their values. the string "start" is a special value
    position: 'start',
    onDrop: ((source: Square, target: Square, piece: Piece, _newPos: any, _oldPos: any, _orientation: any): true | "snapback" => {
        console.log('Attempting move from ' + source + ' to ' + target);
        //if this returns snapback then the piece in board will return to where it was
        if (!game.tryMove(source, target, piece)) {
            console.log('Illegal move attempted');
            return 'snapback';
        }

        // Start cooldown animation for the moved piece
        const cooldownTime: number = game.getPieceCooldownTime(piece);
        game.pieceCooldowns.set(target, Date.now() + cooldownTime);
        updateCooldownCircle(piece, target);
        //tell the server that you made this move. the server will assess the move's validity
        //itself, and if the client's copy was outdated then the move may not be valid in 
        //the true version of the game. after the server receives 'move' it will broadcast
        // 'moveMade' to both players which contains the most up to date version of the game,
        //resynchronizing the players
        socket.emit('move', {
            source,
            target,
        });
        return true;
    }) as unknown as Callback,//the Callback type is improperly defined by chessboardjs so this is necessary

    //this is called when attempting to drag a piece. if it returns false it isnt dragged
    onDragStart: ((source: Square, piece: Piece, _position: any, _orientation: any): boolean => {
        // Check if piece is on cooldown
        if (game.pieceCooldowns.has(source) && Date.now() < game.pieceCooldowns.get(source)) {
            return false;
        }

        // Only allow moving pieces of player's color
        const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
        return pieceColor === playerColor;
    }) as unknown as Callback
};
//this needs to be at the start to prevent race condition
//@ts-expect-error
board = ChessBoard('myBoard', config);

// Initialize Socket.IO
//socket.io made duplicate conflicting types.
const socket = (io() as Socket & SocketIOClient.Socket);
//if you have a link to a game then you can join it b/c gameId is in the url
let gameId:null|string = new URLSearchParams(window.location.search).get('game');
if (!gameId) {
    try {
        //sends the server a looking for game request, and waits until the server tells
        //it what game to join
        let response = await socket.timeout(10000).emitWithAck('lfg', ranked, userId);
        gameId = response.gameId;
        console.log("got resp to lfg")
    } catch (e) {
        // the server did not acknowledge the event in the given delay
        console.log(e)
    }
}
//contacts the server, asking to join the game, if gameId is null then the server will decide which game.
socket.emit('joinGame', gameId, userId, ranked);

// Add game ID to URL without reloading
if (!window.location.search.includes('game=')) {
    window.history.pushState({}, '', `?game=${gameId}`);
}


// Socket event handlers


socket.on('gameJoined', (data: { color: pColor; position: BoardPositionType; waiting: boolean; cooldowns: [Square, number][]; }): void => {
    console.log('Joined game as', data.color);
    playerColor = data.color;
    board.orientation(data.color);
    board.position(data.position);

    // Create matchmaking overlay if waiting for opponent
    if (data.waiting) {
        matchmakingOverlay = createMatchmakingOverlay();

        // Start countdown
        const countdownEl = document.getElementById('countdown');
        let timeLeft = 60; // 60 seconds matchmaking timeout

        countdownInterval = setInterval(() => {
            countdownEl.textContent = timeLeft.toString();
            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(countdownInterval);
                // Handle matchmaking timeout
                socket.emit('matchmakingTimeout');
            }
        }, 1000);
    }

    // Apply any existing cooldowns
    data.cooldowns.forEach(function ([square, time]) {
        if (Date.now() < time && !document.getElementById(`cooldown-${square}`)) {
            game.pieceCooldowns.set(square, time);
            const piece:Piece = board.position()[square];
            if (piece) {
                updateCooldownCircle(piece, square);
            }
        }
    });
});
//failed join, redirect to matchmaking
socket.on('spectatorJoined', (_data: any) => {
    console.log('spectator. try again');
    window.location.href = window.location.href.split('?')[0];
});

socket.on('moveMade', (data: { position: BoardPositionType; winner: pColor|null; cooldowns: [Square, number][]; }) => {
    //updates 
    game.position = { ...data.position };
    game.winner = data.winner;
    board.position(game.position);

    // Only apply new cooldowns that don't already have animations
    data.cooldowns.forEach(([square, time]) => {
        if (Date.now() < time && !document.getElementById(`cooldown-${square}`)) {
            game.pieceCooldowns.set(square, time);
            const piece = game.position[square];
            if (piece) {
                updateCooldownCircle(piece, square);
            }
        }
    });
});


socket.on('playerDisconnected', (data: { remainingPlayers: any; }) => {
    console.log('Player disconnected, remaining players:', data.remainingPlayers);
});
socket.on('gameOver', (data: { winner: pColor; method: string; }) => {
    game.winner = data.winner;
    console.log("got game over msg");
    showGameEndMessage(data.winner, data.method);
});

// Initialize board and UI
$(document).ready(function () {
    updateOverlaySize();

    $('#resignBtn').on('click', function () {
        socket.emit('resign');
    });

    $('#drawBtn').on('click', function () {
        console.log('Requesting draw');
        socket.emit('requestDraw');
    });

    // Show modal when a draw request is received
    socket.on('drawRequest', () => {
        $('#drawModal').show();
    });

    // Handle the response buttons in the modal
    $('#acceptDraw').on('click', function () {
        $('#drawModal').hide();
        socket.emit('acceptDraw');
    });
    $('#declineDraw').on('click', function () {
        $('#drawModal').hide();
        socket.emit('declineDraw');
    });

    // Handle accepted and declined draw responses
    socket.on('drawAccepted', () => {
        console.log('Draw accepted, ending game');
        showGameEndMessage(null, "draw");
    });

    socket.on('drawDeclined', () => {
        console.log('Draw declined');
        alert("Your draw request was declined.");
    });


    $(window).resize(function () {
        board.resize();
        updateOverlaySize();
    });
});

function showGameEndMessage(winner: pColor, method = "capture") {
    console.log('Initiated Game Ending');

    const existingMessage = document.querySelector('.game-end-message');
    if (existingMessage) existingMessage.remove();

    const messageContainer = document.createElement('div');
    messageContainer.className = 'game-end-message';

    const messageContent = document.createElement('div');
    if (method === "draw") {
        messageContent.innerHTML = `
            <h2>Game Over!</h2>
            <p>The game ended in a draw.</p>
            <button onclick="location.replace('/account.html')">Close</button>
        `;
    } else if (method === "resign") {
        messageContent.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winner} wins by resignation!</p>
            <button onclick="location.replace('/account.html')">Close</button>
        `;
    } else {
        messageContent.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winner} wins by capturing the king!</p>
            <button onclick="location.replace('/account.html')">Close</button>
        `;
    }


    // Add message to page
    messageContainer.appendChild(messageContent);
    document.body.appendChild(messageContainer);

    // Disable further moves
    game.gameEnded = true;

    /* // Add click outside to dismiss
    document.addEventListener('click', function closeMessage(e) {
        if (!messageContainer.contains(e.target)) {
            messageContainer.remove();
            document.removeEventListener('click', closeMessage);
        }
    }); */
}


function updateCooldownCircle(_piece: Piece, square: Square): void {
    const cooldownId = `cooldown-${square}`;
    // Don't create new animation if one already exists
    if (document.getElementById(cooldownId)) {
        return;
    }

    const pos = $(`[data-square="${square}"]`).position();
    if (!pos) return;

    const radius = squareSize * 0.4;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("id", cooldownId);
    circle.setAttribute("cx", (pos.left + squareSize / 2).toString());
    circle.setAttribute("cy", (pos.top + squareSize / 2).toString());
    circle.setAttribute("r", radius.toString());
    circle.setAttribute("class", "cooldown-circle");

    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference.toString();
    circle.style.strokeDashoffset = "0";
    circle.style.stroke = "rgba(255, 0, 0, 0.5)";
    circle.style.strokeWidth = "3";
    circle.style.fill = "rgba(255, 0, 0, 0.2)";

    const cooldownTime = game.pieceCooldowns.get(square) - Date.now();
    if (cooldownTime < 0) {
        return;
    }

    const animation = circle.animate([
        { strokeDashoffset: '0' },
        { strokeDashoffset: circumference + 'px' }
    ], {
        duration: cooldownTime,
        easing: 'linear',
        fill: 'forwards'
    });

    document.getElementById("cooldownOverlay").appendChild(circle);

    setTimeout(() => {
        circle.remove();
        game.pieceCooldowns.delete(square); // Clean up the cooldown entry
    }, cooldownTime);
}

function updateOverlaySize(): void {
    const boardElement = document.querySelector<HTMLDivElement>('.board-container');
    const overlay = document.querySelector<SVGSVGElement>('#cooldownOverlay');
    overlay.setAttribute('width', boardElement.offsetWidth.toString());
    overlay.setAttribute('height', boardElement.offsetHeight.toString());
    squareSize = boardElement.offsetWidth / 8;
}
// Matchmaking overlay before two players have joined
function createMatchmakingOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'matchmaking-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50';

    const content = document.createElement('div');
    content.className = 'text-white text-center';
    content.innerHTML = `
        <h2 class="text-3xl mb-4">Matchmaking</h2>
        <p class="mb-4">Waiting for opponent...</p>
        <div id="countdown" class="text-6xl"></div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);
    return overlay;
}

let matchmakingOverlay:HTMLDivElement = null;
let countdownInterval:NodeJS.Timeout = null;

//once both players have joined
socket.on('gameStart', (data: { position: BoardPositionType ; cooldowns: [Square, number][]; }) => {
    // Remove matchmaking overlay
    if (matchmakingOverlay) {
        matchmakingOverlay.remove();
        matchmakingOverlay = null;
    }

    // Clear any existing countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    // Set initial board position
    board.position(data.position);

    // Apply any existing cooldowns
    data.cooldowns.forEach(([square, time]) => {
        if (Date.now() < time && !document.getElementById(`cooldown-${square}`)) {
            game.pieceCooldowns.set(square, time);
            const piece = board.position()[square];
            if (piece) {
                updateCooldownCircle(piece, square);
            }
        }
    });
});

