// database.js
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
            localStorage.setItem('userId', data.userId);
            // Redirect to game page or dashboard
            window.location.href = '/public/game.html';
        } else {
            alert('Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}