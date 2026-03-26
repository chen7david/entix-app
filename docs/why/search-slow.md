# Why is the search field responding so slow?

If you are typing into a search field (like the one on the Organization Members page or the Media Library Table) and noticing a delay before the results update, **this is intentional by design.**

## The Problem
When a user types "Alex" into a search box, they generate 4 separate keystrokes (`A`, `l`, `e`, `x`). If our React components were tightly coupled directly to our TanStack Query hooks, we would fire off 4 independent backend requests to our Cloudflare D1 database in the span of milliseconds. 

This leads to:
1. **Database Spam:** Rapid, unnecessary reads that consume compute resources.
2. **Race Conditions:** If the request for "A" takes longer than the request for "Alex", the user might see results for "A" pop into the table out of order.
3. **UI Thrashing:** The screen loading indicator flickers instantly as requests overlap.

## The Solution: TanStack Pacer
To provide a smooth, resilient experience, we use **TanStack Pacer** (`@tanstack/react-pacer`).

We decouple the "raw" React input state from the database fetch by passing the input into `useDebouncedValue`.

```tsx
import { UI_CONSTANTS } from '@web/src/utils/constants';
import { useDebouncedValue } from '@tanstack/react-pacer';

const [searchText, setSearchText] = useState('');

// 1. Debounce the Local State
const [debouncedSearch, control] = useDebouncedValue(
    searchText,
    { wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE }, // Exactly 500ms delay!
    (state) => ({ isPending: state.isPending })
);

// 2. Only Pass the Debounced Value to the Query Hook
const { media } = useMedia(debouncedSearch);
```

### The result:
- The `searchText` updates instantly on every keystroke, keeping the text box responsive.
- The `debouncedSearch` string stays frozen until the user *stops* typing for `500ms` (as defined in `UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE`).
- During that 500ms wait, `control.state.isPending` surfaces as `true`, which powers the `...typing` indicator.

**Do not reduce this to `0ms` or remove the debouncer to "fix" the speed.** Doing so will immediately revert the application to spamming the backend on every keystroke.
