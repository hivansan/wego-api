const fetch = require('node-fetch');

export async function fetchNParse<T = unknown>(url: string, options?: any): Promise<T> {
  return fetch(url, options).then((res: any) => res.json());
}

export async function arrayFetch<T = unknown>(urls: string[]): Promise<T[]> {
  return Promise.all(urls.map((url) => fetchNParse(url, {}))) as any as T[];
}

export async function* paginated<Val>(
  isDone: (v: Val) => boolean,
  next: (page: number) => Promise<Val>,
) {
  let result: Val;
  let page = 0;

  do {
    result = await next(page);
    yield result;
    page++;
  } while (!isDone(result));
}