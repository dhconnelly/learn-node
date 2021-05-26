import { request, createServer, IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

function handleRequest(
    clientReq: IncomingMessage,
    clientRes: ServerResponse
): void {
    const url = new URL(clientReq.url!);
    const proxyReq = request(
        {
            port: url.port || 80,
            hostname: url.hostname,
            path: url.pathname,
            method: clientReq.method,
            headers: clientReq.headers,
        },
        (proxyRes) => {
            clientRes.writeHead(proxyRes.statusCode!, proxyRes.headers);
            proxyRes.pipe(clientRes, { end: true });
        }
    );
    clientReq.pipe(proxyReq, { end: true });
}

function serve(port: number): void {
    const server = createServer(handleRequest);
    server.listen(port);
    console.log("listening on port", port);
}

function main(args: string[]): void {
    const port = args.length === 1 ? parseInt(args[0]) : 80;
    serve(port);
}

main(process.argv.slice(2));
