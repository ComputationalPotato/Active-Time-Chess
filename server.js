import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import {tryLogin,createAccount,incWins,incLosses,getWinLoss} from './public/database.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const http = createServer(app);
const io = new Server(http);

// Add body parser middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/chessboardjs', express.static(path.join(__dirname, 'node_modules', 'chessboardjs', 'www')));

// Game state storage
const games = new Map();
const playerGames = new Map();

// Constants
const COOLDOWN_TIME = 3000; // 3 seconds to match client // 3 seconds to match client

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

    socket.on('lfg', (callback) => {
        console.log("got lfg");
        for(let [id,g] of games.entries()) 
        {
            console.log(g)
            console.log(g.players.length)
            if(g.players.length<2)
            {
                console.log('found open game');
                callback({gameId:id});
                return;
            }
        }
        console.log("sent back new game");
        callback({gameId:Math.random().toString(36).substring(7)});
    });

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

    socket.on('requestDraw', () => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;
    
        const game = games.get(gameId);
        if (!game) return;
    
        // Find the opponent's socket
        const opponentSocketId = game.players.find(id => id !== socket.id);
        if (opponentSocketId) {
            io.to(opponentSocketId).emit('drawRequest');
        }
    });
    
    socket.on('acceptDraw', () => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;
        console.log('Both players accepted the draw. Emitting drawAccepted event.');
        io.to(gameId).emit('drawAccepted');
    });
    
    socket.on('declineDraw', () => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;
        console.log('Draw Declined.');
        io.to(gameId).emit('drawDeclined');
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

    socket.on('resign', () => {
        const gameId = playerGames.get(socket.id);
        if (!gameId) return;
    
        const game = games.get(gameId);
        if (!game) return;
    
        const playerColor = game.getPlayerColor(socket.id);
        const winner = playerColor === 'white' ? 'Black' : 'White';
    
        // Emit a game over event to declare the winner
        io.to(gameId).emit('gameOver', { winner });
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




// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userId = await tryLogin(username, password);
        
        if (userId) {
            res.json({
                success: true,
                userId: userId
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

app.post('/api/create-account', async (req, res) => {
    try {
        const { username, password } = req.body;
        const success = await createAccount(username, password);
        
        res.json({
            success: success,
            message: success ? 'Account created successfully' : 'Username already exists'
        });
    } catch (error) {
        console.error('Account creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

app.post('/api/incWins', async (req, res) => {
    try {
        const { userId } = req.body;
        const success = await incWins(userId);
        
        res.json({
            success: success,
            message: success ? 'win inced' : 'win not inced'
        });
    } catch (error) {
        console.error('win count inc error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});
app.post('/api/incLosses', async (req, res) => {
    try {
        const { userId } = req.body;
        const success = await incLosses(userId);
        
        res.json({
            success: success,
            message: success ? 'loss inced' : 'loss not inced'
        });
    } catch (error) {
        console.error('loss count inc error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

app.post('/api/getWinLoss', async (req, res) => {
    try {
        const { userId } = req.body;
        const {wins, losses} = await getWinLoss(userId);
        
        res.json({
            wins: wins,
            losses: losses
        });
    } catch (error) {
        console.error('getwinloss error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
