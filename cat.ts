import { createReadStream } from "fs";
import { Readable, Writable } from "stream";

async function write(is: Readable, os: Writable) {
    return new Promise((res, rej) => {
        is.on("end", res);
        is.on("error", rej);
        is.pipe(os);
    });
}

async function main(args: string[]) {
    if (args.length === 0) {
        await write(process.stdin, process.stdout);
        return;
    }
    for (const file of args) {
        try {
            const is = createReadStream(file);
            await write(is, process.stdout);
        } catch (err) {
            console.error(`cat: ${err.message}`);
            process.exit(1);
        }
    }
}

(async () => await main(process.argv.slice(2)))();
