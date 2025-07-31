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
                        // Clean npm cache and node_modules
                        sh 'npm cache clean --force'
                        sh 'rm -rf node_modules package-lock.json'
                        sh 'npm ci'
                        
                        // Check if test-diagnostic.sh exists before running
                        sh '''
                            if [ -f test-diagnostic.sh ]; then
                                chmod +x test-diagnostic.sh && ./test-diagnostic.sh
                            else
                                echo "test-diagnostic.sh not found, skipping diagnostic"
                            fi
                        '''
                        
                        // Run tests with timeout and error handling
                        timeout(time: 10, unit: 'MINUTES') {
                            sh '''
                                if npm run | grep -q "test:ci"; then
                                    npm run test:ci
                                elif npm run | grep -q "test"; then
                                    npm test
                                else
                                    echo "No test script found, skipping tests"
                                fi
                            '''
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
                        // Clean npm cache and node_modules
                        sh 'npm cache clean --force'
                        sh 'rm -rf node_modules package-lock.json'
                        sh 'npm ci'
                        
                        // Check if test-diagnostic.sh exists before running
                        sh '''
                            if [ -f test-diagnostic.sh ]; then
                                chmod +x test-diagnostic.sh && ./test-diagnostic.sh
                            else
                                echo "test-diagnostic.sh not found, skipping diagnostic"
                            fi
                        '''
                        
                        // Run tests with timeout and error handling
                        timeout(time: 10, unit: 'MINUTES') {
                            sh '''
                                if npm run | grep -q "test:ci"; then
                                    npm run test:ci
                                elif npm run | grep -q "test"; then
                                    npm test
                                else
                                    echo "No test script found, skipping tests"
                                fi
                            '''
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

        // stage('SonarQube Analysis') {
        //     steps {
        //         script {
        //             // Backend SonarQube analysis
        //             dir('backend') {
        //                 withSonarQubeEnv('SonarQube') {
        //                     sh '''
        //                         sonar-scanner \
        //                         -Dsonar.host.url=http://localhost:9000 \
        //                         -Dsonar.login=${SONAR_TOKEN}
        //                     '''
        //                 }
        //             }
        //             
        //             // Frontend SonarQube analysis
        //             dir('frontend') {
        //                 withSonarQubeEnv('SonarQube') {
        //                     sh '''
        //                         sonar-scanner \
        //                         -Dsonar.host.url=http://localhost:9000 \
        //                         -Dsonar.login=${SONAR_TOKEN}
        //                     '''
        //                 }
        //             }
        //         }
        //     }
        // }

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

        stage('Cleanup') {
            steps {
                script {
                    // Clean up Docker images to save space
                    sh '''
                        docker image prune -f
                        docker system prune -f --volumes
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
            echo 'Pipeline completed successfully!'
        }
        failure {
            mail to: 'dev@tondomaine.com',
                 subject: "Échec pipeline ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Le pipeline a échoué. Voir les logs Jenkins : ${env.BUILD_URL}"
        }
        unstable {
            mail to: 'dev@tondomaine.com',
                 subject: "Pipeline instable ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Le pipeline est instable avec des avertissements. Voir les logs Jenkins : ${env.BUILD_URL}"
        }
    }
}