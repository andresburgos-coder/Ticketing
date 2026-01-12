# Etapa de desarrollo
FROM node:20-alpine as development

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto de desarrollo
EXPOSE 4200

# Comando por defecto - usar configuración Docker
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "--configuration", "docker"]

# Etapa de construcción
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine as production

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
