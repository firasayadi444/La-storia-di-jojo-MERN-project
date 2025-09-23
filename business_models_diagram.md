# Diagramme de Classes - Modèles Métier OrderApp

## Diagramme de Classes UML

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String role
        +String address
        +String phone
        +Boolean isAvailable
        +Object currentLocation
        +ObjectId latestLocation
        +String status
        +String vehicleType
        +String vehiclePhoto
        +String facePhoto
        +String cinPhoto
        +Boolean mustChangePassword
        +Date createdAt
        +Date updatedAt
    }

    class Food {
        +ObjectId _id
        +String name
        +String category
        +Number price
        +String description
        +String image
        +Boolean available
        +Date createdAt
        +Date updatedAt
    }

    class Order {
        +ObjectId _id
        +ObjectId user
        +Array items
        +Number totalAmount
        +String status
        +String deliveryAddress
        +Object customerLocation
        +ObjectId deliveryMan
        +Date estimatedDeliveryTime
        +Date actualDeliveryTime
        +String deliveryNotes
        +Number deliveryRating
        +Number foodRating
        +String feedbackComment
        +Date assignedAt
        +Date cancelledAt
        +ObjectId payment
        +Date createdAt
        +Date updatedAt
    }

    class OrderItem {
        +ObjectId food
        +Number quantity
        +Number price
    }

    class Payment {
        +ObjectId _id
        +ObjectId userId
        +ObjectId orderId
        +Number amount
        +String paymentMethod
        +String paymentStatus
        +String stripePaymentId
        +String stripeChargeId
        +String stripePaymentIntentId
        +Date paidAt
        +Date refundedAt
        +String refundId
        +String refundReason
        +Date createdAt
        +Date updatedAt
    }

    class Location {
        +ObjectId _id
        +ObjectId userId
        +Number latitude
        +Number longitude
        +String address
        +Number accuracy
        +Number altitude
        +Number speed
        +Number heading
        +Date timestamp
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    class CustomerLocation {
        +Number latitude
        +Number longitude
        +Number accuracy
        +Date timestamp
    }

    class CurrentLocation {
        +String type
        +Array coordinates
    }

    %% Relations
    User ||--o{ Order : "places"
    User ||--o{ Payment : "makes"
    User ||--o{ Location : "has"
    User ||--o{ Order : "delivers"
    
    Order ||--o{ OrderItem : "contains"
    Order ||--|| Payment : "has"
    Order }o--|| Food : "references"
    
    OrderItem }o--|| Food : "references"
    
    Location }o--|| User : "belongs to"
    
    %% Enums
    class UserRole {
        <<enumeration>>
        user
        admin
        delivery
    }
    
    class UserStatus {
        <<enumeration>>
        pending
        active
        rejected
    }
    
    class OrderStatus {
        <<enumeration>>
        pending
        confirmed
        preparing
        ready
        out_for_delivery
        delivered
        cancelled
    }
    
    class PaymentMethod {
        <<enumeration>>
        card
        cash
    }
    
    class PaymentStatus {
        <<enumeration>>
        pending
        paid
        failed
        refunded
    }

    %% Relations with enums
    User --> UserRole : role
    User --> UserStatus : status
    Order --> OrderStatus : status
    Payment --> PaymentMethod : paymentMethod
    Payment --> PaymentStatus : paymentStatus
```

## Description des Entités Métier

### 1. **User** (Utilisateur)
- **Rôle central** dans l'application
- **Types de rôles** : client, administrateur, livreur
- **Gestion de localisation** : position actuelle et historique
- **Statut** : en attente, actif, rejeté
- **Informations véhicule** : pour les livreurs

### 2. **Food** (Nourriture)
- **Catalogue des produits** disponibles
- **Catégorisation** des plats
- **Gestion de disponibilité**
- **Informations de prix** et description

### 3. **Order** (Commande)
- **Entité principale** du processus de commande
- **Items multiples** avec quantités et prix
- **Suivi de statut** complet du cycle de vie
- **Localisation client** pour la livraison
- **Système de notation** (livraison et nourriture)
- **Gestion des annulations**

### 4. **OrderItem** (Article de Commande)
- **Détail des articles** dans une commande
- **Quantité** et **prix unitaire**
- **Référence** vers le produit

### 5. **Payment** (Paiement)
- **Intégration Stripe** pour les paiements en ligne
- **Support multi-méthodes** (carte, espèces)
- **Gestion des remboursements**
- **Suivi des statuts** de paiement

### 6. **Location** (Localisation)
- **Tracking GPS** des utilisateurs
- **Données de précision** et métadonnées
- **Historique des positions**
- **Optimisation** pour les requêtes géospatiales

## Relations Principales

1. **User ↔ Order** : Un utilisateur peut passer plusieurs commandes
2. **User ↔ Payment** : Un utilisateur effectue plusieurs paiements
3. **User ↔ Location** : Un utilisateur a plusieurs positions GPS
4. **Order ↔ OrderItem** : Une commande contient plusieurs articles
5. **Order ↔ Food** : Les articles référencent les produits
6. **Order ↔ Payment** : Chaque commande a un paiement associé
7. **User ↔ Order (delivery)** : Un livreur peut livrer plusieurs commandes

## Fonctionnalités Métier Clés

- **Gestion multi-rôles** (client, admin, livreur)
- **Suivi de localisation** en temps réel
- **Workflow de commande** complet
- **Intégration de paiement** Stripe
- **Système de notation** et feedback
- **Optimisation géospatiale** pour la livraison
