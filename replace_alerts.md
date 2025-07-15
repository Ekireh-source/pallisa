# Alert Replacement Guide

I've successfully created a reusable `ConfirmationModal` component and replaced alerts in several key pages. Here's what has been completed and what needs to be done:

## ✅ Completed Pages:
1. **Student Detail Page** (`/members/students/[id]/page.tsx`) - Delete and Restore modals
2. **Teacher Detail Page** (`/members/teachers/[id]/page.tsx`) - Delete modal  
3. **Students List Page** (`/members/students/page.tsx`) - Delete modal
4. **Teachers List Page** (`/members/teachers/page.tsx`) - Delete modal

## 🔄 Remaining Pages to Update:

### Members Management:
- `/members/classes/page.tsx` - Line 43
- `/members/classes/[id]/page.tsx` - Line 42
- `/members/subjects/page.tsx` - Line 36
- `/members/streams/page.tsx` - Line 36
- `/members/parents/page.tsx` - Line 56

### Expense Management:
- `/expenses/[id]/page.tsx` - Line 60
- `/components/expenses/ExpenseCard.tsx` - Line 143

### Other Management:
- `/categories/page.tsx` - Line 37
- `/departments/page.tsx` - Line 37
- `/vendors/page.tsx` - Line 38
- `/terms/page.tsx` - Line 37
- `/academic-years/page.tsx` - Line 36
- `/fees/categories/page.tsx` - Line 45

## 📋 Implementation Pattern:

For each page, follow this pattern:

1. **Import the modal:**
```tsx
import { ConfirmationModal } from '@/components/ui';
```

2. **Add state:**
```tsx
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [itemToDelete, setItemToDelete] = useState<number | null>(null);
```

3. **Replace window.confirm:**
```tsx
// Before:
if (window.confirm('Are you sure...')) {
  // delete logic
}

// After:
const handleDelete = (id: number) => {
  setItemToDelete(id);
  setShowDeleteModal(true);
};

const confirmDelete = async () => {
  if (itemToDelete) {
    await dispatch(deleteItem(itemToDelete));
    setShowDeleteModal(false);
    setItemToDelete(null);
  }
};
```

4. **Add modal component:**
```tsx
<ConfirmationModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={confirmDelete}
  title="Confirm Deletion"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
/>
```

## 🎨 Modal Features:
- **Variants**: `danger`, `warning`, `info`, `success`
- **Loading states**: Shows "Processing..." when `isLoading={true}`
- **Accessible**: Uses Radix UI Dialog for proper accessibility
- **Responsive**: Works on all screen sizes
- **Customizable**: Configurable title, message, and button text

## 🚀 Next Steps:
1. Follow the pattern above for each remaining page
2. Test each modal to ensure proper functionality
3. Consider adding loading states for async operations
4. Add success/error notifications after operations complete 