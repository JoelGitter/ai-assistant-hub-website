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
            
            // Send message to server support endpoint
            fetch('https://ai-assistant-hub-app.azurewebsites.net/api/ai/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    subject: data.subject || 'Website Contact Form',
                    message: data.message
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Thank you! Your message has been sent successfully.', 'success');
                    contactForm.reset();
                    
                    // Track form submission
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'form_submit', {
                            event_category: 'engagement',
                            event_label: 'contact_form',
                            value: 1
                        });
                    }
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }
            })
            .catch(error => {
                console.error('Support endpoint error:', error);
                showNotification('Sorry, there was an error sending your message. Please try again or email us directly at support@myassistanthub.com', 'error');
            })
            .finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
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
                <div class="modal-logo">
                    <img src="images/logo.svg" alt="AI Assistant Hub" class="logo">
                    <span class="logo-text">AI Assistant Hub</span>
                </div>
                <h2>Welcome Back</h2>
                <p class="modal-subtitle">Sign in to upgrade your account</p>
                <button class="modal-close" aria-label="Close modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email">Email Address</label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope input-icon"></i>
                            <input type="email" id="login-email" name="email" placeholder="Enter your email" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" id="login-password" name="password" placeholder="Enter your password" required>
                        </div>
                    </div>
                    <div class="form-options">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" id="remember-me">
                            <span class="checkmark"></span>
                            Remember me
                        </label>
                        <a href="#" class="forgot-password">Forgot password?</a>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">
                        <i class="fas fa-sign-in-alt"></i>
                        Sign In
                    </button>
                </form>
                <div class="modal-footer">
                    <div class="divider">
                        <span>or</span>
                    </div>
                    <p class="footer-text">
                        Don't have an account? 
                        <a href="#" id="show-register" class="link-primary">Create one now</a>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Add enhanced styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: modalFadeIn 0.3s ease-out;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        max-width: 450px;
        width: 100%;
        position: relative;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        animation: modalSlideIn 0.3s ease-out;
    `;
    
    // Add header styles
    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.style.cssText = `
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 2rem 2rem 1.5rem;
        text-align: center;
        position: relative;
    `;
    
    // Add logo styles
    const modalLogo = modal.querySelector('.modal-logo');
    modalLogo.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 1rem;
    `;
    
    const logoImg = modal.querySelector('.modal-logo .logo');
    logoImg.style.cssText = `
        width: 32px;
        height: 32px;
        filter: brightness(0) invert(1);
    `;
    
    const logoText = modal.querySelector('.modal-logo .logo-text');
    logoText.style.cssText = `
        font-weight: 700;
        font-size: 1.25rem;
        color: white;
    `;
    
    // Add title styles
    const modalTitle = modal.querySelector('.modal-header h2');
    modalTitle.style.cssText = `
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: white;
    `;
    
    const modalSubtitle = modal.querySelector('.modal-subtitle');
    modalSubtitle.style.cssText = `
        font-size: 1rem;
        opacity: 0.9;
        margin: 0;
        font-weight: 400;
    `;
    
    // Add close button styles
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
    `;
    
    // Add body styles
    const modalBody = modal.querySelector('.modal-body');
    modalBody.style.cssText = `
        padding: 2rem;
    `;
    
    // Add form group styles
    const formGroups = modal.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.style.cssText = `
            margin-bottom: 1.5rem;
        `;
    });
    
    // Add label styles
    const labels = modal.querySelectorAll('label');
    labels.forEach(label => {
        label.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
        `;
    });
    
    // Add input wrapper styles
    const inputWrappers = modal.querySelectorAll('.input-wrapper');
    inputWrappers.forEach(wrapper => {
        wrapper.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
        `;
    });
    
    // Add input icon styles
    const inputIcons = modal.querySelectorAll('.input-icon');
    inputIcons.forEach(icon => {
        icon.style.cssText = `
            position: absolute;
            left: 12px;
            color: #9ca3af;
            font-size: 1rem;
            z-index: 1;
        `;
    });
    
    // Add input styles
    const inputs = modal.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    inputs.forEach(input => {
        input.style.cssText = `
            width: 100%;
            padding: 12px 12px 12px 44px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s ease;
            background: white;
        `;
        
        // Add focus styles
        input.addEventListener('focus', function() {
            this.style.borderColor = '#6366f1';
            this.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e5e7eb';
            this.style.boxShadow = 'none';
        });
    });
    
    // Add form options styles
    const formOptions = modal.querySelector('.form-options');
    formOptions.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
    `;
    
    // Add checkbox styles
    const checkboxWrapper = modal.querySelector('.checkbox-wrapper');
    checkboxWrapper.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #6b7280;
    `;
    
    const checkbox = modal.querySelector('#remember-me');
    checkbox.style.cssText = `
        width: 16px;
        height: 16px;
        accent-color: #6366f1;
    `;
    
    // Add forgot password styles
    const forgotPassword = modal.querySelector('.forgot-password');
    forgotPassword.style.cssText = `
        color: #6366f1;
        text-decoration: none;
        font-weight: 500;
    `;
    
    // Add button styles
    const submitBtn = modal.querySelector('.btn');
    submitBtn.style.cssText = `
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    
    // Add footer styles
    const modalFooter = modal.querySelector('.modal-footer');
    modalFooter.style.cssText = `
        margin-top: 2rem;
        text-align: center;
    `;
    
    // Add divider styles
    const divider = modal.querySelector('.divider');
    divider.style.cssText = `
        position: relative;
        text-align: center;
        margin: 1.5rem 0;
        color: #9ca3af;
        font-size: 0.875rem;
    `;
    
    divider.innerHTML = `
        <span style="background: white; padding: 0 1rem; position: relative; z-index: 1;">
            or
        </span>
        <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e5e7eb; z-index: 0;"></div>
    `;
    
    // Add footer text styles
    const footerText = modal.querySelector('.footer-text');
    footerText.style.cssText = `
        color: #6b7280;
        font-size: 0.875rem;
        margin: 0;
    `;
    
    const linkPrimary = modal.querySelector('.link-primary');
    linkPrimary.style.cssText = `
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
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
                <div class="modal-logo">
                    <img src="images/logo.svg" alt="AI Assistant Hub" class="logo">
                    <span class="logo-text">AI Assistant Hub</span>
                </div>
                <h2>Create Account</h2>
                <p class="modal-subtitle">Join our community to unlock more features</p>
                <button class="modal-close" aria-label="Close modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="register-form">
                    <div class="form-group">
                        <label for="register-name">Name</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user input-icon"></i>
                            <input type="text" id="register-name" name="name" placeholder="Enter your name" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="register-email">Email</label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope input-icon"></i>
                            <input type="email" id="register-email" name="email" placeholder="Enter your email" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" id="register-password" name="password" placeholder="Create a password" required minlength="6">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">
                        <i class="fas fa-user-plus"></i>
                        Create Account
                    </button>
                </form>
                <div class="modal-footer">
                    <p class="footer-text">
                        Already have an account? 
                        <a href="#" id="show-login" class="link-primary">Login here</a>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Add enhanced styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: modalFadeIn 0.3s ease-out;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        max-width: 450px;
        width: 100%;
        position: relative;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        animation: modalSlideIn 0.3s ease-out;
    `;
    
    // Add header styles
    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.style.cssText = `
        background: linear-gradient(135deg, #4f46e5, #8b5cf6);
        color: white;
        padding: 2rem 2rem 1.5rem;
        text-align: center;
        position: relative;
    `;
    
    // Add logo styles
    const modalLogo = modal.querySelector('.modal-logo');
    modalLogo.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 1rem;
    `;
    
    const logoImg = modal.querySelector('.modal-logo .logo');
    logoImg.style.cssText = `
        width: 32px;
        height: 32px;
        filter: brightness(0) invert(1);
    `;
    
    const logoText = modal.querySelector('.modal-logo .logo-text');
    logoText.style.cssText = `
        font-weight: 700;
        font-size: 1.25rem;
        color: white;
    `;
    
    // Add title styles
    const modalTitle = modal.querySelector('.modal-header h2');
    modalTitle.style.cssText = `
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: white;
    `;
    
    const modalSubtitle = modal.querySelector('.modal-subtitle');
    modalSubtitle.style.cssText = `
        font-size: 1rem;
        opacity: 0.9;
        margin: 0;
        font-weight: 400;
    `;
    
    // Add close button styles
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
    `;
    
    // Add body styles
    const modalBody = modal.querySelector('.modal-body');
    modalBody.style.cssText = `
        padding: 2rem;
    `;
    
    // Add form group styles
    const formGroups = modal.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.style.cssText = `
            margin-bottom: 1.5rem;
        `;
    });
    
    // Add label styles
    const labels = modal.querySelectorAll('label');
    labels.forEach(label => {
        label.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
        `;
    });
    
    // Add input wrapper styles
    const inputWrappers = modal.querySelectorAll('.input-wrapper');
    inputWrappers.forEach(wrapper => {
        wrapper.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
        `;
    });
    
    // Add input icon styles
    const inputIcons = modal.querySelectorAll('.input-icon');
    inputIcons.forEach(icon => {
        icon.style.cssText = `
            position: absolute;
            left: 12px;
            color: #9ca3af;
            font-size: 1rem;
            z-index: 1;
        `;
    });
    
    // Add input styles
    const inputs = modal.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    inputs.forEach(input => {
        input.style.cssText = `
            width: 100%;
            padding: 12px 12px 12px 44px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s ease;
            background: white;
        `;
        
        // Add focus styles
        input.addEventListener('focus', function() {
            this.style.borderColor = '#6366f1';
            this.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e5e7eb';
            this.style.boxShadow = 'none';
        });
    });
    
    // Add button styles
    const submitBtn = modal.querySelector('.btn');
    submitBtn.style.cssText = `
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    
    // Add footer styles
    const modalFooter = modal.querySelector('.modal-footer');
    modalFooter.style.cssText = `
        margin-top: 2rem;
        text-align: center;
    `;
    
    // Add footer text styles
    const footerText = modal.querySelector('.footer-text');
    footerText.style.cssText = `
        color: #6b7280;
        font-size: 0.875rem;
        margin: 0;
    `;
    
    const linkPrimary = modal.querySelector('.link-primary');
    linkPrimary.style.cssText = `
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
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
    const videoOverlay = document.getElementById('video-overlay');
    const playButton = document.getElementById('play-video-btn');
    
    if (heroVideo && videoBox) {
        // Check if autoplay is supported and working
        let autoplaySupported = true;
        
        // Listen for video load and check if it's playing
        heroVideo.addEventListener('load', function() {
            // Wait a bit to see if autoplay works
            setTimeout(() => {
                checkVideoPlayback();
            }, 2000);
        });
        
        // Function to check if video is actually playing
        function checkVideoPlayback() {
            if (videoOverlay && !videoOverlay.classList.contains('hidden')) {
                // If overlay is still visible after 2 seconds, autoplay probably failed
                autoplaySupported = false;
                console.log('Autoplay not supported, showing play button');
            }
        }
        
        // Handle play button click
        if (playButton) {
            playButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering video box click
                
                // Hide the overlay
                if (videoOverlay) {
                    videoOverlay.classList.add('hidden');
                }
                
                // Try to play the video
                if (heroVideo.contentWindow) {
                    try {
                        heroVideo.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    } catch (e) {
                        console.log('Manual play attempted for hero video');
                    }
                }
                
                // Track manual play event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'video_play', {
                        event_category: 'engagement',
                        event_label: 'hero_video_manual_play',
                        video_id: 'UlkU6Ihz94Y'
                    });
                }
            });
        }
        
        // Add click to expand functionality (only if not clicking play button)
        videoBox.addEventListener('click', function(e) {
            if (!playButton || !playButton.contains(e.target)) {
                openVideoPopup();
            }
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
                video_id: 'UlkU6Ihz94Y'
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
    const videoId = 'UlkU6Ihz94Y';
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