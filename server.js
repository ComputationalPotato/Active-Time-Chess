const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path'); 
app.use(express.static('public'));
app.use('/chessboardjs', express.static(path.join(__dirname, 'node_modules', 'chessboardjs', 'www')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Game state storage
const games = new Map();
const playerGames = new Map();

// Constants
const COOLDOWN_TIME = 3000; // 3 seconds to match client

class Game {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.position = 'start';
        this.pieceCooldowns = new Map();
        this.spectators = new Set();
    }

    addPlayer(socketId) {
        if (this.players.length >= 2) return false;
        this.players.push(socketId);
        return true;
    }

    removePlayer(socketId) {
        this.players = this.players.filter(id => id !== socketId);
    }

    addSpectator(socketId) {
        this.spectators.add(socketId);
    }

    removeSpectator(socketId) {
        this.spectators.delete(socketId);
    }

    getPlayerColor(socketId) {
        const index = this.players.indexOf(socketId);
        return index === 0 ? 'white' : index === 1 ? 'black' : null;
    }

    isPieceOnCooldown(square) {
        if (!this.pieceCooldowns.has(square)) return false;
        return Date.now() < this.pieceCooldowns.get(square);
    }

    setCooldown(square) {
        this.pieceCooldowns.set(square, Date.now() + COOLDOWN_TIME);
    }
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', (gameId) => {
        // Create or join game
        if (!games.has(gameId)) {
            games.set(gameId, new Game(gameId));
        }

        const game = games.get(gameId);
        const joined = game.addPlayer(socket.id);

        if (joined) {
            playerGames.set(socket.id, gameId);
            socket.join(gameId);

            const color = game.getPlayerColor(socket.id);
            socket.emit('gameJoined', {
                color,
                position: game.position,
                cooldowns: Array.from(game.pieceCooldowns.entries())
            });

            // Start game if we have two players
            if (game.players.length === 2) {
                io.to(gameId).emit('gameStart', {
                    position: game.position,
                    cooldowns: Array.from(game.pieceCooldowns.entries())
                });
            }
        } else {
            // Handle spectator
            game.addSpectator(socket.id);
            socket.join(gameId);
            socket.emit('spectatorJoined', {
                position: game.position,
                cooldowns: Array.from(game.pieceCooldowns.entries())
            });
        }
    });

    socket.on('move', (data) => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (!game) return;

        const { source, target, piece, newPosition } = data;

        // Verify it's the player's turn based on piece color
        const playerColor = game.getPlayerColor(socket.id);
        const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
        if (playerColor !== pieceColor) return;

        // Check cooldown
        if (game.isPieceOnCooldown(source)) return;

        // Set cooldown and update position
        game.setCooldown(target);
        game.position = newPosition;

        // Broadcast move to all players and spectators
        io.to(gameId).emit('moveMade', {
            source,
            target,
            piece,
            position: newPosition,
            cooldown: {
                square: target,
                time: Date.now() + COOLDOWN_TIME
            }
        });
    });

    socket.on('resetBoard', () => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (!game) return;

        game.position = 'start';
        game.pieceCooldowns.clear();
        io.to(gameId).emit('boardReset', { position: 'start' });
    });

    socket.on('clearBoard', () => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (!game) return;

        game.position = 'empty';
        game.pieceCooldowns.clear();
        io.to(gameId).emit('boardCleared');
    });

    socket.on('disconnect', () => {
        const gameId = playerGames.get(socket.id);
        if (gameId) {
            const game = games.get(gameId);
            if (game) {
                game.removePlayer(socket.id);
                game.removeSpectator(socket.id);

                // Notify other players
                io.to(gameId).emit('playerDisconnected', {
                    remainingPlayers: game.players.length
                });

                // Clean up empty games
                if (game.players.length === 0 && game.spectators.size === 0) {
                    games.delete(gameId);
                }
            }
            playerGames.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});