import { Client } from 'boardgame.io/client';
import { ChessGame } from './Game';
import $ from 'jquery'
import ChessBoard from 'chessboardjs'
import { INVALID_MOVE } from 'boardgame.io/core';

class TicTacToeClient {
  constructor(rootElement) {
    this.client = Client({ game: ChessGame });
    this.client.start();
    this.rootElement = rootElement;
    this.createBoard();
    this.client.subscribe(state => this.update(state));

    //this.attachListeners();
  }

  createBoard() {
    // Create cells in rows for the Tic-Tac-Toe board.
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
      onDragStart: function (source, piece, position, orientation) {
        return true;
      },
      onMoveEnd:  (oldPos, newPos)=> {
        this.board.position(this.client.getState().G.board,false);
      }
    }


    // Add the HTML to our app <div>.
    // We’ll use the empty <p> to display the game winner later.
    /* this.rootElement.innerHTML = `
      <div id="myBoard" style="width: 400px"></div>
    `; */
    this.board = new ChessBoard("myBoard", config)
  }
  update(state) {
    this.board.position(state.G.board);
  }
  /* attachListeners() {
     // This event handler will read the cell id from a cell’s
     // `data-id` attribute and make the `clickCell` move.
     const handleCellClick = event => {
       const id = parseInt(event.target.dataset.id);
       this.client.moves.clickCell(id);
     };
     // Attach the event listener to each of the board cells.
     const cells = this.rootElement.querySelectorAll('.cell');
     cells.forEach(cell => {
       cell.onclick = handleCellClick;
     });
   }*/
}

const appElement = document.getElementById('app');
const app = new TicTacToeClient(appElement);
