FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Rename env file inside container
COPY .env.production .env

EXPOSE 3000

CMD ["npm", "start"]
