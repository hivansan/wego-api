import { Request, Response } from "express";

type ResponseVal = {
  status?: number;
  headers?: { [key: string]: any },
  body?: any;
};

type RequestFn = (req: Request) => ResponseVal | Promise<ResponseVal>;

/**
 * Simple utility function to build Express request handlers. Pass in a callback that accepts a `Request` object,
 * and return a `ResponseVal` value, or a `ResponseVal` wrapped in a promise.
 */
export const respond = (fn: RequestFn) => (
  (req: Request, res: Response) => Promise.resolve(fn(req)).then((result: ResponseVal) => {
    result.status && res.status(result.status) || res.status(200);
    result.headers && res.set(result.headers);
    (result.body !== undefined) ? res.json(result.body) : res.end();
  }).catch((e) => {
    res.status(500)
    e instanceof Error ? res.send(e.message) : res.json(e)
  })
);

export const error = (status: number, msg: string, extra: {} = {}) => Promise.resolve({ status, body: { msg, ...extra } });

export const sleep = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));
