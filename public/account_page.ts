import { getId, sendFreq, deleteFriend, getSentFreqs, getELO, getName, getIncomingFreqs, getFriends, getWinLoss } from './accounts.js';

// Check if user is logged in
const userId = sessionStorage.getItem('userId');
if (!userId) {
    window.location.href = 'index.html';
}
async function sendFreqButton(): Promise<void> {
    const targetName = (document.getElementById("sendFreqName")as HTMLInputElement).value;
    const targetId = await getId(targetName);
    const userId = sessionStorage.getItem('userId');
    await sendFreq(userId, targetId);
    await updateFriendStuff();

}
//when pressing the x button on an incoming friend request
async function handleXInc(row: { sourceId: string; }): Promise<void> {
    const targetId = row.sourceId;//incoming means that row.targetId is you.
    const userId = sessionStorage.getItem('userId');
    await deleteFriend(userId, targetId);
    await updateFriendStuff();
}
//when pressing the x button on an outgoing friend request
async function handleXPend(row: { targetId: string; }): Promise<void> {
    const targetId = row.targetId;
    const userId = sessionStorage.getItem('userId');
    await deleteFriend(userId, targetId);
    await updateFriendStuff();
}
//when pressing the check button on an incoming friend request
async function handleYes(row: { sourceId: string; }): Promise<void> {
    const targetId = row.sourceId;//incoming means that row.targetId is you.
    const userId = sessionStorage.getItem('userId');
    await sendFreq(userId, targetId);
    await updateFriendStuff();
}
//loads user's outgoing friend requests
async function getPend(): Promise<void> {
    const userId = sessionStorage.getItem('userId');
    const data = await getSentFreqs(userId);
    const outputDiv = document.getElementById("pending");
    outputDiv.innerHTML = ""; // Clear previous results
    // Dynamically create and append rows for each result
    data.forEach(async (row): Promise<void> => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        // Display the row's content (customize as needed)
        const content = document.createElement("span");
        const frid=row.targetId;
        const frelo=await getELO(frid);
        content.textContent = `${await getName(frid)}    ELO:${frelo}`;


        // Create the X button
        const xButton = document.createElement("button");
        xButton.textContent = "✖";
        xButton.style.marginLeft = "5px";
        xButton.onclick = async (): Promise<void> => {
            return await handleXPend(row);
        };

        // Append content and buttons to the row
        rowDiv.appendChild(content);
        rowDiv.appendChild(xButton);

        // Append the row to the output div
        outputDiv.appendChild(rowDiv);
    });
}
//loads user's incoming friend requests
async function getInc(): Promise<void> {
    const userId = sessionStorage.getItem('userId');
    const data = await getIncomingFreqs(userId);
    const outputDiv = document.getElementById("incoming");
    outputDiv.innerHTML = ""; // Clear previous results
    // Dynamically create and append rows for each result
    data.forEach(async (row): Promise<void> => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        // Display the row's content (customize as needed)
        const content = document.createElement("span");
        const frid=row.sourceId;
        const frelo=await getELO(frid);
        content.textContent = `${await getName(frid)}    ELO:${frelo}`;

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
//loads user's friends
async function getFriend(): Promise<void> {
    const userId = sessionStorage.getItem('userId');
    const data = await getFriends(userId);
    const outputDiv = document.getElementById("friendsList");
    outputDiv.innerHTML = ""; // Clear previous results
    // Dynamically create and append rows for each result
    data.forEach(async (row): Promise<void> => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        // Display the row's content (customize as needed)
        const content = document.createElement("span");
        const frid=row.userid;
        const frelo=await getELO(frid);
        content.textContent = `${await getName(frid)}    ELO:${frelo}`;


        // Create the X button
        const xButton = document.createElement("button");
        xButton.textContent = "✖";
        xButton.style.marginLeft = "5px";
        xButton.onclick = async () => await handleXPend({targetId:frid});

        // Append content and buttons to the row
        rowDiv.appendChild(content);
        rowDiv.appendChild(xButton);

        // Append the row to the output div
        outputDiv.appendChild(rowDiv);
    });
}
// Update user stats
async function updateStats(): Promise<void> {
    try {
        const stats = await getWinLoss(userId);
        const elo = await getELO(userId);
        if (stats) {
            document.getElementById('winLossStats').textContent =
                `Wins: ${stats.wins} | Losses: ${stats.losses}`;

            // Calculate win rate
            const totalGames = Number(stats.wins) + Number(stats.losses);
            const winRate = totalGames > 0
                ? ((stats.wins / totalGames) * 100).toFixed(1)
                : 0;

            document.getElementById('winLossStats').textContent +=
                ` | Win Rate: ${winRate}%`;
        }
        if (elo) {
            document.getElementById('playerElo').textContent =
                `ELO: ${elo}`;
        } else {
            document.getElementById('playerElo').textContent =
                `ELO: ${0}`;
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function updateFriendStuff(): Promise<void> {
    await getFriend();
    await getPend();
    await getInc();
}

// Initialize page
async function initializePage(): Promise<void> {
    console.log("page init start");
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
    await updateFriendStuff();
}

// Load user data when page loads
window.addEventListener('load', initializePage);