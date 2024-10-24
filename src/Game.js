import { INVALID_MOVE } from 'boardgame.io/core';
import { updateCooldownCircle, updateOverlaySize, isLegalMove, isPathBlocked } from '../gamelogic.js';
import { ActivePlayers } from 'boardgame.io/core';
import { Stage } from 'boardgame.io/core';
import ChessBoard from 'chessboardjs'


export const ChessGame = {
  setup: () => ({board:(new ChessBoard("real", 'start')).fen(),pieceCooldowns : Array.from((new Map()).entries())}),

  moves: {
    clickCell: ({ G, playerID }, id) => {
      G.cells[id] = playerID;
    },
    move: ({ G, ctx, playerID }, source, target, piece, newPos, oldPos) => {
      
      if (!isLegalMove(source, target, piece, null, G.board)) {
        console.log('Illegal move attempted');
        return INVALID_MOVE;
      }
      let tempBoard=new ChessBoard("real",G.board)
      tempBoard.move(source+'-'+target);
      G.board=tempBoard.fen();
    }
  },
  turn: {
    minMoves: 1,
    maxMoves: 1,
    activePlayers: { all: Stage.NULL },
  },

};
