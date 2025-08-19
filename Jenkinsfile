pipeline {
    agent any   // Run on Jenkins VM

    tools {
        nodejs 'NodeJS 22'
    }

    environment {
        DOCKER_HUB_CREDENTIALS = 'docker-hub-creds'
        DOCKER_HUB_REPO = 'firas444/pfe'
        BACKEND_IMAGE = "${DOCKER_HUB_REPO}-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_REPO}-frontend"
        SONAR_TOKEN = credentials('sonar-token')
        KUBECONFIG_FILE = credentials('jenkins-kubeconfig')  // Secret file
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
                sh 'mkdir -p backend/coverage frontend/coverage'
            }
        }

        stage('Environment Check') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh '''
                    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
                    if [ "$NODE_VERSION" -lt 18 ]; then
                        echo "❌ Node.js version $(node --version) is too old. Required: >=18"
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

        stage('Docker Login') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        echo '✅ Logged in to Docker Hub'
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withEnv(["KUBECONFIG=${KUBECONFIG_FILE}"]) {
                        sh """
                            kubectl apply -f k8s-manifestes/backend-deployment.yaml
                            kubectl apply -f k8s-manifestes/frontend-deployment.yaml
                            kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${BUILD_NUMBER}-${GIT_COMMIT.take(7)}
                            kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${BUILD_NUMBER}-${GIT_COMMIT.take(7)}
                            kubectl rollout status deployment/backend
                            kubectl rollout status deployment/frontend
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                withEnv(["KUBECONFIG=${KUBECONFIG_FILE}"]) {
                    sh 'kubectl get pods -n default'
                }
            }
        }
        success {
            echo '✅ Déploiement réussi !'
        }
        failure {
            echo '❌ Échec du déploiement.'
        }
    }
}
