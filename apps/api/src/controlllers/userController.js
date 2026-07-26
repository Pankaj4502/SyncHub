const dbService = require('../services/DataServices');

const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const pgPool = dbService.getPgPool();

    // Insert the new user into PostgreSQL
    const sqlQuery = `
      INSERT INTO users (name, email, role) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const pgResult = await pgPool.query(sqlQuery, [name, email, role || 'engineer']);
    const newUser = pgResult.rows[0];

    res.status(201).json({
      status: 'success',
      message: 'User created successfully!',
      data: newUser
    });

  } catch (error) {
    if (error.code === '23505') {
        return res.status(400).json({ status: 'error', error: 'Email already exists.' });
    }
    console.error(' Error creating user:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const pgPool = dbService.getPgPool();
    const sqlQuery = 'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC;';
    const pgResult = await pgPool.query(sqlQuery);

    res.status(200).json({
      status: 'success',
      results: pgResult.rowCount,
      data: pgResult.rows
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
};

module.exports = {
  createUser,
  getAllUsers
};