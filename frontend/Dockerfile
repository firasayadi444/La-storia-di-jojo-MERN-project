# Étape 1 : Build React avec Vite
FROM node:22-alpine AS builder
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --prefer-offline

# Copier le code source
COPY . .

# Build avec Vite (ignorer les erreurs TypeScript)
RUN npm run build

# Étape 2 : Servir le build avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx
COPY nginx-config/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]