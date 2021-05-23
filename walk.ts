import * as assert from "assert";
import { nextTick } from "process";
import * as fs from "fs";

interface Transform<T, U> {
    (t: T, cb: Callback<U>): void;
}

interface Callback<Result> {
    (err: Error): void;
    (err: null, result: Result): void;
}

interface Predicate<T> {
    (t: T, cb: Callback<boolean>): void;
}

function pmap<T, U>(f: Transform<T, U>, collection: T[], cb: Callback<U[]>) {
    if (collection.length === 0) {
        return nextTick(() => cb(null, []));
    }
    const all: U[] = [];
    let stop = false;
    let done = 0;
    const onItemDone: Callback<U> = (err: Error | null, result?: U) => {
        ++done;
        if (stop) return;
        if (result !== undefined) {
            all.push(result);
        }
        if (err) {
            stop = true;
            return cb(err);
        } else if (done === collection.length) {
            return cb(null, all);
        }
    };
    for (const item of collection) {
        nextTick(() => f(item, onItemDone));
    }
}

function pfilter<T>(f: Predicate<T>, collection: T[], cb: Callback<T[]>) {
    if (collection.length === 0) {
        return nextTick(() => cb(null, []));
    }
    const all: T[] = [];
    let stop = false;
    let done = 0;
    const onItemDone = (item: T, err: Error | null, result?: boolean): void => {
        ++done;
        if (stop) return;
        if (result !== undefined) {
            if (result) all.push(item);
        }
        if (err) {
            stop = true;
            return cb(err);
        } else if (done === collection.length) {
            return cb(null, all);
        }
    };
    for (const item of collection) {
        const done: Callback<boolean> = onItemDone.bind(null, item);
        nextTick(() => f(item, done));
    }
}

pmap(
    (x, done) => done(null, x * x),
    [1, 2, 3],
    (err: Error | null, result?: number[]): void => {
        assert.ok(!err);
        assert.deepStrictEqual([1, 4, 9], result);
    }
);

pmap(
    (x, done) => {
        if (x === 3) return done(new Error("foo"));
    },
    [1, 2, 3],
    (err: Error | null, result?: number[]) => {
        assert.ok(err);
        assert.strictEqual("foo", err.message);
        assert.ok(!result);
    }
);

pmap(
    (x, done) => done(x),
    [],
    (err: Error | null, result?: number[]) => {
        assert.ok(!err);
        assert.deepStrictEqual([], result);
    }
);

pfilter(
    (x, done) => done(null, x > 1),
    [1, 2, 3],
    (err: Error | null, result?: number[]): void => {
        assert.ok(!err);
        assert.deepStrictEqual([2, 3], result);
    }
);

pfilter(
    (x, done) => {
        if (x === 2) return done(new Error("foo"));
    },
    [1, 2, 3],
    (err: Error | null, result?: number[]) => {
        assert.ok(err);
        assert.strictEqual("foo", err.message);
        assert.ok(!result);
    }
);

function isDirectory(path: string, cb: Callback<boolean>) {
    fs.stat(path, (err, stats) => {
        if (err) return cb(err);
        return cb(null, stats.isDirectory());
    });
}

function listContents(path: string, cb: Callback<string[]>) {
    fs.readdir(path, (err, files) => {
        if (err) return cb(err);
        const paths = files.map((file) => `${path}/${file}`);
        return cb(null, paths);
    });
}

function walkAll(paths: string[], cb: Callback<string[]>) {
    pmap(walk, paths, (err: Error | null, files?: string[][]) => {
        if (err) return cb(err);
        return cb(null, files!.flat());
    });
}

function walk(path: string, cb: Callback<string[]>) {
    const all = [path];
    function onContents(err: Error | null, files?: string[]) {
        if (err) return cb(err);
        const paths = all.concat(files!);
        return cb(null, paths);
    }
    isDirectory(path, (err: Error | null, isDirectory?: boolean) => {
        if (err) return cb(err);
        if (!isDirectory) return nextTick(() => onContents(null, []));
        listContents(path, (err: Error | null, files?: string[]) => {
            if (err) return cb(err);
            walkAll(files!, onContents);
        });
    });
}

walk(process.argv[2], (err: Error | null, files?: string[]) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
    console.log(files);
});
