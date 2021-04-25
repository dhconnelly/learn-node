import net from "node:net";

async function connect(host, port, is, os) {
    return new Promise((res, rej) => {
        const client = net.connect(port, host);
        client.on("connect", () => is.pipe(client));
        client.on("data", (data) => os.write(data));
        client.on("end", res);
        client.on("error", rej);
    });
}

async function listen(host, port, os) {
    await new Promise((res, rej) => {
        const server = net.createServer();
        server.on("connection", (conn) => {
            conn.pipe(os);
            conn.on("error", (error) => rej(error));
            conn.on("end", () => {
                server.close();
                res();
            });
        });
        server.listen(port, host);
    });
}

function usage() {
    console.error("usage: netcat [-l] hostname port");
    process.exit(1);
}

async function main(args) {
    if (args[0] === "-l") {
        if (args.length < 3) usage();
        await listen(args[1], args[2], process.stdout);
    } else {
        if (args.length < 2) usage();
        await connect(args[0], args[1], process.stdin, process.stdout);
    }
}

try {
    await main(process.argv.slice(2));
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
