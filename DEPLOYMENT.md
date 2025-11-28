# RAGdoll Config Frontend - Deployment Guide

## Overview

This frontend is designed to be deployed alongside the RAGdoll backend using Docker Compose on the shared `ragdoll_default` network.

## Network Architecture

- **Service Name**: `frontend-service`
- **Container Name**: `ragdoll-frontend`
- **Internal Port**: `3000` (exposed only within Docker network)
- **External Access**: Via Nginx reverse proxy at `https://iplvr.it.ntnu.no/app/`
- **Backend API**: `https://iplvr.it.ntnu.no/api/`

## Prerequisites

1. The `ragdoll_default` Docker network must exist (created by main docker-compose.yml)
2. Nginx reverse proxy container (`ragdoll-nginx`) must be running
3. `.env.local` file with required environment variables

## File Structure on Server

```
/iplvr-app/
├── RAGdoll/              # Backend app
├── RAGdollConfig/        # This frontend app
├── docker-compose.yml    # Main compose file (or include this one)
├── nginx.conf            # Reverse proxy configuration
└── .env                  # Backend environment variables
```

## Deployment Steps

### Initial Deployment

1. Clone the repository:

   ```bash
   cd /iplvr-app
   git clone <repo-url> RAGdollConfig
   cd RAGdollConfig
   ```

2. Create `.env.local` file with your environment variables:

   ```bash
   nano .env.local
   ```

   Add your NextAuth and other required variables.

3. Build and start the container:

   ```bash
   sudo docker-compose build frontend-service
   sudo docker-compose up -d frontend-service
   ```

4. Verify the container is running:
   ```bash
   sudo docker ps | grep ragdoll-frontend
   sudo docker logs ragdoll-frontend
   ```

### Updating Nginx Configuration

Add the frontend route to your main `nginx.conf` (in the ragdoll-nginx container):

```nginx
location /app/ {
    proxy_pass http://frontend-service:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
}
```

Then reload Nginx:

```bash
sudo docker exec ragdoll-nginx nginx -s reload
```

### Deploying Updates

When code changes are pushed:

1. Pull latest changes:

   ```bash
   cd /iplvr-app/RAGdollConfig
   git pull
   ```

2. Rebuild and restart only the frontend:

   ```bash
   sudo docker-compose build frontend-service
   sudo docker-compose up -d frontend-service
   ```

3. Verify deployment:
   ```bash
   sudo docker logs -f ragdoll-frontend
   ```

## Environment Variables

Create a `.env.local` file with:

```env
NEXTAUTH_URL=https://iplvr.it.ntnu.no/app
NEXTAUTH_SECRET=<your-secret>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
# Add any other required variables
```

## API Configuration

The frontend should call the backend API using:

```
https://iplvr.it.ntnu.no/api/
```

**DO NOT** hardcode:

- `localhost`
- Container names (`backend-service`)
- Internal ports
- IP addresses

Always use the public domain with proper routing.

## Troubleshooting

### Container won't start

```bash
sudo docker logs ragdoll-frontend
```

### Network issues

```bash
# Verify network exists
sudo docker network ls | grep ragdoll_default

# Verify container is on the network
sudo docker network inspect ragdoll_default
```

### Can't reach backend

Ensure:

1. Backend is running: `sudo docker ps | grep ragdoll-backend`
2. Network is shared: both containers should be on `ragdoll_default`
3. API calls use `https://iplvr.it.ntnu.no/api/` (not internal URLs)

### Nginx routing issues

```bash
# Check Nginx config syntax
sudo docker exec ragdoll-nginx nginx -t

# Reload Nginx
sudo docker exec ragdoll-nginx nginx -s reload

# Check Nginx logs
sudo docker logs ragdoll-nginx
```

## Important Notes

- ✅ Frontend listens on port 3000 internally only
- ✅ HTTPS is terminated by ragdoll-nginx (frontend uses HTTP internally)
- ✅ All external traffic goes through Nginx reverse proxy
- ❌ Never expose port 3000 to the host
- ❌ Never try to handle SSL/TLS in the frontend container
- ❌ Never use `localhost` or internal container names in frontend code
