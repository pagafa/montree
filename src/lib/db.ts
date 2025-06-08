
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the path for the database file
const dbDir = path.resolve(process.cwd()); // Project root
const dbPath = path.join(dbDir, 'sensor_data.db');

// Ensure the directory exists (though for root, it always will)
// For a subdirectory like 'data', this would be:
// const dbDir = path.resolve(process.cwd(), 'data');
// if (!fs.existsSync(dbDir)) {
//   fs.mkdirSync(dbDir, { recursive: true });
// }

let dbInstance: Database.Database;

try {
  dbInstance = new Database(dbPath, { verbose: console.log }); // Enable verbose logging for development
  console.log(`SQLite database connected at ${dbPath}`);
} catch (error) {
  console.error('Failed to connect to SQLite database:', error);
  // Exit or handle critical failure if DB connection is essential at startup
  process.exit(1); 
}


// Function to initialize the database schema
function initializeDatabase(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      userVisibleId TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      channel INTEGER NOT NULL,
      unit TEXT NOT NULL,
      deviceId TEXT NOT NULL,
      -- For simplicity, we'll store the last known value and timestamp here.
      -- A separate 'readings' table would be better for historical data.
      currentValue REAL, 
      lastTimestamp TEXT, 
      FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE
    );

    -- Example of a readings table for historical data (optional for now)
    /*
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensorId TEXT NOT NULL,
      timestamp TEXT NOT NULL, -- ISO 8601 string
      value REAL NOT NULL,
      FOREIGN KEY (sensorId) REFERENCES sensors(id) ON DELETE CASCADE
    );
    */
  `);
  console.log('Database schema initialized (devices, sensors tables created if not exist).');
}

// Initialize the database schema on first import/run
if (dbInstance) {
  initializeDatabase(dbInstance);
} else {
  console.error("Database instance not available for schema initialization.");
}

export const db = dbInstance;
