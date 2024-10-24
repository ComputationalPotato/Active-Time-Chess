export const TicTacToe = {
    setup: () => ({ cells: Array(9).fill(null) }),
  
    moves: {
      clickCell: ({ G, playerID }, id) => {
        G.cells[id] = playerID;
      },
    },
  };
  