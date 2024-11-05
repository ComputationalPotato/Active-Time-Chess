//import { checkKingCapture,showGameEndMessage } from './gameEnds.js';

export let gameEnded = false;

const pieceCooldowns = new Map(); // Track piece cooldowns
let squareSize = 0;

const COOLDOWN_TIMES = {
    'p': 2000,  // Pawns
    'r': 3000,  // Rooks
    'n': 3000,  // Knights
    'b': 3000,  // Bishops
    'q': 5000,  // Queens
    'k': 4000   // Kings
};
export function showGameEndMessage(winner, method = "capture") {
    const existingMessage = document.querySelector('.game-end-message');
    if (existingMessage) existingMessage.remove();

    const messageContainer = document.createElement('div');
    messageContainer.className = 'game-end-message';

    const messageContent = document.createElement('div');
    if (method === "draw") {
        messageContent.innerHTML = `
            <h2>Game Over!</h2>
            <p>The game ended in a draw.</p>
            <button onclick="location.reload()">Play Again</button>
        `;
    } else if (method === "resign") {
        messageContent.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winner} wins by resignation!</p>
            <button onclick="location.reload()">Play Again</button>
        `;
    } else {
        messageContent.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winner} wins by capturing the king!</p>
            <button onclick="location.reload()">Play Again</button>
        `;
    }


    // Add message to page
    messageContainer.appendChild(messageContent);
    document.body.appendChild(messageContainer);

    // Disable further moves
    gameEnded = true;

    // Add click outside to dismiss
    document.addEventListener('click', function closeMessage(e) {
        if (!messageContainer.contains(e.target)) {
            messageContainer.remove();
            document.removeEventListener('click', closeMessage);
        }
    });
}

function checkForKingCapture(target, position) {
    const targetPiece = position[target];
    if (targetPiece && targetPiece.toLowerCase().includes('k')) {
        const winner = targetPiece.charAt(0) === 'w' ? 'Black' : 'White';
        setTimeout(() => showGameEndMessage(winner), 100); // Small delay to ensure move completes
        return true;
    }
    return false;
}

// Helper function to get cooldown time for a piece
function getPieceCooldownTime(piece) {
    const pieceType = piece.charAt(1).toLowerCase();
    return COOLDOWN_TIMES[pieceType] || 3000;
}

export function updateCooldownCircle(piece, square) {
    const cooldownId = `cooldown-${square}`;
    const existingCircle = document.getElementById(cooldownId);
    if (existingCircle) {
        existingCircle.remove();
    }

    const pos = $(`[data-square="${square}"]`).position();
    if (!pos) return;

    const radius = squareSize * 0.4;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("id", cooldownId);
    circle.setAttribute("cx", pos.left + squareSize / 2);
    circle.setAttribute("cy", pos.top + squareSize / 2);
    circle.setAttribute("r", radius);
    circle.setAttribute("class", "cooldown-circle");

    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = 0;
    circle.style.stroke = "rgba(255, 0, 0, 0.5)";
    circle.style.strokeWidth = "3";
    circle.style.fill = "rgba(255, 0, 0, 0.2)";

    const cooldownTime = getPieceCooldownTime(piece);

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
    }, cooldownTime);
}

export function isPathBlocked(boardState, from, to) {
    const rowFrom = parseInt(from.charAt(1));
    const rowTo = parseInt(to.charAt(1));
    const colFrom = from.charCodeAt(0) - 'a'.charCodeAt(0);
    const colTo = to.charCodeAt(0) - 'a'.charCodeAt(0);
    const rowStep = rowTo > rowFrom ? 1 : (rowTo < rowFrom ? -1 : 0);
    const colStep = colTo > colFrom ? 1 : (colTo < colFrom ? -1 : 0);

    let row = rowFrom + rowStep;
    let col = colFrom + colStep;
    while (row !== rowTo || col !== colTo) {
        const position = String.fromCharCode('a'.charCodeAt(0) + col) + row;
        if (boardState[position]) {
            return true;
        }
        row += rowStep;
        col += colStep;
    }
    return false;
}

const pieceMoveHistory = new Map();

function hasPieceMoved(square, oldPos) {
    return pieceMoveHistory.has(`${oldPos[square]}-${square}`);
}

function recordPieceMove(piece, square) {
    pieceMoveHistory.set(`${piece}-${square}`, true);
}

