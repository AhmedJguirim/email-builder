# MailBuilder

A professional drag-and-drop email builder library built with TypeScript. Create beautiful, responsive emails with an intuitive visual editor similar to Mailchimp.

![MailBuilder Demo](https://via.placeholder.com/800x400?text=MailBuilder+Demo)

## ✨ Features

- 🎨 **Visual Drag & Drop Editor** - Intuitive block-based editing
- 📱 **Responsive Preview** - Desktop and mobile preview modes
- 🔤 **Variables/Merge Tags** - Dynamic content with `{{ variable }}` syntax
- 📦 **16+ Block Types** - Text, images, buttons, columns, social links, and more
- 🎯 **Flexible Styling** - Full control over colors, spacing, typography
- ☁️ **S3/Minio Integration** - Seamless asset management
- ⌨️ **Keyboard Shortcuts** - Undo, redo, delete, duplicate, and more
- 📧 **Email-Safe HTML** - Generates compatible HTML for all email clients
- 🔧 **TypeScript** - Full type definitions included
- 🎭 **Customizable** - Themes, custom blocks, and callbacks

## 🚀 Quick Start

### Installation

```bash
npm install @mailbuilder/core
```

### Basic Usage

```typescript
import { createMailBuilder } from '@mailbuilder/core';

const builder = createMailBuilder({
  container: '#editor',
  onSave: (data) => {
    console.log('Saved:', data);
  }
});

// Get HTML
const html = builder.getHtml();
```

### With Initial Content

```typescript
import { createMailBuilder, createTextBlock, createButtonBlock } from '@mailbuilder/core';

const builder = createMailBuilder({
  container: '#editor',
  initialBlocks: [
    createTextBlock({ content: '<p>Hello {{ first_name }}!</p>' }),
    createButtonBlock({ 
      text: 'Shop Now', 
      link: 'https://example.com',
      buttonStyles: {
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
      }
    }),
  ],
  variables: [
    { id: '1', name: 'First Name', key: 'first_name', defaultValue: 'there' },
  ],
});
```

## 📦 Block Types

| Block | Description |
|-------|-------------|
| **Text** | Rich text with HTML support |
| **Heading** | H1-H6 headings |
| **Image** | Images with optional linking |
| **Button** | CTA buttons with full styling |
| **Divider** | Horizontal separators |
| **Spacer** | Vertical spacing |
| **Columns** | Multi-column layouts (1-4) |
| **Social** | Social media icon links |
| **Video** | Video thumbnails with play button |
| **Menu** | Navigation links |
| **Logo** | Company logo with alignment |
| **Header** | Preheader with "view in browser" |
| **Footer** | Footer with unsubscribe |
| **List** | Ordered/unordered lists |
| **HTML** | Custom HTML content |

## ☁️ Storage Integration

### AWS S3

```typescript
createMailBuilder({
  container: '#editor',
  storage: {
    type: 's3',
    s3: {
      region: 'us-east-1',
      bucket: 'my-assets',
      accessKeyId: 'YOUR_KEY',
      secretAccessKey: 'YOUR_SECRET',
    }
  }
});
```

### Minio

```typescript
createMailBuilder({
  container: '#editor',
  storage: {
    type: 'minio',
    minio: {
      endpoint: 'minio.example.com',
      port: 9000,
      bucket: 'assets',
      accessKey: 'YOUR_KEY',
      secretKey: 'YOUR_SECRET',
    }
  }
});
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+D` | Duplicate block |
| `Delete` | Delete block |
| `Escape` | Deselect |
| `Ctrl+↑/↓` | Move block |

## 🎨 Customization

### Custom Styles

```typescript
createMailBuilder({
  container: '#editor',
  initialStyles: {
    body: {
      backgroundColor: '#f0f0f0',
      fontFamily: 'Georgia, serif',
    },
    container: {
      backgroundColor: '#ffffff',
      maxWidth: '600px',
    },
  }
});
```

### Callbacks

```typescript
createMailBuilder({
  container: '#editor',
  onBlockSelect: (block) => console.log('Selected:', block),
  onBlockChange: (blocks) => console.log('Changed:', blocks),
  onSave: (data) => saveToApi(data),
  onAssetUpload: async (file) => {
    const url = await uploadToServer(file);
    return url;
  },
});
```

## 📖 Documentation

See [documentation.md](./documentation.md) for complete API reference and usage examples.

## 🔧 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build library
npm run build

# Run tests
npm test
```

## 🗺️ Roadmap

- [ ] React component wrapper
- [ ] Vue component wrapper
- [x] FilamentPHP integration (Laravel) - See documentation
- [ ] Template library
- [ ] Collaborative editing
- [ ] AI content generation

## 📄 License

MIT © 2024

---

Built with ❤️ for email marketers and developers.
