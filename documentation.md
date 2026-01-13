# MailBuilder - Visual Email Builder Library

A professional drag-and-drop email builder library built with TypeScript. Similar to Mailchimp's email builder with support for variables, flexible styling, and S3/Minio integration.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Block Types](#block-types)
5. [Variables System](#variables-system)
6. [Styling System](#styling-system)
7. [Storage Integration](#storage-integration)
8. [API Reference](#api-reference)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [FilamentPHP Integration Notes](#filamentphp-integration-notes)
11. [Architecture](#architecture)

---

## Installation

```bash
npm install @mailbuilder/core
# or
yarn add @mailbuilder/core
# or
pnpm add @mailbuilder/core
```

### Dependencies

The library requires the following peer dependencies:
- `zustand` - State management
- `uuid` - ID generation
- `@aws-sdk/client-s3` - S3/Minio integration (optional)
- `@aws-sdk/s3-request-presigner` - Signed URLs (optional)

---

## Quick Start

### Basic Usage

```typescript
import { createMailBuilder } from '@mailbuilder/core';

const builder = createMailBuilder({
  container: '#email-editor',
  initialBlocks: [],
  onSave: (data) => {
    console.log('Email saved:', data);
  }
});

// Get HTML output
const html = builder.getHtml();

// Export to file
builder.exportHtml();
```

### With Initial Content

```typescript
import { createMailBuilder, createTextBlock, createButtonBlock } from '@mailbuilder/core';

const builder = createMailBuilder({
  container: '#editor',
  initialBlocks: [
    createTextBlock({ content: '<p>Welcome to our newsletter!</p>' }),
    createButtonBlock({ text: 'Learn More', link: 'https://example.com' }),
  ],
});
```

---

## Configuration

### EditorConfig Options

```typescript
interface EditorConfig {
  // Required: Container element or selector
  container: HTMLElement | string;
  
  // Initial blocks to load
  initialBlocks?: Block[];
  
  // Custom email styles
  initialStyles?: Partial<EmailStyles>;
  
  // Variable definitions for merge tags
  variables?: Variable[];
  
  // Storage configuration for asset uploads
  storage?: StorageConfig;
  
  // Custom theme colors
  theme?: EditorTheme;
  
  // Read-only mode
  readOnly?: boolean;
  
  // Auto-save settings
  autosave?: boolean;
  autosaveInterval?: number; // milliseconds
  
  // History limit
  maxHistoryLength?: number;
  
  // Callbacks
  onBlockSelect?: (block: Block | null) => void;
  onBlockChange?: (blocks: Block[]) => void;
  onSave?: (data: EmailData) => void;
  onAssetUpload?: (file: File) => Promise<string>;
  
  // Custom block types
  customBlocks?: CustomBlockDefinition[];
}
```

### Email Styles

```typescript
interface EmailStyles {
  body: {
    backgroundColor: string;    // Email background
    fontFamily: string;         // Base font
    fontSize: string;           // Base font size
    lineHeight: string;         // Base line height
    color: string;              // Base text color
  };
  container: {
    backgroundColor: string;    // Content area background
    maxWidth: string;           // Email width (typically 600px)
    borderRadius?: string;      // Corner rounding
    padding?: string;           // Inner padding
  };
  link: {
    color: string;              // Link color
    textDecoration: string;     // Link decoration
  };
}
```

---

## Block Types

### Content Blocks

#### Text Block
Rich text content with HTML support.

```typescript
import { createTextBlock } from '@mailbuilder/core';

const textBlock = createTextBlock({
  content: '<p>Hello <strong>{{ first_name }}</strong>!</p>',
  styles: {
    fontSize: '16px',
    color: '#333333',
  }
});
```

#### Heading Block
Heading levels H1-H6.

```typescript
import { createHeadingBlock } from '@mailbuilder/core';

const heading = createHeadingBlock({
  content: 'Welcome to Our Newsletter',
  level: 1,
  styles: {
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center',
  }
});
```

#### Button Block
Call-to-action buttons with customizable styling.

```typescript
import { createButtonBlock } from '@mailbuilder/core';

const button = createButtonBlock({
  text: 'Shop Now',
  link: 'https://example.com/shop',
  buttonStyles: {
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: '6px',
    paddingX: '32px',
    paddingY: '14px',
    fullWidth: false,
  }
});
```

#### List Block
Ordered and unordered lists.

```typescript
import { createListBlock } from '@mailbuilder/core';

const list = createListBlock({
  listType: 'unordered',
  items: [
    { id: '1', content: 'Feature one' },
    { id: '2', content: 'Feature two' },
    { id: '3', content: 'Feature three' },
  ]
});
```

### Media Blocks

#### Image Block
Images with optional linking.

```typescript
import { createImageBlock } from '@mailbuilder/core';

const image = createImageBlock({
  src: 'https://example.com/image.jpg',
  alt: 'Product image',
  link: 'https://example.com/product',
  width: '100%',
});
```

#### Video Block
Video thumbnail with play button overlay.

```typescript
import { createVideoBlock } from '@mailbuilder/core';

const video = createVideoBlock({
  videoUrl: 'https://youtube.com/watch?v=xxxxx',
  playButtonColor: '#ff0000',
});
```

#### Logo Block
Company logo with alignment options.

```typescript
import { createLogoBlock } from '@mailbuilder/core';

const logo = createLogoBlock({
  src: 'https://example.com/logo.png',
  alt: 'Company Logo',
  width: '150px',
  alignment: 'center',
  link: 'https://example.com',
});
```

### Layout Blocks

#### Columns Block
Multi-column layouts (1-4 columns).

```typescript
import { createColumnsBlock, createTextBlock } from '@mailbuilder/core';

const columns = createColumnsBlock(2); // 2 columns, 50% each

// Add content to columns
columns.columns[0].children.push(createTextBlock({ content: 'Left column' }));
columns.columns[1].children.push(createTextBlock({ content: 'Right column' }));
```

#### Divider Block
Horizontal rule separators.

```typescript
import { createDividerBlock } from '@mailbuilder/core';

const divider = createDividerBlock({
  dividerStyles: {
    style: 'solid',      // 'solid' | 'dashed' | 'dotted'
    color: '#e5e7eb',
    thickness: '1px',
    width: '100%',
  }
});
```

#### Spacer Block
Vertical spacing between blocks.

```typescript
import { createSpacerBlock } from '@mailbuilder/core';

const spacer = createSpacerBlock({
  height: '40px',
});
```

### Social & Structure Blocks

#### Social Block
Social media icon links.

```typescript
import { createSocialBlock } from '@mailbuilder/core';

const social = createSocialBlock({
  links: [
    { id: '1', platform: 'facebook', url: 'https://facebook.com/company' },
    { id: '2', platform: 'twitter', url: 'https://twitter.com/company' },
    { id: '3', platform: 'instagram', url: 'https://instagram.com/company' },
  ],
  iconSize: '32px',
  iconStyle: 'color',
  alignment: 'center',
});
```

#### Menu Block
Navigation menu links.

```typescript
import { createMenuBlock } from '@mailbuilder/core';

const menu = createMenuBlock({
  items: [
    { id: '1', text: 'Home', link: '#' },
    { id: '2', text: 'Products', link: '#' },
    { id: '3', text: 'Contact', link: '#' },
  ],
  separator: '|',
  layout: 'horizontal',
});
```

#### Header Block
Email preheader with "view in browser" link.

```typescript
import { createHeaderBlock } from '@mailbuilder/core';

const header = createHeaderBlock({
  showWebVersion: true,
  webVersionText: 'View this email in your browser',
});
```

#### Footer Block
Footer with unsubscribe link and address.

```typescript
import { createFooterBlock } from '@mailbuilder/core';

const footer = createFooterBlock({
  content: '© {{ current_year }} {{ company_name }}',
  showUnsubscribe: true,
  showAddress: true,
  address: '{{ company_address }}',
});
```

#### HTML Block
Custom HTML content.

```typescript
import { createHtmlBlock } from '@mailbuilder/core';

const html = createHtmlBlock({
  content: '<table><tr><td style="border-collapse: collapse;">Custom HTML</td></tr></table>',
});
```

---

## Variables System

### Variable Definition

```typescript
interface Variable {
  id: string;
  name: string;          // Display name
  key: string;           // Variable key (used in {{ key }})
  defaultValue: string;  // Fallback value
  description?: string;
  category?: string;
  required?: boolean;
}
```

### Default Variables

The library includes these default variables:

| Variable | Key | Description |
|----------|-----|-------------|
| First Name | `first_name` | Recipient's first name |
| Last Name | `last_name` | Recipient's last name |
| Email | `email` | Recipient's email |
| Company Name | `company_name` | Your company name |
| Company Address | `company_address` | Your mailing address |
| Unsubscribe Link | `unsubscribe_link` | Unsubscribe URL |
| View in Browser | `view_in_browser_link` | Browser view URL |
| Current Year | `current_year` | Current year (auto) |

### Using Variables in Content

Variables use Handlebars-style syntax:

```html
<p>Hello {{ first_name }},</p>
<p>Thank you for being a {{ company_name }} customer!</p>
```

### Variable Utilities

```typescript
import { 
  parseVariables, 
  replaceVariables, 
  createVariableTag,
  isValidVariableKey 
} from '@mailbuilder/core';

// Parse variables from text
const vars = parseVariables('Hello {{ first_name }}!'); // ['first_name']

// Replace variables with values
const values = new Map([['first_name', 'John']]);
const result = replaceVariables('Hello {{ first_name }}!', values);
// Result: 'Hello John!'

// Create a variable tag
const tag = createVariableTag('email'); // '{{ email }}'

// Validate variable key
isValidVariableKey('first_name'); // true
isValidVariableKey('123invalid'); // false
```

---

## Styling System

### Block Styles

Every block has a `styles` property with these options:

```typescript
interface BlockStyles {
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  
  // Spacing
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  
  // Borders
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderRadius?: string;
  
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  
  // Dimensions
  width?: string;
  maxWidth?: string;
  height?: string;
}
```

### Email-Safe Fonts

```typescript
import { FONT_FAMILIES } from '@mailbuilder/core';

// Available email-safe fonts:
// - Arial
// - Georgia
// - Times New Roman
// - Courier New
// - Verdana
// - Trebuchet MS
// - Tahoma
// - Lucida Sans
// - Palatino
// - Garamond
```

### Style Utilities

```typescript
import { stylesToCss, mergeStyles, parseInlineStyles } from '@mailbuilder/core';

// Convert styles object to CSS string
const css = stylesToCss({
  backgroundColor: '#ffffff',
  padding: '20px',
  fontSize: '16px',
});
// Result: 'background-color: #ffffff; padding: 20px; font-size: 16px'

// Merge multiple style objects
const merged = mergeStyles(baseStyles, customStyles);

// Parse CSS string to styles object
const styles = parseInlineStyles('color: red; font-size: 14px');
```

---

## Storage Integration

### S3 Configuration

```typescript
import { createMailBuilder } from '@mailbuilder/core';

const builder = createMailBuilder({
  container: '#editor',
  storage: {
    type: 's3',
    s3: {
      region: 'us-east-1',
      bucket: 'my-email-assets',
      accessKeyId: 'YOUR_ACCESS_KEY',
      secretAccessKey: 'YOUR_SECRET_KEY',
      pathPrefix: 'emails/',
      publicUrl: 'https://cdn.example.com', // Optional CDN URL
    }
  }
});
```

### Minio Configuration

```typescript
import { createMailBuilder } from '@mailbuilder/core';

const builder = createMailBuilder({
  container: '#editor',
  storage: {
    type: 'minio',
    minio: {
      endpoint: 'minio.example.com',
      port: 9000,
      useSSL: true,
      bucket: 'email-assets',
      accessKey: 'YOUR_ACCESS_KEY',
      secretKey: 'YOUR_SECRET_KEY',
      pathPrefix: 'uploads/',
    }
  }
});
```

### Custom Upload Handler

```typescript
const builder = createMailBuilder({
  container: '#editor',
  onAssetUpload: async (file: File) => {
    // Upload to your own backend
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const { url } = await response.json();
    return url;
  }
});
```

### Storage Provider API

```typescript
import { createStorageProvider } from '@mailbuilder/core';

const storage = createStorageProvider({
  type: 's3',
  s3: { /* config */ }
});

// Upload file
const result = await storage.upload(file, 'custom-path.jpg');
console.log(result.url);

// List files
const files = await storage.list('images/');

// Get signed URL (private access)
const signedUrl = await storage.getSignedUrl('private/image.jpg', 3600);

// Delete file
await storage.delete('path/to/file.jpg');
```

---

## API Reference

### MailBuilder Class

```typescript
class MailBuilder {
  // Add a new block
  addBlock(type: BlockType, index?: number): Block;
  
  // Get all blocks
  getBlocks(): Block[];
  
  // Set all blocks
  setBlocks(blocks: Block[]): void;
  
  // Get complete email data
  getEmailData(): EmailData;
  
  // Get rendered HTML
  getHtml(): string;
  
  // Export HTML to file download
  exportHtml(): string;
  
  // Open preview in new window
  showPreview(): void;
  
  // Load email data
  loadData(data: EmailData): void;
  
  // Destroy editor instance
  destroy(): void;
}
```

### Store (Zustand)

```typescript
import { useEditorStore } from '@mailbuilder/core';

// Get state
const blocks = useEditorStore.getState().blocks;
const selectedId = useEditorStore.getState().selectedBlockId;

// Actions
useEditorStore.getState().addBlock(block, index);
useEditorStore.getState().updateBlock(id, updates);
useEditorStore.getState().deleteBlock(id);
useEditorStore.getState().moveBlock(id, toIndex);
useEditorStore.getState().duplicateBlock(id);
useEditorStore.getState().selectBlock(id);
useEditorStore.getState().undo();
useEditorStore.getState().redo();

// Subscribe to changes
const unsubscribe = useEditorStore.subscribe((state) => {
  console.log('State changed:', state);
});
```

### Email Renderer

```typescript
import { EmailRenderer, renderEmail } from '@mailbuilder/core';

// Using class
const renderer = new EmailRenderer(emailStyles, variables);
const html = renderer.render(blocks, {
  includeWrapper: true,  // Include <!DOCTYPE> wrapper
  minify: false,
});

// Using function
const html = renderEmail(blocks, emailStyles, variables, options);
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate selected block |
| `Delete` / `Backspace` | Delete selected block |
| `Escape` | Deselect block |
| `↑` Arrow Up | Select previous block |
| `↓` Arrow Down | Select next block |
| `Ctrl+↑` | Move block up |
| `Ctrl+↓` | Move block down |
| `Ctrl++` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |

---

## FilamentPHP Integration Notes

This library is designed to be integrated with FilamentPHP for Laravel applications. Here's the planned approach:

### Filament Field Component

```php
namespace App\Forms\Components;

use Filament\Forms\Components\Field;

class MailBuilderField extends Field
{
    protected string $view = 'forms.components.mail-builder';
    
    protected array $variables = [];
    protected ?array $storageConfig = null;
    
    public function variables(array $variables): static
    {
        $this->variables = $variables;
        return $this;
    }
    
    public function storage(array $config): static
    {
        $this->storageConfig = $config;
        return $this;
    }
}
```

### Blade View

```blade
<div
    x-data="mailBuilderComponent({
        state: $wire.entangle('{{ $getStatePath() }}'),
        variables: @js($getVariables()),
        storage: @js($getStorageConfig()),
    })"
    wire:ignore
>
    <div x-ref="editor" class="h-[600px]"></div>
</div>

@push('scripts')
<script>
    document.addEventListener('alpine:init', () => {
        Alpine.data('mailBuilderComponent', (config) => ({
            builder: null,
            
            init() {
                import('@mailbuilder/core').then(({ createMailBuilder }) => {
                    this.builder = createMailBuilder({
                        container: this.$refs.editor,
                        initialBlocks: config.state?.blocks || [],
                        variables: config.variables,
                        storage: config.storage,
                        onBlockChange: (blocks) => {
                            config.state = { blocks };
                        }
                    });
                });
            },
            
            destroy() {
                this.builder?.destroy();
            }
        }));
    });
</script>
@endpush
```

### Laravel Controller for Asset Upload

```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmailAssetController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:10240',
        ]);
        
        $path = $request->file('file')->store('email-assets', 's3');
        
        return response()->json([
            'url' => Storage::disk('s3')->url($path),
            'path' => $path,
        ]);
    }
}
```

---

## Architecture

### Project Structure

```
src/
├── blocks/
│   ├── factory.ts       # Block creation functions
│   └── index.ts
├── editor/
│   ├── DragDropManager.ts   # Drag and drop handling
│   ├── KeyboardManager.ts   # Keyboard shortcuts
│   ├── MailBuilder.ts       # Main editor class
│   └── index.ts
├── renderer/
│   ├── EmailRenderer.ts     # HTML email rendering
│   └── index.ts
├── storage/
│   ├── S3Provider.ts        # AWS S3 integration
│   ├── MinioProvider.ts     # Minio integration
│   └── index.ts
├── store/
│   └── index.ts             # Zustand state store
├── types/
│   ├── blocks.ts            # Block type definitions
│   ├── editor.ts            # Editor type definitions
│   ├── storage.ts           # Storage type definitions
│   ├── styles.ts            # Style type definitions
│   ├── variables.ts         # Variable type definitions
│   └── index.ts
├── utils/
│   ├── html.ts              # HTML utilities
│   ├── id.ts                # ID generation
│   ├── styles.ts            # Style utilities
│   └── index.ts
└── index.ts                 # Main exports
```

### State Management

The editor uses Zustand for state management with these key features:

- **Immutable updates**: All state changes create new objects
- **History**: Undo/redo with configurable history length
- **Subscriptions**: React-style subscriptions for state changes
- **Persistence ready**: Easy to persist state to localStorage or API

### Email Rendering

The `EmailRenderer` class generates email-safe HTML:

- **Table-based layouts**: For maximum email client compatibility
- **Inline styles**: All CSS is inlined for email clients
- **MSO conditionals**: Special handling for Outlook
- **Responsive**: Mobile-first with media queries
- **Variable replacement**: Merge tags processed at render time

---

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/mailbuilder.git
cd mailbuilder

# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build

# Run tests
npm test
```

### Building for Production

```bash
npm run build:lib
```

This generates:
- `dist/mailbuilder.es.js` - ES module
- `dist/mailbuilder.umd.js` - UMD bundle
- `dist/index.d.ts` - TypeScript declarations

---

## License

MIT License - see LICENSE file for details.

---

## Changelog

### v1.0.0
- Initial release
- 16 block types
- Variable/merge tag system
- S3 and Minio storage integration
- Drag and drop editor
- Undo/redo history
- Mobile preview
- HTML export
- Keyboard shortcuts
