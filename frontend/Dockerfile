# Stage 1: Build React/Vite app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html   # ✅ Vite outputs "dist"
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
