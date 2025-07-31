pipeline {
    agent any

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
                    // Check if nvm is available and use it if needed
                    sh '''
                        if command -v nvm &> /dev/null; then
                            echo "nvm found, using Node.js 22"
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                            nvm use 22 || nvm use 18 || nvm use 20
                            echo "Active Node.js: $(node --version)"
                        else
                            echo "nvm not found, using system Node.js"
                        fi
                    '''
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

     

        stage('Test') {
            steps {
                dir('backend') {
                    // Clean npm cache and node_modules
                    sh 'npm cache clean --force'
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm ci'
                    // Run diagnostic first
                    sh 'chmod +x test-diagnostic.sh && ./test-diagnostic.sh'
                    // Run tests with timeout and error handling
                    timeout(time: 10, unit: 'MINUTES') {
                        sh 'npm run test:ci'
                    }
                }
            }
            post {
                always {
                    // Publish test results
                    publishTestResults testResultsPattern: '**/test-results.xml'
                    // Archive test coverage
                    archiveArtifacts artifacts: 'coverage/**/*'
                }
            }
        }

        stage('Frontend Test') {
            steps {
                dir('frontend') {
                    // Clean npm cache and node_modules
                    sh 'npm cache clean --force'
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm ci'
                    // Run diagnostic first
                    sh 'chmod +x test-diagnostic.sh && ./test-diagnostic.sh'
                    // Run tests with timeout and error handling
                    timeout(time: 10, unit: 'MINUTES') {
                        sh 'npm run test:ci'
                    }
                }
            }
            post {
                always {
                    // Publish test results
                    publishTestResults testResultsPattern: '**/test-results.xml'
                    // Archive test coverage
                    archiveArtifacts artifacts: 'coverage/**/*'
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
                        sh 'npm audit --audit-level=moderate'
                    }
                    dir('frontend') {
                        sh 'npm audit --audit-level=moderate'
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    dir('backend') {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        sh "docker build -t ${BACKEND_IMAGE}:${imageTag} ."
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    dir('frontend') {
                        sh "docker build -t ${FRONTEND_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                script {
                    // Scan backend image
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity MEDIUM,HIGH,CRITICAL --exit-code 1 ${BACKEND_IMAGE}:latest'
                    // Scan frontend image
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity MEDIUM,HIGH,CRITICAL --exit-code 1 ${FRONTEND_IMAGE}:latest'
                }
            }
        }

        stage('Push Backend Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Push Frontend Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }
    }

    post {
      failure {
        mail to: 'dev@tondomaine.com',
             subject: "Échec pipeline ${env.JOB_NAME} #${env.BUILD_NUMBER}",
             body: "Voir les logs Jenkins : ${env.BUILD_URL}"
      }
    }
}
