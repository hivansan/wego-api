const fetch = require('node-fetch');

export async function fetchNParse<T = unknown>(url: string): Promise<T> {
  return fetch(url).then((res) => res.json());
}

export async function arrayFetch<T = unknown>(urls: string[]): Promise<T[]> {
  return Promise.all(urls.map(fetchNParse)) as any as T[];
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