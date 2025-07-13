const Organization = require("../../models/Organization");
const checkSessionFilesExist = require("./checkSessionFilesExist");
const handleWhatsappClientDisconnection = require("./handleWhatsappClientDisconnection");
const whatsappClients = require("./whatsappClients");
const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');

// Auto-recreate clients from session data after server restart
async function initializeWhatsappClientsFromDatabase() {
    try {
        const organizations = await Organization.find({ "whatsappAuth.clientReady": true });
        console.log(`initializeWhatsappClientsFromDatabase - Initializing ${organizations?.length} clients from database session data...`);
        for (const organization of organizations) {
            try {
                const clientId = organization._id.toString();
                if (!checkSessionFilesExist(clientId)) {
                    console.log(`initializeWhatsappClientsFromDatabase - No session files found for organization ${organization.name} (${organization._id}), skipping...`);
                    organization.whatsappAuth.clientReady = false;
                    await organization.save();
                    continue;
                }
                console.log(`initializeWhatsappClientsFromDatabase - Try Recreating client for organization: ${organization.name} (${organization._id})`);
                const client = new Client({
                    authStrategy: new LocalAuth({ clientId: clientId }),
           
                });
                whatsappClients.set(organization._id.toString(), client);

                
                let isReady = false;
                const timeout = setTimeout(async () => {
                    if (!isReady) {
                        console.log(`initializeWhatsappClientsFromDatabase - Timeout: Client for ${organization.name} did not become ready. Cleaning up session.`);
                        // Clean up session files and mark as not ready
                        await handleWhatsappClientDisconnection(organization._id.toString(), "Initialization timeout");
                    }
                }, 45000); //     not now - 60 seconds

                client.once('authenticated', async (session) => {
                    console.log("initializeWhatsappClientsFromDatabase - authenticated");
                });
                client.once('ready', async () => {
                    clearTimeout(timeout);
                    isReady = true;
                    console.log("ready - client restored from session");
                    organization.clientReady = true;
                    await organization.save();
                });

                client.once('auth_failure', async (msg) => {
                    clearTimeout(timeout);
                    isReady = false;
                    console.error(`initializeWhatsappClientsFromDatabase - Authentication failed for Organization ID ${organization._id}:`, msg);
                    await handleWhatsappClientDisconnection(organization._id.toString(), msg);
                });

                client.on('disconnected', async (reason) => {
                    clearTimeout(timeout);
                    isReady = false;
                    console.log("initializeWhatsappClientsFromDatabase - disconnected");
                    await handleWhatsappClientDisconnection(organization._id.toString(), reason);
                });

                client.initialize();
            } catch (error) {
                console.log(`Failed to recreate client for organization ${organization._id}:`, error.message);
                organization.whatsappAuth.clientReady = false;
                await organization.save();
            }
        }
    } catch (error) {
        console.log("Error initializing clients from database:", error);
    }
}

module.exports = initializeWhatsappClientsFromDatabase;