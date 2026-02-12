pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_NAME = "book-review-app"
    TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          sh 'node -v'
          sh 'npm -v'
          sh 'docker --version'
          sh 'docker compose version'
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