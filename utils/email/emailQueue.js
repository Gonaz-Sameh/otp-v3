const queue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;
    while (queue.length > 0) {
        const job = queue.shift();
        try {
            await job();
        } catch (e) {
            console.error('Email job failed:', e);
        }
    }
    isProcessing = false;
}

function enqueueEmailJob(job) {
    queue.push(job);
    processQueue();
}

module.exports = enqueueEmailJob; 