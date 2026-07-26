const express = require('express');
const cors = require('cors');
const dbService = require('./services/DataServices');
const initializeDatabase = require('./db/DBInit');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
// CHANGED: Forcing the backend to use port 5000 so it stops fighting with Next.js
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json()); 

// Mount all routes
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', activityRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const pgPool = dbService.getPgPool();
    const pgResult = await pgPool.query('SELECT 1 + 1 AS solution');
    
    res.status(200).json({
      status: 'success',
      message: 'SyncHub API is running perfectly!',
      databaseStatus: {
        postgres: pgResult.rows[0].solution === 2 ? 'connected' : 'error',
        mongo: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

async function startServer() {
  try {
    await dbService.connectAll();
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 SyncHub API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();