# Prescription API - Postman Test Data

## Base URL
```
http://localhost:3000/api/v1
```

---

## 1. CREATE PRESCRIPTION
**Method:** POST  
**URL:** `{{baseUrl}}/prescriptions`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

**Body (JSON):**
```json
{
  "patientId": 1,
  "doctorId": 1,
  "patientName": "John Doe",
  "diagnosis": "Seasonal allergies and mild respiratory infection",
  "status": "PENDING",
  "medicines": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Take after meals with plenty of water"
    },
    {
      "name": "Cetirizine",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "14 days",
      "instructions": "Take before bedtime"
    },
    {
      "name": "Paracetamol",
      "dosage": "650mg",
      "frequency": "As needed (max 4 times daily)",
      "duration": "5 days",
      "instructions": "Take only when fever or pain is present"
    }
  ]
}
```

**Alternative Example (Diabetes Prescription):**
```json
{
  "patientId": 2,
  "doctorId": 1,
  "patientName": "Sarah Smith",
  "diagnosis": "Type 2 Diabetes Mellitus - Regular checkup",
  "status": "PENDING",
  "medicines": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "30 days",
      "instructions": "Take with breakfast and dinner"
    },
    {
      "name": "Glimepiride",
      "dosage": "2mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take 30 minutes before breakfast"
    }
  ]
}
```

**Alternative Example (Hypertension):**
```json
{
  "patientId": 3,
  "doctorId": 2,
  "patientName": "Michael Johnson",
  "diagnosis": "Essential Hypertension",
  "status": "VERIFIED",
  "medicines": [
    {
      "name": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take in the morning with or without food"
    },
    {
      "name": "Losartan",
      "dosage": "50mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take in the evening"
    }
  ]
}
```

---

## 2. GET ALL PRESCRIPTIONS
**Method:** GET  
**URL:** `{{baseUrl}}/prescriptions`  
**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (all optional):**

### Pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Search:
- `search` - Search by prescription number (e.g., "RX-2025")

### Filters:
- `status` - Filter by status (PENDING, VERIFIED, DISPENSED)
- `patientName` - Search by patient name (partial match)
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)

**Examples:**

Basic request (first 10 results):
```
GET {{baseUrl}}/prescriptions
```

Pagination (page 2, 20 items per page):
```
GET {{baseUrl}}/prescriptions?page=2&limit=20
```

Search by prescription number:
```
GET {{baseUrl}}/prescriptions?search=RX-2025-001
```

Filter by status:
```
GET {{baseUrl}}/prescriptions?status=PENDING
```

Filter by patient name:
```
GET {{baseUrl}}/prescriptions?patientName=John
```

Filter by date range:
```
GET {{baseUrl}}/prescriptions?startDate=2025-12-01&endDate=2025-12-31
```

Combined filters (pending prescriptions for December 2025, page 1):
```
GET {{baseUrl}}/prescriptions?status=PENDING&startDate=2025-12-01&endDate=2025-12-31&page=1&limit=10
```

Search with pagination:
```
GET {{baseUrl}}/prescriptions?search=RX-2025&page=1&limit=5
```

**Response:**
```json
{
  "status": "success",
  "results": 10,
  "totalCount": 45,
  "totalPages": 5,
  "currentPage": 1,
  "data": {
    "prescriptions": [...]
  }
}
```

**Role-Based Behavior:**
- **Doctor:** Only sees their own prescriptions (filtered automatically)
- **Pharmacist/Admin:** Sees all prescriptions in the system

---

## 3. GET SINGLE PRESCRIPTION
**Method:** GET  
**URL:** `{{baseUrl}}/prescriptions/:id`  
**Example:** `{{baseUrl}}/prescriptions/1`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Role-Based Behavior:**
- **Doctor:** Can only view their own prescriptions (403 error if trying to view another doctor's prescription)
- **Pharmacist/Admin:** Can view any prescription

**No body required**

---

## 4. UPDATE PRESCRIPTION
**Method:** PATCH  
**URL:** `{{baseUrl}}/prescriptions/:id`  
**Example:** `{{baseUrl}}/prescriptions/1`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

**Body (JSON) - Update diagnosis and add new medicines:**
```json
{
  "diagnosis": "Seasonal allergies and moderate respiratory infection - Updated",
  "medicines": [
    {
      "name": "Azithromycin",
      "dosage": "500mg",
      "frequency": "Once daily",
      "duration": "5 days",
      "instructions": "Take on empty stomach, 1 hour before meals"
    },
    {
      "name": "Montelukast",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take at night before sleep"
    }
  ]
}
```

**Body (JSON) - Update only diagnosis:**
```json
{
  "diagnosis": "Upper respiratory tract infection - improving"
}
```

**Body (JSON) - Update patient name:**
```json
{
  "patientName": "John Michael Doe"
}
```

---

## 5. UPDATE PRESCRIPTION STATUS
**Method:** PATCH  
**URL:** `{{baseUrl}}/prescriptions/:id/status`  
**Example:** `{{baseUrl}}/prescriptions/1/status`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

**Body (JSON) - Mark as Verified:**
```json
{
  "status": "VERIFIED"
}
```

**Body (JSON) - Mark as Dispensed:**
```json
{
  "status": "DISPENSED"
}
```

**Body (JSON) - Mark as Pending:**
```json
{
  "status": "PENDING"
}
```

---

## 6. DELETE PRESCRIPTION
**Method:** DELETE  
**URL:** `{{baseUrl}}/prescriptions/:id`  
**Example:** `{{baseUrl}}/prescriptions/1`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**No body required**

---

## Authentication

All prescription endpoints require authentication. Include the JWT token in your requests:

**Option 1: Authorization Header (Recommended)**
```
Authorization: Bearer <your_jwt_token>
```

**Option 2: Cookie**
The JWT is automatically sent via cookie if you're using the same domain.

### Getting a Token

1. **Login** to get a token:
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "yourpassword"
}
```

Response will include:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": 1,
      "name": "Dr. Smith",
      "email": "doctor@hospital.com",
      "role": "Doctor"
    }
  }
}
```

