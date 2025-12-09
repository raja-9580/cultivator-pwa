# Component Naming Conventions

## Modal Components

**Modal** components are overlay/popup components that appear on top of the page.

### Characteristics:
- ✅ Has `isOpen` prop (boolean) - Controls visibility
- ✅ Has `onClose` handler - Dismisses the modal
- ✅ Renders with backdrop/overlay
- ✅ Blocks interaction with rest of page
- ✅ Can be dismissed by user (close button, ESC key, backdrop click)

### Naming Convention:
**Always use `Modal` suffix** for these components.

**Examples:**
```
PrepareBatchModal.tsx      ✅ Correct
PlanBatchModal.tsx         ✅ Correct  
BatchMetricsWizardModal.tsx ✅ Correct
```

### When to use Modal:
- User workflows that require focus (wizards, multi-step forms)
- Creating/editing data
- Confirmations and alerts
- Any temporary overlay UI

---

## Regular Components

**Regular** components are part of the normal page flow (not popups).

### Characteristics:
- ❌ No `isOpen` prop
- ❌ No overlay/backdrop
- ✅ Always visible when rendered
- ✅ Part of the document flow
- ✅ Cannot be "dismissed"

### Naming Convention:
**No special suffix needed** - just the component's purpose.

**Examples:**
```
BatchCard.tsx         ✅ Displays batch information in a card
Button.tsx            ✅ A reusable button component
SubstrateMix.tsx      ✅ Shows substrate composition
BagletsList.tsx       ✅ Displays list of baglets
```

### When to use Regular Components:
- Page sections and layouts
- Data display (cards, lists, tables)
- Reusable UI elements (buttons, inputs)
- Any non-overlay UI

---

## Quick Decision Guide

**Ask yourself:** "Can this be closed/dismissed to reveal the page behind it?"
- **YES** → It's a Modal → Use `Modal` suffix
- **NO** → It's a Regular Component → No suffix needed

---

## Component Examples in This Project

### Modals (have `Modal` suffix):
| Component | Purpose |
|-----------|---------|
| `PlanBatchModal` | Create/plan a new batch (multi-step wizard) |
| `PrepareBatchModal` | Prepare batch with recipe checklist + metrics |
| `BatchMetricsWizardModal` | Rapid metrics entry for multiple baglets |

### Regular Components (no suffix):
| Component | Purpose |
|-----------|---------|
| `BatchCard` | Display batch info in list view |
| `BagletsList` | Show all baglets in a batch |
| `SubstrateMix` | Display substrate composition |
| `BagletStatusDistribution` | Show status breakdown chart |
| `Button` | Reusable button |
| `Card` | Reusable card container |

---

## Why This Matters

**Benefits of consistent naming:**
1. **Instant recognition** - Developers know immediately if component is a modal
2. **Better organization** - Easy to find all modals in codebase
3. **Code clarity** - Props like `isOpen` and `onClose` make sense
4. **Standard convention** - Follows industry best practices

**Without the suffix:**
```typescript
// Confusing - is this a modal or regular component?
import BatchMetricsWizard from './BatchMetricsWizard';
```

**With the suffix:**
```typescript
// Clear - obviously a modal!
import BatchMetricsWizardModal from './BatchMetricsWizardModal';
```
