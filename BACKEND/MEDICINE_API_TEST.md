# Medicine Management API - Test Data

## Authentication
First, you need to login to get an authentication token:

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Use the returned token in all subsequent requests as a Bearer token.

---

## Medicine API Endpoints

### 1. Get All Medicines (with Pagination)

```bash
GET http://localhost:3000/api/v1/medicines
GET http://localhost:3000/api/v1/medicines?page=1&limit=10
GET http://localhost:3000/api/v1/medicines?search=پاراسیتامول
GET http://localhost:3000/api/v1/medicines?type=قرص
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": 1,
        "type": "قرص",
        "companyName": "فیض",
        "genericName": "پاراسیتامول",
        "dosage": "500mg",
        "frequency": "1x3",
        "mealTiming": "بعد از غذا",
        "createdBy": 1,
        "updatedBy": 1,
        "createdAt": "2026-01-15T10:30:00Z",
        "updatedAt": "2026-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 2. Create New Medicine

```bash
POST http://localhost:3000/api/v1/medicines
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "type": "قرص",
  "companyName": "فیض",
  "genericName": "پاراسیتامول",
  "dosage": "500mg",
  "frequency": "1x3",
  "mealTiming": "بعد از غذا"
}
```

**Valid Types:**
- قرص (tablet)
- کپسول (capsule)
- سیروپ (syrup)
- انجکشن (injection)
- قطره (drops)
- مرهم (ointment)
- پماد (cream)

**Valid Frequencies:**
- 1x1, 1x2, 1x3, 1x4
- 2x1, 2x2, 2x3
- 3x1, 3x2, 3x3

**Valid Meal Timings:**
- قبل از غذا (before food)
- بعد از غذا (after food)
- بدون توجه به غذا (regardless of food)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 11,
    "type": "قرص",
    "companyName": "فیض",
    "genericName": "پاراسیتامول",
    "dosage": "500mg",
    "frequency": "1x3",
    "mealTiming": "بعد از غذا",
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### 3. Get Single Medicine

```bash
GET http://localhost:3000/api/v1/medicines/1
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "قرص",
    "companyName": "فیض",
    "genericName": "پاراسیتامول",
    "dosage": "500mg",
    "frequency": "1x3",
    "mealTiming": "بعد از غذا",
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### 4. Update Medicine

```bash
PUT http://localhost:3000/api/v1/medicines/1
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "type": "کپسول",
  "companyName": "فیض",
  "genericName": "پاراسیتامول",
  "dosage": "500mg",
  "frequency": "1x2",
  "mealTiming": "قبل از غذا"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "کپسول",
    "companyName": "فیض",
    "genericName": "پاراسیتامول",
    "dosage": "500mg",
    "frequency": "1x2",
    "mealTiming": "قبل از غذا",
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T11:45:00Z"
  }
}
```

---

### 5. Delete Medicine

```bash
DELETE http://localhost:3000/api/v1/medicines/1
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Medicine deleted successfully"
}
```

---

### 6. Search Medicines

```bash
GET http://localhost:3000/api/v1/medicines/search?q=پاراسیتامول
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "قرص",
      "companyName": "فیض",
      "genericName": "پاراسیتامول",
      "dosage": "500mg",
      "frequency": "1x3",
      "mealTiming": "بعد از غذا",
      "createdBy": 1,
      "updatedBy": 1,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

## Sample Test Data

### Medicine 1: Paracetamol Tablet
```json
{
  "type": "قرص",
  "companyName": "فیض",
  "genericName": "پاراسیتامول",
  "dosage": "500mg",
  "frequency": "1x3",
  "mealTiming": "بعد از غذا"
}
```

### Medicine 2: Ambroxol Syrup
```json
{
  "type": "سیروپ",
  "companyName": "داروسازی غرب",
  "genericName": "امبروکسول",
  "dosage": "30mg/5ml",
  "frequency": "2x3",
  "mealTiming": "بدون توجه به غذا"
}
```

### Medicine 3: Amoxicillin Capsule
```json
{
  "type": "کپسول",
  "companyName": "ابوریحان",
  "genericName": "آموکسی سیلین",
  "dosage": "250mg",
  "frequency": "1x3",
  "mealTiming": "قبل از غذا"
}
```

### Medicine 4: Insulin Injection
```json
{
  "type": "انجکشن",
  "companyName": "اکسیر",
  "genericName": "انسولین",
  "dosage": "10 unit",
  "frequency": "1x2",
  "mealTiming": "قبل از غذا"
}
```

### Medicine 5: Eye Drops
```json
{
  "type": "قطره",
  "companyName": "سینا دارو",
  "genericName": "کلرامفنیکل",
  "dosage": "0.5%",
  "frequency": "2x4",
  "mealTiming": "بدون توجه به غذا"
}
```

### Medicine 6: Hydrocortisone Cream
```json
{
  "type": "پماد",
  "companyName": "فارابی",
  "genericName": "هیدروکورتیزون",
  "dosage": "1%",
  "frequency": "2x2",
  "mealTiming": "بدون توجه به غذا"
}
```

### Medicine 7: Diclofenac Ointment
```json
{
  "type": "مرهم",
  "companyName": "زهراوی",
  "genericName": "دیکلوفناک",
  "dosage": "1%",
  "frequency": "1x2",
  "mealTiming": "بدون توجه به غذا"
}
```

---

## Error Responses

### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "type": "Type is required",
    "companyName": "Company name is required",
    "genericName": "Generic name is required",
    "dosage": "Dosage is required",
    "frequency": "Frequency must be one of: 1x1, 1x2, 1x3, 1x4, 2x1, 2x2, 2x3, 3x1, 3x2, 3x3",
    "mealTiming": "Meal timing must be one of: قبل از غذا, بعد از غذا, بدون توجه به غذا"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "You are not logged in! Please log in to get access."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Medicine not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## cURL Examples

### Create Medicine
```bash
curl -X POST http://localhost:3000/api/v1/medicines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "قرص",
    "companyName": "فیض",
    "genericName": "پاراسیتامول",
    "dosage": "500mg",
    "frequency": "1x3",
    "mealTiming": "بعد از غذا"
  }'
```

### Get All Medicines
```bash
curl -X GET "http://localhost:3000/api/v1/medicines?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search Medicines
```bash
curl -X GET "http://localhost:3000/api/v1/medicines/search?q=پاراسیتامول" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Medicine
```bash
curl -X PUT http://localhost:3000/api/v1/medicines/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "کپسول",
    "companyName": "فیض",
    "genericName": "پاراسیتامول",
    "dosage": "500mg",
    "frequency": "1x2",
    "mealTiming": "قبل از غذا"
  }'
```

### Delete Medicine
```bash
curl -X DELETE http://localhost:3000/api/v1/medicines/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
