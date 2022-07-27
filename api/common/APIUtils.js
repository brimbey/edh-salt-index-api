export const APIUtils = {
  formatSalt: (value) => Math.ceil(value * 10000) / 1000,
  defaultResponseHeaders: {
    'content-type': 'application/json; charset=utf8',
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    'Access-Control-Allow-Headers' : 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  },
};
