// Mobile Navigation Fix - Create clickable dropdown menu
(function() {
    'use strict';
    
    function createMobileNav() {
        const hiddenLinks = document.querySelector('.greedy-nav .hidden-links');
        const button = document.querySelector('.greedy-nav button');
        
        if (!hiddenLinks || !button) return;
        
        // Clear any existing content
        hiddenLinks.innerHTML = '';
        
        // Create navigation items with actual links
        const navItems = [
            { title: '📝 Publications', url: '/publications/' },
            { title: '🏆 Awards', url: '/awards/' },
            { title: '💬 Talks', url: '/talks/' },
            { title: '📚 Teaching', url: '/teaching/' },
            { title: '📄 CV', url: '/cv/' },
            { title: '🇨🇳 中文', url: '/about-zh/' }
        ];
        
        // Create list items with links
        navItems.forEach(function(item) {
            const li = document.createElement('li');
            li.className = 'masthead__menu-item';
            
            const a = document.createElement('a');
            a.href = item.url;
            a.textContent = item.title;
            a.style.cssText = `
                display: block !important;
                padding: 1rem !important;
                color: white !important;
                text-decoration: none !important;
                border-bottom: 1px solid #333 !important;
                transition: background 0.2s ease !important;
                text-align: center !important;
                font-size: 1.1rem !important;
            `;
            
            // Add hover effect
            a.addEventListener('mouseenter', function() {
                this.style.background = '#333 !important';
            });
            a.addEventListener('mouseleave', function() {
                this.style.background = 'transparent !important';
            });
            
            li.appendChild(a);
            hiddenLinks.appendChild(li);
        });
        
        // Enhanced button click handler
        let isOpen = false;
        
        function toggleMenu() {
            if (isOpen) {
                hiddenLinks.classList.add('hidden');
                isOpen = false;
            } else {
                hiddenLinks.classList.remove('hidden');
                isOpen = true;
            }
        }
        
        // Remove existing event listeners and add new one
        button.removeEventListener('click', toggleMenu);
        button.addEventListener('click', toggleMenu);
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!button.contains(e.target) && !hiddenLinks.contains(e.target)) {
                hiddenLinks.classList.add('hidden');
                isOpen = false;
            }
        });
        
        // Close menu when clicking on a link
        hiddenLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                hiddenLinks.classList.add('hidden');
                isOpen = false;
            }
        });
        
        console.log('Mobile navigation initialized with clickable links');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createMobileNav);
    } else {
        createMobileNav();
    }
    
    // Also initialize after a short delay to ensure all elements are loaded
    setTimeout(createMobileNav, 1000);
    
})();