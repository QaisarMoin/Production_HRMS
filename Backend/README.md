# HRMS Backend API

A comprehensive Human Resource Management System backend built with Node.js, Express, and MongoDB.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Features

- ✅ JWT Authentication
- ✅ Department Management (CRUD)
- ✅ Employee Management
- ✅ Designation Management
- ✅ Employee Category Management
- ✅ Attendance Rules Management
- ✅ Standardized API Response Structure
- ✅ Input Validation
- ✅ Error Handling
- ✅ Protected Routes

## Project Structure

```
Backend/
├── models/              # Database models
│   ├── Department.js
│   ├── Employee.js
│   ├── Designation.js
│   ├── EmployeeCategory.js
│   ├── AttendanceRules.js
│   └── User.js
├── routes/              # API routes
│   ├── auth.js
│   └── departments.js
├── middleware/          # Custom middleware
│   └── auth.js
├── utils/               # Utility functions
│   └── apiResponse.js
├── .env                 # Environment variables
├── index.js            # Entry point
└── package.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add the following:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication

#### Login
- **POST** `/api/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ success, message, data: { user, token } }`

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, message, data: user }`

### Departments

All department routes require authentication and admin/HR role.

#### Get All Departments
- **GET** `/api/departments?page=1&limit=10&search=keyword`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, message, data: departments[], pagination }`

#### Get Single Department
- **GET** `/api/departments/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, message, data: department }`

#### Create Department
- **POST** `/api/departments`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ name, code, description }`
- **Response:** `{ success, message, data: department }`

#### Update Department
- **PUT** `/api/departments/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ name, code, description, headOfDepartment, isActive }`
- **Response:** `{ success, message, data: department }`

#### Delete Department
- **DELETE** `/api/departments/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, message }`

## API Response Structure

All API responses follow this standard structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Error Handling

All errors follow this structure:

```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes with role-based access control
- Input validation
- CORS enabled
- Helmet for security headers

## Database Models

### Department
- name (String, required, unique)
- code (String, required, unique, uppercase)
- description (String)
- headOfDepartment (ObjectId, ref: Employee)
- isActive (Boolean, default: true)

### Employee
- employeeId (String, required, unique)
- firstName (String, required)
- lastName (String, required)
- email (String, required, unique)
- phone (String, required)
- department (ObjectId, ref: Department, required)
- designation (ObjectId, ref: Designation, required)
- category (ObjectId, ref: EmployeeCategory, required)
- dateOfBirth (Date, required)
- dateOfJoining (Date, required)
- gender (Enum: Male, Female, Other, required)
- address (Object)
- isActive (Boolean, default: true)

### Designation
- name (String, required, unique)
- code (String, required, unique, uppercase)
- description (String)
- level (Number, required)
- isActive (Boolean, default: true)

### EmployeeCategory
- name (String, required, unique)
- code (String, required, unique, uppercase)
- description (String)
- isActive (Boolean, default: true)

### AttendanceRules
- name (String, required)
- workStartTime (String, required)
- workEndTime (String, required)
- lateMarkThreshold (Number, default: 15)
- halfDayThreshold (Number, default: 120)
- fullDayThreshold (Number, default: 240)
- overtimeAllowed (Boolean, default: false)
- overtimeThreshold (Number, default: 60)
- isActive (Boolean, default: true)

### User
- email (String, required, unique)
- password (String, required, hashed)
- role (Enum: admin, hr, employee)
- employee (ObjectId, ref: Employee)
- isActive (Boolean, default: true)
- lastLogin (Date)

## Development Guidelines

1. Always use the `ApiResponse` utility for consistent responses
2. Validate all inputs using express-validator
3. Use the `protect` middleware for authenticated routes
4. Use the `authorize` middleware for role-based access control
5. Follow RESTful API conventions
6. Add proper error handling
7. Update this README when adding new features

## License

ISC