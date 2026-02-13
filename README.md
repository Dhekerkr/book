Book Review App — Mini-projet CaaS (CI/CD + Docker + Jenkins + Kubernetes + Monitoring)

Application “Book Review” déployée en architecture microservices avec une chaîne CI/CD DevOps complète.

1) Objectif du projet

Mettre en place une chaîne d’intégration et de déploiement continu d’une application via :

GitHub (code source)

Docker (images)

Jenkins (pipeline CI/CD)

Kubernetes / Minikube (déploiement)

Prometheus + Grafana (monitoring via Helm)

2) Référentiel GitHub (Code Source)

Le code est hébergé sur GitHub et doit être rendu public pour l’évaluation.

La pipeline Jenkins récupère le code directement depuis le repo.

3) Architecture de l’application (Microservices)
Services

Frontend : Next.js (port 3000) — interface utilisateur

auth-service : Node.js/Express (port 4001) — authentication JWT (signup/login/me)

books-service : Node.js/Express (port 4002) — CRUD Books + Reviews

MySQL 8 : base de données (port 3306)

phpMyAdmin : administration DB (port 80)

Pourquoi microservices ?

Chaque service est déployé et scalé indépendamment (auth séparé du CRUD books).

4) Dockerisation (Dockerfiles + images)
Où trouver les Dockerfiles ?

Frontend : ./Dockerfile

Auth : services/auth-service/Dockerfile

Books : services/books-service/Dockerfile

MySQL custom : infra/mysql/Dockerfile

Initialisation DB : infra/mysql/init.sql

Images Docker Hub

dhekerkr/book-review-frontend

dhekerkr/book-review-auth

dhekerkr/book-review-books

dhekerkr/book-review-mysql

5) Développement Local (Docker Compose)

Méthode recommandée pour tester rapidement sans Kubernetes.

Depuis la racine :

docker compose up --build


Accès :

Frontend : http://localhost:3000

phpMyAdmin : http://localhost:8080

Auth health : http://localhost:4001/health

Books health : http://localhost:4002/health

Identifiants MySQL (compose) :

Host : mysql

User : root

Password : rootpassword

DB : book_review

6) Pipeline Jenkins (CI/CD)
Objectif de la pipeline

Automatiser :

Checkout du code depuis GitHub

Install / lint / build (frontend + services)

Build Docker images

Push des images sur Docker Hub

(Option) Déploiement (kubectl ou GitOps template)

Où trouver la pipeline ?

Fichier : ./Jenkinsfile

Remarque importante

Jenkins doit avoir accès à :

node / npm pour build

docker pour build/push d’images (docker socket ou agent configuré)

7) Kubernetes (Minikube) — Déploiement K8s
Manifests Kubernetes

Tous les manifests sont dans :

./k8s/

Ils contiennent :

Namespace : book-review

Secrets + ConfigMap (variables d’environnement)

Deployments : frontend, auth-service, books-service, phpMyAdmin

StatefulSet : mysql (stockage persistant)

Services :

ClusterIP pour la communication interne (auth/books/mysql)

NodePort pour accéder à frontend et phpMyAdmin depuis l’extérieur

Lancer Minikube
minikube start --driver=docker
kubectl get nodes

Déployer l’application sur K8s
kubectl apply -f k8s/
kubectl -n book-review get pods
kubectl -n book-review get svc

Accéder à l’application

Frontend :

minikube service frontend -n book-review --url


phpMyAdmin :

minikube service phpmyadmin -n book-review --url

Note importante (erreur que j’ai corrigée)

Dans Kubernetes, le frontend ne doit pas proxifier vers localhost:4001.
Il doit utiliser les DNS internes Kubernetes :

http://auth-service:4001

http://books-service:4002

8) APIs (Résumé)
Auth-service

POST /auth/signup

POST /auth/login

GET /auth/me

GET /health

Books-service (JWT requis)

GET /books

POST /books

GET /books/:id

PUT /books/:id

DELETE /books/:id

POST /books/:id/reviews

GET /health

9) Monitoring (Prometheus + Grafana) via Helm
Objectif

Mettre en place une solution de monitoring :

Accès Grafana (port-forward)

Vérifier que Prometheus scrape bien nodes/pods

Importer au moins 1 dashboard cluster/workloads

Installation kube-prometheus-stack (Helm)

Namespace monitoring :

kubectl create namespace monitoring


Installer :

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring


Vérifier :

kubectl -n monitoring get pods

Accès Grafana (port-forward)
kubectl -n monitoring port-forward svc/kps-grafana 3000:80


Mot de passe admin :

kubectl -n monitoring get secret kps-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d; echo


Accès :

http://localhost:3000

user : admin

Vérifier Prometheus collecte les métriques du cluster
kubectl -n monitoring port-forward svc/kps-kube-prometheus-stack-prometheus 9090:9090


Vérifications :

http://localhost:9090/targets
 → targets UP

requêtes utiles :

CPU : sum(rate(node_cpu_seconds_total{mode!="idle"}[5m]))

RAM : sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)

Dashboard Grafana

Importer un dashboard :

ID 315 (Kubernetes cluster monitoring)

ou ID 1860 (Node Exporter Full)

10) Livrables

Lien repo GitHub public

Dockerfiles + scripts (Dockerfile, services/*/Dockerfile, infra/mysql/*)

Manifests Kubernetes (k8s/)

Jenkinsfile (Jenkinsfile)

Instructions reproduction (ce README)

11) Commandes rapides (pour démo)
Déployer sur k8s
kubectl apply -f k8s/
minikube service frontend -n book-review --url

Monitoring
helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
