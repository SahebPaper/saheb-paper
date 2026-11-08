# Saheb Paper Pvt. Ltd. — ERP System: Project Overview

## 1. Executive Summary
The Saheb Paper ERP system is an end-to-end digital solution designed to streamline the operations of paper manufacturing. The system tracks the entire lifecycle from raw material way, production, quality control, and final dispatch, ensuring real-time visibility, data accuracy, and operational efficiency.

## 2. Key Modules & Features

### 2.1 Authentication & Security
- **secure login**: role-based access control with session-based authentication.
- **session management**: PIN-based or password-based secure access.
- **Adaptive Dashboard**: personalized home screen based on the user's specific role.

### 2.2 Admin Master Management
Centralized control over all business-critical master data:
- **Products**: Define paper specifications (GSM, way, etc.).
- **Parties**: Manage customer records and business contacts.
- **Vendors**: Track raw material suppliers.
- **Vehicles**: Manage the fleet used for logistics.
- **Raw Materials**: Inventory tracking for production inputs.
- **User Management**: Control staff access and permission levels.

### 2.3 Raw Material way
- **Inward Entry**: Log incoming raw materials from vendors.
- **Stock Monitoring**: Real-time alerts when stock falls below minimum thresholds.
- **Consumption Tracking**: Automatic deduction of stock when production is initiated.

### 2.4 Production Pipeline
Detailed tracking of the manufacturing process across three stages:
1. **Pulp Mill**: Track waste percentage and chemical dosage.
2. ** paper Machine**: Track parent roll production, weight, and GSM.
3. **Rewinder**: Split parent rolls into finished reels with specific dimensions (Size, Ply, Weight, Diameter).

### 2.5 Quality Control (QC) Inspection
A rigorous quality gate before dispatch:
- **Testing**: evaluate GSM, Brightness, and Softness.
- **Grading**: classify reels as **Grade A**, **Grade B**, or **Fail**.
- **Status Updates**: automatic updating of artwork status based on QC results.

### 2.6 Dispatch & Challan Flow
- **Order Fulfillment**: Select finished reels for customer orders.
- **Documentation**: Generate professional packing slips and delivery challans.
- **Logistics**: Assign vehicles and drivers to shipments.
- **Fulfillment Tracking**: Track orders as Partial, Dispatched, or Completed.

### 2.7 Utilities Monitoring
Tracking operational costs and resource consumption:
- **Boiler**: Log wood consumption, water pressure, and temperature.
- **ETP (Effluent Treatment Plant)**: Track liquid usage.
- **Electricity**: Monitor power consumption in kWh.

### 2.8 Full Digital Traceability
- **QR Code Integration**: Every artwork is assigned a unique QR code.
- **Instant History**: Scan any artwork to instantly view its entire history, including which batch produced it, its QC results, and its current delivery status.

## 3. User Roles & Access
The system provides tailored interfaces for different departments:
- **Admin**: Full access to master data and system-wide reports.
- **Production Staff**: Focus on Mill, Machine, and Rewinder entries.
- **QC Inspectors**: Dedicated to testing and grading.
- **Warehouse/Dispatch**: Manage orders and challan generation.
- **Utility Operators**: Focused on logging resource data.

## 4. Technical Specifications
- **platform**: Cross-platform availability (Desktop via artwork and Mobile via Android).
- **architecture**: real-time data synchronization with offline-capable session management.