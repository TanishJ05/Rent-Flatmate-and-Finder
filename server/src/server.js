require('dotenv').config();
const http = require('http');
const { initSockets } = require('./sockets');
const app = require('./app');
const connectDB = require('./config/db');

const server = http.createServer(app);

initSockets(server);

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
