const fetch = require('node-fetch');

export async function fetchNParse(url: string): Promise<unknown> {
  return fetch(url).then((res) => res.json());
}

export async function arrayFetch(urls: string[]): Promise<unknown[]> {
  return Promise.all(urls.map(fetchNParse));
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