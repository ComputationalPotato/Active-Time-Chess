import {Game} from './gamelogic.js'
import { createElement } from 'react';

    var ranked = document.getElementsByName('isranked')[0]?.content === "true";
    console.log(ranked);
    let game= new Game();
    let board = null;
    const COOLDOWN_TIME = 3000;
    //const pieceCooldowns = new Map();
    let squareSize = 0;
    let playerColor = 'white'; // Default color
    let userId=sessionStorage.getItem("userId");
    var config = {
        draggable: true,
        position: 'start',
        onDrop: function (source, target, piece, newPos, oldPos, orientation) {
            console.log('Attempting move from ' + source + ' to ' + target);

        if (!game.tryMove(source, target, piece)) {
            console.log('Illegal move attempted');
            return 'snapback';
        }

        // Start cooldown animation for the moved piece
        const cooldownTime = game.getPieceCooldownTime(piece);
        game.pieceCooldowns.set(target, Date.now() + cooldownTime);
        updateCooldownCircle(piece, target);

        socket.emit('move', {
            source,
            target,
        });

        console.log('Move successful');
        return true;
    },
    onDragStart: function (source, piece, position, orientation) {
        // Check if piece is on cooldown
        if (game.pieceCooldowns.has(source) && Date.now() < game.pieceCooldowns.get(source)) {
            return false;
        }

        // Only allow moving pieces of player's color
        const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
        return pieceColor === playerColor;
    },
    onChange: function (oldPos, newPos) {
        console.log('Board position changed');
    }
};
//this needs to be at the start to prevent race condition
board = ChessBoard('myBoard', config);

// Initialize Socket.IO
const socket = io();
let gameId = new URLSearchParams(window.location.search).get('game');
if (!gameId) {
    try {
        let response = await socket.timeout(10000).emitWithAck('lfg',ranked,userId);
        gameId=response.gameId;
        console.log("got resp to lfg")
    } catch (e) {
        // the server did not acknowledge the event in the given delay
        console.log(e)

    }
}

socket.emit('joinGame', gameId, userId,ranked);

// Add game ID to URL without reloading
if (!window.location.search.includes('game=')) {
    window.history.pushState({}, '', `?game=${gameId}`);
}


// Socket event handlers


socket.on('gameJoined', (data) => {
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
            countdownEl.textContent = timeLeft;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(countdownInterval);
                // Handle matchmaking timeout
                socket.emit('matchmakingTimeout');
            }
        }, 1000);
    }
    
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

socket.on('spectatorJoined', (data) => {
    console.log('spectator. try again');
    window.location.href=window.location.href.split('?')[0];
});

socket.on('moveMade', (data) => {
    game.position = {...data.position};
    game.winner= data.winner;
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
socket.on('boardReset', (data) => {
    board.position(data.position);
    game.pieceCooldowns.clear();
    $('.cooldown-circle').remove();
});

socket.on('boardCleared', () => {
    board.clear();
    game.pieceCooldowns.clear();
    $('.cooldown-circle').remove();
});

socket.on('playerDisconnected', (data) => {
    console.log('Player disconnected, remaining players:', data.remainingPlayers);
});
socket.on('gameOver', (data) => {
    game.winner=data.winner;
    console.log("got game over msg");
    showGameEndMessage(data.winner, data.method);
});

// Initialize board and UI
$(document).ready(function () {
    updateOverlaySize();

    $('#startBtn').on('click', function () {
        socket.emit('resetBoard');
    });

    $('#clearBtn').on('click', function () {
        socket.emit('clearBoard');
    });

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
        showGameEndMessage("Draw", "draw");
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

function showGameEndMessage(winner, method = "capture") {
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

/**
 * @param {string} piece
 * @param {string} square
 */
function updateCooldownCircle(piece: string, square: string) {
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
    if(cooldownTime < 0) {
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

    function updateOverlaySize() {
        const boardElement = document.querySelector('.board-container');
        const overlay = document.getElementById('cooldownOverlay');
        overlay.setAttribute('width', boardElement.offsetWidth);
        overlay.setAttribute('height', boardElement.offsetHeight);
        squareSize = boardElement.offsetWidth / 8;
    }
// Matchmaking overlay before two players have joined
function createMatchmakingOverlay() {
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

// Modify the socket connection logic
let matchmakingOverlay = null;
let countdownInterval = null;

socket.on('gameStart', (data) => {
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
    
