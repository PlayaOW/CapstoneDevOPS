FROM node:22-alpine AS client-build
# Using a lightweight node image to build the frontend

# Set the working dir for the image
WORKDIR /pomodoroGame/client

# Copy package files and install all dependencies such as npm
COPY client/package*.json ./
RUN npm install

#COPY the rest of the codes inside client
COPY client/ ./

# Start npm run build to create the start/stop script
RUN npm run build

# Create another node image for the backend server
FROM node:22-alpine

# Set the working dir
WORKDIR /pomodoroGame/server

# Copy package json files from the web server
COPY server/package*.json ./
RUN npm install

# Copy everyhting else inside of server dir
COPY server/ ./

# Now we will copy the built react file into the public dir so that server/index.js works
COPY --from=client-build /pomodoroGame/client/dist ./public

# Expose the port 5000 the server is running on for the images
EXPOSE 5000

#start the app
CMD ["node", "index.js"]
