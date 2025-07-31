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
        stage('Docker Login') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
                        echo 'Logged in to Docker Hub'
                    }
                }
            }
        }

        stage('Lint') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                }
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run lint'
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
                    sh 'npm ci'
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
                dir('backend') {
                    def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                    sh "docker build -t ${BACKEND_IMAGE}:${imageTag} ."
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh "docker build -t ${FRONTEND_IMAGE}:latest ."
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
