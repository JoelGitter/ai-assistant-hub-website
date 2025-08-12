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
    initVideoPopup(); // Add video popup initialization
    initHeroVideo(); // Add hero video initialization
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

    // Only initialize if elements exist
    if (!navToggle || !navMenu) {
        console.log('Mobile menu elements not found, skipping initialization');
        return;
    }

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
    // Hardcoded GA4 measurement ID
    const GA_MEASUREMENT_ID = 'G-BNQRGZZEHK';
    
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
    // Pro Monthly Plan
    const proMonthlyBtn = document.getElementById('pro-plan-btn');
    if (proMonthlyBtn) {
        proMonthlyBtn.addEventListener('click', () => {
            // Check if user is logged in
            const token = localStorage.getItem('authToken');
            if (!token) {
                showLoginModal();
                return;
            }
            
            triggerStripeCheckout();
        });
    }
}

// Show login modal
function showLoginModal() {
    // Remove existing modals
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Login to Upgrade</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <div class="modal-footer">
                    <p>Don't have an account? <a href="#" id="show-register">Register</a></p>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        max-width: 400px;
        width: 90%;
        position: relative;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Show register modal
    const showRegisterBtn = modal.querySelector('#show-register');
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showRegisterModal();
    });
    
    // Handle login form
    const loginForm = modal.querySelector('#login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        try {
            const response = await fetch(`https://ai-assistant-hub-app.azurewebsites.net/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                showNotification('Login successful!', 'success');
                modal.remove();
                triggerStripeCheckout();
            } else {
                showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Login failed. Please try again.', 'error');
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}

// Show register modal
function showRegisterModal() {
    // Remove existing modals
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create Account</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="register-form">
                    <div class="form-group">
                        <label for="register-name">Name</label>
                        <input type="text" id="register-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">Email</label>
                        <input type="email" id="register-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <input type="password" id="register-password" name="password" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary">Create Account</button>
                </form>
                <div class="modal-footer">
                    <p>Already have an account? <a href="#" id="show-login">Login</a></p>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        max-width: 400px;
        width: 90%;
        position: relative;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Show login modal
    const showLoginBtn = modal.querySelector('#show-login');
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showLoginModal();
    });
    
    // Handle register form
    const registerForm = modal.querySelector('#register-form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        
        try {
            const response = await fetch(`https://ai-assistant-hub-app.azurewebsites.net/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                showNotification('Account created successfully! Please check your email for verification.', 'success');
                modal.remove();
                triggerStripeCheckout();
            } else {
                showNotification(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please try again.', 'error');
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}

// Trigger Stripe checkout
function triggerStripeCheckout() {
    const proMonthlyBtn = document.getElementById('pro-plan-btn');
    
    // Initialize Stripe at the top level with hardcoded key
    const stripe = Stripe('pk_live_51Rolv8I5JHWOZqzkQzDNnxsFw1q350Kqu0OdLBM9G1XKuhSXclErAds7w2qZ9g4HvUjqTnu2vVXI8vdNhLUBX9Dn00Y8s2BKkU');
    
    // Get the stored token
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        showNotification('Please log in to upgrade to Pro.', 'warning');
        return;
    }
    
    // Validate user subscription status
    fetch(`https://ai-assistant-hub-app.azurewebsites.net/api/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }).then(userResponse => {
        if (!userResponse.ok) {
            // Token is invalid, remove it and show login
            localStorage.removeItem('authToken');
            showLoginModal();
            return;
        }

        return userResponse.json();
    }).then(userData => {
        if (!userData) return;
        
        const user = userData.user;

        // Check if user already has an active subscription
        if (user.usage.plan === 'pro' && user.usage.status === 'active') {
            showNotification('You already have an active Pro subscription!', 'info');
            return;
        }

        // Show loading state
        if (proMonthlyBtn) {
            proMonthlyBtn.textContent = 'Loading...';
            proMonthlyBtn.disabled = true;
        }
        
        // Create checkout session for authenticated user
        return fetch(`https://ai-assistant-hub-app.azurewebsites.net/api/billing/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                priceId: 'price_1RpKAYI5JHWOZqzklUS9vUna',
                successUrl: 'https://myassistanthub.com/success.html',
                cancelUrl: 'https://myassistanthub.com/#pricing'
            })
        });
    }).then(response => {
        if (!response) return;
        
        return response.json();
    }).then(session => {
        if (!session) return;
        
        if (session.error) {
            throw new Error(session.error);
        }
        
        // Redirect to Stripe Checkout
        return stripe.redirectToCheckout({
            sessionId: session.sessionId
        });
    }).then(result => {
        if (!result) return;
        
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
        
    }).catch(error => {
        console.error('Checkout error:', error);
        showNotification('Unable to start checkout. Please try again.', 'error');
        
        // Reset button
        if (proMonthlyBtn) {
            proMonthlyBtn.textContent = 'Upgrade to Pro';
            proMonthlyBtn.disabled = false;
        }
    });
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

// Video Popup Functions
function initHeroVideo() {
    const heroVideo = document.getElementById('hero-video');
    const videoBox = document.querySelector('.video-box');
    
    if (heroVideo && videoBox) {
        // Add click to expand functionality
        videoBox.addEventListener('click', function() {
            openVideoPopup();
        });
        
        // Add hover effects
        videoBox.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        videoBox.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        // Add cursor pointer to indicate it's clickable
        videoBox.style.cursor = 'pointer';
        
        // Track video view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_view', {
                event_category: 'engagement',
                event_label: 'hero_video',
                video_id: 'Yzy8v77TLxE'
            });
        }
    }
}

function initVideoPopup() {
    const watchDemoBtn = document.getElementById('watch-demo-btn');
    
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', openVideoPopup);
    }
    
    const videoPopup = document.getElementById('video-popup');
    
    if (videoPopup) {
        // Close video popup when clicking outside the video
        videoPopup.addEventListener('click', function(e) {
            if (e.target === videoPopup) {
                closeVideoPopup();
            }
        });
    }
    
    // Close video popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const videoPopup = document.getElementById('video-popup');
            if (videoPopup && videoPopup.classList.contains('active')) {
                closeVideoPopup();
            }
        }
    });
}

function openVideoPopup() {
    const videoPopup = document.getElementById('video-popup');
    const videoIframe = document.getElementById('video-iframe');
    
    if (!videoPopup || !videoIframe) {
        console.error('Video popup elements not found');
        return;
    }
    
    // Set the YouTube video URL with autoplay (same as hero video)
    const videoId = 'Yzy8v77TLxE';
    videoIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`;
    
    // Show the popup
    videoPopup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Track video play event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'video_play', {
            event_category: 'engagement',
            event_label: 'demo_video_popup',
            video_id: videoId
        });
    }
}

function closeVideoPopup() {
    const videoPopup = document.getElementById('video-popup');
    const videoIframe = document.getElementById('video-iframe');
    
    if (!videoPopup || !videoIframe) {
        console.error('Video popup elements not found');
        return;
    }
    
    // Hide the popup
    videoPopup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Clear the iframe src to stop the video
    videoIframe.src = '';
    
    // Track video close event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'video_close', {
            event_category: 'engagement',
            event_label: 'demo_video'
        });
    }
} 