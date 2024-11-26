//import { checkKingCapture,showGameEndMessage } from './gameEnds.js';

export class Game {
    //make const after switch to typescript
    static readonly startPos = {
        "a8": "bR",
        "b8": "bN",
        "c8": "bB",
        "d8": "bQ",
        "e8": "bK",
        "f8": "bB",
        "g8": "bN",
        "h8": "bR",
        "a7": "bP",
        "b7": "bP",
        "c7": "bP",
        "d7": "bP",
        "e7": "bP",
        "f7": "bP",
        "g7": "bP",
        "h7": "bP",
        "a2": "wP",
        "b2": "wP",
        "c2": "wP",
        "d2": "wP",
        "e2": "wP",
        "f2": "wP",
        "g2": "wP",
        "h2": "wP",
        "a1": "wR",
        "b1": "wN",
        "c1": "wB",
        "d1": "wQ",
        "e1": "wK",
        "f1": "wB",
        "g1": "wN",
        "h1": "wR"
    };
    static _=Object.freeze(this.startPos);
    position:object;
    pieceCooldowns: Map<string, number>;
    winner: string|null;
    gameEnded: boolean;
    COOLDOWN_TIMES:object;
    constructor() {
        this.position = {...Game.startPos};
        this.gameEnded = false;
        this.winner=null;

        this.pieceCooldowns = new Map(); // Track piece cooldowns
        console.log(this.pieceCooldowns);
        

        this.COOLDOWN_TIMES = {
            'p': 2000,  // Pawns
            'r': 3000,  // Rooks
            'n': 3000,  // Knights
            'b': 3000,  // Bishops
            'q': 5000,  // Queens
            'k': 4000   // Kings
        };
    }
    

    checkForKingCapture(target) {
        const targetPiece = this.position[target];
        if (targetPiece && targetPiece.toLowerCase().includes('k')) {
            this.winner = targetPiece.charAt(0) === 'w' ? 'Black' : 'White';
            //setTimeout(() => this.showGameEndMessage(winner), 100); // Small delay to ensure move completes
            return true;
        }
        return false;
    }

    // Helper function to get cooldown time for a piece
    /**
     * @param {string} piece
     */
    getPieceCooldownTime(piece: string): number {
        const pieceType = piece.charAt(1).toLowerCase();
        return this.COOLDOWN_TIMES[pieceType] || 3000;
    }

    

