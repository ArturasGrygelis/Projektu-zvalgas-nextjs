FROM node:18-alpine as development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install -D tailwindcss postcss autoprefixer
# Create the config files manually instead of using npx
COPY tailwind.config.js postcss.config.js ./
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Keep your existing production stages
FROM node:18-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install -D tailwindcss postcss autoprefixer
# Copy configuration files
COPY tailwind.config.js postcss.config.js ./
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "start"]