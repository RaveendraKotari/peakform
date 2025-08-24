pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "local"   // for now local only, later you can push to Docker Hub
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'docker build -t peakform-frontend:latest .'
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'docker build -t peakform-backend:latest .'
                        }
                    }
                }
                stage('AI Service') {
                    steps {
                        dir('ai_service') {
                            sh 'docker build -t peakform-ai-service:latest .'
                        }
                    }
                }
            }
        }

        stage('Deploy to UAT') {
            steps {
                script {
                    sh '''
                    docker rm -f frontend-uat || true
                    docker rm -f backend-uat || true
                    docker rm -f ai-uat || true

                    docker run -d --name frontend-uat -p 3001:3000 peakform-frontend:latest
                    docker run -d --name backend-uat -p 4001:4000 peakform-backend:latest
                    docker run -d --name ai-uat -p 5001:5000 peakform-ai-service:latest
                    '''
                }
            }
        }

        stage('Promote to Sandbox') {
            steps {
                input message: 'Approve deployment to Sandbox?'
                script {
                    sh '''
                    docker rm -f frontend-sandbox || true
                    docker rm -f backend-sandbox || true
                    docker rm -f ai-sandbox || true

                    docker run -d --name frontend-sandbox -p 3002:3000 peakform-frontend:latest
                    docker run -d --name backend-sandbox -p 4002:4000 peakform-backend:latest
                    docker run -d --name ai-sandbox -p 5002:5000 peakform-ai-service:latest
                    '''
                }
            }
        }

        stage('Promote to Prod') {
            steps {
                input message: 'Final approval for Prod?'
                script {
                    sh '''
                    docker rm -f frontend-prod || true
                    docker rm -f backend-prod || true
                    docker rm -f ai-prod || true

                    docker run -d --name frontend-prod -p 80:3000 peakform-frontend:latest
                    docker run -d --name backend-prod -p 4000:4000 peakform-backend:latest
                    docker run -d --name ai-prod -p 5000:5000 peakform-ai-service:latest
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Check containers with: docker ps"
        }
    }
}
