const COOLDOWN_TIME = 3000; // 3 seconds            <----------------------------cooldown set
const pieceCooldowns = new Map(); // Track piece cooldowns
let squareSize = 0;

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

    // Create circular progress animation
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = 0;
    circle.style.stroke = "rgba(255, 0, 0, 0.5)";
    circle.style.strokeWidth = "3";
    circle.style.fill = "rgba(255, 0, 0, 0.2)";

    // Set up the animation using keyframes
    const animation = circle.animate([
        { strokeDashoffset: '0' },
        { strokeDashoffset: circumference + 'px' }
    ], {
        duration: COOLDOWN_TIME,
        easing: 'linear',
        fill: 'forwards'
    });

    document.getElementById("cooldownOverlay").appendChild(circle);

    // Remove the circle when cooldown is complete
    setTimeout(() => {
        circle.remove();
    }, COOLDOWN_TIME);
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

// Track whether pieces have moved
const pieceMoveHistory = new Map();

// Helper function to check if a piece has moved
function hasPieceMoved(square, oldPos) {
    return pieceMoveHistory.has(`${oldPos[square]}-${square}`);
}

// Helper function to record a piece movement
function recordPieceMove(piece, square) {
    pieceMoveHistory.set(`${piece}-${square}`, true);
}

export function isLegalMove(source, target, piece, newPos, oldPos) {
    // Check cooldown
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
    if (targetPiece && targetPiece.charAt(0) === color) return false;

    switch (pieceType) {
        case 'p':
            if (color === 'w') {
                // Capture for white
                if (colDiff === 1 && rowTo - rowFrom === 1 && targetPiece) {
                    return true;
                }
                // Forward for white
                if (colDiff === 0 && !targetPiece) {
                    // Single square advance
                    if (rowTo - rowFrom === 1) return true;
                    // Initial two square advance
                    if (rowFrom === 2 && rowTo - rowFrom === 2) {
                        return !isPathBlocked(oldPos, source, target);
                    }
                }
                return false;
            } else {
                // Capture for black
                if (colDiff === 1 && rowFrom - rowTo === 1 && targetPiece) {
                    return true;
                }
                // Forward for black
                if (colDiff === 0 && !targetPiece) {
                    // Single square advance
                    if (rowFrom - rowTo === 1) return true;
                    // Initial two square advance
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
            // Check for normal king move
            if (rowDiff <= 1 && colDiff <= 1) return true;
            
            // Check for castling
            if (rowDiff === 0 && colDiff === 2 && !hasPieceMoved(source, oldPos)) {
                const isKingsideCastling = colTo > colFrom;
                const rookFile = isKingsideCastling ? 'h' : 'a';
                const rookRank = rowFrom;
                const rookSquare = `${rookFile}${rookRank}`;
                
                // Check if rook is present and hasn't moved
                if (!oldPos[rookSquare] || 
                    oldPos[rookSquare].charAt(1).toLowerCase() !== 'r' ||
                    hasPieceMoved(rookSquare, oldPos)) {
                    return false;
                }
                
                // Check if path is clear
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

// After a successful move, call to add to history and handle castling and promotion
export function afterMove(source, target, piece, position) {  // Add position parameter instead of game
    recordPieceMove(piece, source);
    
    // rook movement during castle
    if (piece.charAt(1).toLowerCase() === 'k' && Math.abs(target.charCodeAt(0) - source.charCodeAt(0)) === 2) {
        const isKingside = target.charAt(0) === 'g';
        const rank = source.charAt(1);
        const oldRookFile = isKingside ? 'h' : 'a';
        const newRookFile = isKingside ? 'f' : 'd';
        const rookPiece = piece.charAt(0) + 'r';
        recordPieceMove(rookPiece, `${oldRookFile}${rank}`);
    }

    // Handle pawn promotion
    if (shouldPromotePawn(piece, target)) {
        return promotePawn(target, piece.charAt(0));  
    }

    // Set cooldown after move
    pieceCooldowns.set(target, Date.now() + COOLDOWN_TIME);
    return null;  // Return null if no promotion occurred
}

// provide promotion piece (wq or bq) Add more later if needed
function promotePawn(square, color) {
    // Promote to queen
    return color + 'q';
}

export function updateOverlaySize() {
    const boardElement = document.querySelector('.board-container');
    const overlay = document.getElementById('cooldownOverlay');
    overlay.setAttribute('width', boardElement.offsetWidth);
    overlay.setAttribute('height', boardElement.offsetHeight);
    squareSize = boardElement.offsetWidth / 8;
}



