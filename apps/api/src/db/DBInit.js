const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dbService = require('../services/DataServices');

async function initializeDatabase() {
    try{
        const pgPool = dbService.getPgPool();

        const schemaPath = path.join(__dirname,'PostgresSchema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running postgres sql initialization');

        await pgPool.query(schemaSql);
    } catch (error) {
        console.error("Failed to initialize schema", error);
        throw error;
    }
}

module.exports = initializeDatabase;