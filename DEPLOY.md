# Deployment Guide for Komodo

This project is configured to be deployed using [Komodo](https://komo.do/), a self-hosted deployment tool.

## Prerequisites

1.  A targeted **Komodo** server/instance.
2.  A Server Resource (VPS) connected to your Komodo instance.

## Deployment Steps

### 1. Add Repository
In your Komodo dashboard:
1.  Go to **Resources** > **Add Resource** > **Repo**.
2.  Enter the URL of this Git repository.
3.  (Optional) Setup authentication if the repo is private.

### 2. Configure Stack (Docker Compose)
1.  Go to **Deployments** > **Add Deployment** > **Compose**.
2.  **Name**: `chat-ui-stack` (or your preferred name).
3.  **Repository**: Select the repository you just added.
4.  **Compose File**: Key in `docker-compose.yml`.

### 3. Environment Variables
You need to define the environment variables required by your application. In Komodo's **Environment** tab for your deployment:

#### Backend Variables
```bash
PORT=3001
NODE_ENV=production
DB_HOST=host.docker.internal # Or your external DB IP
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=whatsapp_db
JWT_SECRET=your_jwt_secret
# Add other variables from backend/.env.example
```

> **Note on Database**: If you are running PostgreSQL inside the same Komodo server but outside this stack, use the host's internal IP or Docker network alias. If utilizing `host.docker.internal`, ensure the Komodo agent supports passing this host.

#### Frontend Variables
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com # URL where backend will be reachable
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
```

### 4. Build Arguments (CRITICAL)
The Frontend requires `NEXT_PUBLIC_API_URL` at **Build Time**.
In the **Build** configuration or **Compose Overrides**:

 Ensure your `docker-compose.yml` uses the arguments (already configured):
 ```yaml
 omnichat-ui:
   build:
     args:
       NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
 ```
 
 Make sure the variable `NEXT_PUBLIC_API_URL` is available in the environment during the build phase.

### 5. Deploy
1.  Click **Deploy**.
2.  Monitor the **Logs** tab for build progress.
3.  Once built, the services `omnichat-api` (Port 3001) and `omnichat-ui` (Port 3000) will start.

### 6. Reverse Proxy (Ingress)
To expose your apps to the internet, set up a Reverse Proxy in Komodo (or Nginx Proxy Manager / Traefik if managed separately).

- **Frontend**: Point `https://chat.yourdomain.com` -> Container `omnichat-ui` on Port `3000`.
- **Backend**: Point `https://api.yourdomain.com` -> Container `omnichat-api` on Port `3001`.

## Troubleshooting

- **Backend Connection Failed**: Ensure `NEXT_PUBLIC_API_URL` matches the actual HTTPS URL where your backend is exposed.
- **Database Error**: Check `DB_HOST`. If using `localhost` inside Docker, it refers to the container itself. Use the actual IP or Docker service name.
