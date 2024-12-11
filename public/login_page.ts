import { trylogin } from "./accounts.js";

export async function handleLogin(event: Event) {
    event.preventDefault();
    
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const errorDiv = document.getElementById('error-message') as HTMLDivElement;
    const loadingDiv = document.getElementById('loading') as HTMLDivElement;
    const form = document.getElementById('loginForm') as HTMLFormElement;
    
    // Reset error message
    errorDiv.style.display = 'none';
    
    // Show loading indicator
    loadingDiv.style.display = 'block';
    form.querySelectorAll('button').forEach(btn => btn.disabled = true);
    
    try {
        const result = await trylogin(username, password);
        //if login worked the go to account page
        if (result) {
            window.location.href = '/account.html';
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
        form.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }
}