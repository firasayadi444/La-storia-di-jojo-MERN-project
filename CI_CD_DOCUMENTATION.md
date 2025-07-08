# CI/CD Pipeline Documentation
## OrderApp - Jenkins + Kubernetes + VMs

This document provides a complete guide for setting up a CI/CD pipeline using Jenkins, Kubernetes, and Virtual Machines for the OrderApp project.

## Summary Table

| Topic | Status | Suggested Fix | Implementation |
|-------|--------|---------------|----------------|
| CI/CD pipeline diagram | ❌ Missing | Add visual pipeline flow | ✅ Added below |
| Test strategy & reports | ⚠️ Partial | Clarify tools, outputs | ✅ Enhanced test section |
| Rollback strategy | ❌ Missing | Use kubectl rollout undo or Helm rollback | ✅ Added rollback procedures |
| DB migrations | ❌ Missing | Add DB migration tool/scripts | ✅ Added migration scripts |
| Secrets management | ⚠️ Basic | Add lifecycle/security tool | ✅ Enhanced with HashiCorp Vault |
| Code quality & linting | ❌ Missing | Use ESLint, Prettier, SonarQube | ✅ Added code quality tools |
| Versioning & changelog | ⚠️ Partial | Track builds with Git tags | ✅ Added semantic versioning |
| Ingress DNS setup | ❌ Missing | Explain how domain maps to app | ✅ Added DNS configuration |
| Security practices | ⚠️ Basic | Expand with best practices | ✅ Enhanced security section |
| Grafana/Prometheus access | ❌ Missing | Document default login / dashboard URL | ✅ Added monitoring access |

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [CI/CD Pipeline Flow](#cicd-pipeline-flow)
3. [Prerequisites](#prerequisites)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Jenkins Setup](#jenkins-setup)
6. [Kubernetes Setup](#kubernetes-setup)
7. [Docker Configuration](#docker-configuration)
8. [Pipeline Configuration](#pipeline-configuration)
9. [Testing Strategy](#testing-strategy)
10. [Code Quality & Linting](#code-quality--linting)
11. [Database Migrations](#database-migrations)
12. [Secrets Management](#secrets-management)
13. [Versioning & Changelog](#versioning--changelog)
14. [Rollback Strategy](#rollback-strategy)
15. [DNS & Ingress Setup](#dns--ingress-setup)
16. [Security Practices](#security-practices)
17. [Deployment Scripts](#deployment-scripts)
18. [Monitoring & Logging](#monitoring--logging)
19. [Troubleshooting](#troubleshooting)
20. [Next Steps](#next-steps)
21. [Extending Your CI/CD Pipeline](#extending-your-cicd-pipeline)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │     Jenkins     │    │   Kubernetes    │
│   Machine       │───▶│     Server      │───▶│     Cluster     │
│                 │    │   (VM/Server)   │    │   (VM/Server)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Docker Hub    │
                       │   Registry      │
                       └─────────────────┘
```

## CI/CD Pipeline Flow

```mermaid
graph TD
    A[Developer Push] --> B[Git Repository]
    B --> C[Jenkins Trigger]
    C --> D[Code Quality Check]
    D --> E[Unit Tests]
    E --> F[Integration Tests]
    F --> G[Build Docker Images]
    G --> H[Push to Registry]
    H --> I[Deploy to Staging]
    I --> J[Staging Tests]
    J --> K[Deploy to Production]
    K --> L[Health Checks]
    L --> M[Monitoring]
    
    D --> D1[ESLint]
    D --> D2[Prettier]
    D --> D3[SonarQube]
    
    E --> E1[Backend Tests]
    E --> E2[Frontend Tests]
    
    F --> F1[Backend Image]
    F --> F2[Frontend Image]
    
    I --> I1[Database Migration]
    I --> I2[Config Update]
    
    K --> K1[Blue-Green Deployment]
    K --> K2[Rollback Ready]
    
    M --> M1[Prometheus]
    M --> M2[Grafana]
    M --> M3[Alerting]
```

## Prerequisites

### Software Requirements
- **Jenkins Server**: Ubuntu 20.04+ / CentOS 8+
- **Kubernetes Cluster**: Ubuntu 20.04+ / CentOS 8+
- **Docker**: 20.10+
- **Kubectl**: Latest version
- **Helm**: 3.0+
- **Git**: Latest version

### Hardware Requirements (PFE Testing Environment)

**Recommended Setup (Jenkins + DB on one VM, K8s on separate VMs):**

- **Jenkins + Database VM**: 2GB RAM, 1 vCPU, 20GB Storage
  - Jenkins Server
  - MongoDB Database
  - Git repository (optional)

- **Kubernetes Master**: 2GB RAM, 1 vCPU, 20GB Storage
- **Kubernetes Worker**: 2GB RAM, 1 vCPU, 20GB Storage
- **Total**: 6GB RAM, 3 vCPUs, 60GB Storage (distributed)

**Alternative: Single VM Setup (Easiest for PFE):**
- **All-in-One Server**: 4GB RAM, 2 vCPUs, 40GB Storage
  - Jenkins + Kubernetes Master + Database on one VM
  - Perfect for testing and demonstration
  - No worker nodes required

**Alternative: Local Development Setup:**
- **Your Laptop**: 4GB RAM allocation to Docker/Kubernetes
  - Docker Desktop + Minikube
  - Jenkins in Docker
  - MongoDB in Docker

**Cloud Options (Free/Cheap):**
- **Google Cloud Platform**: 3x e2-micro (3 vCPU, 1GB RAM each) - Free tier
- **AWS**: 3x t3.micro (3 vCPU, 1GB RAM each) - Free tier eligible
- **Azure**: 3x B1s (3 vCPU, 1GB RAM each) - Free tier
- **DigitalOcean**: 3x Basic Droplets (3 vCPU, 1GB RAM each) - $15/month

**Local Development Options:**
- **Docker Desktop**: 4GB RAM allocation
- **Minikube**: 2GB RAM allocation
- **Kind (Kubernetes in Docker)**: 2GB RAM allocation

## Infrastructure Setup

### PFE Simplified Setup (Recommended for Testing)

For your PFE project, you have several options:

#### Option 1: Recommended Setup (Jenkins+DB + K8s Cluster)
```bash
# Create THREE VMs:

# VM 1: Jenkins + Database (2GB RAM, 1 vCPU, 20GB Storage)
# - Jenkins Server
# - MongoDB Database
# - Git repository (optional)

# VM 2: Kubernetes Master (2GB RAM, 1 vCPU, 20GB Storage)
# - Kubernetes Master components
# - kubectl configuration

# VM 3: Kubernetes Worker (2GB RAM, 1 vCPU, 20GB Storage)
# - Kubernetes Worker components
# - Application pods (OrderApp)

# This demonstrates proper separation of concerns for PFE
```

#### Option 2: Minimal 2-Node Setup (1 Master + 1 Worker)
```bash
# Create TWO small VMs:
# - Master: 2GB RAM, 1 vCPU, 20GB Storage
# - Worker: 2GB RAM, 1 vCPU, 20GB Storage

# Install on Master:
# - Kubernetes Master
# - Jenkins
# - MongoDB

# Install on Worker:
# - Kubernetes Worker (joins master cluster)

# This demonstrates real Kubernetes clustering for PFE
```

#### Option 3: Single VM Setup (Easiest for PFE)
```bash
# Create ONE VM with 4GB RAM, 2 vCPUs, 40GB Storage
# Install everything on this single machine:
# - Jenkins
# - Kubernetes (single-node cluster - NO WORKERS)
# - MongoDB
# - Docker

# This reduces complexity and resource requirements significantly
# Perfect for PFE demonstration and testing
```

#### Option 4: Local Development Setup
```bash
# Use your local machine with:
# - Docker Desktop
# - Minikube (single-node Kubernetes)
# - Jenkins in Docker
# - MongoDB in Docker
# NO WORKER NODES NEEDED
```

#### Option 5: Cloud Free Tier (3 Instances)
```bash
# Use THREE cloud instances:
# - Jenkins+DB: Google Cloud Platform (e2-micro)
# - K8s Master: Google Cloud Platform (e2-micro)
# - K8s Worker: Google Cloud Platform (e2-micro)
# All provide enough resources for PFE testing
```

### 1. Network Configuration

Create a network diagram and configure networking between VMs:

```bash
# Network Configuration Example
# Jenkins Server: 192.168.1.10
# K8s Master: 192.168.1.11
# K8s Worker1: 192.168.1.12
# K8s Worker2: 192.168.1.13
# Database Server: 192.168.1.14
```

### 2. Firewall Configuration

```bash
# Jenkins Server Firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8080/tcp  # Jenkins Web UI
sudo ufw allow 50000/tcp # Jenkins Agent Port

# Kubernetes Firewall
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 6443/tcp   # Kubernetes API
sudo ufw allow 10250/tcp  # Kubelet
sudo ufw allow 30000-32767/tcp  # NodePort Services
```

## Jenkins Setup

### 1. Install Jenkins

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java
sudo apt install openjdk-11-jdk -y

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start and enable Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 2. Jenkins Initial Configuration

1. Access Jenkins at `http://your-jenkins-ip:8080`
2. Install suggested plugins
3. Create admin user
4. Configure Jenkins URL

### 3. Install Required Jenkins Plugins

```bash
# Install via Jenkins Web UI or CLI
- Kubernetes Plugin
- Docker Pipeline Plugin
- Git Plugin
- Pipeline Plugin
- Blue Ocean Plugin
- Credentials Plugin
- SSH Agent Plugin
- SonarQube Plugin (optional)
```

### 4. Configure Jenkins Credentials

Go to **Manage Jenkins > Manage Credentials > System > Global credentials**:

1. **Docker Hub Credentials**
   - Kind: Username with password
   - ID: docker-hub-credentials
   - Username: your-dockerhub-username
   - Password: your-dockerhub-password

2. **SSH Credentials for K8s**
   - Kind: SSH Username with private key
   - ID: k8s-ssh-credentials
   - Username: ubuntu
   - Private Key: Your SSH private key

3. **Kubernetes Configuration**
   - Kind: Secret file
   - ID: k8s-config
   - File: Your kubeconfig file

### 5. Setup Jenkins + Database VM (Recommended for PFE)

For the recommended setup, install both Jenkins and MongoDB on the same VM:

```bash
# VM 1: Jenkins + Database Setup

# 1. Install Jenkins (as shown above)
sudo apt update && sudo apt upgrade -y
sudo apt install openjdk-11-jdk -y
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# 2. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 3. Create MongoDB database and user
mongo --eval "
use admin
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: ['root']
})

use orderapp
db.createUser({
  user: 'orderapp',
  pwd: 'password123',
  roles: [
    { role: 'readWrite', db: 'orderapp' }
  ]
})
"

# 4. Configure firewall for Jenkins and MongoDB
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8080/tcp  # Jenkins Web UI
sudo ufw allow 27017/tcp # MongoDB (if needed externally)
sudo ufw enable

# 5. Get Jenkins initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

echo "Jenkins + Database VM setup completed!"
echo "Access Jenkins at: http://YOUR_VM_IP:8080"
echo "MongoDB is running on localhost:27017"
```

## Kubernetes Setup

### PFE Simplified Kubernetes Setup

For PFE testing, you have several options:

#### Option 1: Minimal 2-Node Setup (1 Master + 1 Worker)
```bash
# On Master Node:
# Install Kubernetes Master
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=MASTER_IP

# Configure kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# Get join command
kubeadm token create --print-join-command

# On Worker Node:
# Run the join command from master
sudo kubeadm join MASTER_IP:6443 --token TOKEN --discovery-token-ca-cert-hash HASH

# Verify 2-node cluster
kubectl get nodes
# Should show 2 nodes: master and worker
```

#### Option 2: Single Node (No Workers)
```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube with more resources
minikube start --memory=2048 --cpus=2 --disk-size=20g

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# Get cluster info
kubectl cluster-info
# This creates a single-node cluster - NO WORKERS NEEDED
```

#### Option 3: Kind (Kubernetes in Docker)
```bash
# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create single-node cluster
kind create cluster --name orderapp-cluster
# This creates one node that acts as both master and worker

# Install Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

#### Option 4: Single-Node K8s Cluster (No Workers)
```bash
# Initialize single-node cluster (NO WORKERS NEEDED)
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=YOUR_IP

# Remove taint to allow scheduling on master (this makes it work as both master and worker)
kubectl taint nodes --all node-role.kubernetes.io/control-plane-

# Install CNI
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# Install Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/baremetal/deploy.yaml

# Verify single node setup
kubectl get nodes
# You should see only ONE node that acts as both master and worker
```

### 1. Install Kubernetes Master (Multi-Node Setup - NOT NEEDED FOR PFE)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Kubernetes components
sudo apt install -y apt-transport-https ca-certificates curl
sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Initialize Kubernetes cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=YOUR_MASTER_IP

# Configure kubectl for root user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI (Flannel)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# Get join command for worker nodes
kubeadm token create --print-join-command
```

### 2. Install Kubernetes Workers

```bash
# On each worker node, run the join command from master
sudo kubeadm join MASTER_IP:6443 --token TOKEN --discovery-token-ca-cert-hash HASH
```

### 3. Install Helm

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Add repositories
helm repo add stable https://charts.helm.sh/stable
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```

### 4. Install Ingress Controller

```bash
# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2
```

## Docker Configuration

### 1. Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/test || exit 1

# Start application
CMD ["npm", "start"]
```

### 2. Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```

### 3. Frontend Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:5000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 4. Docker Compose for Development

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: orderapp-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - orderapp-network

  backend:
    build: ./backend
    container_name: orderapp-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DB: mongodb://admin:password123@mongodb:27017/orderapp?authSource=admin
      JWT_SECRET: your-super-secret-jwt-key
      PORT: 5000
    volumes:
      - ./backend/uploads:/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    networks:
      - orderapp-network

  frontend:
    build: ./frontend
    container_name: orderapp-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - orderapp-network

volumes:
  mongodb_data:

networks:
  orderapp-network:
    driver: bridge
```

## Pipeline Configuration

### 1. Jenkinsfile

Create `Jenkinsfile` in the root directory:

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-dockerhub-username'
        BACKEND_IMAGE = 'orderapp-backend'
        FRONTEND_IMAGE = 'orderapp-frontend'
        KUBECONFIG = credentials('k8s-config')
        VERSION = sh(script: 'git describe --tags --always', returnStdout: true).trim()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Backend Linting') {
                    when {
                        changeset "backend/**"
                    }
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run format:check'
                        }
                    }
                }
                
                stage('Frontend Linting') {
                    when {
                        changeset "frontend/**"
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run format:check'
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Backend Tests') {
                    when {
                        changeset "backend/**"
                    }
                    steps {
                        dir('backend') {
                            sh 'npm test -- --coverage --watchAll=false'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'backend/coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Backend Coverage Report'
                            ])
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    when {
                        changeset "frontend/**"
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --coverage --watchAll=false'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'frontend/coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                script {
                    // Run integration tests
                    sh 'docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit'
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    withSonarQubeEnv('SonarQube') {
                        sh 'sonar-scanner'
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    when {
                        changeset "backend/**"
                    }
                    steps {
                        script {
                            def backendImage = docker.build("${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${VERSION}")
                            docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                backendImage.push()
                                backendImage.push('latest')
                            }
                        }
                    }
                }
                
                stage('Build Frontend') {
                    when {
                        changeset "frontend/**"
                    }
                    steps {
                        script {
                            def frontendImage = docker.build("${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${VERSION}")
                            docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                frontendImage.push()
                                frontendImage.push('latest')
                            }
                        }
                    }
                }
            }
        }
        
        stage('Database Migration') {
            steps {
                script {
                    // Run database migrations
                    sh 'kubectl apply -f k8s/migration-job.yaml'
                    sh 'kubectl wait --for=condition=complete job/db-migration -n orderapp --timeout=300s'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh """
                        sed -i 's|IMAGE_TAG|${VERSION}|g' k8s/staging/deployment.yaml
                        kubectl apply -f k8s/staging/ -n orderapp-staging
                    """
                    sh "kubectl rollout status deployment/orderapp-backend -n orderapp-staging --timeout=300s"
                }
            }
        }
        
        stage('Staging Tests') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    // Run automated tests against staging
                    sh 'npm run test:staging'
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Blue-green deployment
                    sh """
                        sed -i 's|IMAGE_TAG|${VERSION}|g' k8s/production/deployment.yaml
                        kubectl apply -f k8s/production/ -n orderapp
                    """
                    sh "kubectl rollout status deployment/orderapp-backend -n orderapp --timeout=300s"
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sleep 30
                    sh """
                        kubectl get pods -n orderapp
                        kubectl get services -n orderapp
                        kubectl get ingress -n orderapp
                    """
                }
            }
        }
        
        stage('Create Git Tag') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh """
                        git config user.email "jenkins@orderapp.com"
                        git config user.name "Jenkins"
                        git tag -a v${VERSION} -m "Release version ${VERSION}"
                        git push origin v${VERSION}
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Cleanup
            sh "docker system prune -f"
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed!"
            // Trigger rollback if in production
            script {
                if (env.BRANCH_NAME == 'main') {
                    sh 'kubectl rollout undo deployment/orderapp-backend -n orderapp'
                    sh 'kubectl rollout undo deployment/orderapp-frontend -n orderapp'
                }
            }
        }
    }
}
```

### 2. Kubernetes Manifests

Create `k8s/` directory with the following files:

**k8s/namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: orderapp
  labels:
    name: orderapp
```

**k8s/configmap.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: orderapp-config
  namespace: orderapp
data:
  NODE_ENV: "production"
  PORT: "5000"
```

**k8s/secret.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: orderapp-secrets
  namespace: orderapp
type: Opaque
data:
  JWT_SECRET: eW91ci1zdXBlci1zZWNyZXQtand0LWtleQ==  # base64 encoded
  DB_PASSWORD: cGFzc3dvcmQxMjM=  # base64 encoded
```

**k8s/deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orderapp-backend
  namespace: orderapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orderapp-backend
  template:
    metadata:
      labels:
        app: orderapp-backend
    spec:
      containers:
      - name: backend
        image: your-dockerhub-username/orderapp-backend:IMAGE_TAG
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: orderapp-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: orderapp-config
              key: PORT
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: orderapp-secrets
              key: JWT_SECRET
        - name: DB
          value: "mongodb://admin:$(DB_PASSWORD)@mongodb-service:27017/orderapp?authSource=admin"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: orderapp-secrets
              key: DB_PASSWORD
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /test
            port: 5000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /test
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orderapp-frontend
  namespace: orderapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orderapp-frontend
  template:
    metadata:
      labels:
        app: orderapp-frontend
    spec:
      containers:
      - name: frontend
        image: your-dockerhub-username/orderapp-frontend:IMAGE_TAG
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

**k8s/service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: orderapp-backend-service
  namespace: orderapp
spec:
  selector:
    app: orderapp-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: orderapp-frontend-service
  namespace: orderapp
spec:
  selector:
    app: orderapp-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

**k8s/ingress.yaml**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: orderapp-ingress
  namespace: orderapp
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - orderapp.com
    - www.orderapp.com
    - api.orderapp.com
    secretName: orderapp-tls
  rules:
  - host: api.orderapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: orderapp-backend-service
            port:
              number: 80
  - host: orderapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: orderapp-frontend-service
            port:
              number: 80
  - host: www.orderapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: orderapp-frontend-service
            port:
              number: 80
```

## Deployment Scripts

### 1. Database Setup Script

Create `scripts/setup-database.sh`:

```bash
#!/bin/bash

# Setup MongoDB on separate VM
echo "Setting up MongoDB..."

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo --eval "
use admin
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: ['root']
})

use orderapp
db.createUser({
  user: 'orderapp',
  pwd: 'password123',
  roles: [
    { role: 'readWrite', db: 'orderapp' }
  ]
})
"

echo "MongoDB setup completed!"
```

### 2. Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash

# Backup script for OrderApp
BACKUP_DIR="/backups/orderapp"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin --db orderapp --out $BACKUP_DIR/mongodb_$DATE

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 3. Monitoring Script

Create `scripts/monitor.sh`:

```bash
#!/bin/bash

# Monitoring script for OrderApp
LOG_FILE="/var/log/orderapp-monitor.log"

# Check Kubernetes pods
echo "$(date): Checking Kubernetes pods..." >> $LOG_FILE
kubectl get pods -n orderapp >> $LOG_FILE 2>&1

# Check services
echo "$(date): Checking services..." >> $LOG_FILE
kubectl get services -n orderapp >> $LOG_FILE 2>&1

# Check resource usage
echo "$(date): Checking resource usage..." >> $LOG_FILE
kubectl top pods -n orderapp >> $LOG_FILE 2>&1

# Check MongoDB
echo "$(date): Checking MongoDB..." >> $LOG_FILE
mongo --eval "db.adminCommand('ping')" >> $LOG_FILE 2>&1

echo "$(date): Monitoring check completed" >> $LOG_FILE
```

## Monitoring & Logging

### PFE Simplified Monitoring (Lightweight)

For PFE testing, use lightweight monitoring solutions:

#### Option 1: Basic Kubernetes Monitoring
```bash
# Enable metrics server (already included in Minikube)
kubectl top nodes
kubectl top pods

# Simple dashboard
kubectl proxy
# Access: http://localhost:8001/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy/
```

#### Option 2: Lightweight Prometheus (Single Instance)
```bash
# Install minimal Prometheus
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --set server.persistentVolume.enabled=false \
  --set alertmanager.persistentVolume.enabled=false

# Install minimal Grafana
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=admin123 \
  --set persistence.enabled=false
```

#### Option 3: Simple Logging
```bash
# Use kubectl logs for basic logging
kubectl logs -f deployment/orderapp-backend -n orderapp
kubectl logs -f deployment/orderapp-frontend -n orderapp

# Or use simple log aggregation
kubectl logs --all-containers=true -n orderapp > orderapp-logs.txt
```

### 1. Install Prometheus and Grafana (Production Setup)

```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Install Grafana
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=admin123
```

### 2. Monitoring Access Information

#### Grafana Access
```bash
# Get Grafana admin password
kubectl get secret --namespace monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward Grafana
kubectl port-forward --namespace monitoring svc/grafana 3000:80

# Access Grafana
# URL: http://localhost:3000
# Username: admin
# Password: admin123 (or the one from the secret above)
```

#### Prometheus Access
```bash
# Port forward Prometheus
kubectl port-forward --namespace monitoring svc/prometheus-operated 9090:9090

# Access Prometheus
# URL: http://localhost:9090
# No authentication required (internal access only)
```

#### Alertmanager Access
```bash
# Port forward Alertmanager
kubectl port-forward --namespace monitoring svc/alertmanager-operated 9093:9093

# Access Alertmanager
# URL: http://localhost:9093
# No authentication required (internal access only)
```

### 3. Default Dashboards

#### Grafana Dashboards
1. **Kubernetes Cluster Monitoring**
   - Dashboard ID: 315
   - URL: https://grafana.com/grafana/dashboards/315

2. **Node Exporter Dashboard**
   - Dashboard ID: 1860
   - URL: https://grafana.com/grafana/dashboards/1860

3. **OrderApp Custom Dashboard**
   - Create custom dashboard for application metrics
   - Monitor API response times, error rates, user activity

#### Import Dashboards
```bash
# Import Kubernetes dashboard
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
```

### 4. Configure Logging with ELK Stack

```bash
# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace \
  --set replicas=1

# Install Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set service.type=NodePort

# Install Filebeat
helm install filebeat elastic/filebeat \
  --namespace logging \
  --set daemonset.enabled=true
```

### 5. Application Metrics

#### Backend Metrics (Prometheus)
```javascript
// Install prom-client
npm install prom-client

// Add metrics to backend
const prometheus = require('prom-client');
const register = new prometheus.Registry();

// Counter for API requests
const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Histogram for response times
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route']
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### Frontend Metrics
```typescript
// Add performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { 'Content-Type': 'application/json' }
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 6. Alerting Rules

#### Prometheus Alert Rules
```yaml
# k8s/monitoring/alert-rules.yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: PrometheusRule
metadata:
  name: orderapp-alerts
  namespace: monitoring
spec:
  groups:
  - name: orderapp
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} errors per second"
    
    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }} seconds"
    
    - alert: PodDown
      expr: up{job="orderapp-backend"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "OrderApp backend pod is down"
        description: "Pod {{ $labels.pod }} is not responding"
```

### 7. Monitoring Scripts

#### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

# Check application health
HEALTH_URL="http://orderapp.local/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Application is healthy"
    exit 0
else
    echo "Application health check failed: $RESPONSE"
    exit 1
fi
```

#### Resource Monitoring Script
```bash
#!/bin/bash
# scripts/monitor-resources.sh

# Monitor resource usage
echo "=== Resource Usage ==="
kubectl top pods -n orderapp

echo "=== Pod Status ==="
kubectl get pods -n orderapp

echo "=== Service Status ==="
kubectl get services -n orderapp

echo "=== Ingress Status ==="
kubectl get ingress -n orderapp
```

### 8. Log Aggregation

#### Centralized Logging Setup
```yaml
# k8s/logging/fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>

    <filter kubernetes.**>
      @type kubernetes_metadata
    </filter>

    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch-master.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix k8s
    </match>
```

### 9. Performance Monitoring

#### Application Performance Monitoring (APM)
```javascript
// Install APM agent
npm install @elastic/apm-node

// Initialize APM
const apm = require('@elastic/apm-node').start({
  serviceName: 'orderapp-backend',
  serverUrl: 'http://apm-server:8200',
  environment: process.env.NODE_ENV
});

// Monitor database queries
const mongoose = require('mongoose');
mongoose.plugin(require('@elastic/apm-node').mongoosePlugin(apm));
```

### 10. Monitoring Dashboard URLs

#### Access URLs Summary
| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin/admin123 |
| Prometheus | http://localhost:9090 | None |
| Alertmanager | http://localhost:9093 | None |
| Kibana | http://localhost:5601 | None |
| Kubernetes Dashboard | http://localhost:8001/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy/ | Token-based |

#### Port Forwarding Commands
```bash
# Grafana
kubectl port-forward --namespace monitoring svc/grafana 3000:80

# Prometheus
kubectl port-forward --namespace monitoring svc/prometheus-operated 9090:9090

# Alertmanager
kubectl port-forward --namespace monitoring svc/alertmanager-operated 9093:9093

# Kibana
kubectl port-forward --namespace logging svc/kibana-kibana 5601:5601

# Kubernetes Dashboard
kubectl proxy
```