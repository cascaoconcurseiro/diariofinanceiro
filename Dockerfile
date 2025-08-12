# Dockerfile para produção segura
FROM node:18-alpine

# Instalar dependências de segurança
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código
COPY . .
RUN chown -R nextjs:nodejs /app

# Build
RUN npm run build

# Usuário não-root
USER nextjs

# Porta
EXPOSE 3000

# Iniciar com dumb-init (segurança)
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]