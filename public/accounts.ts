// accounts.js
export async function trylogin(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Store user info in session/localStorage if needed
            sessionStorage.setItem('userId', data.userId);
            //caller handles the redirect
            //// Redirect to game page or dashboard
            //window.location.href = '/accounts.html';
            return true;
        } else {
            //login page has this already
            //alert('Invalid username or password');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

export async function createAccount(username, password) {
    try {
        const response = await fetch('/api/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        
        if (data.success) {
            //// Store user info in session/localStorage if needed
            //localStorage.setItem('userId', data.userId);
            // Redirect to game page or dashboard
            window.location.href = '/index.html';
        } else {
            alert('something went wrong with account creation');
        }
    } catch (error) {
        console.error('account creation error:', error);
        alert('An error occurred during account creation');
    }
}

async function incWins(userId) {
    try {
        const response = await fetch('/api/incWins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Store user info in session/localStorage if needed
            //localStorage.setItem('userId', data.userId);
            // Redirect to game page or dashboard
            //window.location.href = '/index.html';
        } else {
            alert('something went wrong with inc win');
        }
    } catch (error) {
        console.error('inc win error:', error);
        alert('An error occurred during inc win');
    }
}

async function incLosses(userId) {
    try {
        const response = await fetch('/api/incLosses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Store user info in session/localStorage if needed
            //localStorage.setItem('userId', data.userId);
            // Redirect to game page or dashboard
            //window.location.href = '/index.html';
        } else {
            alert('something went wrong with inc loss');
        }
    } catch (error) {
        console.error('inc loss error:', error);
        alert('An error occurred during inc loss');
    }
}

export async function getWinLoss(userId) {
    try {
        const response = await fetch('/api/getWinLoss', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json();
        
        return {wins:data.wins,losses:data.losses};
    } catch (error) {
        console.error('get win loss error:', error);
        alert('An error occurred during get win loss');
    }
}

export async function sendFreq(userId: string,targetId: string): Promise<void> {
    try {
        const response = await fetch('/api/sendFreq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                targetId:targetId
            })
        });

        const data = await response.json() as {success:boolean};
        
        if (data.success) {
            // Store user info in session/localStorage if needed
            //localStorage.setItem('userId', data.userId);
            // Redirect to game page or dashboard
            //window.location.href = '/index.html';
        } else {
            alert('something went wrong with sendFreq');
        }
    } catch (error) {
        console.error('sendFreq error:', error);
        alert('An error occurred during sendFreq');
    }
}

export async function getSentFreqs(userId: string): Promise<{targetId:string}[]> {
    try {
        const response = await fetch('/api/getSentFreqs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json() as {freqs:{targetId:string}[]};
        
        return data.freqs;
    } catch (error) {
        console.error('getSentFreqs error:', error);
        alert('An error occurred during getSentFreqs');
    }
}
export async function getIncomingFreqs(userId: string): Promise<{ sourceId: string; }[]> {
    try {
        const response = await fetch('/api/getIncomingFreqs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json() as {freqs:{sourceId:string}[]};
        
        return data.freqs;
    } catch (error) {
        console.error('getIncomingFreqs error:', error);
        alert('An error occurred during getIncomingFreqs');
    }
}
export async function getFriends(userId: string): Promise<{ userid: string; }[]> {
    try {
        const response = await fetch('/api/getFriends', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json() as {freqs:{userid:string}[]};
        
        return data.freqs;
    } catch (error) {
        console.error('getFriends error:', error);
        alert('An error occurred during getFriends');
    }
}
export async function deleteFriend(userId: string,targetId: string): Promise<void> {
    try {
        const response = await fetch('/api/deleteFriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                targetId:targetId
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Store user info in session/localStorage if needed
            //localStorage.setItem('userId', data.userId);
            // Redirect to game page or dashboard
            //window.location.href = '/index.html';
        } else {
            alert('something went wrong with deleteFriend');
        }
    } catch (error) {
        console.error('deleteFriend error:', error);
        alert('An error occurred during deleteFriend');
    }
}
export async function getId(username: string): Promise<string> {
    try {
        const response = await fetch('/api/getId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username
            })
        });

        const data = await response.json() as {id:string};
        
        return data.id;
    } catch (error) {
        console.error('getId error:', error);
        alert('An error occurred during getId');
    }
}

export async function getELO(userId: string): Promise<number> {
    try {
        const response = await fetch('/api/getELO', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json() as {elo:number};
        //console.log(data);
        return data.elo;
    } catch (error) {
        console.error('get elo error:', error);
        alert('An error occurred during get elo');
    }
}
export async function getName(userId: string): Promise<string> {
    try {
        const response = await fetch('/api/getName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json() as {name:string};
        
        return data.name;
    } catch (error) {
        console.error('get name error:', error);
        alert('An error occurred during get name');
    }
}