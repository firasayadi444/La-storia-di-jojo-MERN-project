# 📦 Base image
FROM node:22-alpine

# 📁 Dossier de travail dans le conteneur
WORKDIR /app

# 📄 Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# 📥 Installation des dépendances (y compris devDependencies)
RUN npm install

# 🗂️ Copie de tout le code source
COPY . .

# 📂 Crée le dossier uploads (pour les fichiers utilisateurs)
RUN mkdir -p uploads

# 🌱 Variables d'environnement (tu peux aussi les passer via docker-compose ou CLI)
ENV NODE_ENV=development
ENV PORT=5000

# 🔥 Exposition du port 5000
EXPOSE 5000

# 🏁 Commande de démarrage avec nodemon
CMD ["npm", "run", "dev"] 