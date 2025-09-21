// Mock database connection
// In a real application, you would connect to MongoDB, PostgreSQL, etc.

class MockDatabase {
  constructor() {
    this.connected = false;
  }

  async connect() {
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.connected = true;
    console.log('Mock database connected');
    return this;
  }

  async disconnect() {
    this.connected = false;
    console.log('Mock database disconnected');
  }

  isConnected() {
    return this.connected;
  }
}

const db = new MockDatabase();

module.exports = db;
