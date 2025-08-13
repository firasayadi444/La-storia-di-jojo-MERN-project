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
        SONAR_TOKEN = credentials('sonar-token')
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
        stage('SonarQube Analysis') {
            steps {
                script {
                    withSonarQubeEnv('SonarQube') {
                        // Adapt paths and keys to your project config
                        sh """
                            sonar-scanner \
                            -Dsonar.projectKey=OrderApp-backend \
                            -Dsonar.sources=backend \
                            -Dsonar.tests=backend/tests \
                            -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info \
                            -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
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

      
}
