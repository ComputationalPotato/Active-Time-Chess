//import './accounts.js';

// Check if user is logged in
const userId = sessionStorage.getItem('userId');
if (!userId) {
    window.location.href = 'index.html';
}
async function sendFreqButton() {
    const targetName = document.getElementById("sendFreqName").value;
    const targetId = await getId(targetName);
    const userId = sessionStorage.getItem('userId');
    await sendFreq(userId, targetId);
}
async function handleXInc(row) {
    const targetId = row.sourceId;//incoming means that row.targetId is you.
    const userId = sessionStorage.getItem('userId');
    await deleteFriend(userId, targetId);
}
async function handleXPend(row) {
    const targetId = row.targetId;
    const userId = sessionStorage.getItem('userId');
    await deleteFriend(userId, targetId);
}
async function handleYes(row) {
    const targetId = row.sourceId;//incoming means that row.targetId is you.
    const userId = sessionStorage.getItem('userId');
    await sendFreq(userId, targetId);
}
async function getPend() {
    const userId = sessionStorage.getItem('userId');
    const data = await getSentFreqs(userId);
    const outputDiv = document.getElementById("pending");
    outputDiv.innerHTML = ""; // Clear previous results
    // Dynamically create and append rows for each result
    data.forEach(async row => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        // Display the row's content (customize as needed)
        const content = document.createElement("span");
        content.textContent = JSON.stringify(row);


        // Create the X button
        const xButton = document.createElement("button");
        xButton.textContent = "✖";
        xButton.style.marginLeft = "5px";
        xButton.onclick = async () => await handleXPend(row);

        // Append content and buttons to the row
        rowDiv.appendChild(content);
        rowDiv.appendChild(xButton);

        // Append the row to the output div
        outputDiv.appendChild(rowDiv);
    });
}
async function getInc() {
    const userId = sessionStorage.getItem('userId');
    const data = await getIncomingFreqs(userId);
    const outputDiv = document.getElementById("incoming");
    outputDiv.innerHTML = ""; // Clear previous results
    // Dynamically create and append rows for each result
    data.forEach(async row => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        // Display the row's content (customize as needed)
        const content = document.createElement("span");
        content.textContent = JSON.stringify(row);

        // Create the checkmark button
        const checkButton = document.createElement("button");
        checkButton.textContent = "✔";
        checkButton.style.marginLeft = "10px";
        checkButton.onclick = async () => await handleYes(row);

        // Create the X button
        const xButton = document.createElement("button");
        xButton.textContent = "✖";
        xButton.style.marginLeft = "5px";
        xButton.onclick = async () => await handleXInc(row);

        // Append content and buttons to the row
        rowDiv.appendChild(content);
        rowDiv.appendChild(checkButton);
        rowDiv.appendChild(xButton);

        // Append the row to the output div
        outputDiv.appendChild(rowDiv);
    });
}

async function getFriend() {
    const userId = sessionStorage.getItem('userId');
    const data = await getFriends(userId);
    const outputDiv = document.getElementById("friendsList");
    outputDiv.innerHTML = ""; // Clear previous results
    // Dynamically create and append rows for each result
    data.forEach(async row => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        // Display the row's content (customize as needed)
        const content = document.createElement("span");
        content.textContent = JSON.stringify(row);


        // Create the X button
        const xButton = document.createElement("button");
        xButton.textContent = "✖";
        xButton.style.marginLeft = "5px";
        xButton.onclick = async () => await handleXPend(row);

        // Append content and buttons to the row
        rowDiv.appendChild(content);
        rowDiv.appendChild(xButton);

        // Append the row to the output div
        outputDiv.appendChild(rowDiv);
    });
}
// Update user stats
async function updateStats() {
    try {
        const stats = await getWinLoss(userId);
        if (stats) {
            document.getElementById('winLossStats').textContent =
                `Wins: ${stats.wins} | Losses: ${stats.losses}`;

            // Calculate win rate
            const totalGames = stats.wins + stats.losses;
            const winRate = totalGames > 0
                ? ((stats.wins / totalGames) * 100).toFixed(1)
                : 0;

            document.getElementById('winLossStats').textContent +=
                ` | Win Rate: ${winRate}%`;
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}


// Initialize page
async function initializePage() {
    console.log("page init start")
    // Get username from sessionStorage if you stored it during login
    const username = sessionStorage.getItem('username') || 'User';
    document.getElementById('username').textContent = username;
    
// Sign out handler
document.getElementById('signOutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('userId');
    window.location.href = 'index.html';
});
    // Update stats
    await updateStats();
    //do the friend list stuff
    await getFriend();
    }

// Load user data when page loads
window.addEventListener('load', initializePage);