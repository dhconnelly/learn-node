import * as assert from "assert";
import { nextTick } from "process";

interface Transform<T, U, E extends Error> {
    (t: T, cb: Callback<U, E>): void;
}

interface Callback<Result, E extends Error> {
    (err: E): void;
    (err: null, result: Result): void;
}

interface Predicate<T, E extends Error> {
    (t: T, cb: Callback<boolean, E>): void;
}

function pmap<T, U, E extends Error>(
    collection: T[],
    f: Transform<T, U, E>,
    cb: Callback<U[], E>
) {
    const all: U[] = [];
    let stop = false;
    let done = 0;
    const onItemDone: Callback<U, E> = (err: E | null, result?: U): void => {
        if (stop) return;
        if (result) {
            ++done;
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

function pfilter<T, E extends Error>(
    collection: T[],
    f: Predicate<T, E>,
    cb: Callback<T[], E>
) {
    const all: T[] = [];
    let stop = false;
    let done = 0;
    const onItemDone = (item: T, err: E | null, result?: boolean): void => {
        if (stop) return;
        if (result !== undefined) {
            ++done;
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
        const done: Callback<boolean, E> = onItemDone.bind(null, item);
        nextTick(() => f(item, done));
    }
}

pmap(
    [1, 2, 3],
    (x, done) => done(null, x * x),
    (err: Error | null, result?: number[]): void => {
        assert.ok(!err);
        assert.deepStrictEqual([1, 4, 9], result);
    }
);

pmap(
    [1, 2, 3],
    (x, done) => {
        if (x === 3) return done(new Error("foo"));
    },
    (err: Error | null, result?: number[]) => {
        assert.ok(err);
        assert.strictEqual("foo", err.message);
        assert.ok(!result);
    }
);

pfilter(
    [1, 2, 3],
    (x, done) => done(null, x > 1),
    (err: Error | null, result?: number[]): void => {
        assert.ok(!err);
        assert.deepStrictEqual([2, 3], result);
    }
);

pfilter(
    [1, 2, 3],
    (x, done) => {
        if (x === 2) return done(new Error("foo"));
    },
    (err: Error | null, result?: number[]) => {
        assert.ok(err);
        assert.strictEqual("foo", err.message);
        assert.ok(!result);
    }
);
