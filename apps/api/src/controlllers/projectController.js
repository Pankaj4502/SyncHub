const dbService = require('../services/DataServices');
const ActivityLog = require('../models/ActivityLog');

const createProject = async (req , res) => {
    try{
    
        const { name, description, owner_id} = req.body;

        if(!name || !owner_id) {
            return res.status(400).json({error: "Project name and owner_id required"});
        }

        const pgPool = dbService.getPgPool();

        const sqlQuery =  `
        INSERT INTO projects (name, description, owner_id) 
        VALUES ($1, $2, $3) 
        RETURNING *;
        `;

        const pgResult = await pgPool.query(sqlQuery, [name, description, owner_id]);
        const newProject = pgResult.rows[0];

        const logEntry = await ActivityLog.create({
            acton: "CREATED_PROJECT",
            userId: owner_id,
            entityId: newProject.id,
        metadata: {
            projectName: newProject.name,
            clientIp: req.ip,
            notes: "Project initialized successfully"
        }
        });

        res.status(201).json({
            status: 'success',
            message: 'Project created and activity logged',
            data: {
                project: newProject,
                log: logEntry
            }
        })}catch(error){
            console.error('error creating Project', error);
            res.status(500).json({status:'error' , error: 'Internal Sever Error'});
        }
};
const getAllProjects = async (req, res) => {
  try {
    const pgPool = dbService.getPgPool();

    // SQL JOIN: We match projects.owner_id to users.id to grab the user's name
    const sqlQuery = `
      SELECT 
        p.id, 
        p.name AS project_name, 
        p.description, 
        p.created_at, 
        u.name AS owner_name 
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC;
    `;
    
    const pgResult = await pgPool.query(sqlQuery);

    res.status(200).json({
      status: 'success',
      results: pgResult.rowCount,
      data: pgResult.rows
    });
  } catch (error) {
    console.error(' Error fetching projects:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const pgPool = dbService.getPgPool();
    
    // RETURNING * lets us see what was deleted so we can log it!
    const sqlQuery = `DELETE FROM projects WHERE id = $1 RETURNING *;`;
    const pgResult = await pgPool.query(sqlQuery, [id]);

    if (pgResult.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deletedProject = pgResult.rows[0];

    // Log the deletion in MongoDB
    await ActivityLog.create({
      action: 'DELETED_PROJECT',
      userId: deletedProject.owner_id || 0,
      entityId: id,
      metadata: { projectName: deletedProject.name }
    });

    res.status(200).json({ status: 'success', message: 'Project and associated tasks deleted.' });
  } catch (error) {
    console.error(' Error deleting project:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  deleteProject
};
