import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { tryLogin, createAccount, incWins, incLosses, getWinLoss, getName,getId,getELO, updateELO,sendFreq,getSentFreqs,getIncomingFreqs,getFriends,deleteFriend } from './public/database.js'

import { Game } from "./public/gamelogic.js"
import Elo from 'arpad';

const elo = new Elo();
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
const matches = new Map<string, Match>();
const playerMatches = new Map();

// Constants
const COOLDOWN_TIME = 3000; // 3 seconds to match client // 3 seconds to match client

class Match {
    game: Game;
    id: string;
    userIds: Map<string, string>;
    players: string[];
    spectators: Set<string>;
    ranked: boolean;
    constructor(id: string, ranked = false) {
        this.id = id;
        this.players = [];
        this.userIds = new Map();
        this.game = new Game();
        this.spectators = new Set();
        this.ranked = ranked;
    }

    addPlayer(socketId: string, userId: string) {
        if (this.players.length >= 2) return false;
        this.players.push(socketId);
        this.userIds.set(socketId, userId)
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
    //these are done in the Game() obj
    /* isPieceOnCooldown(square) {
        if (!this.pieceCooldowns.has(square)) return false;
        return Date.now() < this.pieceCooldowns.get(square);
    }

    setCooldown(square) {
        this.pieceCooldowns.set(square, Date.now() + COOLDOWN_TIME);
    } */
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('lfg', async (ranked, userId, callback) => {
        console.log("got lfg");
        for (let [id, g] of matches.entries()) {
            console.log(g)
            console.log(g.players.length)
            if (g.players.length < 2 && g.game.winner == null) {
                if (g.ranked != ranked || (ranked && Math.abs(await getELO(g.userIds.get(g.players[0])) - await getELO(userId)) > 100)) {
                    continue;
                }
                console.log('found open game');
                callback({ gameId: id });
                return;
            }
        }
        console.log("sent back new game");
        //console.log(callback)
        callback({ gameId: Math.random().toString(36).substring(7) });
    });

    socket.on('joinGame', (gameId, userId, ranked) => {
        // Create or join game
        if (!matches.has(gameId)) {
            matches.set(gameId, new Match(gameId, ranked));
        }

        const match = matches.get(gameId);
        if (!match) {
            throw "created game vanished";
        }
        const joined = match.addPlayer(socket.id, userId);

        if (joined) {
            playerMatches.set(socket.id, gameId);
            socket.join(gameId);

            const color = match.getPlayerColor(socket.id);
            //TODO make it send more. like full game i guess. do it for all of them
            socket.emit('gameJoined', {
                color,
                position: match.game.position,
                cooldowns: Array.from(match.game.pieceCooldowns.entries())
            });

            // Start game if we have two players
            if (match.players.length === 2) {
                io.to(gameId).emit('gameStart', {
                    position: match.game.position,
                    cooldowns: Array.from(match.game.pieceCooldowns.entries())
                });
            }
        } else {
            // Handle spectator
            match.addSpectator(socket.id);
            socket.join(gameId);
            socket.emit('spectatorJoined', {
                position: match.game.position,
                cooldowns: Array.from(match.game.pieceCooldowns.entries())
            });
        }
    });

    socket.on('requestDraw', () => {
        const gameId = playerMatches.get(socket.id);
        if (!gameId) return;

        const match = matches.get(gameId);
        if (!match) return;

        // Find the opponent's socket
        const opponentSocketId = match.players.find(id => id !== socket.id);
        if (opponentSocketId) {
            io.to(opponentSocketId).emit('drawRequest');
        }
    });

    socket.on('acceptDraw', () => {
        const gameId = playerMatches.get(socket.id);
        if (!gameId) return;
        console.log('Both players accepted the draw. Emitting drawAccepted event.');
        io.to(gameId).emit('drawAccepted');
    });

    socket.on('declineDraw', () => {
        const gameId = playerMatches.get(socket.id);
        if (!gameId) return;
        console.log('Draw Declined.');
        io.to(gameId).emit('drawDeclined');
    });



    socket.on('move', async (data) => {
        const matchId = playerMatches.get(socket.id);
        if (!matchId) return;

        const match = matches.get(matchId);
        if (!match) return;

        const { source, target } = data;

        // Verify it's the player's turn based on piece color
        const piece = match.game.position[source];
        const playerColor = match.getPlayerColor(socket.id);
        const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
        if (playerColor !== pieceColor) {

        }
        else if (!match.game.tryMove(source, target, piece)) {
            console.log('Illegal move attempted');
        }
        //handled in Game()
        /*         // Check cooldown
                if (match.isPieceOnCooldown(source)) return;
        
                // Set cooldown and update position
                match.setCooldown(target);
                match.position = newPosition;
         */
        // Broadcast move to all players and spectators
        io.to(matchId).emit('moveMade', {
            source,
            target,
            piece,
            position: match.game.position,
            winner: match.game.winner,
            cooldowns: Array.from(match.game.pieceCooldowns.entries())
        });
        if (match.game.winner) {
            console.log("game won");
            io.to(matchId).emit('gameOver', { winner: match.game.winner, method: "capture" });
            if (match.ranked) {
                console.log(match.ranked)
                console.log(match.userIds.entries());
                console.log(match.players);
                console.log(`p1 id: ${match.userIds.get(match.players[0])}`)
                console.log(match.userIds.get(match.players[1]))
                if (match.game.winner == "white") {
                    incWins(match.userIds.get(match.players[0]));
                    incLosses(match.userIds.get(match.players[1]));
                }
                else {
                    incLosses(match.userIds.get(match.players[0]));
                    incWins(match.userIds.get(match.players[1]));
                }
                let [p1elo, p2elo] = eloCalc(await getELO(match.userIds.get(match.players[0])), await getELO(match.userIds.get(match.players[1])), match.game.winner == "white");
                updateELO(match.userIds.get(match.players[0]), p1elo, match.userIds.get(match.players[1]), p2elo);
            }
        }
    });

    socket.on('resetBoard', () => {
        const matchId = playerMatches.get(socket.id);
        if (!matchId) return;

        const match = matches.get(matchId);
        if (!match) return;

        match.game.position = {...Game.startPos};
        match.game.pieceCooldowns.clear();
        io.to(matchId).emit('boardReset', { position: {...Game.startPos} });
    });

    socket.on('clearBoard', () => {
        const matchId = playerMatches.get(socket.id);
        if (!matchId) return;

        const match = matches.get(matchId);
        if (!match) return;

        match.game.position = {};
        match.game.pieceCooldowns.clear();
        io.to(matchId).emit('boardCleared');
    });

    socket.on('resign', () => {
        const matchId = playerMatches.get(socket.id);
        if (!matchId) return;

        const match = matches.get(matchId);
        if (!match) return;

        const playerColor = match.getPlayerColor(socket.id);
        const winner = playerColor === 'white' ? 'Black' : 'White';
        match.game.winner = winner;
        // Emit a game over event to declare the winner
        io.to(matchId).emit('gameOver', { winner: winner, method: "resign" });
    });




    socket.on('disconnect', () => {
        const gameId = playerMatches.get(socket.id);
        if (gameId) {
            const game = matches.get(gameId);
            if (game) {
                game.removePlayer(socket.id);
                game.removeSpectator(socket.id);

                // Notify other players
                io.to(gameId).emit('playerDisconnected', {
                    remainingPlayers: game.players.length
                });

                // Clean up empty games
                if (game.players.length === 0 && game.spectators.size === 0) {
                    matches.delete(gameId);
                }
            }
            playerMatches.delete(socket.id);
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
        const { wins, losses } = (await getWinLoss(userId)) || { wins: -1, losses: -1 };
        if (wins < 0 || losses < 0) {
            throw "getWinLoss returned null";
        }

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
app.post('/api/sendFreq', async (req, res) => {
    try {
        const { userId, targetId } = req.body;
        const success= await sendFreq(userId,targetId);

        res.json({
            success:success
        });
    } catch (error) {
        console.error('sendFreq error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});
app.post('/api/getSentFreqs', async (req, res) => {
    try {
        const { userId } = req.body;
        const result= await getSentFreqs(userId);

        res.json({
            freqs:result
        });
    } catch (error) {
        console.error('getSentFreqs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});
app.post('/api/getIncomingFreqs', async (req, res) => {
    try {
        const { userId } = req.body;
        const result= await getIncomingFreqs(userId);

        res.json({
            freqs:result
        });
    } catch (error) {
        console.error('getIncomingFreqs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});
app.post('/api/getFriends', async (req, res) => {
    try {
        const { userId } = req.body;
        const result= await getFriends(userId);

        res.json({
            freqs:result
        });
    } catch (error) {
        console.error('getFriends error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});
app.post('/api/deleteFriend', async (req, res) => {
    try {
        const { userId, targetId } = req.body;
        const success= await deleteFriend(userId,targetId);

        res.json({
            success:success
        });
    } catch (error) {
        console.error('deleteFriend error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});
app.post('/api/getId', async (req, res) => {
    try {
        const { username } = req.body;
        const result= await getId(username);

        res.json({
            id:result
        });
    } catch (error) {
        console.error('getId error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

app.post('/api/getELO', async (req, res) => {
    try {
        const { userId } = req.body;
        const result= await getELO(userId);

        res.json({
            elo:result
        });
    } catch (error) {
        console.error('getELO error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

app.post('/api/getName', async (req, res) => {
    try {
        const { userId } = req.body;
        const result= await getName(userId);

        res.json({
            name:result
        });
    } catch (error) {
        console.error('getName error:', error);
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

//returns [p1newELO,p2newELO]
function eloCalc(p1ELO: number, p2ELO: number, p1won: boolean) {
    if (p1won) {
        return [elo.newRatingIfWon(p1ELO, p2ELO), elo.newRatingIfLost(p2ELO, p1ELO)];
    }
    else {
        return [elo.newRatingIfLost(p1ELO, p2ELO), elo.newRatingIfWon(p2ELO, p1ELO)];
    }
}
