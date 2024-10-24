import { Client } from 'boardgame.io/client';
import { TicTacToe } from './Game';
import $ from 'jquery'
import ChessBoard from 'chessboardjs'
class TicTacToeClient {
    constructor(rootElement) {
      this.client = Client({ game: TicTacToe });
      this.client.start();
      this.rootElement = rootElement;
      this.createBoard();
      //this.attachListeners();
    }
  
    createBoard() {
      // Create cells in rows for the Tic-Tac-Toe board.
      var config = {
        draggable: true,
        dropOffBoard: 'snapback', // this is the default
        position: 'start'
      }
      
  
      // Add the HTML to our app <div>.
      // We’ll use the empty <p> to display the game winner later.
      /* this.rootElement.innerHTML = `
        <div id="myBoard" style="width: 400px"></div>
      `; */
      this.board=new ChessBoard("myBoard",config)
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
