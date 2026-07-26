require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');

class DatabaseService {
    constructor() {
        if(DatabaseService.instance){
            return DatabaseService.instance;
        }

    this.pgPool = null;
    this.mongoConnection = null;

    DatabaseService.instance = this;
    }

    async connectPostgres(){
        try{
            const connectionString = process.env.DATABASE_URL || 'postgresql://synchub_user:password123@localhost:5432/synchub_sql';

            this.pgPool = new Pool({
                connectionString,
                // Cloud databases require SSL. If we are using a cloud string, turn SSL on!
                ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
            });

            await this.pgPool.query('SELECT NOW()');
            console.log("CONNECTED to Postgres");
        } catch(error) {
            console.error('ERROR WHILE CONNECTED', error.message);
            throw error;
        }
    }

    async connectMongo() {
    try {
      // Use the .env variable, or fall back to localhost
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/synchub_nosql';
      
      this.mongoConnection = await mongoose.connect(mongoUri);
      console.log('✅ MongoDB (Atlas) Connected Successfully!');
    } catch (error) {
      console.error('❌ MongoDB Connection Failed:', error.message);
      throw error;
    }
  }


    async connectAll() {
        await Promise.all([
            this.connectPostgres(),
            this.connectMongo()
        ]);
    }

    getPgPool() {
        if(!this.pgPool) throw new Error('PostgreSQL is not connected');
        return this.pgPool;
    }
}

const instance = new DatabaseService();


module.exports = instance;