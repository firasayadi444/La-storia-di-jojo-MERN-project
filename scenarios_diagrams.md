# Diagrammes de Scénarios - OrderApp

## 1. Scénario de Paiement (Payment Flow)

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend
    participant B as Backend
    participant S as Stripe
    participant DB as Database

    C->>F: Sélectionne articles + checkout
    F->>B: POST /api/orders (créer commande)
    B->>DB: Sauvegarder commande (status: pending)
    B-->>F: Order ID + total amount

    F->>B: POST /api/payments (initier paiement)
    B->>S: Créer PaymentIntent
    S-->>B: PaymentIntent ID + client_secret
    B->>DB: Sauvegarder payment (status: pending)
    B-->>F: client_secret + PaymentIntent ID

    F->>S: Confirmer paiement (carte)
    S->>S: Traiter paiement
    S-->>F: Résultat paiement

    F->>B: POST /api/payments/confirm
    B->>S: Récupérer statut paiement
    S-->>B: Statut confirmé

    alt Paiement réussi
        B->>DB: Mettre à jour payment (status: paid)
        B->>DB: Mettre à jour order (status: confirmed)
        B-->>F: Succès + order ID
        F-->>C: Confirmation commande
    else Paiement échoué
        B->>DB: Mettre à jour payment (status: failed)
        B-->>F: Erreur paiement
        F-->>C: Échec paiement
    end
```

## 2. Scénario de Localisation et Tracking (Location Tracking)

```mermaid
sequenceDiagram
    participant D as Livreur
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant C as Client
    participant WS as WebSocket

    Note over D,C: Phase 1: Mise à jour position livreur
    D->>F: Active GPS + partage localisation
    F->>B: POST /api/locations (position actuelle)
    B->>DB: Sauvegarder location
    B->>DB: Mettre à jour user.currentLocation
    B->>WS: Émettre position livreur

    Note over D,C: Phase 2: Assignation commande
    B->>B: Trouver livreur le plus proche
    B->>DB: Assigner commande au livreur
    B->>WS: Notifier livreur (nouvelle commande)
    B->>WS: Notifier client (livreur assigné)

    Note over D,C: Phase 3: Tracking livraison
    loop Pendant la livraison
        D->>F: Mise à jour position
        F->>B: POST /api/locations
        B->>DB: Sauvegarder position
        B->>WS: Émettre position à client
        C->>F: Voir position livreur en temps réel
    end

    Note over D,C: Phase 4: Livraison terminée
    D->>F: Marquer comme livré
    F->>B: PUT /api/orders/:id (status: delivered)
    B->>DB: Mettre à jour order
    B->>WS: Notifier client (livré)
    B->>WS: Notifier livreur (livraison terminée)
```

## 3. Scénario de Modification de Statut Commande par Admin

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant WS as WebSocket
    participant C as Client
    participant D as Livreur

    A->>F: Accède au dashboard admin
    F->>B: GET /api/orders (toutes commandes)
    B->>DB: Récupérer commandes
    B-->>F: Liste commandes avec statuts

    A->>F: Sélectionne commande à modifier
    F->>B: GET /api/orders/:id
    B->>DB: Récupérer détails commande
    B-->>F: Détails commande

    A->>F: Change statut (ex: preparing → ready)
    F->>B: PUT /api/orders/:id/status
    B->>B: Valider transition statut
    B->>DB: Mettre à jour order.status

    alt Statut = "ready"
        B->>WS: Notifier livreurs disponibles
        B->>WS: Notifier client (commande prête)
    else Statut = "cancelled"
        B->>DB: Mettre à jour payment (refund)
        B->>WS: Notifier client (annulation)
        B->>WS: Notifier livreur (si assigné)
    else Statut = "out_for_delivery"
        B->>WS: Notifier client (en cours de livraison)
    end

    B-->>F: Statut mis à jour
    F-->>A: Confirmation modification
```

## 4. Scénario de Statistiques Personnelles Livreur

```mermaid
sequenceDiagram
    participant D as Livreur
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    D->>F: Accède au dashboard livreur
    F->>B: GET /api/deliveryman/stats

    par Récupération statistiques
        B->>DB: Compter commandes livrées
        B->>DB: Calculer revenus du jour
        B->>DB: Calculer revenus du mois
        B->>DB: Récupérer commandes en cours
        B->>DB: Calculer note moyenne
        B->>DB: Récupérer historique positions
    end

    B->>B: Calculer métriques:
    Note over B: - Commandes livrées (total/jour/mois)<br/>- Revenus (total/jour/mois)<br/>- Note moyenne<br/>- Temps de livraison moyen<br/>- Distance parcourue<br/>- Commandes en cours

    B-->>F: Statistiques complètes
    F-->>D: Affichage dashboard

    Note over D,F: Mise à jour temps réel
    loop Toutes les 30 secondes
        F->>B: GET /api/deliveryman/stats/live
        B->>DB: Récupérer dernières données
        B-->>F: Stats mises à jour
        F-->>D: Actualisation dashboard
    end
```

