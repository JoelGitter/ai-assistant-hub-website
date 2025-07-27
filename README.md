# AI Assistant Hub Website

A modern, responsive website for the AI Assistant Hub Chrome extension. Built with HTML5, CSS3, and vanilla JavaScript.

## Features

- 🎨 **Modern Design**: Clean, professional design with smooth animations
- 📱 **Fully Responsive**: Works perfectly on all devices and screen sizes
- ⚡ **Fast Performance**: Optimized for speed with lazy loading and efficient code
- 🔍 **SEO Optimized**: Proper meta tags, structured data, and semantic HTML
- ♿ **Accessible**: WCAG compliant with proper ARIA labels and keyboard navigation
- 🌙 **Dark Mode Support**: Automatic dark mode detection
- 📊 **Analytics Ready**: Google Analytics 4 integration
- 📧 **Contact Form**: Functional contact form with validation

## File Structure

```
website/
├── index.html              # Main homepage
├── css/
│   ├── style.css          # Main stylesheet
│   └── responsive.css     # Responsive design rules
├── js/
│   └── main.js           # JavaScript functionality
├── images/
│   ├── logo.svg          # Website logo
│   ├── hero-extension.png # Hero section image
│   ├── step-1.png        # How it works images
│   ├── step-2.png
│   ├── step-3.png
│   └── favicon files
├── privacy-policy.html    # Privacy policy page
├── terms-of-service.html  # Terms of service page
└── README.md             # This file
```

## Deployment to Cloudflare Pages

### Option 1: GitHub Integration (Recommended)

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-assistant-hub-website.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project"
   - Choose "Connect to Git"
   - Select your GitHub repository
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: Leave empty
     - **Build output directory**: Leave empty
     - **Root directory**: Leave empty

3. **Deploy**
   - Click "Save and Deploy"
   - Your site will be available at `https://your-project-name.pages.dev`

### Option 2: Direct Upload

1. **Zip the website files**
   ```bash
   cd website
   zip -r ../ai-assistant-hub-website.zip .
   ```

2. **Upload to Cloudflare Pages**
   - Go to Cloudflare Pages
   - Click "Create a project"
   - Choose "Direct Upload"
   - Upload your ZIP file
   - Deploy

## Customization

### Colors and Branding

Update the CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #6366f1;      /* Your brand color */
    --primary-dark: #4f46e5;       /* Darker shade */
    --secondary-color: #10b981;    /* Accent color */
    --accent-color: #fbbf24;       /* Highlight color */
}
```

### Content Updates

1. **Update Extension Links**: Replace Chrome Web Store URLs in `index.html`
2. **Update Contact Information**: Change email addresses and contact details
3. **Update Analytics**: Replace `G-XXXXXXXXXX` with your actual GA4 ID in `js/main.js`

### Images

Replace placeholder images in the `images/` folder:
- `hero-extension.png` - Screenshot of your extension
- `step-1.png`, `step-2.png`, `step-3.png` - How it works screenshots
- Add favicon files (16x16, 32x32, 180x180)

## Performance Optimization

The website is already optimized for performance:

- ✅ **Minified CSS and JS** (consider using build tools for production)
- ✅ **Optimized images** (use WebP format when possible)
- ✅ **Lazy loading** for images
- ✅ **Efficient animations** with CSS transforms
- ✅ **Preloaded critical resources**

## SEO Setup

The website includes:

- ✅ **Meta tags** for social sharing
- ✅ **Structured data** (add your specific schema)
- ✅ **Semantic HTML** structure
- ✅ **Fast loading times**
- ✅ **Mobile-friendly design**

### Add Structured Data

Add this to the `<head>` section of `index.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AI Assistant Hub",
  "description": "Smart form filling and page summarization with AI",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Chrome",
  "url": "https://aiassistanthub.com",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

## Analytics Setup

1. **Google Analytics 4**
   - Create a GA4 property
   - Replace `G-XXXXXXXXXX` in `js/main.js` with your measurement ID
   - Events are already tracked for extension installs and form submissions

2. **Cloudflare Analytics** (Optional)
   - Enable in your Cloudflare Pages settings
   - Provides additional performance insights

## Security

- ✅ **HTTPS enforced** by Cloudflare
- ✅ **Content Security Policy** (add CSP headers)
- ✅ **XSS protection** with proper input validation
- ✅ **CSRF protection** for forms

## Monitoring

The website includes performance monitoring:

- **Core Web Vitals** tracking
- **Error logging** (add your error reporting service)
- **Uptime monitoring** (Cloudflare provides this)

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-assistant-hub-website.git
   cd ai-assistant-hub-website
   ```

2. **Serve locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:
- Email: support@aiassistanthub.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/ai-assistant-hub-website/issues)

---

**Ready to deploy?** Follow the Cloudflare Pages deployment guide above and your website will be live in minutes! 🚀 