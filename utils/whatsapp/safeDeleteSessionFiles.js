
const fs = require('fs');
// Utility: Safe deletion of session files with retry mechanism
async function safeDeleteSessionFiles(sessionPath) {
    const MAX_RETRIES = 5; // Maximum number of retries
    const RETRY_DELAY_MS = 1000; // Delay between retries (in milliseconds)

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`Deleted session files for path: ${sessionPath}`);
                return; // Exit the loop if deletion succeeds
            } else {
                console.log(`Session path does not exist: ${sessionPath}`);
                return;
            }
        } catch (error) {
            console.error(`Attempt ${attempt}/${MAX_RETRIES}: Error deleting session files:`, error.message);

            if (attempt === MAX_RETRIES) {
                console.error("Max retries reached. Unable to delete session files.");
                throw error; // Rethrow the error after max retries
            }

            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); // Wait before retrying
        }
    }
}
module.exports =safeDeleteSessionFiles;