//import { checkKingCapture,showGameEndMessage } from './gameEnds.js';

import { BoardPositionType, OrientationType, Piece, Square } from "./cbt.js";

export class Game {
    //make const after switch to typescript
    static readonly startPos: BoardPositionType = {
        a8: Piece.bR,
        b8: Piece.bN,
        c8: Piece.bB,
        d8: Piece.bQ,
        e8: Piece.bK,
        f8: Piece.bB,
        //there is a typo in the typedef for Square which affects BoardPositionType as well
        //@ts-expect-error
        g8: Piece.bN,
        h8: Piece.bR,
        a7: Piece.bP,
        b7: Piece.bP,
        c7: Piece.bP,
        d7: Piece.bP,
        e7: Piece.bP,
        f7: Piece.bP,
        g7: Piece.bP,
        h7: Piece.bP,
        a2: Piece.wP,
        b2: Piece.wP,
        c2: Piece.wP,
        d2: Piece.wP,
        e2: Piece.wP,
        f2: Piece.wP,
        g2: Piece.wP,
        h2: Piece.wP,
        a1: Piece.wR,
        b1: Piece.wN,
        c1: Piece.wB,
        d1: Piece.wQ,
        e1: Piece.wK,
        f1: Piece.wB,
        g1: Piece.wN,
        h1: Piece.wR
    };
    static _ = Object.freeze(this.startPos);
    position: BoardPositionType;
    pieceCooldowns: Map<Square, number>;
    winner: OrientationType | null;
    gameEnded: boolean;
    COOLDOWN_TIMES: Map<string, number>;
    pieceMoveHistory: Map<string, boolean>;
    constructor() {
        this.position = { ...Game.startPos };
        this.gameEnded = false;
        this.winner = null;
        this.pieceMoveHistory = new Map<string, boolean>();

        this.pieceCooldowns = new Map<Square, number>(); // Track piece cooldowns
        console.log(this.pieceCooldowns);


        this.COOLDOWN_TIMES = new Map<string, number>([
            ['p', 2000],  // Pawns
            ['r', 3000],  // Rooks
            ['n', 3000],  // Knights
            ['b', 3000],  // Bishops
            ['q', 5000],  // Queens
            ['k', 4000]   // Kings
        ]);
    }


    checkForKingCapture(target: Square) {
        const targetPiece: Piece = this.position[target];
        if (targetPiece && targetPiece.toLowerCase().includes('k')) {
            this.winner = targetPiece.charAt(0) === 'w' ? 'black' : 'white';
            return true;
        }
        return false;
    }

    // Helper function to get cooldown time for a piece
    getPieceCooldownTime(piece: Piece): number {
        const pieceType = piece.charAt(1).toLowerCase();
        return this.COOLDOWN_TIMES[pieceType] || 3000;
    }




    isPathBlocked(from: Square, to: Square) {
        const rowFrom = parseInt(from.charAt(1));
        const rowTo = parseInt(to.charAt(1));
        const colFrom = from.charCodeAt(0) - 'a'.charCodeAt(0);
        const colTo = to.charCodeAt(0) - 'a'.charCodeAt(0);
        const rowStep = rowTo > rowFrom ? 1 : (rowTo < rowFrom ? -1 : 0);
        const colStep = colTo > colFrom ? 1 : (colTo < colFrom ? -1 : 0);

        let row = rowFrom + rowStep;
        let col = colFrom + colStep;
        while (row !== rowTo || col !== colTo) {
            const position: Square = (String.fromCharCode('a'.charCodeAt(0) + col) + row) as Square;
            if (this.position[position]) {
                return true;
            }
            row += rowStep;
            col += colStep;
        }
        return false;
    }


    hasPieceMoved(square: Square): boolean {
        return this.pieceMoveHistory.has(`${this.position[square]}-${square}`);
    }

    recordPieceMove(piece: Piece, square: Square): void {
        this.pieceMoveHistory.set(`${piece}-${square}`, true);
    }


    isLegalMove(source: Square, target: Square, piece: Piece): boolean {
        // If game has ended, no moves are legal
        if (this.winner != null || this.gameEnded) {
            return false;
        }

        if (this.position[source] != piece) {
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

        if (targetPiece && targetPiece.charAt(0) === color) return false;

        switch (pieceType) {
            case 'p':
                if (color === 'w') {
                    console.log(colDiff, rowTo, rowFrom, targetPiece);
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
                    const rookSquare = `${rookFile}${rookRank}` as Square;

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
    shouldPromotePawn(piece: Piece, target: Square): boolean {
        const pieceType = piece.charAt(1).toLowerCase();
        const color = piece.charAt(0);
        const rank = parseInt(target.charAt(1));

        return pieceType === 'p' && ((color === 'w' && rank === 8) || (color === 'b' && rank === 1));
    }


    afterMove(source: Square, target: Square, piece: Piece): Piece {
        this.recordPieceMove(piece, source);

        // Check if this was a castling move
        if (piece.charAt(1).toLowerCase() === 'k' && Math.abs(target.charCodeAt(0) - source.charCodeAt(0)) === 2) {
            // Calculate rook's movement
            const rank = source.charAt(1);
            const isKingside = target.charAt(0) === 'g';
            const oldRookFile = isKingside ? 'h' : 'a';
            const newRookFile = isKingside ? 'f' : 'd';
            const rookSource = `${oldRookFile}${rank}` as Square;
            const rookTarget = `${newRookFile}${rank}` as Square;

            // Update position to include rook movement
            this.position[rookTarget] = this.position[rookSource];
            delete this.position[rookSource];
        }
        let promoted: Piece = null;
        // Handle pawn promotion
        if (this.shouldPromotePawn(piece, target)) {
            promoted = piece.charAt(0) + 'Q' as Piece;
            this.position[target] = promoted;
        }

        // Set cooldown
        const cooldownTime = this.getPieceCooldownTime(piece);
        this.pieceCooldowns.set(target, Date.now() + cooldownTime);

        return promoted;
    }

    tryMove(source: Square, target: Square, piece: Piece) {
        if (!this.isLegalMove(source, target, piece)) {
            console.log('Illegal move attempted');
            return false;
        }
        // Check for king capture only if there's a piece on the target square that differs in color
        if (this.position[target] && this.position[target].charAt(0) !== piece.charAt(0)) {
            this.checkForKingCapture(target);
        }
        this.position[target] = piece;
        delete this.position[source];
        this.afterMove(source, target, piece)
        return true;
    }

}