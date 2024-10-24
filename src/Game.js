import { INVALID_MOVE } from 'boardgame.io/core';
import { updateCooldownCircle, updateOverlaySize, isLegalMove, isPathBlocked } from '../gamelogic.js';
import { ActivePlayers } from 'boardgame.io/core';
import { Stage } from 'boardgame.io/core';
import ChessBoard from 'chessboardjs'


export const ChessGame = {
  setup: () => ({
    board: {
      a8: 'bR',
      b8: 'bN',
      c8: 'bB',
      d8: 'bQ',
      e8: 'bK',
      f8: 'bB',
      g8: 'bN',
      h8: 'bR',
      a7: 'bP',
      b7: 'bP',
      c7: 'bP',
      d7: 'bP',
      e7: 'bP',
      f7: 'bP',
      g7: 'bP',
      h7: 'bP',
      a2: 'wP',
      b2: 'wP',
      c2: 'wP',
      d2: 'wP',
      f2: 'wP',
      g2: 'wP',
      h2: 'wP',
      a1: 'wR',
      b1: 'wN',
      c1: 'wB',
      d1: 'wQ',
      e1: 'wK',
      f1: 'wB',
      g1: 'wN',
      h1: 'wR',
      e4: 'wP'
    }, pieceCooldowns: Array.from((new Map()).entries())
  }),

  moves: {
    clickCell: ({ G, playerID }, id) => {
      G.cells[id] = playerID;
    },
    move: ({ G, ctx, playerID }, source, target, piece, newPos, oldPos) => {

      if (!isLegalMove(source, target, piece, null, G.board)) {
        console.log('Illegal move attempted');
        return INVALID_MOVE;
      }
      G.board[target]=G.board[source];
      delete G.board[source];
    }
  },
  turn: {
    minMoves: 1,
    maxMoves: 1,
    activePlayers: { all: Stage.NULL },
  },

};
