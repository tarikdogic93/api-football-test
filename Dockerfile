# Use lightweight Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (cache this layer)
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Expose Next.js dev port
EXPOSE 3000

# Start Next.js in development mode
CMD ["npm", "run", "dev"]