    /**
     * @param {string} from
     * @param {string} to
     */
    isPathBlocked(from, to) {
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
            if (this.position[position]) {
                return true;
            }
            row += rowStep;
            col += colStep;
        }
        return false;
    }

    pieceMoveHistory = new Map();

    hasPieceMoved(square) {
        return this.pieceMoveHistory.has(`${this.position[square]}-${square}`);
    }

    recordPieceMove(piece, square) {
        this.pieceMoveHistory.set(`${piece}-${square}`, true);
    }

    /**
     * @param {string} source
     * @param {string} target
     * @param {string} piece
     */
    isLegalMove(source, target, piece) {
        // If game has ended, no moves are legal
        if (this.winner != null) {
            return false;
        }

        if(this.position[source]!=piece)
        {
            return false;
        }

        if (this.pieceCooldowns.has(source) && Date.now() < this.pieceCooldowns.get(source)) {
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

        const targetPiece = this.position[target];

        //i think this would mean that moves get to skip validation if they take a king?
        /* // Check for king capture before validating the move
        if (targetPiece && this.checkForKingCapture(target)) {
            return true; // Allow the move that captures the king
        } */

        if (targetPiece && targetPiece.charAt(0) === color) return false;

        switch (pieceType) {
            case 'p':
                if (color === 'w') {
                    console.log(colDiff,rowTo,rowFrom,targetPiece);
                    if (colDiff === 1 && rowDiff === 1 && targetPiece) {
                        return true;
                    }
                    if (colDiff === 0 && !targetPiece) {
                        if (rowTo - rowFrom === 1) return true;
                        if (rowFrom === 2 && rowTo - rowFrom === 2) {
                            return !this.isPathBlocked(source, target);
                        }
                    }
                    return false;
                } else {
                    if (colDiff === 1 && rowDiff === 1 && targetPiece) {
                        return true;
                    }
                    if (colDiff === 0 && !targetPiece) {
                        if (rowFrom - rowTo === 1) return true;
                        if (rowFrom === 7 && rowFrom - rowTo === 2) {
                            return !this.isPathBlocked(source, target);
                        }
                    }
                    return false;
                }
            case 'r':
                return (rowDiff === 0 || colDiff === 0) && !this.isPathBlocked(source, target);
            case 'n':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case 'b':
                return rowDiff === colDiff && !this.isPathBlocked(source, target);
            case 'q':
                return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && !this.isPathBlocked(source, target);
            case 'k':
                // Regular king move (one square in any direction)
                if (rowDiff <= 1 && colDiff <= 1) return true;

                // Castling logic
                if (rowDiff === 0 && colDiff === 2 && !this.hasPieceMoved(source)) {
                    const isKingsideCastling = colTo > colFrom;
                    const rookFile = isKingsideCastling ? 'h' : 'a';
                    const rookRank = rowFrom;
                    const rookSquare = `${rookFile}${rookRank}`;

                    if (!this.position[rookSquare] ||
                        this.position[rookSquare].charAt(1).toLowerCase() !== 'r' ||
                        this.hasPieceMoved(rookSquare)) {
                        return false;
                    }

                    const kingPath = isKingsideCastling ?
                        [`f${rowFrom}`, `g${rowFrom}`] :
                        [`d${rowFrom}`, `c${rowFrom}`, `b${rowFrom}`];

                    return kingPath.every(square => !this.position[square]);
                }
                return false;

            default:
                return false;
        }
    }

    // Check if pawn needs promotion
    shouldPromotePawn(piece, target) {
        const pieceType = piece.charAt(1).toLowerCase();
        const color = piece.charAt(0);
        const rank = parseInt(target.charAt(1));

        return pieceType === 'p' && ((color === 'w' && rank === 8) || (color === 'b' && rank === 1));
    }


    afterMove(source, target, piece) {
        this.recordPieceMove(piece, source);

        

        //i think this one is outdated or smth.
        /* // Handle castling
        if (piece.charAt(1).toLowerCase() === 'k' && Math.abs(target.charCodeAt(0) - source.charCodeAt(0)) === 2) {
            const isKingside = target.charAt(0) === 'g';
            const rank = source.charAt(1);
            const oldRookFile = isKingside ? 'h' : 'a';
            const newRookFile = isKingside ? 'f' : 'd';
            const rookPiece = piece.charAt(0) + 'R';
            this.recordPieceMove(rookPiece, `${oldRookFile}${rank}`);
        } */

        // Check if this was a castling move
        if (piece.charAt(1).toLowerCase() === 'k' && Math.abs(target.charCodeAt(0) - source.charCodeAt(0)) === 2) {
            // Calculate rook's movement
            const rank = source.charAt(1);
            const isKingside = target.charAt(0) === 'g';
            const oldRookFile = isKingside ? 'h' : 'a';
            const newRookFile = isKingside ? 'f' : 'd';
            const rookSource = `${oldRookFile}${rank}`;
            const rookTarget = `${newRookFile}${rank}`;

            // Update position to include rook movement
            this.position[rookTarget] = this.position[rookSource];
            delete this.position[rookSource];
        }
        let promoted=null;
        // Handle pawn promotion
        if (this.shouldPromotePawn(piece, target)) {
            promoted= piece.charAt(0) + 'Q';
            this.position[target] =piece.charAt(0) + 'Q';
        }

        // Set cooldown
        const cooldownTime = this.getPieceCooldownTime(piece);
        this.pieceCooldowns.set(target, Date.now() + cooldownTime);

        return promoted;
    }

    promotePawn(square, color) {
        return color + 'Q'; // Promote to queen (using uppercase 'Q' to match chess.js notation)
    }
    tryMove(source, target, piece)
    {
        if (!this.isLegalMove(source, target, piece)) {
            console.log('Illegal move attempted');
            return false;
        }
        // Check for king capture only if there's a piece on the target square that differs in color
        if (this.position[target] && this.position[target].charAt(0) !== piece.charAt(0)) {
            this.checkForKingCapture(target);
        }
        this.position[target]=piece;
        delete this.position[source];
        this.afterMove(source, target, piece)
        return true;
    }
    
}