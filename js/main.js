// AI Assistant Hub Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initSmoothScrolling();
    initFAQ();
    initScrollAnimations();
    initContactForm();
    initMobileMenu();
    initLazyLoading();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove scrolled class for styling
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll (optional)
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// FAQ accordion functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card, .step, .faq-item');
    animateElements.forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
    });
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!data.name || !data.email || !data.message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            if (!isValidEmail(data.email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                showNotification('Thank you! Your message has been sent successfully.', 'success');
                this.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

// Analytics tracking (Google Analytics 4)
function initAnalytics() {
    // Get GA4 measurement ID from config
    const GA_MEASUREMENT_ID = config.analytics.measurementId;
    
    if (GA_MEASUREMENT_ID) {
        // Google Analytics 4
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID);
        
        // Load GA script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
        
        // Track events
        trackEvents();
    }
}

// Track user interactions
function trackEvents() {
    // Track extension install clicks
    const installButtons = document.querySelectorAll('a[href*="chrome.google.com"]');
    installButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'engagement',
                    event_label: 'extension_install',
                    value: 1
                });
            }
        });
    });
    
    // Track form submissions
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'submit', {
                    event_category: 'engagement',
                    event_label: 'contact_form',
                    value: 1
                });
            }
        });
    }
    
    // Track pricing clicks
    const pricingButtons = document.querySelectorAll('.pricing-card .btn');
    pricingButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'engagement',
                    event_label: 'pricing_click',
                    value: 1
                });
            }
        });
    });
}

// Performance monitoring
function initPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({entryTypes: ['largest-contentful-paint']});
        
        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        });
        fidObserver.observe({entryTypes: ['first-input']});
        
        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            console.log('CLS:', clsValue);
        });
        clsObserver.observe({entryTypes: ['layout-shift']});
    }
}

// Stripe checkout functionality
function initStripeCheckout() {
    // Initialize Stripe with your publishable key from config
    const stripe = Stripe(config.stripe.publishableKey);
    
    // Pro Monthly Plan
    const proMonthlyBtn = document.getElementById('pro-plan-btn');
    if (proMonthlyBtn) {
        proMonthlyBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                proMonthlyBtn.textContent = 'Loading...';
                proMonthlyBtn.disabled = true;
                
                // Create checkout session
                const response = await fetch(config.api.baseUrl + config.api.billingEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        priceId: config.stripe.priceIds.proMonthly,
                        successUrl: window.location.origin + '/success.html',
                        cancelUrl: window.location.origin + '/#pricing'
                    })
                });
                
                const session = await response.json();
                
                if (session.error) {
                    throw new Error(session.error);
                }
                
                // Redirect to Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.sessionId
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                // Track the event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'begin_checkout', {
                        event_category: 'ecommerce',
                        event_label: 'pro_monthly',
                        value: 9.99
                    });
                }
                
            } catch (error) {
                console.error('Checkout error:', error);
                showNotification('Unable to start checkout. Please try again.', 'error');
                
                // Reset button
                proMonthlyBtn.textContent = 'Upgrade to Pro';
                proMonthlyBtn.disabled = false;
            }
        });
    }
    
    // Pro Annual Plan
    const proAnnualBtn = document.getElementById('pro-annual-btn');
    if (proAnnualBtn) {
        proAnnualBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                proAnnualBtn.textContent = 'Loading...';
                proAnnualBtn.disabled = true;
                
                // Create checkout session
                const response = await fetch(config.api.baseUrl + config.api.billingEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        priceId: config.stripe.priceIds.proYearly,
                        successUrl: window.location.origin + '/success.html',
                        cancelUrl: window.location.origin + '/#pricing'
                    })
                });
                
                const session = await response.json();
                
                if (session.error) {
                    throw new Error(session.error);
                }
                
                // Redirect to Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.sessionId
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                // Track the event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'begin_checkout', {
                        event_category: 'ecommerce',
                        event_label: 'pro_yearly',
                        value: 99.90
                    });
                }
                
            } catch (error) {
                console.error('Checkout error:', error);
                showNotification('Unable to start checkout. Please try again.', 'error');
                
                // Reset button
                proAnnualBtn.textContent = 'Choose Annual';
                proAnnualBtn.disabled = false;
            }
        });
    }
}

// Initialize analytics and performance monitoring
initAnalytics();
initPerformanceMonitoring();
initStripeCheckout();

// Utility functions
const utils = {
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Format number with commas
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Copy to clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
};

// Export utils for use in other scripts
window.utils = utils; 