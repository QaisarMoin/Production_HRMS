require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const masterRoutes = require('./routes/masters');
const coreHrRoutes = require('./routes/coreHr');
const attendanceRoutes     = require('./routes/attendance');
const reimbursementRoutes  = require('./routes/reimbursement');
const leaveRoutes = require('./routes/leave');
const payrollRoutes = require('./routes/payroll');
const dashboardRoutes = require('./routes/dashboard');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, you might want to whitelist specific origins
    callback(null, true);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log('Request body:', req.body);
  }
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api', masterRoutes);
app.use('/api', coreHrRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', reimbursementRoutes);
app.use('/api', leaveRoutes);
app.use('/api', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HRMS API is running successfully',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});