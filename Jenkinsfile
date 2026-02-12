pipeline {
  agent any

  environment {
    REGISTRY = "dhekerkr"
    TAG = "${env.GIT_COMMIT}"
  }

  stages {
    stage('Install & Lint Frontend') {
      steps {
        dir('.') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm run build'
        }
      }
    }

    stage('Install Services') {
      parallel {
        stage('Auth Service') {
          steps {
            dir('services/auth-service') {
              sh 'npm install'
            }
          }
        }
        stage('Books Service') {
          steps {
            dir('services/books-service') {
              sh 'npm install'
            }
          }
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh "docker build -t ${REGISTRY}/book-review-frontend:${TAG} -t ${REGISTRY}/book-review-frontend:latest ."
        sh "docker build -t ${REGISTRY}/book-review-auth:${TAG} -t ${REGISTRY}/book-review-auth:latest services/auth-service"
        sh "docker build -t ${REGISTRY}/book-review-books:${TAG} -t ${REGISTRY}/book-review-books:latest services/books-service"
        sh "docker build -t ${REGISTRY}/book-review-mysql:${TAG} -t ${REGISTRY}/book-review-mysql:latest infra/mysql"
      }
    }

    stage('Push Images') {
      steps {
        sh "docker push ${REGISTRY}/book-review-frontend:${TAG}"
        sh "docker push ${REGISTRY}/book-review-frontend:latest"
        sh "docker push ${REGISTRY}/book-review-auth:${TAG}"
        sh "docker push ${REGISTRY}/book-review-auth:latest"
        sh "docker push ${REGISTRY}/book-review-books:${TAG}"
        sh "docker push ${REGISTRY}/book-review-books:latest"
        sh "docker push ${REGISTRY}/book-review-mysql:${TAG}"
        sh "docker push ${REGISTRY}/book-review-mysql:latest"
      }
    }

    stage('Deploy (Template)') {
      steps {
        sh 'docker compose pull || true'
        sh 'docker compose up -d --remove-orphans'
      }
    }
  }
}
