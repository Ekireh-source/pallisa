# Expenses Module Documentation

## Overview

The Expenses module is a comprehensive expense tracking system for the Pallisa School Management System. It allows schools to track expenditures like salaries, maintenance, utilities, and more, while associating each expense with departments, vendors, academic terms, and the staff member who recorded it.

## Features

- ✅ **Expense Categorization**: Organize expenses by categories (salaries, utilities, maintenance, etc.)
- ✅ **Department Tracking**: Associate expenses with specific school departments
- ✅ **Vendor Management**: Track vendors/suppliers and their expenses
- ✅ **Academic Term Association**: Link expenses to specific academic terms
- ✅ **Approval Workflow**: Require approval for expenses with audit trail
- ✅ **Receipt Management**: Upload and store receipt images
- ✅ **Comprehensive Filtering**: Filter expenses by category, department, date, etc.
- ✅ **Summary Reports**: Get expense summaries and statistics
- ✅ **Django Admin Integration**: Full admin interface with custom features

## Models

### ExpenseCategory
Categorizes expenses like salaries, utilities, maintenance, etc.

**Fields:**
- `name`: Category name (unique)
- `description`: Optional description
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### Term
Represents academic terms/semesters.

**Fields:**
- `name`: Term name (e.g., "Term 1", "Semester 1")
- `academic_year`: Academic year (e.g., "2024/2025")
- `start_date`, `end_date`: Term duration
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

**Constraints:**
- Unique together: `name` + `academic_year`

### Department
School departments like Administration, Academics, Sports, etc.

**Fields:**
- `name`: Department name
- `description`: Optional description
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### Vendor
Vendors/suppliers the school does business with.

**Fields:**
- `name`: Vendor name
- `contact`: Contact person
- `email`: Email address
- `phone`: Phone number
- `address`: Physical address
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### Expense
Main expense model to track all school expenditures.

**Fields:**
- `title`: Expense title
- `description`: Optional description
- `amount`: Expense amount (decimal, 12 digits, 2 decimal places)
- `category`: Foreign key to ExpenseCategory (PROTECT)
- `department`: Foreign key to Department (SET_NULL, optional)
- `vendor`: Foreign key to Vendor (SET_NULL, optional)
- `term`: Foreign key to Term (SET_NULL, optional)
- `incurred_on`: Date when expense was incurred
- `recorded_by`: User who recorded the expense
- `approved`: Approval status (boolean)
- `approved_by`: User who approved the expense
- `approved_at`: Timestamp of approval
- `receipt_image`: Receipt image upload
- `invoice_number`: Invoice reference
- `payment_method`: Payment method (cash, bank_transfer, etc.)
- `created_at`, `updated_at`: Timestamps

**Properties:**
- `status`: Returns "Approved" or "Pending Approval"

## API Endpoints

### Expense Categories

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/expenses/categories/` | List all expense categories |
| POST | `/expenses/categories/` | Create new expense category |
| GET | `/expenses/categories/{id}/` | Get specific category |
| PUT | `/expenses/categories/{id}/` | Update category |
| DELETE | `/expenses/categories/{id}/` | Soft delete category |

### Terms

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/expenses/terms/` | List all academic terms |
| POST | `/expenses/terms/` | Create new term |
| GET | `/expenses/terms/{id}/` | Get specific term |
| PUT | `/expenses/terms/{id}/` | Update term |
| DELETE | `/expenses/terms/{id}/` | Soft delete term |

### Departments

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/expenses/departments/` | List all departments |
| POST | `/expenses/departments/` | Create new department |
| GET | `/expenses/departments/{id}/` | Get specific department |
| PUT | `/expenses/departments/{id}/` | Update department |
| DELETE | `/expenses/departments/{id}/` | Soft delete department |

### Vendors

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/expenses/vendors/` | List all vendors |
| POST | `/expenses/vendors/` | Create new vendor |
| GET | `/expenses/vendors/{id}/` | Get specific vendor |
| PUT | `/expenses/vendors/{id}/` | Update vendor |
| DELETE | `/expenses/vendors/{id}/` | Soft delete vendor |

