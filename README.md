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
