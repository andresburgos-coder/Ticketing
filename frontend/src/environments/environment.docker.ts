export const environment = {
  production: false,
  // Con NGINX Proxy: todas las rutas pasan por HTTPS
  apiUrl: (() => {
    const host = window.location.hostname;
    const protocol = window.location.protocol; // El protocolo ya será HTTPS gracias a NGINX
    const port = window.location.protocol === 'https:' ? '' : ':3000'; // Sin puerto en HTTPS con NGINX
    
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${host}${port}/api`;
    } else {
      // Con NGINX proxy, usar el mismo host y protocolo
      return `${protocol}//${host}/api`;
    }
  })(),
  baseUrl: (() => {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.protocol === 'https:' ? '' : ':3000';
    
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${host}${port}`;
    } else {
      return `${protocol}//${host}`;
    }
  })(),
  fileServerUrl: (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    } else {
      return `http://${host}:3001`;
    }
  })()
};