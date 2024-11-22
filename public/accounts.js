// accounts.js
async function trylogin(username, password) {
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
            // Redirect to game page or dashboard
            window.location.href = '/main.html';
        } else {
            alert('Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

async function createAccount(username, password) {
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

async function getWinLoss(userId) {
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
