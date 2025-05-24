# Use an official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy entire project
COPY . .

# Build the TypeScript files
RUN npm run build

# Copy generated Prisma files if needed
RUN npx cpy src/generated dist/generated --recursive

# Tell Docker to run this on container start
CMD ["node", "dist/server.js"]
