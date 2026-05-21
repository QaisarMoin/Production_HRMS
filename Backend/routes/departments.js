const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Department = require('../models/Department');
const ApiResponse = require('../utils/apiResponse');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('admin', 'hr'));

// @route   POST /api/departments
// @desc    Create a new department
// @access  Private (Admin, HR)
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('code').trim().notEmpty().withMessage('Department code is required'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, 'Validation failed', errors.array());
      }

      const { name, code, description } = req.body;

      // Check if department with same name or code exists
      const existingDepartment = await Department.findOne({
        $or: [{ name }, { code: code.toUpperCase() }]
      });

      if (existingDepartment) {
        return ApiResponse.error(res, 'Department with this name or code already exists', null, 400);
      }

      // Create department
      const department = await Department.create({
        name,
        code: code.toUpperCase(),
        description
      });

      return ApiResponse.created(res, 'Department created successfully', department);
    } catch (error) {
      console.error('Create department error:', error);
      return ApiResponse.error(res, 'Error creating department', null, 500);
    }
  }
);

// @route   GET /api/departments
// @desc    Get all departments with pagination and search
// @access  Private (Admin, HR)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]
    };

    // Get departments with pagination
    const departments = await Department.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('headOfDepartment', 'firstName lastName email');

    // Get total count for pagination
    const total = await Department.countDocuments(query);

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };

    return ApiResponse.success(res, 'Departments fetched successfully', departments, 200, pagination);
  } catch (error) {
    console.error('Get departments error:', error);
    return ApiResponse.error(res, 'Error fetching departments', null, 500);
  }
});

// @route   GET /api/departments/:id
// @desc    Get single department
// @access  Private (Admin, HR)
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headOfDepartment', 'firstName lastName email');

    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    return ApiResponse.success(res, 'Department fetched successfully', department);
  } catch (error) {
    console.error('Get department error:', error);
    return ApiResponse.error(res, 'Error fetching department', null, 500);
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin, HR)
router.put('/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
    body('code').optional().trim().notEmpty().withMessage('Department code cannot be empty'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, 'Validation failed', errors.array());
      }

      const { name, code, description, headOfDepartment, isActive } = req.body;

      // Check if department exists
      let department = await Department.findById(req.params.id);
      if (!department) {
        return ApiResponse.notFound(res, 'Department not found');
      }

      // Check if another department with same name or code exists
      if (name || code) {
        const existingDepartment = await Department.findOne({
          _id: { $ne: req.params.id },
          $or: [
            ...(name ? [{ name }] : []),
            ...(code ? [{ code: code.toUpperCase() }] : [])
          ]
        });

        if (existingDepartment) {
          return ApiResponse.error(res, 'Department with this name or code already exists', null, 400);
        }
      }

      // Update department
      department = await Department.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name }),
          ...(code && { code: code.toUpperCase() }),
          ...(description !== undefined && { description }),
          ...(headOfDepartment !== undefined && { headOfDepartment }),
          ...(isActive !== undefined && { isActive })
        },
        { new: true, runValidators: true }
      ).populate('headOfDepartment', 'firstName lastName email');

      return ApiResponse.success(res, 'Department updated successfully', department);
    } catch (error) {
      console.error('Update department error:', error);
      return ApiResponse.error(res, 'Error updating department', null, 500);
    }
  }
);

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Admin, HR)
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    await Department.findByIdAndDelete(req.params.id);

    return ApiResponse.success(res, 'Department deleted successfully');
  } catch (error) {
    console.error('Delete department error:', error);
    return ApiResponse.error(res, 'Error deleting department', null, 500);
  }
});

module.exports = router;