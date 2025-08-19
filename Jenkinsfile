pipeline {
    agent {
        kubernetes {
            label 'jenkins-agent' // Utilise le Pod Template configuré dans Cloud
            defaultContainer 'jnlp'
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  namespace: default
spec:
  serviceAccountName: jenkins
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:latest
    command:
    - sleep
    args:
    - "9999999"
    workingDir: /home/jenkins/agent
  - name: docker
    image: docker:20.10
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }

    tools {
        nodejs 'NodeJS 22'
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
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[
                            url: 'https://github.com/firasayadi444/La-storia-di-jojo-MERN-project.git',
                            credentialsId: 'github-credentials'
                        ]]
                    ])
                    sh 'git --version'
                    sh 'git log --oneline -3'
                    sh 'ls -la'
                }
            }
        }

        stage('Setup') {
            steps {
                script {
                    sh 'mkdir -p backend/coverage frontend/coverage'
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=OrderApp-backend \
                        -Dsonar.sources=backend \
                        -Dsonar.exclusions=backend/tests/** \
                        -Dsonar.tests=backend/tests \
                        -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info \
                        -Dsonar.login=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Environment Check') {
            steps {
                script {
                    sh 'node --version'
                    sh 'npm --version'
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
                    sh 'echo "PATH: $PATH"'
                    sh 'which node'
                    sh 'which npm'
                    sh 'free -h || echo "Memory info not available"'
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

        // stage('Backend Test') {
        //     steps {
        //         dir('backend') {
        //             script {
        //                 sh 'npm cache clean --force'
        //                 sh 'rm -rf node_modules'
        //                 sh '''
        //                     if [ -f package-lock.json ]; then
        //                         echo "Using npm ci with existing package-lock.json"
        //                         npm ci
        //                     else
        //                         echo "No package-lock.json found, using npm install"
        //                         npm install
        //                     fi
        //                 '''
        //                 sh '''
        //                     if [ -f test-diagnostic.sh ]; then
        //                         chmod +x test-diagnostic.sh && ./test-diagnostic.sh
        //                     else
        //                         echo "test-diagnostic.sh not found, skipping diagnostic"
        //                     fi
        //                 '''
        //                 catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
        //                     timeout(time: 10, unit: 'MINUTES') {
        //                         sh '''
        //                             if npm run | grep -q "test:ci"; then
        //                                 npm run test:ci || echo "Backend tests failed but continuing pipeline"
        //                             elif npm run | grep -q "test"; then
        //                                 npm test || echo "Backend tests failed but continuing pipeline"
        //                             else
        //                                 echo "No test script found, skipping tests"
        //                             fi
        //                         '''
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     post {
        //         always {
        //             script {
        //                 if (fileExists('backend/test-results.xml')) {
        //                     publishTestResults testResultsPattern: 'backend/test-results.xml'
        //                 }
        //                 if (fileExists('backend/coverage')) {
        //                     archiveArtifacts artifacts: 'backend/coverage/**/*', allowEmptyArchive: true
        //                 }
        //             }
        //         }
        //     }
        // }

        // stage('Frontend Test') {
        //     steps {
        //         dir('frontend') {
        //             script {
        //                 sh 'npm cache clean --force'
        //                 sh 'rm -rf node_modules'
        //                 sh '''
        //                     if [ -f package-lock.json ]; then
        //                         echo "Using npm ci with existing package-lock.json"
        //                         npm ci
        //                     else
        //                         echo "No package-lock.json found, using npm install"
        //                         npm install
        //                     fi
        //                 '''
        //                 sh '''
        //                     if [ -f test-diagnostic.sh ]; then
        //                         chmod +x test-diagnostic.sh && ./test-diagnostic.sh
        //                     else
        //                         echo "test-diagnostic.sh not found, skipping diagnostic"
        //                     fi
        //                 '''
        //                 catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
        //                     timeout(time: 10, unit: 'MINUTES') {
        //                         sh '''
        //                             if npm run | grep -q "test:ci"; then
        //                                 npm run test:ci || echo "Frontend tests failed but continuing pipeline"
        //                             elif npm run | grep -q "test"; then
        //                                 npm test || echo "Frontend tests failed but continuing pipeline"
        //                             else
        //                                 echo "No test script found, skipping tests"
        //                             fi
        //                         '''
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     post {
        //         always {
        //             script {
        //                 if (fileExists('frontend/test-results.xml')) {
        //                     publishTestResults testResultsPattern: 'frontend/test-results.xml'
        //                 }
        //                 if (fileExists('frontend/coverage')) {
        //                     archiveArtifacts artifacts: 'frontend/coverage/**/*', allowEmptyArchive: true
        //                 }
        //             }
        //         }
        //     }
        // }

        // stage('Dependency Audit') {
        //     steps {
        //         catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
        //             dir('backend') {
        //                 sh 'npm audit --audit-level=moderate || echo "Audit completed with warnings"'
        //             }
        //             dir('frontend') {
        //                 sh 'npm audit --audit-level=moderate || echo "Audit completed with warnings"'
        //             }
        //         }
        //     }
        // }

        // stage('Build Backend Image') {
        //     steps {
        //         script {
        //             dir('backend') {
        //                 def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //                 sh "docker build -t ${BACKEND_IMAGE}:${imageTag} -t ${BACKEND_IMAGE}:latest ."
        //             }
        //         }
        //     }
        // }

        // stage('Scan Backend Image with Trivy') {
        //     steps {
        //         script {
        //             def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //             sh """
        //                 trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed ${BACKEND_IMAGE}:${imageTag} || \
        //                 (echo "Trivy scan found vulnerabilities!" && exit 1)
        //             """
        //         }
        //     }
        // }

        // stage('Build Frontend Image') {
        //     steps {
        //         script {
        //             dir('frontend') {
        //                 def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //                 sh "docker build -t ${FRONTEND_IMAGE}:${imageTag} -t ${FRONTEND_IMAGE}:latest ."
        //             }
        //         }
        //     }
        // }

        // stage('Scan Frontend Image with Trivy') {
        //     steps {
        //         script {
        //             def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //             sh """
        //                 trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed ${FRONTEND_IMAGE}:${imageTag} || \
        //                 (echo "Trivy scan found vulnerabilities!" && exit 1)
        //             """
        //         }
        //     }
        // }

        // stage('Push Backend Image') {
        //     steps {
        //         script {
        //             docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
        //                 def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //                 sh "docker push ${BACKEND_IMAGE}:${imageTag}"
        //                 sh "docker push ${BACKEND_IMAGE}:latest"
        //             }
        //         }
        //     }
        // }

        // stage('Push Frontend Image') {
        //     steps {
        //         script {
        //             docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
        //                 def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //                 sh "docker push ${FRONTEND_IMAGE}:${imageTag}"
        //                 sh "docker push ${FRONTEND_IMAGE}:latest"
        //             }
        //         }
        //     }
        // }

        // stage('Cleanup Docker Images') {
        //     steps {
        //         script {
        //             def backendTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //             def frontendTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        //             sh """
        //                 docker rmi ${BACKEND_IMAGE}:${backendTag} || echo "Backend image ${backendTag} not found"
        //                 docker rmi ${BACKEND_IMAGE}:latest || echo "Backend latest image not found"
        //             """
        //             sh """
        //                 docker rmi ${FRONTEND_IMAGE}:${frontendTag} || echo "Frontend image ${frontendTag} not found"
        //                 docker rmi ${FRONTEND_IMAGE}:latest || echo "Frontend latest image not found"
        //             """
        //             sh 'docker image prune -f'
        //         }
        //     }
        // }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                        sh '''
                            kubectl apply -f k8s-manifestes/backend-deployment.yaml -n default
                            kubectl apply -f k8s-manifestes/frontend-deployment.yaml -n default
                            kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${imageTag} -n default
                            kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${imageTag} -n default
                            kubectl rollout status deployment/backend -n default
                            kubectl rollout status deployment/frontend -n default
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            container('kubectl') {
                sh 'kubectl get pods -n default'
            }
        }
        success {
            echo 'Déploiement réussi !'
        }
        failure {
            echo 'Échec du déploiement.'
        }
    }
}
