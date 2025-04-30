FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy the .env file that is created from GitHub secret
COPY .env .env

EXPOSE 3000

CMD ["npm", "start"]
