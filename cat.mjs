import fs from "fs";

async function write(is, os) {
    return new Promise((res, rej) => {
        is.on("end", res);
        is.on("error", rej);
        is.pipe(os);
    });
}

async function main(args) {
    if (args.length === 0) {
        await write(process.stdin, process.stdout);
        return;
    }
    for (const file of args) {
        try {
            const is = fs.createReadStream(file);
            await write(is, process.stdout);
        } catch (err) {
            console.error(`cat: ${err.message}`);
            process.exit(1);
        }
    }
}

await main(process.argv.slice(2));
