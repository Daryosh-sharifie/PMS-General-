const app= require('./app');





const PORT= process.env.PORT || 4000;
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket');

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const allowedSocketOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https:\/\/.*\.devtunnels\.ms$/,
    /^https:\/\/.*\.ngrok-free\.app$/,
    /^https:\/\/.*\.loca\.lt$/,
];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowed = allowedSocketOrigins.some((entry) =>
                entry instanceof RegExp ? entry.test(origin) : entry === origin
            );
            if (allowed) return callback(null, true);
            return callback(null, false);
        },
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
