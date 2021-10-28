import { Request, Response } from "express";
import { isPromise } from "util/types";

export type ResponseVal = {
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
  (req: Request, res: Response) => {
    const handlerResult = fn(req);
    (isPromise(handlerResult) ? handlerResult : Promise.resolve(handlerResult)).then((result: ResponseVal) => {
      res.status(result.status || 200);
      result.headers && res.set(result.headers);
      (result.body !== undefined) ? res.json(result.body) : res.end();
    }, (e) => {
      if (e && (e.status || e.body)) {
        res.status(e.status || 500);
        e.headers && res.set(e.headers);
        (e.body !== undefined) ? res.json(e.body) : res.end();
        return;
      }

      res.status(500);
      e instanceof Error ? res.send(e.message) : res.json(e)
    })
  }
);

export const error = (status: number, msg: string, extra: {} = {}) => Promise.resolve({ status, body: { msg, ...extra } });

export const handleError = (msg: string) => (e: any) => {
  console.error(msg, e);
  return Promise.resolve(e).then(eVal => eVal.status && eVal.status > 100 ? eVal : error(503, 'Service error'));
}

export const sleep = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));

export const debugStr = (val: { [key: string]: any }) => JSON.stringify(val).replaceAll(/[{}\"]+/, '');