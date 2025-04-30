FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Inject .env file content passed via build arg
ARG ENV_CONTENT
RUN echo "$ENV_CONTENT" > .env

EXPOSE 3000

CMD ["npm", "start"]
