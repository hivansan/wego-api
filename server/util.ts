import { Request, Response } from "express";

type Result<Body> = {
  status?: number;
  headers?: { [key: string]: any },
  body?: Body;
};

type RequestFn<Body = any> = (req: Request) => Result<Body> | Promise<Result<Body>>;

/**
 * Simple utility function to build Express request handlers. Pass in a callback that accepts a `Request` object,
 * and return a `Result` value, or a `Result` wrapped in a promise.
 */
export const respond = <B>(fn: RequestFn<B>) => (
  (req: Request, res: Response) => Promise.resolve(fn(req)).then((result: Result<B>) => {
    result.status && res.status(result.status) || res.status(200);
    result.headers && res.set(result.headers);
    (result.body !== undefined) ? res.json(result.body) : res.end();
  }).catch((e) => {
    res.status(500)
    e instanceof Error ? res.send(e.message) : res.json(e)
  })
);

export const error = (status: number, msg: string) => Promise.resolve({ status, body: { msg } });

export const sleep = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));
