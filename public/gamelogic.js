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
                if (colDiff === 0 && !targetPiece) {
                    if (rowDiff === 1 && rowTo > rowFrom) return true;
                    if (rowFrom === 2 && rowDiff === 2) return !isPathBlocked(oldPos, source, target);
                }
                return colDiff === 1 && rowDiff === 1 && rowTo > rowFrom && targetPiece;
            } else {
                if (colDiff === 0 && !targetPiece) {
                    if (rowDiff === 1 && rowTo < rowFrom) return true;
                    if (rowFrom === 7 && rowDiff === 2) return !isPathBlocked(oldPos, source, target);
                }
                return colDiff === 1 && rowDiff === 1 && rowTo < rowFrom && targetPiece;
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
            return rowDiff <= 1 && colDiff <= 1;
        default:
            return false;
    }
}


export function updateOverlaySize() {
    const boardElement = document.querySelector('.board-container');
    const overlay = document.getElementById('cooldownOverlay');
    overlay.setAttribute('width', boardElement.offsetWidth);
    overlay.setAttribute('height', boardElement.offsetHeight);
    squareSize = boardElement.offsetWidth / 8;
}



