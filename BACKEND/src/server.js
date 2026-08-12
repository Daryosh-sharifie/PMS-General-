const app= require('./app');





const PORT= process.env.PORT || 4000;
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket');

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://192.168.0.195:5173',
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173$/,
        ],
        credentials: true,
    },
});

// Initialize socket event handlers
initSocket(io);

// Make io available to controllers via req.app.get('io')
app.set('io', io);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
