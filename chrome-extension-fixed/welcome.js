// Welcome Page JavaScript
console.log('🎉 Welcome page loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Welcome page ready');
    
    // Setup scroll animations
    setupScrollAnimations();
    
    // Setup configure button
    setupConfigureButton();
    
    console.log('✅ Welcome page initialized');
});

function setupScrollAnimations() {
    // Create intersection observer for animations
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
    
    // Observe all animatable elements
    const animatableElements = document.querySelectorAll(
        '.feature-card, .setup-step, .provider-card'
    );
    
    animatableElements.forEach(element => {
        observer.observe(element);
    });
    
    console.log(`📱 Observing ${animatableElements.length} elements for animations`);
}

function setupConfigureButton() {
    const configureBtn = document.getElementById('configure-btn');
    
    if (configureBtn) {
        configureBtn.addEventListener('click', function() {
            console.log('🔧 Opening extensions page...');
            
            try {
                // Try to open Chrome extensions page
                if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.create({ url: 'chrome://extensions/' });
                } else {
                    // Fallback: open in current tab
                    window.open('chrome://extensions/', '_blank');
                }
            } catch (error) {
                console.error('❌ Failed to open extensions page:', error);
                
                // Manual fallback
                alert('Please manually navigate to chrome://extensions/ to configure the extension.');
            }
        });
        
        console.log('🔧 Configure button ready');
    } else {
        console.error('❌ Configure button not found');
    }
}

console.log('✅ Welcome script loaded');