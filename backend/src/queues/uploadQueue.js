const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const uploadQueue = new Queue('uploadQueue', { connection: redisConnection });
const queueEvents = new QueueEvents('uploadQueue', { connection: redisConnection });

const uploadWorker = new Worker('uploadQueue', async (job) => {
  const { filePath, folder, resourceType } = job.data;
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
    });
    
    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error inside worker:', error);
    throw error;
  }
}, { connection: redisConnection });

uploadWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});

module.exports = {
  uploadQueue,
  queueEvents,
  uploadWorker
};