## 5. Scénario de Gestion des Commandes (Workflow Complet)

```mermaid
stateDiagram-v2
    [*] --> Pending: Client passe commande
    Pending --> Confirmed: Paiement validé
    Pending --> Cancelled: Paiement échoué/annulation
    
    Confirmed --> Preparing: Admin confirme commande
    Preparing --> Ready: Cuisine terminée
    Preparing --> Cancelled: Annulation par admin
    
    Ready --> OutForDelivery: Livreur assigné
    OutForDelivery --> Delivered: Livraison réussie
    OutForDelivery --> Cancelled: Problème livraison
    
    Delivered --> [*]: Commande terminée
    Cancelled --> [*]: Commande annulée

    note right of Pending
        - Paiement en attente
        - Stock vérifié
    end note

    note right of Preparing
        - Cuisine en cours
        - Temps estimé calculé
    end note

    note right of Ready
        - Commande prête
        - Recherche livreur
    end note

    note right of OutForDelivery
        - Tracking GPS actif
        - Client notifié
    end note
```

## 6. Scénario de Recherche et Assignation Livreur

```mermaid
sequenceDiagram
    participant B as Backend
    participant DB as Database
    participant WS as WebSocket
    participant D1 as Livreur 1
    participant D2 as Livreur 2
    participant D3 as Livreur 3

    Note over B,D3: Commande prête, recherche livreur
    B->>DB: Récupérer livreurs disponibles
    DB-->>B: Liste livreurs actifs

    B->>B: Calculer distances:
    Note over B: - Position commande<br/>- Position chaque livreur<br/>- Distance euclidienne

    B->>B: Trier par distance + charge travail
    Note over B: Critères:<br/>- Distance minimale<br/>- Nombre commandes en cours<br/>- Note moyenne<br/>- Disponibilité

    B->>DB: Assigner commande au livreur optimal
    B->>WS: Notifier livreur sélectionné (D1)
    B->>WS: Notifier autres livreurs (commande assignée)

    alt Livreur accepte
        D1->>WS: Confirmer acceptation
        B->>DB: Mettre à jour order (deliveryMan)
        B->>WS: Notifier client (livreur assigné)
    else Livreur refuse/timeout
        B->>B: Sélectionner livreur suivant
        B->>WS: Notifier livreur suivant (D2)
    end
```

## 7. Scénario de Notifications Temps Réel

```mermaid
sequenceDiagram
    participant WS as WebSocket Service
    participant C as Client
    participant D as Livreur
    participant A as Admin
    participant B as Backend

    Note over WS,A: Connexions WebSocket
    C->>WS: Connexion client
    D->>WS: Connexion livreur
    A->>WS: Connexion admin

    Note over WS,A: Notifications automatiques
    B->>WS: Émettre "nouvelle_commande"
    WS->>A: Notifier admin
    WS->>D: Notifier livreurs disponibles

    B->>WS: Émettre "commande_assignée"
    WS->>C: Notifier client (livreur assigné)
    WS->>D: Notifier livreur sélectionné

    B->>WS: Émettre "position_livreur"
    WS->>C: Mise à jour position temps réel

    B->>WS: Émettre "statut_commande"
    WS->>C: Notifier changement statut
    WS->>D: Notifier changement statut
    WS->>A: Notifier changement statut

    Note over WS,A: Notifications personnalisées
    B->>WS: Émettre "stats_livreur"
    WS->>D: Mise à jour statistiques personnelles
```

## Résumé des Scénarios Clés

### 🔄 **Flux de Paiement**
- Intégration Stripe complète
- Gestion des échecs de paiement
- Mise à jour automatique des statuts

### 📍 **Tracking de Localisation**
- Mise à jour GPS temps réel
- Optimisation assignation livreur
- Notifications position client

### ⚙️ **Gestion Admin**
- Modification statuts commandes
- Notifications automatiques
- Gestion des annulations

### 📊 **Dashboard Livreur**
- Statistiques personnelles
- Revenus et performance
- Mise à jour temps réel

### 🔄 **Workflow Complet**
- États de commande clairs
- Transitions validées
- Gestion des erreurs

### 🚚 **Assignation Intelligente**
- Algorithme de sélection optimal
- Critères multiples (distance, charge, performance)
- Fallback automatique

### 📱 **Notifications Temps Réel**
- WebSocket pour toutes les parties
- Notifications contextuelles
- Mise à jour automatique des interfaces
