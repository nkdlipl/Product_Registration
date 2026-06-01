const app = require('../app');
const env = require('./config/env');
const { connectRedis } = require('./config/redis');

// Import and start background workers
require('./queues/uploadQueue');

const PORT = env.PORT || 3000;

const startServer = async () => {
  try {
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('--- SERVER STARTUP FAILED ---');
    console.error(error);
  }
};

startServer();

// Triggered restart
