# Tahap 1: Builder
FROM node:18 AS builder
# Set working directory di dalam container
WORKDIR /app
# Copy package.json dan package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy semua file proyek ke working directory
COPY . .

# Tahap 2: Production
FROM node:18
# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
# Set working directory di dalam container
WORKDIR /app
# Copy hanya build artifacts dari builder
COPY --from=builder /app ./
# Copy file env.dev ke dalam container
COPY .env.dev .env
# Expose port yang digunakan aplikasi
EXPOSE 3000
# Perintah untuk menjalankan aplikasi
CMD ["node", "index.js"]
