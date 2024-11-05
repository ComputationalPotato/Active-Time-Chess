import pg from 'pg'
const { Pool } = pg
const pool = new Pool()

const {
    createHash,
} = await import('node:crypto');


//returns true if account was created, false if username already existed, errors if it errors
export async function createAccount(username, password) {
    let client = await pool.connect();
    try {
        let hash = createHash('sha256');
        hash.update(password);
        await client.query('BEGIN')
        queryText = 'SELECT public.createaccount($1,$2)';
        res = await client.query(queryText, [username,hash.digest('hex')]);
        await client.query('COMMIT');
        return res.rows[0][0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

}
//returns user id if login successful, returns false if not
export async function tryLogin(username, password) {
    let client = await pool.connect();
    try {
        let hash = createHash('sha256');
        hash.update(password);
        await client.query('BEGIN')
        queryText = 'SELECT public.trylogin($1,$2)';
        res = await client.query(queryText, [username,hash.digest('hex')]);
        await client.query('COMMIT');
        return res.rows[0][0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

}