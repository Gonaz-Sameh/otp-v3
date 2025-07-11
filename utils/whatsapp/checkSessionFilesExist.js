const path = require('path');
const fs = require('fs');
// Check if LocalAuth session files exist for a client
function checkSessionFilesExist(clientId) {
    const sessionPath = path.join(__dirname, `../../.wwebjs_auth/session-${clientId}`);
    //const sessionFile = path.join(sessionPath, 'session.json');
    return fs.existsSync(sessionPath);
}
module.exports = checkSessionFilesExist;