const app= require('./app');





const PORT= process.env.PORT || 4000;
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket');

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
    },
});

// Initialize socket event handlers
initSocket(io);

// Make io available to controllers via req.app.get('io')
app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
