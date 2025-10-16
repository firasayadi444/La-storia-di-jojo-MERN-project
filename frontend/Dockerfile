# Étape 1 : Build React avec Node
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --prefer-offline

COPY . .
RUN npm run build

# Étape 2 : Servir le build avec Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier le config Nginx si tu veux le proxy vers /api
COPY nginx-config/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]