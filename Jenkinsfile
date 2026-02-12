pipeline {
  agent any

  environment {
    REGISTRY = "dhekerkr"
    TAG = "${env.GIT_COMMIT}"
  }

  stages {

    stage('Frontend Build') {
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
        sh """
          docker build -t ${REGISTRY}/book-review-frontend:${TAG} -t ${REGISTRY}/book-review-frontend:latest .
          docker build -t ${REGISTRY}/book-review-auth:${TAG} -t ${REGISTRY}/book-review-auth:latest services/auth-service
          docker build -t ${REGISTRY}/book-review-books:${TAG} -t ${REGISTRY}/book-review-books:latest services/books-service
          docker build -t ${REGISTRY}/book-review-mysql:${TAG} -t ${REGISTRY}/book-review-mysql:latest infra/mysql
        """
      }
    }

    stage('Push Docker Images') {
      steps {
        sh """
          docker push ${REGISTRY}/book-review-frontend:${TAG}
          docker push ${REGISTRY}/book-review-frontend:latest
          docker push ${REGISTRY}/book-review-auth:${TAG}
          docker push ${REGISTRY}/book-review-auth:latest
          docker push ${REGISTRY}/book-review-books:${TAG}
          docker push ${REGISTRY}/book-review-books:latest
          docker push ${REGISTRY}/book-review-mysql:${TAG}
          docker push ${REGISTRY}/book-review-mysql:latest
        """
      }
    }

    stage('Deploy with Docker Compose') {
      steps {
        sh """
          docker-compose down || true
          docker-compose up -d --build --remove-orphans
        """
      }
    }

  }
}
