const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

export const environment = {
  production: false,
  apiUrl: `${protocol}//${host}:3000/api`,
  baseUrl: `${protocol}//${host}:3000`,
  fileServerUrl: `${protocol}//${host}:3001`
};
