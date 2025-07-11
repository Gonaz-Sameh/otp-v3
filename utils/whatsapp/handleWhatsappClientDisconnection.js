const Organization = require("../../models/Organization");
const safeDeleteSessionFiles = require("./safeDeleteSessionFiles");
const whatsappClients = require("./whatsappClients");
const path = require('path');
// Utility: Handle bot disconnection and cleanup
async function handleWhatsappClientDisconnection(organizationId, reason) {
    try {
        console.log(`handleWhatsappClientDisconnection - Try to disconnect Organization ID ${organizationId} , because: ${reason}`);

        const organization = await Organization.findById(organizationId);
        if (!organization) {
            console.log(`handleWhatsappClientDisconnection - Organization not found for ID ${organizationId}`);
            return;
        }

        // Step 1: Attempt to log out the client
        try {
            console.log("handleWhatsappClientDisconnection - Attempting to log out...");
            const client = whatsappClients.get(organizationId);
            if (client) {
                await client?.logout(); // Use optional chaining to avoid errors
                await client?.destroy(); // Ensures Chromium is closed
                console.log("Waiting for Chromium to release file locks...");
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                console.log(`handleWhatsappClientDisconnection -Client logged out successfully for Organization ID ${organizationId}`);
            }
        } catch (error) {
            console.log("handleWhatsappClientDisconnection - Error during logout:", error.message);
        }

        // Step 2: Attempt to delete session files
        try {
            const sessionPath = path.join(__dirname, `../../.wwebjs_auth/session-${organizationId}`);
            await safeDeleteSessionFiles(sessionPath);
        } catch (error) {
            console.log("handleWhatsappClientDisconnection - Error deleting session files:", error.message);
        }

        // Step 3: Remove the client instance from memory and update database status
        whatsappClients.delete(organizationId);
        organization.whatsappAuth.clientReady = false;
        await organization.save();

        console.log(`handleWhatsappClientDisconnection - Whatsapp Client for Organization ID ${organizationId} has been disconnected`);
    } catch (error) {
        console.log("Unexpected error in 'disconnected' event:", error.message);
        next(new ApiError("Internal Server Error", 500));
    }
}
module.exports =handleWhatsappClientDisconnection;