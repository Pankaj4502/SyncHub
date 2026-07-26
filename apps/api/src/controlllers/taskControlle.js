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


const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pgPool = dbService.getPgPool();

    // First get the old task so we can log the change
    const oldTaskRes = await pgPool.query(`SELECT status, title, assignee_id FROM tasks WHERE id = $1`, [id]);
    if (oldTaskRes.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
    const oldTask = oldTaskRes.rows[0];

    // Update to the new status
    const updateQuery = `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *;`;
    const updatedResult = await pgPool.query(updateQuery, [status, id]);

    // Log the change in MongoDB!
    await ActivityLog.create({
      action: 'UPDATED_STATUS',
      userId: oldTask.assignee_id || 0,
      entityId: id,
      metadata: { 
        taskTitle: oldTask.title,
        oldStatus: oldTask.status, 
        newStatus: status 
      }
    });

    res.status(200).json({ status: 'success', data: updatedResult.rows[0] });
  } catch (error) {
    console.error(' Error updating task:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const pgPool = dbService.getPgPool();
    
    const sqlQuery = `DELETE FROM tasks WHERE id = $1 RETURNING *;`;
    const pgResult = await pgPool.query(sqlQuery, [id]);

    if (pgResult.rowCount === 0) return res.status(404).json({ error: 'Task not found' });

    await ActivityLog.create({
      action: 'DELETED_TASK',
      userId: pgResult.rows[0].assignee_id || 0,
      entityId: id,
      metadata: { taskTitle: pgResult.rows[0].title }
    });

    res.status(200).json({ status: 'success', message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  updateTaskStatus,
  deleteTask
};