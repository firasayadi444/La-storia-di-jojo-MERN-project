# 📦 Base image
FROM node:22-alpine

# 📁 Dossier de travail dans le conteneur
WORKDIR /app

# 📄 Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# 📥 Installation des dépendances avec cache optimisé
RUN npm ci --cache .npm --prefer-offline

# 🗂️ Copie de tout le code source
COPY . .

# 🌱 Variables d'environnement
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:5000/api

# 🔥 Exposition du port 3000
EXPOSE 3000

# 🏁 Commande de démarrage avec Vite
CMD ["npm", "run", "dev"] 