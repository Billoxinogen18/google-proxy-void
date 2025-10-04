import createBareServer from '@tomphttp/bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';
import dotenv from 'dotenv';
dotenv.config();
const bare = createBareServer('/bare/', {
    logErrors: true
});


const serve = new nodeStatic.Server('static/');
const fakeServe = new nodeStatic.Server('BlacklistServe/');

const server = http.createServer();



server.on('request', (request, response) => {
    console.log(`[REQUEST] ${request.method} ${request.url}`);
    
    // Prevent multiple responses
    let responseSent = false;
    
    const originalEnd = response.end;
    response.end = function(...args) {
        if (responseSent) return;
        responseSent = true;
        return originalEnd.apply(this, args);
    };

    const originalWriteHead = response.writeHead;
    response.writeHead = function(...args) {
        if (responseSent) return;
        return originalWriteHead.apply(this, args);
    };

    if (bare.shouldRoute(request)) {
        console.log(`[BARE] Routing to bare server`);
        bare.routeRequest(request, response);
    } else {
        console.log(`[STATIC] Serving static file: ${request.url}`);
        serve.serve(request, response);
    }
});

server.on('upgrade', (req, socket, head) => {
    if (bare.shouldRoute(req)) {
        bare.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});


server.listen(process.env.PORT || 7070);
