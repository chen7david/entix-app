# Entix Native Design Language

This document serves as the absolute source of truth for the Entix application dashboard UI/UX architecture. When building or refactoring React components (like the Members page, Media Library, or Playlists), strictly adhere to these spacing, layout, and color principles.

## 1. Core Structural Layout
All standard dashboard pages must follow an identical internal spacing hierarchy to guarantee uniform padding and optical alignment across the monorepo:

### The Shell Pattern
Every feature page nested beneath the `DashboardLayout` must deploy the following scaffolding:
```tsx
return (
    <>
        <Toolbar />
        <div className="p-6">
            <PageHeader />
            <ContentBlocks />
        </div>
    </>
);
```
- **Top Offset:** Always render the global `<Toolbar />` at the root sibling level.
- **Main Container:** The core application body MUST be enveloped inside a simple `<div className="p-6">` master wrapper. Do NOT use arbitrary 100vh height containers (`h-full` or `h-screen`) mapped against the viewport directly, as this visually breaks scrolling overflow semantics.

## 2. Page Headers & Typography
We natively leverage Ant Design `Typography` for semantic HTML weight mapping.

```tsx
import { Typography } from 'antd';
const { Title, Text } = Typography;

<div className="flex justify-between items-center mb-6">
    <div>
        <Title level={2} className="!mb-1">Page Title</Title>
        <Text type="secondary">Actionable subtitle explaining the specific feature layer.</Text>
    </div>
    <div className="flex items-center gap-4">
        {/* Primary Action Buttons */}
    </div>
</div>
```
- **Title Margins:** Ant Design aggressively injects bottom margins into `<Title>`. Always normalize this with structural Tailwind (`!mb-1`).
- **Subtitles:** Always use `<Text type="secondary">` to inherit the native light/dark contrast gray string mapping. Do NOT manually apply Tailwind gray constants to primary reading text.

## 3. Light / Dark Container Colors
Entix utilizes a highly customized mix of Ant Design core components combined with utility Tailwind CSS borders to harmonize Light/Dark inversion.

### Borders and Corner Radii
- **Strict Square Geometry:** All structural dividers must utilize `border-gray-200 dark:border-zinc-800`.
- **Zero Rounding on Media:** Do *not* apply generous border-radius (e.g., `rounded-lg` or `rounded-xl`) to core layout components (like players, queues, or massive grids). Strictly apply `rounded-none` and override any injected styles on libraries like Vidstack to ensure sharp structural framing. Native Ant Design buttons/inputs may retain their atomic rounding.

### The Active "Brand" State
- System active states (such as active playlist sequence tracks) should NOT use heavy `#646cff` hard-coded blocks.
- Soft active highlights (e.g., active queue borders) should use `bg-blue-50/50 dark:bg-blue-900/10 border-blue-500` and utilize tailwind's semantic text coloring (`text-blue-600 dark:text-blue-400`).

## 4. Data Visualization & Charts
When building charts (e.g., `recharts` or `visx`), utilize the following strict color palette to ensure premium aesthetic harmony across all analytical dashes:
- **Primary / Scheduled (Blue):** `#1677FF` (Ant Design Blue-6)
- **Success / Completed (Green):** `#52C41A` (Ant Design Green-6)
- **Warning / Pending (Orange):** `#FAAD14` (Ant Design Gold-6)
- **Danger / Cancelled (Red):** `#FF4D4F` (Ant Design Red-6)
- **Auxiliary Info (Purple):** `#722ED1` (Ant Design Purple-6)
- **Inactive / Absent (Gray/Neutral):** `#E2E8F0` or `#BFBFBF` (Tailwind Slate-200 / Ant Design Gray-5)

*Chart Tooltips & Backgrounds:* Tooltips must be distinctly elevated with `shadow-md`, `border-radius: 8px`, and clean internal padding, avoiding browser-default aesthetics.

## 5. Specific Component Architectures

### Edge-to-Edge Media Rendering
Cinematic Video players (Vidstack `MediaPlayer`) rendering inside forms, sidebars, or content blocks should NOT contain rounded CSS borders directly wrapping the `video` tag. 
They should be encapsulated by a wrapper:
```tsx
<div className="aspect-video w-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-none shadow-sm z-10 transition-colors">
    <MediaPlayer ... />
</div>
```
*Note: We strip arbitrary border rounding because hard rectangular cuts convey a premium, cinematic hardware-accelerated aesthetic.*

### Universal Avatar Icons
Never deploy bulky box/img representations for pure data-grid associations. Use simple SVGs with semantic Tailwinds:
- **Users:** `<Avatar icon={<UserOutlined />} />` (as seen in the Members page)
- **Video Elements:** `<PlaySquareOutlined className="text-purple-500 text-2xl" />`
- **Audio Elements:** `<AudioOutlined className="text-blue-500 text-2xl" />`

### Members Page References
- **Data Tables:** When rendering lists of entities (like the Members table), wrap clickable list items with Tailwind classes like `cursor-pointer hover:bg-gray-50` in light mode to provide user interaction feedback.
- **Avatars:** Display user data structurally with a clear `<Typography.Text strong>` name and a `<Typography.Text type="secondary">` email stacked underneath.
