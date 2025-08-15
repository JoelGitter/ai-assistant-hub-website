# AI Assistant Hub Website

A comprehensive resource website for AI browser assistants and automation tools.

## 🚀 Features

- **Smart Form Filling**: AI-powered form automation
- **Page Summarization**: Instant content summaries
- **Responsive Design**: Mobile-friendly interface
- **Blog Section**: Educational content about AI tools
- **Chrome Extension Integration**: Direct links to browser extension

## 📁 Project Structure

```
ai-assistant-hub-website/
├── index.html              # Main landing page
├── css/                    # Stylesheets
│   ├── style.css          # Main styles
│   └── responsive.css     # Responsive design
├── js/                     # JavaScript files
│   └── main.js            # Main functionality
├── images/                 # Images and icons
├── blog/                   # Blog articles
├── icons/                  # Extension icons
├── config-live.js          # Configuration file
├── package.json            # Node.js configuration
├── wrangler.toml           # Cloudflare Pages config
└── build.js                # Build validation script
```

## 🛠️ Development

This is a static website that doesn't require a build process. To run locally:

1. Clone the repository
2. Open `index.html` in your browser
3. Or use a local server: `python -m http.server 8000`

## 🚀 Deployment

### Cloudflare Pages

The site is configured for Cloudflare Pages deployment:

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Build output directory: `.` (root)
4. The build script validates all required files

### Manual Deployment

Upload all files to your web server. The site works as a static website.

## 📝 Build Process

The build script (`build.js`) validates:
- All required HTML, CSS, and JavaScript files exist
- Blog directory structure is correct
- Configuration files are present

## 🔧 Configuration

Edit `config-live.js` to modify:
- API endpoints
- Feature flags
- Stripe keys
- Environment settings

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📄 License

MIT License - see LICENSE file for details.
