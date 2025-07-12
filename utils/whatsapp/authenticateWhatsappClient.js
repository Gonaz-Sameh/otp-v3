const pkg = require('qrcode-terminal');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const Organization = require('../../models/Organization');
const handleWhatsappClientDisconnection = require('./handleWhatsappClientDisconnection');
const whatsappClients = require('./whatsappClients');

async function authenticateWhatsappClient(organizationId) {
    return new Promise(async (resolve, reject) => {
        try {
            const organization = await Organization.findById(organizationId);
            if (!organization) return reject(new Error("Organization Not Found"));
            if (whatsappClients.get(organizationId) || organization.whatsappAuth.clientReady) {
                     await handleWhatsappClientDisconnection(organizationId, "DUPLICATION ENTRY");
             }
          /*  if ( 
                !whatsappClients.has(organizationId) ||
                 !organization.whatsappAuth.clientReady
                ) {*/
                console.log("authenticateWhatsappClient - Creating new session...");
                const client = new Client({
                    authStrategy: new LocalAuth({ clientId: organization._id.toString() }),
                    puppeteer: {
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-accelerated-2d-canvas',
                            '--no-first-run',
                            '--no-zygote',
                            '--disable-gpu',
                            '--disable-background-timer-throttling',
                            '--disable-backgrounding-occluded-windows',
                            '--disable-renderer-backgrounding',
                            '--disable-features=TranslateUI',
                            '--disable-ipc-flooding-protection'
                        ],
                        executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable'
                    }
                });
                whatsappClients.set(organizationId, client);
                organization.whatsappAuth.authStrategy = 'LocalAuth';
                await organization.save();

                // QR Code Event
                client.once('qr', async (qr) => {
                    try {
                       // const qrCodeData = await qrcode.toDataURL(qr);
                        console.log(" authenticateWhatsappClient - generating QR code");
                        pkg.generate(qr, { small: true });
                    } catch (error) {
                        console.log("authenticateWhatsappClient - Error generating QR code:", error.message);
                        reject(error);
                    }
                });

                client.once('authenticated', async (session) => {
                    console.log("authenticateWhatsappClient - authenticated");
                });
                // Authenticated Event
                client.once('ready', async () => {
                    console.log("authenticateWhatsappClient - ready");
                    organization.whatsappAuth.clientReady = true;
                    await organization.save();
                    resolve(true); // Resolve only when authenticated
                });
                // Auth Failure Event (Session Expired)
                client.once('auth_failure', async (msg) => {
                    console.log(`authenticateWhatsappClient - Authentication failed for Organization ID ${organization._id}:`, msg);
                    await handleWhatsappClientDisconnection(organization._id.toString(), msg);
                    // next(new ApiError("Session Expired. Please re-authenticate.", 500));
                    reject(new Error("Session Expired. Please re-authenticate."));
                });

                client.on('disconnected', async (reason) => {
                    console.log("authenticateWhatsappClient - disconnected");
                    await handleWhatsappClientDisconnection(organization._id.toString(), reason);
                    reject(new Error("disconnected"));
                });

                console.log(`authenticateWhatsappClient - Bot for Organization ID: ${organization._id} initialized.`);
                client.initialize();
           /* } else {
                console.log(`authenticateWhatsappClient - Bot for Organization ID: ${organization._id} is already running.`);
                resolve(true);
            }*/

            //    return true;
        } catch (error) {
            console.log("authenticateWhatsappClient - Error during bot authentication:", error.message);
            reject(error);
        }
    });
}
module.exports = authenticateWhatsappClient;