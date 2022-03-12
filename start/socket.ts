import Ws from 'App/Services/Ws'
import RobotsController from '../app/Controllers/Http/RobotsController'

Ws.boot()
//
///**
// * Listen for incoming socket connections
// */
Ws.io.on('connection', (socket) => {
    socket.on('start:robot', async () => {
        const robot = new RobotsController;
        robot.index(socket);
    });
})
