const showInputsButton = document.getElementById('show-inputs');
const inputContainer = document.getElementById('input-container');

showInputsButton.addEventListener('click', () => {
  // 1. Replace the original button with input boxes and new buttons
  inputContainer.innerHTML = `
    <input type="text" placeholder="Username">
    <input type="password" placeholder="Password">
    <button id="submit-button">Submit</button>
    <button id="cancel-button">Cancel</button>
  `;

  // 2. Hide the original button
  showInputsButton.style.display = 'none';

  // 3. Show the input container
  inputContainer.style.display = 'block';

  // 4. Add event listeners for the new buttons
  const submitButton = document.getElementById('submit-button');
  const cancelButton = document.getElementById('cancel-button');

  submitButton.addEventListener('click', () => {
    // Handle form submission (e.g., send data to server)
    console.log("Submit button clicked!");
  });

  cancelButton.addEventListener('click', () => {
    // Reset the container and show the original button
    inputContainer.innerHTML = '';
    showInputsButton.style.display = 'block';
    showInputsButton.style.margin = '0 auto'; // Center the button

    inputContainer.style.display = 'none';
  });
});
