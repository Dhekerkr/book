pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_NAME = "book-review-app"
    DOCKERHUB_NAMESPACE = "dhekerkr"
    TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          sh 'node -v'
          sh 'npm -v'
          sh 'docker --version'
          sh 'kubectl version --client'
        }
      }
    }

    stage('Install Frontend') {
      steps {
        dir('.') {
          script {
            sh 'npm ci'
          }
        }
      }
    }

    stage('Install Services') {
      parallel {
        stage('Auth Service') {
          steps {
            dir('services/auth-service') {
              script {
                sh 'npm ci'
              }
            }
          }
        }
        stage('Books Service') {
          steps {
            dir('services/books-service') {
              script {
                sh 'npm ci'
              }
            }
          }
        }
      }
    }

    stage('Lint & Build Frontend') {
      steps {
        dir('.') {
          script {
            sh 'npm run lint'
            sh 'npm run build'
          }
        }
      }
    }

    stage('Build Docker Images (Local)') {
      steps {
        script {
          sh "docker build -t ${APP_NAME}-frontend:${TAG} -t ${APP_NAME}-frontend:latest ."
          sh "docker build -t ${APP_NAME}-auth:${TAG} -t ${APP_NAME}-auth:latest services/auth-service"
          sh "docker build -t ${APP_NAME}-books:${TAG} -t ${APP_NAME}-books:latest services/books-service"
          sh "docker build -t ${APP_NAME}-mysql:${TAG} -t ${APP_NAME}-mysql:latest infra/mysql"
        }
      }
    }

    stage('Push Docker Hub (Frontend & Backend)') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_TOKEN')]) {
          script {
            sh 'echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin'

            sh "docker tag ${APP_NAME}-frontend:${TAG} ${DOCKERHUB_NAMESPACE}/book-review-frontend:${TAG}"
            sh "docker tag ${APP_NAME}-frontend:latest ${DOCKERHUB_NAMESPACE}/book-review-frontend:latest"
            sh "docker push ${DOCKERHUB_NAMESPACE}/book-review-frontend:${TAG}"
            sh "docker push ${DOCKERHUB_NAMESPACE}/book-review-frontend:latest"

            sh "docker tag ${APP_NAME}-auth:${TAG} ${DOCKERHUB_NAMESPACE}/book-review-auth:${TAG}"
            sh "docker tag ${APP_NAME}-auth:latest ${DOCKERHUB_NAMESPACE}/book-review-auth:latest"
            sh "docker push ${DOCKERHUB_NAMESPACE}/book-review-auth:${TAG}"
            sh "docker push ${DOCKERHUB_NAMESPACE}/book-review-auth:latest"

            sh "docker tag ${APP_NAME}-books:${TAG} ${DOCKERHUB_NAMESPACE}/book-review-books:${TAG}"
            sh "docker tag ${APP_NAME}-books:latest ${DOCKERHUB_NAMESPACE}/book-review-books:latest"
            sh "docker push ${DOCKERHUB_NAMESPACE}/book-review-books:${TAG}"
            sh "docker push ${DOCKERHUB_NAMESPACE}/book-review-books:latest"
          }
        }
      }
    }

    stage('Deploy Kubernetes') {
      steps {
        script {
          sh 'kubectl apply -f k8s/namespace.yaml'
          sh 'kubectl apply -f k8s/app-stack.yaml'
          sh "kubectl -n book-review set image deployment/frontend frontend=${DOCKERHUB_NAMESPACE}/book-review-frontend:${TAG}"
          sh "kubectl -n book-review set image deployment/auth-service auth-service=${DOCKERHUB_NAMESPACE}/book-review-auth:${TAG}"
          sh "kubectl -n book-review set image deployment/books-service books-service=${DOCKERHUB_NAMESPACE}/book-review-books:${TAG}"
          sh 'kubectl -n book-review rollout status deployment/frontend --timeout=180s'
          sh 'kubectl -n book-review rollout status deployment/auth-service --timeout=180s'
          sh 'kubectl -n book-review rollout status deployment/books-service --timeout=180s'
        }
      }
    }
  }

  post {
    success {
      echo 'Local deployment completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Check logs from the failing stage.'
    }
  }
}