### Expenses

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/expenses/` | List all expenses with filtering |
| POST | `/expenses/create/` | Create new expense |
| GET | `/expenses/{id}/` | Get specific expense |
| PUT | `/expenses/{id}/` | Update expense |
| DELETE | `/expenses/{id}/` | Delete expense |
| PATCH | `/expenses/{id}/approve/` | Approve/disapprove expense |
| GET | `/expenses/summary/` | Get expense summary statistics |

### Filtering Parameters for Expense List

- `category`: Filter by category ID
- `department`: Filter by department ID
- `vendor`: Filter by vendor ID
- `term`: Filter by term ID
- `approved`: Filter by approval status (true/false)
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)
- `search`: Search in title and description

### Summary Parameters

- `year`: Filter by year
- `month`: Filter by month (1-12)
- `term`: Filter by term ID

## Authentication & Permissions

All endpoints require authentication using JWT tokens. Additional business rules:

- **Expense Creation**: Any authenticated user can create expenses
- **Expense Editing**: Only the person who recorded the expense can edit it (unless it's approved)
- **Expense Approval**: Users cannot approve their own expenses
- **Admin Permissions**: Superusers can override most restrictions

## Usage Examples

### Create an Expense Category

```bash
curl -X POST http://localhost:8000/expenses/categories/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Supplies",
    "description": "General office supplies and materials"
  }'
```

### Create an Expense

```bash
curl -X POST http://localhost:8000/expenses/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Office Chairs" \
  -F "description=10 ergonomic office chairs" \
  -F "amount=1500.00" \
  -F "category=1" \
  -F "department=1" \
  -F "incurred_on=2024-01-15" \
  -F "payment_method=bank_transfer" \
  -F "receipt_image=@receipt.jpg"
```

### List Expenses with Filters

```bash
# Get all expenses for a specific category
curl "http://localhost:8000/expenses/?category=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get pending expenses from last month
curl "http://localhost:8000/expenses/?approved=false&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve an Expense

```bash
curl -X PATCH http://localhost:8000/expenses/1/approve/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

### Get Expense Summary

```bash
# Get summary for current year
curl "http://localhost:8000/expenses/summary/?year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Django Admin Features

The expense module includes a comprehensive Django admin interface with:

### ExpenseCategory Admin
- List view with expense count
- Filtering by active status and creation date
- Search by name and description

### Expense Admin
- Advanced list view with formatted amounts and approval status
- Filtering by approval, category, department, term, vendor, payment method, and dates
- Date hierarchy navigation
- Bulk approval/disapproval actions
- Custom permissions based on approval status
- Fieldsets for organized editing
- Color-coded approval status

### Additional Features
- Soft deletion (sets `is_active=False`)
- Related object links
- Custom display methods with links to filtered lists
- Readonly fields for audit trail
- Custom save logic for approval workflow

## Testing

The module includes comprehensive tests covering:

- Model creation and validation
- API endpoints and authentication
- Filtering and search functionality
- Approval workflow and permissions
- Constraint validation
- Error handling

Run tests with:
```bash
python manage.py test expenses
```

## Database Indexes

The module includes optimized database indexes for:
- Category lookups
- Department filtering
- Date-based queries
- Approval status filtering
- User-based queries
- Term associations

## File Uploads

Receipt images are stored in `media/expenses/receipts/` directory. Ensure your Django settings include proper media file handling for production deployments.

## Integration

The expenses module integrates seamlessly with the existing Pallisa system:
- Uses the custom user model from the accounts app
- Follows the same authentication patterns
- Compatible with the existing permission system
- Consistent API documentation with drf-spectacular

## Future Enhancements

Potential future improvements:
- Expense templates for recurring expenses
- Budget tracking and alerts
- Advanced reporting with charts
- Integration with accounting systems
- Mobile app support
- Expense reimbursement workflow
- Multi-currency support 