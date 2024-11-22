import pg from 'pg';
import { createHash } from 'crypto';


const { Pool } = pg;
const pool = new Pool({
    // comment out so it uses unix sockets 
    host: 'localhost',  // Or your PostgreSQL server's address
    user: 'a',
    password: 'a',
    database: 'atchess',  // Replace with your database name
    // Leave out user and password to use peer authentication
});


// Authentication functions
export async function createAccount(username, password) {
    let client = await pool.connect();
    try {
        const hash = createHash('sha256');
        hash.update(password);
        await client.query('BEGIN');
        const queryText = 'SELECT public.createaccount($1,$2)';
        const res = await client.query(queryText, [username, hash.digest('hex')]);
        await client.query('COMMIT');
        return res.rows[0].createaccount;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function tryLogin(username, password) {
    let client = await pool.connect();
    try {
        const hash = createHash('sha256');
        hash.update(password);
        await client.query('BEGIN');
        const queryText = 'SELECT public.trylogin($1,$2)';
        const res = await client.query(queryText, [username, hash.digest('hex')]);
        await client.query('COMMIT');
        return res.rows[0].trylogin;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function incWins(userid) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = 'UPDATE users SET wins = wins + 1 WHERE userid = $1';
        const res = await client.query(queryText, [userid]);
        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
export async function setELO(userid,num) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = 'UPDATE users SET wins = $1 WHERE userid = $2';
        const res = await client.query(queryText, [num,userid]);
        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function incLosses(userid) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = 'UPDATE users SET losses = losses + 1 WHERE userid = $1';
        const res = await client.query(queryText, [userid]);
        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function getWinLoss(userId) {
    let client = await pool.connect();
    try {
            // Use a parameterized query to fetch wins and losses
            const queryText = 'SELECT wins, losses FROM users WHERE userid = $1';
            const res = await client.query(queryText, [userId]);
        
            if (res.rows.length > 0) {
              const { wins, losses } = res.rows[0];
              console.log(`User ${userId} - Wins: ${wins}, Losses: ${losses}`);
              return { wins, losses };
            } else {
              console.log(`No user found with ID ${userId}`);
              return null;
            }
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}

export async function getELO(userId) {
    let client = await pool.connect();
    try {
            // Use a parameterized query to fetch wins and losses
            const queryText = 'SELECT elo FROM users WHERE userid = $1';
            const res = await client.query(queryText, [userId]);
        
            if (res.rows.length > 0) {
              const { elo } = res.rows[0];
              console.log(`User ${userId} - ELO: ${elo}`);
              return elo;
            } else {
              console.log(`No user found with ID ${userId}`);
              return null;
            }
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}

export async function updateELO(userId1,elo1,userId2,elo2) {
    let client = await pool.connect();
    try {
            // Use a parameterized query to fetch wins and losses
            await client.query('BEGIN');
            const queryText1 = 'UPDATE users SET elo = $1 WHERE userid = $2';
            const res1 = await client.query(queryText1, [elo1,userId1]);
            const queryText2 = 'UPDATE users SET elo = $1 WHERE userid = $2';
            const res2 = await client.query(queryText2, [elo2,userId2]);
            
            await client.query('COMMIT');
            return true;
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}