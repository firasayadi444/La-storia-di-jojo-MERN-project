pipeline {
    agent any

    tools {
        nodejs 'NodeJS 22' // Utilise la configuration Node.js de Jenkins
    }

    environment {
        DOCKER_HUB_CREDENTIALS = 'docker-hub-creds'
        DOCKER_HUB_REPO = 'firas444/pfe'
        BACKEND_IMAGE = "${DOCKER_HUB_REPO}-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_REPO}-frontend"
        // SONAR_TOKEN = credentials('sonar-token')
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    // Explicit checkout
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[
                            url: 'https://github.com/firasayadi444/La-storia-di-jojo-MERN-project.git',
                            credentialsId: 'github-credentials'
                        ]]
                    ])
                    // Verify checkout
                    sh 'git --version'
                    sh 'git log --oneline -3'
                    sh 'ls -la'
                }
            }
        }

        stage('Setup') {
            steps {
                script {
                    // Create test directories
                    sh 'mkdir -p backend/coverage frontend/coverage'
                }
            }
        }

        stage('Environment Check') {
            steps {
                script {
                    // Check Node.js and npm versions
                    sh 'node --version'
                    sh 'npm --version'
                    
                    // Verify Node.js version compatibility
                    sh '''
                        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
                        if [ "$NODE_VERSION" -lt 18 ]; then
                            echo "❌ Node.js version $(node --version) is too old. Required: >=18"
                            echo "Current version: $(node --version)"
                            exit 1
                        else
                            echo "✅ Node.js version $(node --version) is compatible"
                        fi
                    '''
                    
                    // Check PATH and environment
                    sh 'echo "PATH: $PATH"'
                    sh 'which node'
                    sh 'which npm'
                    
                    // Check available memory
                    sh 'free -h || echo "Memory info not available"'
                    // Check disk space
                    sh 'df -h'
                }
            }
        }

        stage('Docker Login') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        echo 'Logged in to Docker Hub'
                    }
                }
            }
        }

        stage('Backend Test') {
            steps {
                dir('backend') {
                    script {
                        // Clean npm cache and node_modules but keep package-lock.json for ci
                        sh 'npm cache clean --force'
                        sh 'rm -rf node_modules'
                        
                        // Use npm ci if package-lock.json exists, otherwise npm install
                        sh '''
                            if [ -f package-lock.json ]; then
                                echo "Using npm ci with existing package-lock.json"
                                npm ci
                            else
                                echo "No package-lock.json found, using npm install"
                                npm install
                            fi
                        '''
                        
                        // Check if test-diagnostic.sh exists before running
                        sh '''
                            if [ -f test-diagnostic.sh ]; then
                                chmod +x test-diagnostic.sh && ./test-diagnostic.sh
                            else
                                echo "test-diagnostic.sh not found, skipping diagnostic"
                            fi
                        '''
                        
                        // Run tests with timeout and error handling - Continue on failure
                        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                            timeout(time: 10, unit: 'MINUTES') {
                                sh '''
                                    if npm run | grep -q "test:ci"; then
                                        npm run test:ci || echo "Backend tests failed but continuing pipeline"
                                    elif npm run | grep -q "test"; then
                                        npm test || echo "Backend tests failed but continuing pipeline"
                                    else
                                        echo "No test script found, skipping tests"
                                    fi
                                '''
                            }
                        }
                    }
                }
            }
            post {
                always {
                    script {
                        // Publish test results if they exist
                        if (fileExists('backend/test-results.xml')) {
                            publishTestResults testResultsPattern: 'backend/test-results.xml'
                        }
                        // Archive test coverage if it exists
                        if (fileExists('backend/coverage')) {
                            archiveArtifacts artifacts: 'backend/coverage/**/*', allowEmptyArchive: true
                        }
                    }
                }
            }
        }

        stage('Frontend Test') {
            steps {
                dir('frontend') {
                    script {
                        // Clean npm cache and node_modules but keep package-lock.json for ci
                        sh 'npm cache clean --force'
                        sh 'rm -rf node_modules'
                        
                        // Use npm ci if package-lock.json exists, otherwise npm install
                        sh '''
                            if [ -f package-lock.json ]; then
                                echo "Using npm ci with existing package-lock.json"
                                npm ci
                            else
                                echo "No package-lock.json found, using npm install"
                                npm install
                            fi
                        '''
                        
                        // Check if test-diagnostic.sh exists before running
                        sh '''
                            if [ -f test-diagnostic.sh ]; then
                                chmod +x test-diagnostic.sh && ./test-diagnostic.sh
                            else
                                echo "test-diagnostic.sh not found, skipping diagnostic"
                            fi
                        '''
                        
                        // Run tests with timeout and error handling - Continue on failure
                        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                            timeout(time: 10, unit: 'MINUTES') {
                                sh '''
                                    if npm run | grep -q "test:ci"; then
                                        npm run test:ci || echo "Frontend tests failed but continuing pipeline"
                                    elif npm run | grep -q "test"; then
                                        npm test || echo "Frontend tests failed but continuing pipeline"
                                    else
                                        echo "No test script found, skipping tests"
                                    fi
                                '''
                            }
                        }
                    }
                }
            }
            post {
                always {
                    script {
                        // Publish test results if they exist
                        if (fileExists('frontend/test-results.xml')) {
                            publishTestResults testResultsPattern: 'frontend/test-results.xml'
                        }
                        // Archive test coverage if it exists
                        if (fileExists('frontend/coverage')) {
                            archiveArtifacts artifacts: 'frontend/coverage/**/*', allowEmptyArchive: true
                        }
                    }
                }
            }
        }

       

        stage('Dependency Audit') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    dir('backend') {
                        sh 'npm audit --audit-level=moderate || echo "Audit completed with warnings"'
                    }
                    dir('frontend') {
                        sh 'npm audit --audit-level=moderate || echo "Audit completed with warnings"'
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    dir('backend') {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        sh "docker build -t ${BACKEND_IMAGE}:${imageTag} -t ${BACKEND_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    dir('frontend') {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        sh "docker build -t ${FRONTEND_IMAGE}:${imageTag} -t ${FRONTEND_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                script {
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        // Install Trivy if not present
                        sh '''
                            if ! command -v trivy &> /dev/null; then
                                echo "Installing Trivy..."
                                wget -qO- https://github.com/aquasecurity/trivy/releases/latest/download/trivy_Linux-64bit.tar.gz | tar xz
                                sudo mv trivy /usr/local/bin/ || mv trivy /tmp/
                                export PATH="/tmp:$PATH"
                            fi
                        '''
                        
                        // Scan backend image
                        sh '''
                            trivy image --severity MEDIUM,HIGH,CRITICAL --exit-code 0 --format table ${BACKEND_IMAGE}:latest || echo "Backend scan completed with issues"
                        '''
                        
                        // Scan frontend image
                        sh '''
                            trivy image --severity MEDIUM,HIGH,CRITICAL --exit-code 0 --format table ${FRONTEND_IMAGE}:latest || echo "Frontend scan completed with issues"
                        '''
                    }
                }
            }
        }

        stage('Push Backend Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        sh "docker push ${BACKEND_IMAGE}:${imageTag}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Push Frontend Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        sh "docker push ${FRONTEND_IMAGE}:${imageTag}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    // Create docker-compose.yml for deployment
                    writeFile file: 'docker-compose.deploy.yml', text: """
version: '3.8'

services:
  # MongoDB Database
  mongo:
    image: mongo:latest
    container_name: orderapp-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=orderapp
    networks:
      - orderapp-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Backend API
  backend:
    image: ${BACKEND_IMAGE}:latest
    container_name: orderapp-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - backend-uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - DB=mongodb://mongo:27017/orderapp
      - JWT_SECRET=your-super-secret-jwt-key-2024
      - PORT=5000
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - orderapp-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/test"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend React App
  frontend:
    image: ${FRONTEND_IMAGE}:latest
    container_name: orderapp-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
      - NODE_ENV=development
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - orderapp-network
    

volumes:
  mongo_data:
  backend-uploads:

networks:
  orderapp-network:
    driver: bridge
"""

                    // Stop existing containers if running
                    sh '''
                        echo "🛑 Stopping existing containers..."
                        docker compose -f docker-compose.deploy.yml down --remove-orphans || echo "No containers to stop"
                    '''

                    // Pull latest images
                    sh '''
                        echo "📥 Pulling latest images..."
                        docker pull mongo:latest || echo "Failed to pull mongo image"
                        docker pull ${BACKEND_IMAGE}:latest || echo "Failed to pull backend image"
                        docker pull ${FRONTEND_IMAGE}:latest || echo "Failed to pull frontend image"
                    '''

                    // Deploy with docker-compose
                    sh '''
                        echo "🚀 Deploying application with MongoDB..."
                        docker compose -f docker-compose.deploy.yml up -d
                    '''

                    // Wait for services to be ready
                    sh '''
                        echo "⏳ Waiting for services to start..."
                        echo "🗄️  MongoDB starting..."
                        sleep 20
                        echo "🔧 Backend starting..."
                        sleep 25
                        echo "⚛️  Frontend starting..."
                        sleep 20
                    '''

                    // Check deployment status
                    sh '''
                        echo "✅ Checking deployment status..."
                        docker compose -f docker-compose.deploy.yml ps
                        echo "📊 Container logs:"
                        echo "=== MongoDB logs ==="
                        docker logs orderapp-mongo --tail 10 || echo "MongoDB logs not available"
                        echo "=== Backend logs ==="
                        docker logs orderapp-backend --tail 15 || echo "Backend logs not available"
                        echo "=== Frontend logs ==="
                        docker logs orderapp-frontend --tail 15 || echo "Frontend logs not available"
                    '''
                }
            }
            post {
                always {
                    // Archive docker-compose file for reference
                    archiveArtifacts artifacts: 'docker-compose.deploy.yml', allowEmptyArchive: true
                }
                success {
                    echo '🎉 Deployment completed successfully!'
                    script {
                        // Basic health check with wget (available in alpine)
                        sh '''
                            echo "🏥 Running health checks..."
                            echo "🗄️  Checking MongoDB..."
                            docker exec orderapp-mongo mongosh --eval "db.adminCommand('ping')" || echo "⚠️ MongoDB health check failed"
                            echo "🔧 Checking Backend API..."
                            wget --spider --tries=3 --timeout=10 http://localhost:5000/ || echo "⚠️ Backend health check failed"
                            echo "⚛️  Checking Frontend..."
                            wget --spider --tries=3 --timeout=10 http://localhost:3000/ || echo "⚠️ Frontend health check failed"
                            
                            echo "🌐 Application URLs:"
                            echo "Frontend: http://localhost:3000"
                            echo "Backend API: http://localhost:5000/api"
                            echo "MongoDB: mongodb://localhost:27017/orderapp"
                        '''
                    }
                }
                failure {
                    echo '💥 Deployment failed!'
                    script {
                        // Show logs for debugging
                        sh '''
                            echo "📋 Deployment failure logs:"
                            docker compose -f docker-compose.deploy.yml logs --tail 50 || echo "No logs available"
                            echo "🔍 Container status:"
                            docker ps -a | grep orderapp || echo "No orderapp containers found"
                        '''
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    // Clean up unused Docker images to save space
                    sh '''
                        echo "🧹 Cleaning up unused Docker resources..."
                        docker image prune -f
                        docker system prune -f --volumes
                        
                        # Keep deployment compose file but clean other temp files
                        echo "📁 Deployment files:"
                        ls -la docker-compose.deploy.yml || echo "Compose file not found"
                    '''
                }
            }
        }
    }

    post {
        always {
            // Clean workspace after build
            cleanWs()
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check logs for details.'
        }
        unstable {
            echo '⚠️ Pipeline unstable! Some tests may have failed but build continued.'
        }
    }
}