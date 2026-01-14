// Promo Page JavaScript - Modular & Optimized

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initAnimations();
    initFAQ();
    initFeatureTabs();
    initCharts();
    initChat();
    initMobileNav();
});

// ============ Intersection Observer for Animations ============
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('.stat-card, .feature-card, .faq-item, .section-title').forEach(el => {
        observer.observe(el);
    });
}

// ============ FAQ Accordion ============
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(other => {
                if (other !== item && other.classList.contains('open')) {
                    other.classList.remove('open');
                }
            });
            // Toggle current
            item.classList.toggle('open');
        });
    });
}

// ============ Feature Tabs ============
function initFeatureTabs() {
    const tabs = document.querySelectorAll('.feature-tab');
    const featuresContainer = document.getElementById('features-container');
    
    const featuresData = {
        all: [
            { icon: 'mobile', title: 'মোবাইল ফ্রেন্ডলি UI/UX', desc: 'দ্রুত, সুন্দর ও কাস্টমাইজযোগ্য ডিজাইন নিশ্চিত করে অসাধারন মোবাইল-ফ্রেন্ডলি অভিজ্ঞতা প্রদান করে।' },
            { icon: 'speed', title: 'সুপার-ফাস্ট 0.2s লোড টাইম', desc: 'মাত্র ০.2 সেকেন্ডে লোড হয়ে সেরা ইউজার অভিজ্ঞতা নিশ্চিত করবে।' },
            { icon: 'landing', title: 'আনলিমিটেড ল্যান্ডিং পেজ', desc: 'আকর্ষণীয় ও সহজে কাস্টমাইজযোগ্য ল্যান্ডিং পেজ তৈরি করুন যা গ্রাহক এনগেজমেন্ট বাড়াবে।' },
            { icon: 'pixel', title: 'ফেসবুক পিক্সেল এবং সার্ভার ট্র্যাকিং', desc: 'Conversion API ব্যবহার করে Stape.io-এর মতো বিনামূল্যে সার্ভার সাইড ট্র্যাক করুন এবং সর্বোচ্চ কনভার্সন রেট নিশ্চিত করুন।' },
            { icon: 'js', title: 'নেক্সট-জেন JavaScript টেকনোলজি', desc: 'Google এর তৈরি একটি JavaScript ফ্রেমওয়ার্ক, যা যেকোনো প্ল্যাটফর্মের তুলনায় অনেক দ্রুত এবং Single Page Web Application!' },
            { icon: 'checkout', title: '1-ক্লিক Easy Checkout', desc: 'লগইন করার দরকার নেই! সহজ, ব্যবহারকারী-বান্ধব অর্ডার প্লেসমেন্ট ও ট্র্যাকিং সিস্টেম উপভোগ করুন।' },
            { icon: 'delivery', title: 'আউটডেটেড ডেলিভারি চার্জ পেমেন্ট', desc: 'নির্বিঘ্ন ও দ্রুত চেকআউটের জন্য অগ্রিম ডেলিভারি ফি সংগ্রহ করুন!' },
            { icon: 'security', title: 'হাই সিকিউর এবং স্কেলেবল', desc: 'নির্ভরতা বৃদ্ধির জন্য একটি স্কেলেবল সিস্টেম সহ শীর্ষ-মানের সুরক্ষা নিশ্চিত করুন এবং নির্ভরযোগ্যতা লাভ করুন!' }
        ],
        advanced: [
            { icon: 'analytics', title: 'অ্যাডভান্সড অ্যানালিটিক্স', desc: 'বিস্তারিত সেলস রিপোর্ট, কাস্টমার বিহেভিয়র ট্র্যাকিং এবং প্রফিট-লস অ্যানালাইসিস।' },
            { icon: 'inventory', title: 'স্মার্ট ইনভেন্টরি', desc: 'অটোমেটিক স্টক আপডেট, লো স্টক অ্যালার্ট এবং ইনভেন্টরি ফোরকাস্টিং।' },
            { icon: 'multi', title: 'মাল্টি-স্টোর সাপোর্ট', desc: 'একাধিক স্টোর ম্যানেজ করুন একটি ড্যাশবোর্ড থেকে।' },
            { icon: 'api', title: 'API ইন্টিগ্রেশন', desc: 'থার্ড-পার্টি সার্ভিস যেমন পেমেন্ট গেটওয়ে, কুরিয়ার সার্ভিস ইন্টিগ্রেশন।' }
        ],
        tech: [
            { icon: 'react', title: 'React + Vite', desc: 'আধুনিক ফ্রন্টএন্ড টেকনোলজি দিয়ে তৈরি সুপার-ফাস্ট অ্যাপ্লিকেশন।' },
            { icon: 'node', title: 'Node.js Backend', desc: 'স্কেলেবল এবং সিকিউর সার্ভার-সাইড আর্কিটেকচার।' },
            { icon: 'database', title: 'MongoDB Database', desc: 'ফ্লেক্সিবল এবং পারফরম্যান্ট ডাটাবেস সল্যুশন।' },
            { icon: 'cloud', title: 'Cloud Hosting', desc: '99.9% আপটাইম গ্যারান্টি সহ ক্লাউড ইনফ্রাস্ট্রাকচার।' }
        ]
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            renderFeatures(featuresData[category] || featuresData.all);
        });
    });

    function renderFeatures(features) {
        featuresContainer.innerHTML = features.map((f, i) => `
            <div class="feature-card animate delay-${(i % 4) + 1}">
                <div class="feature-icon">${getIcon(f.icon)}</div>
                <h4>${f.title}</h4>
                <p>${f.desc}</p>
            </div>
        `).join('');
    }
}

