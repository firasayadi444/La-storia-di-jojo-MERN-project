pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = 'docker-hub-creds'
        DOCKER_HUB_REPO = 'firas444/pfe'
        BACKEND_IMAGE = "${DOCKER_HUB_REPO}-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_REPO}-frontend"
        // SONAR_TOKEN = credentials('sonar-token')
        NODE_CACHE_DIR = 'node_modules'
        NPM_CACHE_DIR = '.npm'
    }

    stages {
        stage('Cache Setup') {
            steps {
                script {
                    // Create cache directories
                    sh 'mkdir -p backend/.npm frontend/.npm'
                    sh 'mkdir -p backend/.docker frontend/.docker'
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
                    sh 'npm run test:ci'
                }
            }
        }

        stage('Frontend Test') {
            steps {
                dir('frontend') {
                    // Cache npm dependencies
                    cache(maxCacheSize: 250, caches: [
                        arbitraryFileCache(path: 'node_modules', includes: '**/*')
                    ]) {
                        sh 'npm ci --cache .npm --prefer-offline'
                    }
                    sh 'npm run test:ci'
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
                        // Use cached node_modules
                        cache(maxCacheSize: 250, caches: [
                            arbitraryFileCache(path: 'node_modules', includes: '**/*')
                        ]) {
                            sh 'npm audit --audit-level=moderate'
                        }
                    }
                    dir('frontend') {
                        // Use cached node_modules
                        cache(maxCacheSize: 250, caches: [
                            arbitraryFileCache(path: 'node_modules', includes: '**/*')
                        ]) {
                            sh 'npm audit --audit-level=moderate'
                        }
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    dir('backend') {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        // Cache Docker layers
                        cache(maxCacheSize: 250, caches: [
                            arbitraryFileCache(path: '.docker', includes: '**/*')
                        ]) {
                            sh "docker build --cache-from ${BACKEND_IMAGE}:latest -t ${BACKEND_IMAGE}:${imageTag} ."
                        }
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    dir('frontend') {
                        // Cache Docker layers
                        cache(maxCacheSize: 250, caches: [
                            arbitraryFileCache(path: '.docker', includes: '**/*')
                        ]) {
                            sh "docker build --cache-from ${FRONTEND_IMAGE}:latest -t ${FRONTEND_IMAGE}:latest ."
                        }
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
      always {
        script {
          // Clean up cache if it gets too large
          sh 'find . -name ".npm" -type d -exec du -sh {} \\; | head -5'
          sh 'find . -name "node_modules" -type d -exec du -sh {} \\; | head -5'
        }
      }
      
    }
}
