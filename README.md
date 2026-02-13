# Book Review App — Mini-projet CaaS (CI/CD + Docker + Jenkins + Kubernetes + Monitoring)

> Application de gestion de livres et avis (reviews) déployée en architecture **microservices** avec une chaîne **CI/CD** complète.

---

## Table des matières
1. [Objectif](#0-objectif-du-projet)
2. [Référentiel GitHub](#1-référentiel-de-code-source-github)
3. [Architecture (microservices)](#2-architecture-de-lapplication-microservices)
4. [Dockerisation](#3-dockerisation)
5. [Exécution locale (Docker Compose)](#4-lancer-en-local-docker-compose)
6. [Jenkins (CI/CD)](#5-jenkins-pipeline-cicd)
7. [Kubernetes (Minikube)](#6-kubernetes-minikube)
8. [API (Résumé)](#7-api-résumé)
9. [Monitoring (Prometheus + Grafana)](#8-monitoring-prometheus--grafana-via-helm)
10. [Livrables](#9-livrables-pour-lévaluation)
11. [Commandes de démo](#10-commandes-de-démo-rapides)
12. [Résumé (à dire au prof)](#11-résumé-à-dire-au-prof)

---

## 0) Objectif du projet
Mettre en place une chaîne **CI/CD** pour une application en utilisant :
- **GitHub** : hébergement du code source
- **Docker** : dockerisation et images
- **Jenkins** : pipeline d’intégration et déploiement continu
- **Kubernetes (Minikube)** : déploiement de l’application
- **Prometheus + Grafana** : monitoring via Helm (`kube-prometheus-stack`)

---

## 1) Référentiel de code source (GitHub)
- Le code est versionné sur GitHub et doit être rendu **public** pour l’évaluation.
- Jenkins récupère le code depuis ce repo lors de l’exécution de la pipeline.

---

## 2) Architecture de l’application (Microservices)

### 2.1 Services
- **Frontend** : Next.js (port `3000`)
- **auth-service** : Node.js/Express (port `4001`)  
  Authentification : `signup/login/me` avec **JWT + bcrypt**
- **books-service** : Node.js/Express (port `4002`)  
  API REST : CRUD Books + Reviews (**JWT requis**)
- **MySQL 8** : base de données (port `3306`)
- **phpMyAdmin** : interface d’administration DB (port `80`)

### 2.2 Pourquoi microservices ?
- Chaque service est **indépendant** (build, déploiement, scaling).
- Auth séparé du service métier (books/reviews), ce qui rend l’architecture plus claire et évolutive.

---

## 3) Dockerisation

### 3.1 Dockerfiles (où les trouver)
- Frontend : `./Dockerfile`
- Auth : `services/auth-service/Dockerfile`
- Books : `services/books-service/Dockerfile`
- MySQL custom : `infra/mysql/Dockerfile`
- Script SQL d’initialisation DB : `infra/mysql/init.sql`

### 3.2 Images Docker Hub
- `dhekerkr/book-review-frontend`
- `dhekerkr/book-review-auth`
- `dhekerkr/book-review-books`
- `dhekerkr/book-review-mysql`

---

## 4) Lancer en local (Docker Compose)
> Permet de tester l’application sans Kubernetes.

### 4.1 Démarrage
Depuis la racine du projet :
```bash
docker compose up --build
```
## 4.2 Accès

- **Frontend** : http://localhost:3000  
- **phpMyAdmin** : http://localhost:8080  
- **Auth health** : http://localhost:4001/health  
- **Books health** : http://localhost:4002/health  

## 4.3 Identifiants MySQL (compose)

- **Host** : mysql  
- **User** : root  
- **Password** : rootpassword  
- **Database** : book_review  

---

## 5) Jenkins (Pipeline CI/CD)

### 5.1 Où trouver la pipeline ?
- `./Jenkinsfile`

### 5.2 Étapes principales de la pipeline
- Checkout du code depuis GitHub  
- Install / lint / build (frontend + services)  
- Build des images Docker (frontend + services + mysql)  
- Push des images sur Docker Hub (credentials Docker Hub configurés dans Jenkins)  
- (Option) Déploiement / template de déploiement (selon configuration)

### 5.3 Points importants
Jenkins doit avoir accès à :
- `node` / `npm` (build)
- `docker` (build & push)

Les credentials Docker Hub sont configurés dans Jenkins (ex : `dockerhub-creds`).

---

## 6) Kubernetes (Minikube)

### 6.1 Manifests Kubernetes (où les trouver)
Tous les manifests sont dans :
- `./k8s/`

Ils contiennent :
- **Namespace** : `book-review`
- **Secret + ConfigMap** (variables d’environnement)
- **Deployments** : `frontend`, `auth-service`, `books-service`, `phpmyadmin`
- **StatefulSet** : `mysql` (stockage persistant)
- **Services** :
  - `ClusterIP` : communication interne entre services
  - `NodePort` : accès externe pour frontend et phpmyadmin

### 6.2 Démarrer Minikube
```bash
minikube start --driver=docker
kubectl get nodes
```

### 6.3 Déployer l’application
```bash
kubectl apply -f k8s/
kubectl -n book-review get pods
kubectl -n book-review get svc
```

### 6.4 Accéder à l’application

**Frontend :**
```bash
minikube service frontend -n book-review --url
```
**PhpMyAdmin :**
```bash
minikube service phpmyadmin -n book-review --url
```
### 6.5 Note importante (DNS Kubernetes)

Dans Kubernetes, les services communiquent via les DNS internes :

- http://auth-service:4001  
- http://books-service:4002  

*(Et non `localhost`, qui pointe uniquement vers le conteneur courant.)*

---

## 7) API (Résumé)

### 7.1 Auth-service
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /health`

### 7.2 Books-service (JWT requis)
- `GET /books`
- `POST /books`
- `GET /books/:id`
- `PUT /books/:id`
- `DELETE /books/:id`
- `POST /books/:id/reviews`
- `GET /health`

---

## 8) Monitoring (Prometheus + Grafana) via Helm

Objectif : mettre en place une solution de monitoring avec :
- Accès Grafana (port-forward)
- Vérification scraping Prometheus (nodes/pods)
- Import d’au moins 1 dashboard Grafana cluster/workloads

### 8.1 Installation kube-prometheus-stack
```bash
kubectl create namespace monitoring

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring
kubectl -n monitoring get pods
```
### 8.2 Accès Grafana

Port-forward :
```bash
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
```
Récupérer le mot de passe admin :
```bash
kubectl -n monitoring get secret kps-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d; echo
```
Connexion :

URL : http://localhost:3000

User : admin

Password : (secret)

### 8.3 Vérifier Prometheus (métriques cluster)

Port-forward Prometheus :
```bash
kubectl -n monitoring port-forward svc/kps-kube-prometheus-stack-prometheus 9090:9090
```
Vérifications :

Targets : http://localhost:9090/targets
 (doit afficher des targets UP)

Exemples de requêtes PromQL :

CPU (cluster) :
```bash
sum(rate(node_cpu_seconds_total{mode!="idle"}[5m]))
```
RAM (cluster) :
```bash
sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
```
### 8.4 Dashboard Grafana (import)

Dans Grafana → Dashboards → Import :

ID 315 (Kubernetes cluster monitoring)
ou

ID 1860 (Node Exporter Full)

## 9) Livrables (pour l’évaluation)

Lien du repo GitHub public

Dockerfiles + scripts (Dockerfile, init.sql, etc.)

Manifests Kubernetes (k8s/)

Jenkinsfile (Jenkinsfile)

Instructions de reproduction (ce README)

## 10) Commandes de démo (rapides)
### 10.1 Déploiement Kubernetes
kubectl apply -f k8s/
minikube service frontend -n book-review --url

### 10.2 Monitoring
helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
