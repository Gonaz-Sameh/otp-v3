
//the one whatsapp phone number can use for multi orgs (sure , if auth in multi )
//but the one org , has only one whatsapp phone number - one whatsapp session
// Client Manager - stores clients in memory for persistence
const whatsappClients = new Map();  //js built in obj

module.exports = whatsappClients;