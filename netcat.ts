import { createConnection, createServer } from "net";
import { Readable, Writable } from "stream";

async function connect(host: string, port: number, is: Readable, os: Writable) {
    return new Promise((res, rej) => {
        const client = createConnection(port, host);
        client.on("connect", () => is.pipe(client));
        client.on("data", (data) => os.write(data));
        client.on("end", res);
        client.on("error", rej);
    });
}

async function listen(host: string, port: number, os: Writable) {
    await new Promise((res, rej) => {
        const server = createServer();
        server.on("connection", (conn) => {
            conn.pipe(os);
            conn.on("error", (error) => rej(error));
            conn.on("end", () => {
                server.close();
                res(undefined);
            });
        });
        server.listen(port, host);
    });
}

function usage(): void {
    console.error("usage: netcat [-l] hostname port");
    process.exit(1);
}

async function main(args: string[]) {
    if (args[0] === "-l") {
        if (args.length < 3) usage();
        await listen(args[1], parseInt(args[2]), process.stdout);
    } else {
        if (args.length < 2) usage();
        await connect(
            args[0],
            parseInt(args[1]),
            process.stdin,
            process.stdout
        );
    }
}

try {
    (async () => main(process.argv.slice(2)))();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
