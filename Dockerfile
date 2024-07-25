# Use the official Node.js image from the Docker Hub
FROM node:18-alpine

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json .

# Install the dependencies
RUN npm install

# Rebuild native modules like bcrypt
#RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 8888

# Define the command to run the application
CMD ["npm", "start"]
