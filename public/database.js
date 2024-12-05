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
        console.log("inc wins failed")
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
        console.log("inc losses failed")
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
    if(!userId1||!userId2 ||!elo1 ||!elo2)
    {
        return false;
    }
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
        console.log("sql error")
        throw e;
    } finally {
        client.release();
    }
}

export async function getName(userId) {
    let client = await pool.connect();
    try {
            // Use a parameterized query to fetch wins and losses
            const queryText = 'SELECT username FROM users WHERE userid = $1';
            const res = await client.query(queryText, [userId]);
        
            if (res.rows.length > 0) {
              const  name  = res.rows[0]["username"];
              console.log(`User ${userId} - name: ${name}`);
              return name;
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
export async function getId(username) {
    let client = await pool.connect();
    try {
            // Use a parameterized query to fetch wins and losses
            const queryText = 'SELECT userid FROM users WHERE username = $1';
            const res = await client.query(queryText, [username]);
        
            if (res.rows.length > 0) {
              const  id  = res.rows[0]["userid"];
              /* console.log(res.rows);
              console.log(res.rows[0]);
              console.log(res.rows[0][0]);
              console.log(Object.keys(res.rows[0])); // This will print the actual column names
              console.log(res.rows[0]["userid"]); */
              console.log(`User ${username} - id: ${id}`);
              return id;
            } else {
              console.log(`No user found with name ${username}`);
              return null;
            }
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}
//send friend request. creates friendship object with userId as source and targetId as target
//a user accepts a friend request by sending a request to the requester
export async function sendFreq(userId,targetId) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = 'insert into public.friendship("sourceId","targetId") values($1,$2)';
        const res = await client.query(queryText, [userId,targetId]);
        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        return false;
    } finally {
        client.release();
    }
}

export async function getSentFreqs(userId) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = 'select "targetId" from public.friendship where "sourceId" = $1';
        const res = await client.query(queryText, [userId]);
        await client.query('COMMIT');
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        return null;
    } finally {
        client.release();
    }
}

export async function getIncomingFreqs(userId) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = 'select "sourceId" from public.friendship where "targetId" = $1';
        const res = await client.query(queryText, [userId]);
        await client.query('COMMIT');
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        return null;
    } finally {
        client.release();
    }
}
//get friend requests that have been accepted
export async function getFriends(userId) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = `select u2.userid from public.users u 
inner join public.friendship f on u.userid = f."sourceId" 
inner join public.friendship f2 on f2."sourceId" = f."targetId" and f2."targetId" =f."sourceId"
inner join public.users u2 on u2.userid =f2."sourceId" 
where u.userid=$1`;
        const res = await client.query(queryText, [userId]);
        await client.query('COMMIT');
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        return null;
    } finally {
        client.release();
    }
}

export async function deleteFriend(userId,targetId) {
    let client = await pool.connect();
    try {
        await client.query('BEGIN');
        let queryText = `delete from public.friendship f where f."sourceId" = $1 and f."targetId"=$2`;
        let res = await client.query(queryText, [userId,targetId]);
        queryText = `delete from public.friendship f where f."targetId" = $1 and f."sourceId"=$2`;
        res = await client.query(queryText, [userId,targetId]);

        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        return;
    } finally {
        client.release();
    }
}