// ============ Chart Animations ============
function initCharts() {
    // Animate bar chart
    const bars = document.querySelectorAll('.chart-bar');
    const heights = [15, 20, 25, 30, 35, 60, 85];
    
    setTimeout(() => {
        bars.forEach((bar, i) => {
            bar.style.height = heights[i] + '%';
        });
    }, 500);

    // Animate donut charts
    animateDonut('donut1', 87.5);
    animateDonut('ring1', 75);
}

function animateDonut(id, percentage) {
    const circle = document.getElementById(id);
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 45;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
    
    setTimeout(() => {
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.transition = 'stroke-dashoffset 1.5s ease-out';
        circle.style.strokeDashoffset = offset;
    }, 300);
}

// ============ Chat Widget ============
function initChat() {
    const chatBtn = document.getElementById('chat-btn');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatBtn) return;

    const responses = {
        'দাম': '💰 আমাদের প্যাকেজ শুরু হয় মাত্র ৫০০ টাকা/মাস থেকে! প্রো প্যাকেজ ১৫০০ টাকা/মাস এবং এন্টারপ্রাইজ ৩০০০ টাকা/মাস।',
        'price': '💰 Our packages start from just 500 BDT/month! Pro package is 1500 BDT/month and Enterprise is 3000 BDT/month.',
        'ফিচার': '✨ আমাদের প্রধান ফিচারগুলো: মোবাইল ফ্রেন্ডলি UI, 0.5s লোড টাইম, আনলিমিটেড ল্যান্ডিং পেজ, ফেসবুক পিক্সেল ট্র্যাকিং!',
        'feature': '✨ Our main features: Mobile friendly UI, 0.5s load time, Unlimited landing pages, Facebook pixel tracking!',
        'ডেমো': '🎯 ডেমো দেখতে চাইলে opbd.systemnextit.com ভিজিট করুন অথবা আমাদের সাথে যোগাযোগ করুন!',
        'demo': '🎯 For demo, visit opbd.systemnextit.com or contact us!',
        'যোগাযোগ': '📞 যোগাযোগ করুন: info.systemnexit.com@gmail.com অথবা আমাদের ফেসবুক পেজে মেসেজ করুন!',
        'contact': '📞 Contact us: info.systemnexit.com@gmail.com or message us on our Facebook page!',
        'default': '👋 ধন্যবাদ আপনার মেসেজের জন্য! আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।',
        'Gadget Theme': '👋গেজেট থিম দেখার জন্য এই লিংকে যান gadget.systemnextit.com'
    };

    chatBtn.addEventListener('click', () => {
        chatWidget.classList.toggle('hidden');
        chatWidget.classList.toggle('active');
    });

    chatClose?.addEventListener('click', () => {
        chatWidget.classList.add('hidden');
        chatWidget.classList.remove('active');
    });

    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';

        // Bot response
        setTimeout(() => {
            const response = findResponse(message.toLowerCase());
            addMessage(response, 'bot');
        }, 800);
    });

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        div.innerHTML = `<div class="message-bubble">${text}</div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function findResponse(msg) {
        for (const [key, response] of Object.entries(responses)) {
            if (msg.includes(key)) return response;
        }
        return responses.default;
    }
}

// ============ Mobile Navigation ============
function initMobileNav() {
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileToggle?.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });
}

// ============ Icon Helper ============
function getIcon(type) {
    const icons = {
        mobile: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>',
        speed: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
        landing: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
        pixel: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
        js: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>',
        checkout: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
        delivery: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>',
        security: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>',
        analytics: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
        inventory: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>',
        multi: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
        api: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
        react: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
        node: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>',
        database: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>',
        cloud: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>'
    };
    return icons[type] || icons.mobile;
}