export function isLegalMove(source, target, piece, newPos, oldPos) {
    // If game has ended, no moves are legal
    if (gameEnded) {
        return false;
    }

    if (pieceCooldowns.has(source) && Date.now() < pieceCooldowns.get(source)) {
        console.log('Piece is on cooldown');
        return false;
    }

    const rowFrom = parseInt(source.charAt(1));
    const rowTo = parseInt(target.charAt(1));
    const colFrom = source.charCodeAt(0) - 'a'.charCodeAt(0);
    const colTo = target.charCodeAt(0) - 'a'.charCodeAt(0);
    const rowDiff = Math.abs(rowTo - rowFrom);
    const colDiff = Math.abs(colTo - colFrom);

    const color = piece.charAt(0);
    const pieceType = piece.charAt(1).toLowerCase();

    if (source === target) return false;

    const targetPiece = oldPos[target];
    
    // Check for king capture before validating the move
    if (targetPiece && checkForKingCapture(target, oldPos)) {
        return true; // Allow the move that captures the king
    }

    if (targetPiece && targetPiece.charAt(0) === color) return false;

    switch (pieceType) {
        case 'p':
            if (color === 'w') {
                if (colDiff === 1 && rowTo - rowFrom === 1 && targetPiece) {
                    return true;
                }
                if (colDiff === 0 && !targetPiece) {
                    if (rowTo - rowFrom === 1) return true;
                    if (rowFrom === 2 && rowTo - rowFrom === 2) {
                        return !isPathBlocked(oldPos, source, target);
                    }
                }
                return false;
            } else {
                if (colDiff === 1 && rowFrom - rowTo === 1 && targetPiece) {
                    return true;
                }
                if (colDiff === 0 && !targetPiece) {
                    if (rowFrom - rowTo === 1) return true;
                    if (rowFrom === 7 && rowFrom - rowTo === 2) {
                        return !isPathBlocked(oldPos, source, target);
                    }
                }
                return false;
            }
        case 'r':
            return (rowDiff === 0 || colDiff === 0) && !isPathBlocked(oldPos, source, target);
        case 'n':
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        case 'b':
            return rowDiff === colDiff && !isPathBlocked(oldPos, source, target);
        case 'q':
            return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && !isPathBlocked(oldPos, source, target);
        case 'k':
            if (rowDiff <= 1 && colDiff <= 1) return true;
            
            if (rowDiff === 0 && colDiff === 2 && !hasPieceMoved(source, oldPos)) {
                const isKingsideCastling = colTo > colFrom;
                const rookFile = isKingsideCastling ? 'h' : 'a';
                const rookRank = rowFrom;
                const rookSquare = `${rookFile}${rookRank}`;
                
                if (!oldPos[rookSquare] || 
                    oldPos[rookSquare].charAt(1).toLowerCase() !== 'r' ||
                    hasPieceMoved(rookSquare, oldPos)) {
                    return false;
                }
                
                const kingPath = isKingsideCastling ? 
                    [`f${rowFrom}`, `g${rowFrom}`] :
                    [`d${rowFrom}`, `c${rowFrom}`, `b${rowFrom}`];
                
                return kingPath.every(square => !oldPos[square]);
            }
            return false;
        default:
            return false;
    }
}

// Check if pawn needs promotion
function shouldPromotePawn(piece, target) {
    const pieceType = piece.charAt(1).toLowerCase();
    const color = piece.charAt(0);
    const rank = parseInt(target.charAt(1));
    
    return pieceType === 'p' && ((color === 'w' && rank === 8) || (color === 'b' && rank === 1));
}


export function afterMove(source, target, piece, position) {
    recordPieceMove(piece, source);
    
    // Check for king capture
    if (position[target] && position[target].toLowerCase().includes('k')) {
        checkKingCapture(target, position);
    }
    
    // Handle castling
    if (piece.charAt(1).toLowerCase() === 'k' && Math.abs(target.charCodeAt(0) - source.charCodeAt(0)) === 2) {
        const isKingside = target.charAt(0) === 'g';
        const rank = source.charAt(1);
        const oldRookFile = isKingside ? 'h' : 'a';
        const newRookFile = isKingside ? 'f' : 'd';
        const rookPiece = piece.charAt(0) + 'R';
        recordPieceMove(rookPiece, `${oldRookFile}${rank}`);
    }

    // Handle pawn promotion
    if (shouldPromotePawn(piece, target)) {
        return piece.charAt(0) + 'Q';
    }

    // Set cooldown
    const cooldownTime = getPieceCooldownTime(piece);
    pieceCooldowns.set(target, Date.now() + cooldownTime);
    
    return null;
}

function promotePawn(square, color) {
    return color + 'Q'; // Promote to queen (using uppercase 'Q' to match chess.js notation)
}

export function updateOverlaySize() {
    const boardElement = document.querySelector('.board-container');
    const overlay = document.getElementById('cooldownOverlay');
    overlay.setAttribute('width', boardElement.offsetWidth);
    overlay.setAttribute('height', boardElement.offsetHeight);
    squareSize = boardElement.offsetWidth / 8;
}