2. Copy the `token` value and use it in the Authorization header for all prescription requests.

---

## Testing Workflow

### Step 1: Authenticate
1. Login as a doctor or create a new account
2. Save the JWT token for subsequent requests

### Step 2: Create Test Data
Before testing prescriptions, ensure you have:
1. At least one patient in the database (use patients API)
2. At least one doctor user in the database (use users/auth API)

### Step 3: Create First Prescription
- Use the CREATE PRESCRIPTION endpoint with patientId and doctorId from your database
- Include the JWT token in Authorization header

### Step 4: Get All Prescriptions with Pagination
- Use GET ALL PRESCRIPTIONS with different pagination and filter parameters
- Test as Doctor (only your prescriptions) vs Pharmacist/Admin (all prescriptions)

### Step 5: Search and Filter
- Search by prescription number: `?search=RX-2025-001`
- Filter by status: `?status=PENDING`
- Filter by patient name: `?patientName=John`
- Combine filters: `?status=PENDING&patientName=John&page=1&limit=5`

### Step 6: Get Single Prescription
- Use the ID from previous step in GET SINGLE PRESCRIPTION
- Test as Doctor (access denied for other doctors' prescriptions)

### Step 7: Update Status
- Change status from PENDING → VERIFIED → DISPENSED

### Step 8: Update Prescription
- Modify diagnosis or medicines

### Step 9: Delete Prescription
- Delete test prescription

---

## Expected Response Format

### Success Response (CREATE/UPDATE):
```json
{
  "status": "success",
  "data": {
    "prescription": {
      "id": "clxxx123456789",
      "prescriptionNo": "RX-2025-001",
      "patientName": "John Doe",
      "date": "2025-12-23T10:30:00.000Z",
      "diagnosis": "Seasonal allergies and mild respiratory infection",
      "status": "PENDING",
      "patientId": 1,
      "doctorId": 1,
      "createdAt": "2025-12-23T10:30:00.000Z",
      "updatedAt": "2025-12-23T10:30:00.000Z",
      "patient": {
        "id": 1,
        "fullname": "John Doe",
        "age": 35,
        "bloodGroup": "O+",
        "gender": "Male",
        "email": "john@example.com",
        "phone": 1234567890,
        "address": "123 Main St",
        "knownallergies": "None"
      },
      "doctor": {
        "id": 1,
        "name": "Dr. Smith",
        "email": "dr.smith@hospital.com",
        "role": "Doctor"
      },
      "medicines": [
        {
          "id": 1,
          "name": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "3 times daily",
          "duration": "7 days",
          "instructions": "Take after meals with plenty of water",
          "prescriptionId": "clxxx123456789"
        }
      ]
    }
  }
}
```

### Success Response (GET ALL):
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "prescriptions": [...]
  }
}
```

### Success Response (DELETE):
Status: 204 No Content

### Error Response:
```json
{
  "status": "fail",
  "message": "Prescription not found"
}
```

---

## Notes

1. **Prescription Number:** Auto-generated in format `RX-YYYY-###` (e.g., RX-2025-001)
2. **Status Values:** Must be one of: `PENDING`, `VERIFIED`, `DISPENSED`
3. **IDs:** Prescription uses string CUID, but patientId and doctorId are integers
4. **Cascade Delete:** Deleting a prescription automatically deletes all associated medicines
5. **Medicine Updates:** When updating medicines, ALL old medicines are replaced with new ones

---

## Postman Environment Variables

Create these variables in Postman for easier testing:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| baseUrl | http://localhost:3000/api/v1 | http://localhost:3000/api/v1 |
| prescriptionId | | (auto-filled from responses) |
| patientId | 1 | 1 |
| doctorId | 1 | 1 |

---

## Common Test Scenarios

### Scenario 1: Complete Prescription Workflow
1. Doctor creates prescription (PENDING)
2. Pharmacist verifies prescription (VERIFIED)
3. Pharmacist dispenses medicines (DISPENSED)

### Scenario 2: Prescription Modification
1. Create prescription
2. Doctor reviews and updates diagnosis
3. Doctor adds/modifies medicines
4. Update status to VERIFIED

### Scenario 3: Error Handling
1. Try to get non-existent prescription
2. Try to create prescription with invalid patientId
3. Try to update status with invalid value
4. Try to delete already deleted prescription
