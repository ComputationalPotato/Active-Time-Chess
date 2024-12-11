import { createAccount } from "./accounts.js";

export async function handleSignup(event: Event) {
    event.preventDefault();
    
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
    const errorDiv = document.getElementById('error-message') as HTMLDivElement;
    const loadingDiv = document.getElementById('loading') as HTMLDivElement;
    const form = document.getElementById('signupForm') as HTMLFormElement;
    
    // Reset error message
    errorDiv.style.display = 'none';
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    await createAccount(username,password);
}