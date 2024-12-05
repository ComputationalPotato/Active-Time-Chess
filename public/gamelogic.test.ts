import { Game } from './gamelogic';

describe('Game Class', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  describe('Initial Setup', () => {
    test('should initialize with correct starting position', () => {
      expect(game.position['e1']).toBe('wK');
      expect(game.position['d8']).toBe('bQ');
      expect(game.position['a2']).toBe('wP');
      expect(game.gameEnded).toBe(false);
      expect(game.winner).toBeNull();
    });

    test('should initialize cooldowns map empty', () => {
      expect(game.pieceCooldowns.size).toBe(0);
    });
  });

  describe('Pawn Movement', () => {
    test('white pawn can move one square forward', () => {
      expect(game.isLegalMove('e2', 'e3', 'wP')).toBe(true);
    });

    test('white pawn can move two squares forward from starting position', () => {
      expect(game.isLegalMove('e2', 'e4', 'wP')).toBe(true);
    });

    test('white pawn cannot move backwards', () => {
      game.position['e3'] = 'wP';
      delete game.position['e2'];
      expect(game.isLegalMove('e3', 'e2', 'wP')).toBe(false);
    });

    test('pawn can capture diagonally', () => {
      game.position['e4'] = 'wP';
      game.position['f5'] = 'bP';
      expect(game.isLegalMove('e4', 'f5', 'wP')).toBe(true);
    });

    test('pawn cannot capture forward', () => {
      game.position['e4'] = 'wP';
      game.position['e5'] = 'bP';
      expect(game.isLegalMove('e4', 'e5', 'wP')).toBe(false);
    });
  });

  describe('Knight Movement', () => {
    test('knight can move in L-shape', () => {
      expect(game.isLegalMove('b1', 'c3', 'wN')).toBe(true);
      expect(game.isLegalMove('b1', 'a3', 'wN')).toBe(true);
    });

    test('knight can jump over pieces', () => {
      // Even with pawns in the way, knight should move
      expect(game.isLegalMove('b1', 'c3', 'wN')).toBe(true);
    });
  });

  describe('Bishop Movement', () => {
    test('bishop can move diagonally', () => {
      game.position['c4'] = 'wB';
      delete game.position['c1'];
      expect(game.isLegalMove('c4', 'e6', 'wB')).toBe(true);
    });

    test('bishop cannot move through pieces', () => {
      game.position['c4'] = 'wB';
      game.position['d5'] = 'wP';
      expect(game.isLegalMove('c4', 'e6', 'wB')).toBe(false);
    });
  });

  describe('Rook Movement', () => {
    test('rook can move horizontally and vertically', () => {
      game.position['e4'] = 'wR';
      delete game.position['a1'];
      expect(game.isLegalMove('e4', 'e7', 'wR')).toBe(true);
      expect(game.isLegalMove('e4', 'a4', 'wR')).toBe(true);
    });

    test('rook cannot move through pieces', () => {
      game.position['e4'] = 'wR';
      game.position['e6'] = 'wP';
      expect(game.isLegalMove('e4', 'e8', 'wR')).toBe(false);
    });
  });

  describe('Queen Movement', () => {
    test('queen can move in all directions', () => {
      game.position['d4'] = 'wQ';
      delete game.position['d1'];
      expect(game.isLegalMove('d4', 'd8', 'wQ')).toBe(false);
      expect(game.isLegalMove('d4', 'd7', 'wQ')).toBe(true);

      expect(game.isLegalMove('d4', 'g7', 'wQ')).toBe(true);
      
      expect(game.isLegalMove('d4', 'a4', 'wQ')).toBe(true);
    });
  });

  describe('King Movement', () => {
    test('king can move one square in any direction', () => {
      delete game.position['e2'];
      delete game.position['f2'];
      delete game.position['d2'];


      expect(game.isLegalMove('e1', 'e2', 'wK')).toBe(true);
      expect(game.isLegalMove('e1', 'f2', 'wK')).toBe(true);
      expect(game.isLegalMove('e1', 'd2', 'wK')).toBe(true);

    });

    test('kingside castling when available', () => {
      // Clear pieces between king and rook
      delete game.position['f1'];
      delete game.position['g1'];
      expect(game.isLegalMove('e1', 'g1', 'wK')).toBe(true);
    });

    test('queenside castling when available', () => {
      // Clear pieces between king and rook
      delete game.position['b1'];
      delete game.position['c1'];
      delete game.position['d1'];
      expect(game.isLegalMove('e1', 'c1', 'wK')).toBe(true);
    });

    test('castling not allowed after king has moved', () => {
      delete game.position['f1'];
      delete game.position['g1'];
      game.recordPieceMove('wK', 'e1');
      expect(game.isLegalMove('e1', 'g1', 'wK')).toBe(false);
    });

    test('castling not allowed after rook has moved', () => {
      delete game.position['f1'];
      delete game.position['g1'];
      game.recordPieceMove('wR', 'h1');
      expect(game.isLegalMove('e1', 'g1', 'wK')).toBe(false);
    });
  });

  describe('Piece Capture', () => {
    test('piece can capture opponent piece', () => {
      game.position['e4'] = 'wP';
      game.position['f5'] = 'bP';
      expect(game.isLegalMove('e4', 'f5', 'wP')).toBe(true);
    });

    test('piece cannot capture same color', () => {
      game.position['e4'] = 'wP';
      game.position['f5'] = 'wR';
      expect(game.isLegalMove('e4', 'f5', 'wP')).toBe(false);
    });
  });

  describe('Cooldown System', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('piece should be on cooldown after moving', () => {
      const source = 'e2';
      const target = 'e4';
      game.tryMove(source, target, 'wP');
      expect(game.pieceCooldowns.has(target)).toBe(true);
    });

    test('piece cannot move while on cooldown', () => {
      const source = 'e2';
      const target = 'e4';
      game.tryMove(source, target, 'wP');
      expect(game.isLegalMove(target, 'e5', 'wP')).toBe(false);
    });

    test('piece can move after cooldown expires', () => {
      const source = 'e2';
      const target = 'e4';
      game.tryMove(source, target, 'wP');
      jest.advanceTimersByTime(2001); // Pawn cooldown is 2000ms
      expect(game.isLegalMove(target, 'e5', 'wP')).toBe(true);
    });
  });

  describe('Pawn Promotion', () => {
    test('white pawn should promote to queen when reaching 8th rank', () => {
      game.position['e7'] = 'wP';
      delete game.position['e2'];
      expect(game.tryMove('e7', 'd8', 'wP')).toBe(true);
      expect(game.position['d8']).toBe('wQ');
    });

    test('black pawn should promote to queen when reaching 1st rank', () => {
      game.position['e2'] = 'bP';
      delete game.position['e7'];
      game.tryMove('e2', 'd1', 'bP');
      expect(game.position['d1']).toBe('bQ');
    });
  });

  describe('Game Ending', () => {
    test('game should end when white king is captured', () => {
      game.position['e4'] = 'bP';
      game.position['f5'] = 'wK';
      // console.log("trying move");
      expect(game.tryMove('e4', 'f5', 'bP')).toBe(true);
      expect(game.winner).toBe('Black');
      //expect(game.gameEnded).toBe(true);
    });

    test('game should end when black king is captured', () => {
      game.position['e4'] = 'wP';
      game.position['f5'] = 'bK';
      game.tryMove('e4', 'f5', 'wP');
      expect(game.winner).toBe('White');
      //expect(game.gameEnded).toBe(true);
    });

    test('no moves should be allowed after game ends', () => {
      game.gameEnded = true;
      expect(game.isLegalMove('e2', 'e4', 'wP')).toBe(false);
    });
  });
});