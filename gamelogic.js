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
    // Basic position calculations
    const rowFrom = parseInt(source.charAt(1));
    const rowTo = parseInt(target.charAt(1));
    const colFrom = source.charCodeAt(0) - 'a'.charCodeAt(0);
    const colTo = target.charCodeAt(0) - 'a'.charCodeAt(0);
    const rowDiff = Math.abs(rowTo - rowFrom);
    const colDiff = Math.abs(colTo - colFrom);

    // Get piece type and color
    const color = piece.charAt(0); // 'w' or 'b'
    const pieceType = piece.charAt(1).toLowerCase();

    // Don't allow moving to the same square
    if (source === target) return false;

    // Don't allow capturing own pieces
    const targetPiece = oldPos[target];
    if (targetPiece && targetPiece.charAt(0) === color) return false;

    switch (pieceType) {
        case 'p': // Pawn
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
        case 'r': // Rook
            return (rowDiff === 0 || colDiff === 0) && !isPathBlocked(oldPos, source, target);
        case 'n': // Knight
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        case 'b': // Bishop
            return rowDiff === colDiff && !isPathBlocked(oldPos, source, target);
        case 'q': // Queen
            return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && !isPathBlocked(oldPos, source, target);
        case 'k': // King
            return rowDiff <= 1 && colDiff <= 1;
        default:
            return false;
    }
}

