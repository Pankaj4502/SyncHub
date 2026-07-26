const dbService = require('../services/DataServices');
const ActivityLog = require('../models/ActivityLog');

const createTask = async (req, res) => {
  try {
    const { title, project_id, assignee_id } = req.body;

    if (!title || !project_id) {
      return res.status(400).json({ error: 'Title and project_id are required.' });
    }

    const pgPool = dbService.getPgPool();

    // 1. Save the strict, relational data to PostgreSQL
    const sqlQuery = `
      INSERT INTO tasks (title, project_id, assignee_id) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const pgResult = await pgPool.query(sqlQuery, [title, project_id, assignee_id || null]);
    const newTask = pgResult.rows[0];

    // 2. Save the flexible tracking data to MongoDB
    const logEntry = await ActivityLog.create({
      action: 'CREATED_TASK',
      userId: assignee_id || 0, // Using 0 if unassigned for the log
      entityId: newTask.id,
      metadata: {
        taskTitle: newTask.title,
        status: newTask.status,
        note: "Task was created via API"
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Task created and activity logged in MongoDB!',
      data: {
        task: newTask,
        log: logEntry
      }
    });

  } catch (error) {
    console.error(' Error creating task:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

const getAllTasks = async (req, res) => {
    try{
        const pgPool = dbService.getPgPool();
        const sqlQuery = `
            SELECT 
                t.id,
                t.title,
                t.status,
                p.name AS project_name,
                u.name AS assignee_id,
                t.created_at
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.assignee_id = u.id
            ORDER BY t.created_at DESC;

        `

        const pgResult = await pgPool.query(sqlQuery);

        res.status(200).json({
        status: 'success',
        results: pgResult.rowCount,
        data: pgResult.rows
        });

    } catch (error) {
        console.error(' Error fetching tasks:', error);
        res.status(500).json({ status: 'error', error: 'Internal Server Error' });
    }
    };

module.exports = {
  createTask,
  getAllTasks
};