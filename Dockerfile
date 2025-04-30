# Dockerfile

# Use a specific base image (adjust according to your requirements)
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) for npm/yarn install
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app files into the container
COPY . .

# Copy the .env.production file into the container
COPY .env.production .env

# Expose the app port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
