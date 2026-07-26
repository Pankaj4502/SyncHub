const ActivityLog = require('../models/ActivityLog');

const getAllLogs = async (req, res) => {
    try{
        const logs = await ActivityLog.find().sort({ createdAt: -1}).limit(50);
        res.status(200).json({
            status: 'success',
            results: logs.length,
            data: logs
            });
        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ status: 'error', error: 'Internal Server Error' });
        }
};

module.exports = {
  getAllLogs
};