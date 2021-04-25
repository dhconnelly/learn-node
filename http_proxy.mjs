import http from "node:http";

function handleRequest(clientReq, clientRes) {
    const url = new URL(clientReq.url);
    const proxyReq = http.request(
        {
            port: url.port || 80,
            hostname: url.hostname,
            path: url.pathname,
            method: clientReq.method,
            headers: clientReq.headers,
        },
        (proxyRes) => {
            clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(clientRes, { end: true });
        }
    );
    clientReq.pipe(proxyReq, { end: true });
}

function serve(port) {
    const server = http.createServer(handleRequest);
    server.listen(port);
    console.log("listening on port", port);
}

function main(args) {
    const port = args.length === 1 ? args[0] : 80;
    serve(args[0]);
}

main(process.argv.slice(2));
