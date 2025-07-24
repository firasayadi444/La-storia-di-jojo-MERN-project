# Food Ordering App – Class Diagram, Use Cases, and Scenarios

## Class Diagram

```mermaid
classDiagram
  class User {
    +_id: string
    +name: string
    +email: string
    +role: 'user' | 'admin' | 'delivery'
    +address: string
    +phone: string
    +status: 'pending' | 'active' | 'rejected'
    +isAvailable: boolean
    +createdAt: Date
    +updatedAt: Date
  }
  class Food {
    +_id: string
    +name: string
    +description: string
    +price: number
    +category: string
    +image: string
    +available: boolean
    +createdAt: Date
    +updatedAt: Date
  }
  class Order {
    +_id: string
    +user: User
    +items: FoodItem[]
    +totalAmount: number
    +status: string
    +deliveryAddress: string
    +deliveryMan: User
    +createdAt: Date
    +updatedAt: Date
    +deliveryRating: number
    +foodRating: number
    +feedbackComment: string
  }
  class FoodItem {
    +food: Food
    +quantity: number
    +price: number
  }
  User "1" --o "*" Order : places
  User "1" --o "*" Order : delivers
  Order "*" --o "*" FoodItem : contains
  Food "1" --o "*" FoodItem : referenced in
```

---

## Use Case Diagram

```mermaid
graph TD
  User((User))
  Admin((Admin))
  Deliveryman((Deliveryman))

  subgraph UserUseCases[User Use Cases]
    U1(Register/Login)
    U2(Browse Menu)
    U3(Add to Cart)
    U4(Place Order)
    U5(Track Order)
    U6(View Order History)
    U7(Provide Feedback)
    U8(Manage Profile)
    U9(Receive Notifications)
  end

  subgraph AdminUseCases[Admin Use Cases]
    A1(Manage Food)
    A2(View All Orders)
    A3(Assign Deliveryman)
    A4(Manage Users)
    A5(View Analytics)
    A6(View Order History)
  end

  subgraph DeliverymanUseCases[Deliveryman Use Cases]
    D1(View Assigned Deliveries)
    D2(Update Delivery Status)
    D3(Track Delivery History)
    D4(Set Availability)
  end

  User-->|performs|U1
  User-->|performs|U2
  User-->|performs|U3
  User-->|performs|U4
  User-->|performs|U5
  User-->|performs|U6
  User-->|performs|U7
  User-->|performs|U8
  User-->|performs|U9

  Admin-->|performs|A1
  Admin-->|performs|A2
  Admin-->|performs|A3
  Admin-->|performs|A4
  Admin-->|performs|A5
  Admin-->|performs|A6

  Deliveryman-->|performs|D1
  Deliveryman-->|performs|D2
  Deliveryman-->|performs|D3
  Deliveryman-->|performs|D4

  U4-->|includes|U9
  U5-->|includes|U9
```

---

## General Use Cases

- **User (Customer):**
  - Register, login, and manage profile
  - Browse menu and food details
  - Add items to cart and place orders
  - Track active orders and view order history
  - Provide feedback and ratings
  - Receive notifications

- **Admin:**
  - Manage food items (add, edit, delete)
  - View and manage all orders
  - Assign deliverymen to orders
  - Manage users and deliverymen
  - View analytics and feedback
  - Access order history with filters

- **Deliveryman:**
  - View assigned deliveries
  - Update delivery status
  - Track delivery history
  - Set availability

---

## Main Scenarios

### 1. User Places an Order
- User browses menu and adds food to cart
- User checks out, enters delivery address, and places order
- Order appears in "Active Orders" with status updates
- User receives notifications as order progresses
- After delivery, user can rate and leave feedback

### 2. Admin Manages Orders
- Admin logs in and accesses dashboard
- Admin views all orders (active, delivered, cancelled)
- Admin assigns deliveryman to an order
- Admin can filter order history by month
- Admin manages users and deliverymen

### 3. Deliveryman Delivers an Order
- Deliveryman logs in and sees assigned orders
- Updates status as order is picked up and delivered
- Marks order as delivered, which updates user and admin dashboards
- Can view delivery history and stats

---

This document summarizes the core data model, main use cases, and typical scenarios for the current state of the food ordering app. 