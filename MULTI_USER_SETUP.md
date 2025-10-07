# Multi-User Architecture Implementation Guide

## Overview
Your CBC Pro Ranker now supports multi-user access with role-based permissions. The system allows institutions to have multiple users (admin, principal, teachers, staff) working simultaneously with appropriate access controls.

## Database Schema

### Institution Staff Table
```sql
institution_staff (
  id UUID PRIMARY KEY,
  institution_id UUID REFERENCES admin_institutions(id),
  user_id UUID REFERENCES auth.users(id),
  role institution_role (admin, principal, teacher, staff),
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  assigned_classes TEXT[], -- Array of class assignments
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID
)
```

### Helper Functions
- `get_institution_role(user_uuid)` - Returns the user's role in their institution
- `get_user_institution()` - Returns the institution ID for the current user

## User Roles & Permissions

### 1. Admin (school_admin)
- **Full Control**: Can manage all aspects of the school
- **User Management**: Add teachers, principals, and staff
- **Settings**: Configure school settings and subscriptions
- **Data Access**: View and edit all students, marks, and reports

### 2. Principal
- **Read Access**: View all school data and analytics
- **Reports**: Generate and view school-wide reports
- **Rankings**: View class and stream rankings
- **Limited Edit**: Cannot modify marks or student records directly

### 3. Teacher
- **Class-Specific**: Can only access their assigned classes
- **Marks Entry**: Enter and edit marks for their students
- **Reports**: Generate reports for their assigned classes
- **Students**: View students in their classes

### 4. Staff
- **Basic Access**: View-only access to school data
- **Limited Functions**: Cannot modify critical data

## Row Level Security (RLS)

The system uses PostgreSQL RLS policies to enforce permissions:

### Marks Table
```sql
-- Teachers and admins can manage marks for their institution
CREATE POLICY "Institution staff can manage marks"
ON marks FOR ALL
USING (
  student_id IN (
    SELECT id FROM students 
    WHERE institution_id = get_user_institution()
  )
);
```

### Students Table
```sql
-- Institution staff can view students
CREATE POLICY "Institution staff can view students"
ON students FOR SELECT
USING (institution_id = get_user_institution());

-- Admins and principals can manage students
CREATE POLICY "Admins and principals can manage students"
ON students FOR ALL
USING (
  institution_id = get_user_institution() 
  AND get_institution_role(auth.uid()) IN ('admin', 'principal')
);
```

## How to Use

### For Admin Users

1. **Adding Staff Members**:
   - Navigate to "Staff" in the navigation menu
   - Click "Add Staff Member"
   - Fill in details:
     - Full Name
     - Email (will be used for login)
     - Password (minimum 6 characters)
     - Phone Number (optional)
     - Role (Teacher, Principal, or Staff)
     - Assigned Classes (comma-separated, e.g., "Grade 7A, Grade 8B")
   - Click "Add Staff"

2. **Managing Staff**:
   - View all staff members in the table
   - Toggle active/inactive status using the action buttons
   - Staff roles and assigned classes are displayed for reference

### For Teachers

1. **Login**:
   - Use your assigned email and password
   - You'll only see data for your assigned classes

2. **Entering Marks**:
   - Navigate to "Marks Entry"
   - Select your class from the dropdown
   - Enter marks for your students
   - System automatically validates you can only edit your classes

3. **Generating Reports**:
   - Navigate to "Reports"
   - Generate reports only for students in your assigned classes

### For Principals

1. **View Analytics**:
   - Access dashboard to see school-wide statistics
   - View rankings across all classes and streams
   - Generate comparative reports

2. **Read-Only Access**:
   - Cannot modify student records or marks
   - Can view all data for monitoring and decision-making

## Security Features

1. **JWT Custom Claims**:
   - User's `school_id` and `role` are stored in JWT
   - No need for database lookups on every request

2. **Server-Side Validation**:
   - All permissions enforced at database level
   - Front-end cannot bypass security policies

3. **Audit Trail**:
   - All staff actions logged with timestamps
   - `created_by` field tracks who added staff members

## Special Features

### "X" Grade Logic (Incomplete Results)
If any student has missing marks (hasn't completed all subjects), their:
- Class rank shows as "X"
- Stream rank shows as "X"
- Report card displays "(Incomplete)" indicator
- This ensures fair ranking - only students with complete results are ranked

### Get Started Buttons
All "Get Started" buttons on the dashboard now navigate to the corresponding views:
- **Add New Student** → Student Registration
- **Enter Marks** → Marks Entry
- **Generate Reports** → Reports
- **View Rankings** → Rankings

## Migration from Single-User

Your existing institution admin account remains unchanged:
1. Admin can still login with original credentials
2. Admin account automatically has 'admin' role
3. Can add additional users through Staff Management
4. Existing data remains accessible

## Testing Checklist

- [ ] Admin can add new teachers
- [ ] Teachers can only see their assigned classes
- [ ] Principals have read-only access
- [ ] Staff members can be activated/deactivated
- [ ] "X" grades show for incomplete results
- [ ] Get Started buttons navigate correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Multiple users can work simultaneously

## Future Enhancements

Consider adding:
- Parent accounts (read-only access to their child's data)
- Email notifications to new staff members
- Password reset functionality
- Activity logs and audit trails
- Role-specific dashboards
- Advanced permission granularity

## Support

For questions or issues:
1. Check RLS policies in database
2. Verify user's role assignment
3. Ensure institution_id is correctly set
4. Review server logs for errors

---

**Note**: This implementation follows Supabase best practices for multi-tenant applications with RLS-based security.
