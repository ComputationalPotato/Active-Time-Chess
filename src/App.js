import { Client } from 'boardgame.io/client';
import { ChessGame } from './Game';
import { SocketIO } from 'boardgame.io/multiplayer'

import $ from 'jquery'
import ChessBoard from 'chessboardjs'
import { INVALID_MOVE } from 'boardgame.io/core';

class TicTacToeClient {
  constructor(rootElement,{ playerID } = {}) {
    this.client = Client({ game: ChessGame,multiplayer: SocketIO({server:'172.24.27.211:8000'}),playerID });
    this.client.start();
    this.rootElement = rootElement;
    this.createBoard();
    this.client.subscribe(state => this.update(state));
  }

  createBoard() {
    var config = {
      draggable: true,
      dropOffBoard: 'snapback', // this is the default
      position: 'start',
      showErrors: 'console',
      pieceTheme: (piece) => {
        const imgPath = `/img/chesspieces/wikipedia/${piece}.png`;
        return imgPath;
      },
      onDrop: (source, target, piece, newPos, oldPos, orientation) => {
        console.log('Attempting move from ' + source + ' to ' + target);
        if(this.client.getState()===null)
        {
          return false;
        }
        let bfore=this.client.getState().G.board
        this.client.moves.move(source, target, piece, newPos, oldPos)
        let after =this.client.getState().G.board//when doing multiplayer will need to replace this
        if(bfore==after)
        {
          console.log("invalid move");
          return 'snapback';
        }
        console.log('Move successful');
        return true;
      },
      onMoveEnd:  (oldPos, newPos)=> {
        this.board.position(this.client.getState().G.board,false);
      }
    }

    this.board = new ChessBoard("myBoard", config)
  }
  update(state) {
    if(state===null)
    {
      return;
    }
    this.board.position(state.G.board);
  }
}
function SplashScreen(rootElement) {
  return new Promise((resolve) => {
    const createButton = (playerID) => {
      const button = document.createElement('button');
      button.textContent = 'Player ' + playerID;
      button.onclick = () => resolve(playerID);
      rootElement.append(button);
    };
    rootElement.innerHTML = ` <p>Play as</p>`;
    const playerIDs = ['0', '1'];
    playerIDs.forEach(createButton);
  });
}
class App {
  constructor(rootElement) {
    this.client = SplashScreen(rootElement).then((playerID) => {
      return new TicTacToeClient(rootElement, { playerID });
    });
  }
}
//todo: replace splash screen with Lobby
const appElement = document.getElementById('app');
new App(appElement);