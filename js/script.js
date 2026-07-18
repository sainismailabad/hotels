// ============================================================================
// BookMyHotel - Complete Application with Firebase Realtime Database
// Professional Edition v3.0 | Clean | Optimized | Maintainable
// ============================================================================

// ============================================================================
// SECTION 1: GLOBALS
// ============================================================================
let currentUser = null;
let currentPartner = null;
let partnerCitiesCache = [];

// Gallery globals
let galleryHotelId = null;
let galleryImages = [];

// Card image navigation
let cardImageIndex = {};

// Hotel detail gallery
let detailImages = [];
let detailCurrentIndex = 0;

// Category filter
let currentCategory = 'all';

// Manage page globals
let manageHotelData = null;
let manageSelectedRoomType = 'Standard';
let manageOverrideActive = false;
let manageRoomMultipliers = { Standard: 1, Deluxe: 1.4, Suite: 1.8, Penthouse: 2.5 };
let manageAllBookings = [];
let manageActionBookingId = null;

// Offers
let currentOfferId = null;

// Room type multipliers (shared by booking and manage)
const ROOM_MULTIPLIERS = { Standard: 1, Deluxe: 1.4, Suite: 1.8, Penthouse: 2.5 };

// ===== LOCATION / GEOLOCATION GLOBALS =====
let userLatitude = null;
let userLongitude = null;
let userCity = '';
let userCityDetected = false;
let locationWatchId = null;
let mapInstance = null;
let mapMarkers = [];

// ===== DETECT & FILL LOCATION (called from button) =====
async function detectAndFillLocation() {
    const btn = document.querySelector('button[onclick*="detectAndFillLocation"]');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }
    
    const loc = await getLocationFromBrowser();
    if (loc.lat && loc.lng) {
        userCity = findNearestCity(loc.lat, loc.lng);
        userCityDetected = true;
        if (userCity) {
            document.querySelectorAll('#searchLocation').forEach(el => el.value = userCity + ', India');
            showLocationBadge(userCity);
            showToast('Location detected: ' + userCity, 'success', 3000);
            loadNearbyHotelsOnHomepage();
        } else {
            showToast('Could not determine your city. Please type manually.', 'info', 3000);
        }
    } else {
        showToast('Location access denied. Please enable GPS or type manually.', 'error', 4000);
    }
    if (btn) { btn.innerHTML = '<i class="fas fa-location-dot"></i>'; btn.disabled = false; }
}

// ===== LOAD NEARBY HOTELS ON HOMEPAGE =====
async function loadNearbyHotelsOnHomepage() {
    const container = document.getElementById('nearbyHotelsList');
    const section = document.getElementById('nearbyHotelsSection');
    const cityLabel = document.getElementById('nearbyCityName');
    if (!container || !userLatitude || !userLongitude) return;

    const hotels = await dbGet('hotels') || {};
    const list = Object.values(hotels);
    const nearby = getHotelsNearUser(list, userLatitude, userLongitude, 50);
    
    if (!nearby.length) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (cityLabel && userCity) cityLabel.textContent = userCity;
    if (section) section.style.display = 'block';
    
    const wishlistSet = await getWishlistSetForCurrentUser();
    container.innerHTML = nearby.map(h => createHotelCard(h, wishlistSet)).join('');
}

// ===== DISTANCE / COORDINATE HELPERS =====
function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

function getLocationFromBrowser() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve({ lat: null, lng: null }); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLatitude = pos.coords.latitude;
                userLongitude = pos.coords.longitude;
                resolve({ lat: userLatitude, lng: userLongitude });
            },
            () => resolve({ lat: null, lng: null }),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
        );
    });
}

function findNearestCity(lat, lng) {
    if (!lat || !lng) return '';
    const cities = [
        { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
        { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
        { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
        { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
        { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
        { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
        { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
        { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
        { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
        { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
        { name: 'Goa', state: 'Goa', lat: 15.4909, lng: 73.8278 },
        { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
        { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
        { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
        { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
        { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
        { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
        { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
    ];
    let nearest = '', minDist = Infinity;
    cities.forEach(c => {
        const d = getDistanceFromLatLon(lat, lng, c.lat, c.lng);
        if (d < minDist) { minDist = d; nearest = c.name; }
    });
    return minDist < 100 ? nearest : '';
}

function sortHotelsByDistance(hotels, lat, lng) {
    if (!lat || !lng) return hotels;
    return hotels.map(h => {
        const hl = h.latitude || (h.coords && h.coords.lat) || null;
        const hg = h.longitude || (h.coords && h.coords.lng) || null;
        const dist = (hl && hg) ? getDistanceFromLatLon(lat, lng, hl, hg) : null;
        return { ...h, _distance: dist };
    }).sort((a, b) => (a._distance ?? 9999) - (b._distance ?? 9999));
}

function getHotelsNearUser(hotels, lat, lng, radiusKm = 50) {
    if (!lat || !lng) return hotels;
    const withDist = hotels.map(h => {
        const hl = h.latitude || null;
        const hg = h.longitude || null;
        return { ...h, _distance: (hl && hg) ? getDistanceFromLatLon(lat, lng, hl, hg) : null };
    });
    return withDist.filter(h => h._distance !== null && h._distance <= radiusKm);
}

// Leaflet map init
function initLeafletMap(containerId, centerLat = 20.5937, centerLng = 78.9629, zoom = 5) {
    if (typeof L === 'undefined') return null;
    const el = document.getElementById(containerId);
    if (!el) return null;
    if (mapInstance) { mapInstance.remove(); mapInstance = null; }
    mapInstance = L.map(containerId).setView([centerLat, centerLng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
    }).addTo(mapInstance);
    mapMarkers = [];
    return mapInstance;
}

function addMapMarker(lat, lng, title, popupHtml) {
    if (!mapInstance || !lat || !lng) return null;
    const marker = L.marker([lat, lng]).addTo(mapInstance);
    if (title) marker.bindTooltip(title);
    if (popupHtml) marker.bindPopup(popupHtml);
    mapMarkers.push(marker);
    return marker;
}

function addUserLocationMarker(lat, lng) {
    if (!mapInstance || !lat || !lng) return;
    const icon = L.divIcon({
        html: '<div style="width:20px;height:20px;background:#D4AF37;border:3px solid #fff;border-radius:50%;box-shadow:0 0 15px rgba(212,175,55,0.5);"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10], className: ''
    });
    L.marker([lat, lng], { icon }).addTo(mapInstance).bindTooltip('You are here');
}

function fitMapToMarkers() {
    if (!mapInstance || !mapMarkers.length) return;
    const group = L.featureGroup(mapMarkers);
    mapInstance.fitBounds(group.getBounds().pad(0.15));
}

// Show location badge in nav
function showLocationBadge(cityName) {
    document.querySelectorAll('.location-badge').forEach(b => b.remove());
    const navWrap = document.querySelector('.nav-menu ul:first-child') || document.querySelector('#navLinks');
    if (!navWrap || !cityName) return;
    const badge = document.createElement('li');
    badge.className = 'location-badge';
    badge.innerHTML = `<a href="#" style="display:flex;align-items:center;gap:5px;font-size:13px;color:var(--accent);font-weight:600;"><i class="fas fa-location-dot"></i> ${cityName}</a>`;
    navWrap.appendChild(badge);
}

// Detect user location on page load
async function detectUserLocation() {
    const loc = await getLocationFromBrowser();
    if (loc.lat && loc.lng) {
        userCity = findNearestCity(loc.lat, loc.lng);
        userCityDetected = true;
        if (userCity) {
            showLocationBadge(userCity);
            // Update search inputs
            document.querySelectorAll('#searchLocation').forEach(el => {
                if (el.value === 'Mumbai, India' || !el.value) el.value = userCity + ', India';
            });
        }
        return loc;
    }
    return null;
}

// ============================================================================
// SECTION 2: FIREBASE DB HELPERS
// ============================================================================
// db is already initialized in firebase-init.js as: const db = firebase.database();

function dbGet(path) {
    return db.ref(path).once('value').then(s => s.val());
}

function dbSet(path, data) {
    return db.ref(path).set(data);
}

function dbPush(path, data) {
    return db.ref(path).push(data);
}

function dbRemove(path) {
    return db.ref(path).remove();
}

// ============================================================================
// SECTION 3: UTILITY HELPERS
// ============================================================================
function getStarsHtml(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '<div class="stars">';
    for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
    if (half) html += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="fas fa-star empty"></i>';
    html += ` <span class="rating-badge">${rating}</span></div>`;
    return html;
}

function getStatusBadge(status) {
    const map = { active: 'active', inactive: 'inactive', pending: 'pending', confirmed: 'confirmed', completed: 'completed', cancelled: 'cancelled', paid: 'confirmed' };
    const label = (status || '').charAt(0).toUpperCase() + (status || '').slice(1);
    return `<span class="status-badge ${map[status] || 'active'}">${label}</span>`;
}

function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function getUserRole(data) {
    if (!data) return 'customer';
    return data.role || data.type || 'customer';
}

function getDateStr(date) {
    return date.toISOString().split('T')[0];
}

function getTomorrow() {
    const t = new Date();
    return new Date(t.setDate(t.getDate() + 1));
}

function getDayAfter() {
    const t = new Date();
    return new Date(t.setDate(t.getDate() + 2));
}

function getUrlParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function openModal(id) {
    document.getElementById(id)?.classList.add('active');
    document.getElementById('modalOverlay')?.classList.add('active');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
    document.getElementById('modalOverlay')?.classList.remove('active');
}

// ============================================================================
// SECTION 4: UI COMPONENTS
// ============================================================================

// 4a: Loading Bar
function showLoadingBar() {
    let bar = document.getElementById('globalLoadingBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'globalLoadingBar';
        bar.className = 'loading-bar';
        document.body.prepend(bar);
    }
    bar.classList.add('active');
}

function hideLoadingBar() {
    document.getElementById('globalLoadingBar')?.classList.remove('active');
}

function autoLoadingBar(promise) {
    showLoadingBar();
    return Promise.resolve(promise).finally(() => setTimeout(hideLoadingBar, 300));
}

// 4b: Toast Notifications
function showToast(message, type = 'success', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// 4c: Ripple Effect
function addRippleEffect(button) {
    button.classList.add('ripple');
    button.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

// 4d: Scroll Reveal Animation
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

// 4e: Dark Mode Toggle
function initThemeToggle() {
    let themeBtn = document.querySelector('.theme-toggle');
    if (!themeBtn) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.querySelector('.theme-toggle')) {
            themeBtn = document.createElement('button');
            themeBtn.className = 'theme-toggle';
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            themeBtn.setAttribute('aria-label', 'Toggle dark mode');
            navMenu.appendChild(themeBtn);
        }
    }

    const savedTheme = localStorage.getItem('bookmyhotel-theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('bookmyhotel-theme', 'light');
                this.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('bookmyhotel-theme', 'dark');
                this.innerHTML = '<i class="fas fa-sun"></i>';
            }
            showToast(isDark ? 'Light mode enabled' : 'Dark mode enabled', 'info');
        });
    }
}

// 4f: Page Load Animation
function initPageLoad() {
    document.body.classList.add('page-load');
}

// 4g: Skeleton Loading
function showSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="skeleton-grid">' +
        Array(count).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-image skeleton"></div>
                <div class="skeleton-body">
                    <div class="skeleton-line skeleton"></div>
                    <div class="skeleton-line skeleton"></div>
                    <div class="skeleton-line skeleton"></div>
                </div>
            </div>
        `).join('') + '</div>';
}

// 4h: Auth UI Helpers
function showAuthError(msg) {
    const el = document.getElementById('authError');
    if (el) { el.textContent = msg; el.classList.toggle('show', !!msg); }
    const suc = document.getElementById('authSuccess');
    if (suc) suc.classList.remove('show');
}

function showAuthSuccess(msg) {
    const el = document.getElementById('authSuccess');
    if (el) { el.textContent = msg; el.classList.toggle('show', !!msg); }
    const err = document.getElementById('authError');
    if (err) err.classList.remove('show');
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
}

// ============================================================================
// SECTION 5: USER & AUTH
// ============================================================================

// 5a: Ensure user exists in DB
async function ensureUserRecord(user, extra = {}) {
    if (!user) return null;
    const ref = db.ref('users/' + user.uid);
    const snap = await ref.once('value');
    const existing = snap.val() || {};
    const role = extra.type || existing.role || existing.type || 'customer';

    const merged = {
        uid: user.uid,
        name: extra.name || existing.name || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        email: user.email || existing.email || '',
        phone: extra.phone || existing.phone || '',
        type: role,
        role: role,
        emailVerified: !!user.emailVerified,
        createdAt: existing.createdAt || new Date().toISOString()
    };

    await ref.update(merged);
    return merged;
}

// 5b: Check user type from DB
async function checkUserType(required) {
    if (!currentUser) { window.location.href = 'login.html'; return false; }
    try {
        const snap = await db.ref('users/' + currentUser.uid).once('value');
        const data = snap.val();
        const role = getUserRole(data);
        if (data && role === required) return true;
        if (data) {
            const roleMap = { admin: 'admin.html', partner: 'partner.html' };
            window.location.href = roleMap[role] || 'index.html';
        } else {
            window.location.href = 'index.html';
        }
        return false;
    } catch (e) {
        window.location.href = 'index.html';
        return false;
    }
}

// 5c: Get role from DB
async function getUserRoleFromDB(uid) {
    try {
        const snap = await db.ref('users/' + uid).once('value');
        return getUserRole(snap.val());
    } catch (e) {
        return 'customer';
    }
}

// 5d: Navigation with user menu
function updateNav() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    const isMobile = window.innerWidth <= 992;

    if (!currentUser) {
        navAuth.innerHTML = '<li><a href="login.html" class="btn-nav">Sign In</a></li>';
        return;
    }

    const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    const initial = name.charAt(0).toUpperCase();

    db.ref('users/' + currentUser.uid).once('value').then((snap) => {
        const data = snap.val();
        let roleLinks = '';
        if (data) {
            const role = getUserRole(data);
            if (role === 'admin') roleLinks = '<a href="admin.html"><i class="fas fa-cog"></i> Admin Panel</a>';
            else if (role === 'partner') roleLinks = '<a href="partner.html"><i class="fas fa-hotel"></i> Dashboard</a>';
        }

        // Mobile + Desktop single item click: Profile icon click => Profile page
        if (isMobile) {
            navAuth.innerHTML = `
                <li><a href="profile.html" class="nav-auth-link"> <i class="fas fa-user-circle"></i> My Profile</a></li>
                <li><a href="my-bookings.html" class="nav-auth-link"> <i class="fas fa-calendar-check"></i> My Bookings</a></li>
                <li><a href="hotels.html" class="nav-auth-link"> <i class="fas fa-search"></i> Browse Hotels</a></li>
                ${roleLinks ? '<li>' + roleLinks + '</li>' : ''}
                <li><a href="#" onclick="handleLogout()" class="nav-auth-link" style="color:var(--danger);"> <i class="fas fa-sign-out-alt"></i> Sign Out</a></li>
            `;
            return;
        }

        // Desktop: show links directly, no dropdown/click needed - same as mobile style
        navAuth.innerHTML = `
            <li><a href="profile.html" class="nav-auth-link"><i class="fas fa-user-circle"></i> Profile</a></li>
            <li><a href="my-bookings.html" class="nav-auth-link"><i class="fas fa-calendar-check"></i> Bookings</a></li>
            <li><a href="hotels.html" class="nav-auth-link"><i class="fas fa-search"></i> Hotels</a></li>
            ${roleLinks ? '<li>' + roleLinks + '</li>' : ''}
            <li><a href="#" onclick="handleLogout()" class="nav-auth-link" style="color:var(--danger);"><i class="fas fa-sign-out-alt"></i> Sign Out</a></li>`;
    }).catch(() => {
        navAuth.innerHTML = '<li><a href="login.html" class="btn-nav">Sign In</a></li>';
    });
}

// Close dropdown on outside click
document.addEventListener('click', function (e) {
    if (!e.target.closest('.user-menu')) {
        document.querySelectorAll('.user-dropdown.show').forEach(d => d.classList.remove('show'));
    }
});

function handleLogout() {
    sessionStorage.removeItem('hotelStaffLogin');
    localStorage.removeItem('hotelStaffAutoLogin');
    localStorage.removeItem('bookmyhotel_auto_login_email');
    localStorage.removeItem('bookmyhotel_auto_login_password');

    if (firebase.auth().currentUser) {
        firebase.auth().signOut().then(() => { window.location.href = 'index.html'; }).catch(() => { window.location.href = 'index.html'; });
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================================================
// SECTION 6: AUTH PAGES (Login/Signup)
// ============================================================================

// 6a: Password toggle
function togglePassword(id, btn) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.innerHTML = inp.type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

// 6b: Switch auth mode (Login/Signup toggle)
function switchAuthMode(mode) {
    const toggleLogin = document.getElementById('toggleLogin');
    const toggleSignup = document.getElementById('toggleSignup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (!toggleLogin || !toggleSignup || !loginForm || !signupForm) return;

    toggleLogin.classList.toggle('active', mode === 'login');
    toggleSignup.classList.toggle('active', mode === 'signup');
    loginForm.classList.toggle('active', mode === 'login');
    signupForm.classList.toggle('active', mode === 'signup');
    document.getElementById('authTitle').textContent = mode === 'login' ? 'Welcome Back' : 'Join BookMyHotel';
    document.getElementById('authSubtitle').textContent = mode === 'login' ? 'Sign in to continue' : 'Create your free account';
    document.getElementById('authError')?.classList.remove('show');
    document.getElementById('authSuccess')?.classList.remove('show');
    if (mode === 'signup') togglePartnerFields();
}

function showLoginForm() {
    document.getElementById('customerSignupForm')?.classList.remove('active');
    document.getElementById('customerLoginForm')?.classList.add('active');
    document.getElementById('authTitle').textContent = 'Welcome Back';
    document.getElementById('authSubtitle').textContent = 'Sign in to your account to continue';
    document.getElementById('authError')?.classList.remove('show');
    document.getElementById('authSuccess')?.classList.remove('show');
}

function showSignupForm() {
    document.getElementById('customerLoginForm')?.classList.remove('active');
    document.getElementById('customerSignupForm')?.classList.add('active');
    document.getElementById('authTitle').textContent = 'Join BookMyHotel';
    document.getElementById('authSubtitle').textContent = 'Create your free account';
    document.getElementById('authError')?.classList.remove('show');
    document.getElementById('authSuccess')?.classList.remove('show');
}

function togglePartnerFields() {
    const type = document.getElementById('signupUserType')?.value || 'customer';
    const partnerFields = document.getElementById('partnerFields');
    const commissionField = document.getElementById('commissionField');
    const roleLabel = document.getElementById('signupRoleLabel');
    if (partnerFields) partnerFields.style.display = type === 'partner' ? 'block' : 'none';
    if (commissionField) commissionField.style.display = type === 'partner' ? 'block' : 'none';
    if (roleLabel) roleLabel.textContent = type.charAt(0).toUpperCase() + type.slice(1);
}

// 6c: Firebase Email Login
function handleFirebaseLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) { showAuthError('Please enter email and password.'); return; }

    setLoading('loginBtn', true);
    showAuthError('');
    showAuthSuccess('');

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((cred) => {
            showAuthSuccess('Login successful!');
            return ensureUserRecord(cred.user).then(() => cred.user);
        })
        .then((user) => {
            return db.ref('users/' + user.uid).once('value');
        })
        .then((snap) => {
            const role = getUserRole(snap.val());
            const keepSigned = document.getElementById('keepSignedIn')?.checked || false;
            if (keepSigned) {
                localStorage.setItem('bookmyhotel_auto_login_email', email);
                localStorage.setItem('bookmyhotel_auto_login_password', password);
            } else {
                localStorage.removeItem('bookmyhotel_auto_login_email');
                localStorage.removeItem('bookmyhotel_auto_login_password');
            }
            setLoading('loginBtn', false);
            setTimeout(() => {
                const redirects = { admin: 'admin.html', partner: 'partner.html', hotel: 'hotel-manage.html?uid=' + (snap.val()?.uid || '') };
                window.location.href = redirects[role] || 'index.html';
            }, 600);
        })
        .catch((error) => {
            setLoading('loginBtn', false);
            const messages = {
                'auth/user-not-found': 'No account found. Please sign up.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/too-many-requests': 'Too many attempts. Try again later.',
                'auth/invalid-email': 'Invalid email address.'
            };
            showAuthError(messages[error.code] || error.message);
        });
}

// 6d: Firebase Email Signup
function handleFirebaseSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const type = document.getElementById('signupUserType')?.value || 'customer';

    if (!name || !email || !password) { showAuthError('Please fill all required fields.'); return; }
    if (password !== confirm) { showAuthError('Passwords do not match.'); return; }
    if (password.length < 6) { showAuthError('Password must be 6+ characters.'); return; }

    setLoading('signupBtn', true);
    showAuthError('');
    showAuthSuccess('');

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((cred) => {
            return cred.user.updateProfile({ displayName: name }).then(() => cred.user);
        })
        .then((user) => {
            const userData = { uid: user.uid, name, email, phone, type, role: type, emailVerified: !!user.emailVerified, createdAt: new Date().toISOString() };
            return db.ref('users/' + user.uid).update(userData).then(() => ({ user, userData }));
        })
        .then(({ user, userData }) => {
            if (type === 'partner') {
                const company = document.getElementById('signupCompany')?.value.trim() || name + ' Hotels';
                const partnerData = {
                    id: 'prt_' + Date.now(),
                    uid: user.uid,
                    company, owner: name, email, phone,
                    commission: parseInt(document.getElementById('signupCommission')?.value) || 15,
                    status: 'active',
                    hotelCount: 0, revenue: 0,
                    joinedDate: new Date().toISOString()
                };
                return dbSet('partners/' + partnerData.id, partnerData).then(() => type);
            }
            return type;
        })
        .then(() => {
            showAuthSuccess('Account created successfully!');
            setLoading('signupBtn', false);
            setTimeout(() => window.location.href = 'index.html', 800);
        })
        .catch((error) => {
            setLoading('signupBtn', false);
            const messages = {
                'auth/email-already-in-use': 'Email already in use. Sign in instead.',
                'auth/weak-password': 'Password too weak (min 6 chars).',
                'auth/invalid-email': 'Invalid email address.',
                'auth/operation-not-allowed': 'Email/password sign-up is disabled.'
            };
            showAuthError(messages[error.code] || error.message);
            console.error('Signup error:', error);
        });
}

// 6e: Google Sign-In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    setLoading('googleLoginBtn', true);
    showAuthError('');

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            showAuthSuccess('Sign-in successful!');
            return ensureUserRecord(result.user).then(() => result.user);
        })
        .then((user) => {
            return db.ref('users/' + user.uid).once('value');
        })
        .then((snap) => {
            const role = getUserRole(snap.val());
            setLoading('googleLoginBtn', false);
            const redirects = { admin: 'admin.html', partner: 'partner.html' };
            setTimeout(() => { window.location.href = redirects[role] || 'index.html'; }, 600);
        })
        .catch((error) => {
            setLoading('googleLoginBtn', false);
            const messages = {
                'auth/account-exists-with-different-credential': 'An account already exists with this email. Please sign in using the original method.',
                'auth/popup-closed-by-user': 'Sign-in cancelled.',
                'auth/popup-blocked-by-browser': 'Popup blocked. Please allow popups for this site.'
            };
            showAuthError(messages[error.code] || error.message);
            console.error('Google Sign-In Error:', error);
        });
}

// 6f: Auto Sign-In
function checkAutoSignIn() {
    if (!window.location.pathname.includes('login.html')) return;

    const hotelAuto = localStorage.getItem('hotelStaffAutoLogin');
    if (hotelAuto) {
        try {
            const data = JSON.parse(hotelAuto);
            if (data.hotelId && data.hotelRefId) {
                sessionStorage.setItem('hotelStaffLogin', JSON.stringify(data));
                setTimeout(() => window.location.href = 'hotel-manage.html?id=' + data.hotelRefId, 500);
                return;
            }
        } catch (e) { localStorage.removeItem('hotelStaffAutoLogin'); }
    }

    const autoEmail = localStorage.getItem('bookmyhotel_auto_login_email');
    const autoPass = localStorage.getItem('bookmyhotel_auto_login_password');
    if (autoEmail && autoPass && !firebase.auth().currentUser) {
        document.getElementById('loginEmail').value = autoEmail;
        document.getElementById('loginPassword').value = autoPass;
        document.getElementById('keepSignedIn').checked = true;
        setTimeout(() => handleFirebaseLogin(new Event('submit')), 800);
    }
}

// ============================================================================
// SECTION 7: HOTEL STAFF LOGIN (Legacy ID + Password)
// ============================================================================

function showHotelLogin() {
    document.getElementById('loginForm')?.classList.remove('active');
    document.getElementById('signupForm')?.classList.remove('active');
    document.getElementById('hotelLoginForm')?.classList.add('active');
    document.getElementById('authTitle').textContent = 'Hotel Staff Login';
    document.getElementById('authSubtitle').textContent = 'Enter your Hotel ID and password';
    document.getElementById('hotelLoginLink').style.display = 'none';
    document.getElementById('authError')?.classList.remove('show');
    document.getElementById('authSuccess')?.classList.remove('show');
}

function showNormalLogin() {
    document.getElementById('hotelLoginForm')?.classList.remove('active');
    document.getElementById('signupForm')?.classList.remove('active');
    document.getElementById('loginForm')?.classList.add('active');
    document.getElementById('authTitle').textContent = 'Welcome Back';
    document.getElementById('authSubtitle').textContent = 'Sign in to your account to continue';
    document.getElementById('hotelLoginLink').style.display = 'block';
    document.getElementById('authError')?.classList.remove('show');
    document.getElementById('authSuccess')?.classList.remove('show');
}

function handleHotelLogin(event) {
    event.preventDefault();
    const hotelId = document.getElementById('hotelLoginId').value.trim();
    const password = document.getElementById('hotelLoginPassword').value;

    if (!hotelId || !password) {
        const errEl = document.getElementById('authError');
        if (errEl) { errEl.textContent = 'Please enter Hotel ID and password.'; errEl.classList.add('show'); }
        return;
    }

    const btnId = document.getElementById('hotelLoginBtn') ? 'hotelLoginBtn' : 'loginBtn';
    setLoading(btnId, true);
    showAuthError('');

    db.ref('hotel-credentials').once('value').then((snap) => {
        const creds = snap.val() || {};
        let found = null;
        Object.keys(creds).forEach(key => {
            if (creds[key].hotelId === hotelId || (creds[key].email && creds[key].email.toLowerCase() === hotelId.toLowerCase())) {
                found = creds[key];
            }
        });

        if (!found) { setLoading(btnId, false); showAuthError('Hotel ID not found. Check with admin.'); return; }
        if (found.status === 'inactive') { setLoading(btnId, false); showAuthError('This hotel account is inactive.'); return; }
        if (found.password !== password) { setLoading(btnId, false); showAuthError('Incorrect password.'); return; }

        const staffData = { hotelId: found.hotelId, hotelRefId: found.hotelRefId, hotelName: found.hotelName, loggedInAt: new Date().toISOString() };

        const keepSigned = document.getElementById('hotelKeepSignedIn')?.checked || false;
        if (keepSigned) localStorage.setItem('hotelStaffAutoLogin', JSON.stringify(staffData));
        else sessionStorage.setItem('hotelStaffLogin', JSON.stringify(staffData));

        showAuthSuccess('Login successful! Redirecting...');
        setLoading(btnId, false);
        setTimeout(() => window.location.href = 'hotel-manage.html?id=' + found.hotelRefId, 600);
    }).catch((e) => {
        setLoading(btnId, false);
        showAuthError('Error: ' + e.message);
    });
}

function handleHotelStaffLogin(event) {
    handleHotelLogin(event);
}

// ============================================================================
// SECTION 8: DATES & PRICING
// ============================================================================

function setDefaultDates() {
    const t2 = getTomorrow();
    const t3 = getDayAfter();
    document.querySelectorAll('#checkIn, #filterCheckIn, #bookCheckIn, #mgrCheckIn').forEach(el => { if (el) el.value = getDateStr(t2); });
    document.querySelectorAll('#checkOut, #filterCheckOut, #bookCheckOut, #mgrCheckOut').forEach(el => { if (el) el.value = getDateStr(t3); });
}

function calculatePrice() {
    const hotelId = getUrlParam('id');
    if (!hotelId) return;

    const checkIn = document.getElementById('bookCheckIn')?.value;
    const checkOut = document.getElementById('bookCheckOut')?.value;
    const roomType = document.getElementById('bookRoomType')?.value;
    if (!checkIn || !checkOut) return;

    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const mult = ROOM_MULTIPLIERS[roomType] || 1;

    dbGet('hotels/' + hotelId).then(hotel => {
        const rp = Math.round((hotel?.price || 1000) * mult);
        const total = rp * nights;
        document.getElementById('pricePerNight').textContent = formatCurrency(rp);
        document.getElementById('nightsCount').textContent = nights;
        document.getElementById('totalAmount').textContent = formatCurrency(total);
    });
}

function assignRoomNumber(hotelId, checkIn, checkOut) {
    return dbGet('bookings').then(bookings => {
        return dbGet('hotels').then(hotels => {
            const list = Object.values(bookings || {});
            const hotel = Object.values(hotels || {}).find(h => h.id === hotelId);
            const totalRooms = hotel?.rooms || 10;

            const conflicting = list.filter(b => {
                if (b.hotelId !== hotelId || b.status === 'cancelled' || !b.roomNumber) return false;
                const bCheckIn = new Date(b.checkIn);
                const bCheckOut = new Date(b.checkOut);
                const newCheckIn = new Date(checkIn);
                const newCheckOut = new Date(checkOut);
                return newCheckIn < bCheckOut && newCheckOut > bCheckIn;
            });

            const usedRooms = new Set(conflicting.map(b => b.roomNumber));
            for (let i = 1; i <= totalRooms; i++) {
                const roomNum = 'Room ' + i;
                if (!usedRooms.has(roomNum)) return roomNum;
            }
            return 'Room ' + (totalRooms + 1);
        });
    });
}

// ============================================================================
// SECTION 9: WISHLIST / FAVORITES
// ============================================================================

async function getWishlistSetForCurrentUser() {
    if (!currentUser) return new Set();
    try {
        const snap = await dbGet('wishlists/' + currentUser.uid) || {};
        return new Set(Object.keys(snap));
    } catch (e) {
        return new Set();
    }
}

async function toggleFav(btn) {
    if (!currentUser) {
        showToast('Please sign in to use wishlist', 'error');
        setTimeout(() => window.location.href = 'login.html', 900);
        return;
    }

    const card = btn.closest('.oyo-card');
    const hotelId = card?.dataset?.id;
    if (!hotelId) return;

    const wishRef = 'wishlists/' + currentUser.uid + '/' + hotelId;

    try {
        const snap = await dbGet(wishRef);
        if (snap) {
            await dbRemove(wishRef);
            btn.classList.remove('liked');
            btn.querySelector('i').className = 'far fa-heart';
            showToast('Removed from wishlist', 'info');
        } else {
            await dbSet(wishRef, { savedAt: new Date().toISOString() });
            btn.classList.add('liked');
            btn.querySelector('i').className = 'fas fa-heart';
            showToast('Added to wishlist!', 'success');
        }
    } catch (e) {
        showToast('Wishlist update failed. Try again.', 'error');
    }
}

// ============================================================================
// SECTION 10: HOTEL CARDS
// ============================================================================

function createHotelCard(hotel, wishlistSet) {
    const images = hotel.images || [hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];
    const amenities = hotel.amenities || ['Free WiFi'];
    const discount = hotel.discount || 0;
    const rating = hotel.rating || 3;
    const reviews = hotel.reviews || Math.floor(Math.random() * 200) + 50;
    const liked = wishlistSet ? wishlistSet.has(hotel.id) : false;
    const favClass = liked ? 'liked' : '';
    const favIcon = liked ? 'fas fa-heart' : 'far fa-heart';

    return `
        <div class="oyo-card" data-id="${hotel.id}">
            <div class="oyo-card-image-wrap" onclick="window.location.href='hotel-detail.html?id=${hotel.id}'">
                <img src="${images[0]}" alt="${hotel.name}" loading="lazy" id="cardImg_${hotel.id}">
                <span class="oyo-card-badge">${hotel.stars || 3}★ ${hotel.city || 'New'}</span>
                ${discount > 0 ? '<span class="oyo-card-discount">' + discount + '% OFF</span>' : ''}
                <div class="image-dots" id="dots_${hotel.id}">
                    ${images.map((_, i) => '<span class="image-dot ' + (i === 0 ? 'active' : '') + '" onclick="event.stopPropagation();switchCardImage(\'' + hotel.id + '\', ' + i + ')"></span>').join('')}
                </div>
                ${images.length > 1 ? `
                    <button class="img-nav prev" onclick="event.stopPropagation();switchCardImage('${hotel.id}', -1)"><i class="fas fa-chevron-left"></i></button>
                    <button class="img-nav next" onclick="event.stopPropagation();switchCardImage('${hotel.id}', 1)"><i class="fas fa-chevron-right"></i></button>
                ` : ''}
                <button class="oyo-card-fav ${favClass}" onclick="event.stopPropagation();toggleFav(this)" title="${liked ? 'Remove from' : 'Add to'} wishlist"><i class="${favIcon}"></i></button>
            </div>
            <div class="oyo-card-body" onclick="window.location.href='hotel-detail.html?id=${hotel.id}'">
                <div class="hotel-name">${hotel.name}</div>
                <div class="hotel-location"><i class="fas fa-map-marker-alt"></i> ${hotel.city || 'TBD'}, ${hotel.state || ''}</div>
                <div class="hotel-meta">
                    <span class="hotel-rating"><i class="fas fa-star"></i> ${rating}</span>
                    <span class="hotel-reviews">${reviews} reviews</span>
                    <span style="font-size:12px;color:#888;"><i class="fas fa-bed"></i> ${hotel.available || 0} rooms left</span>
                </div>
                <div class="hotel-amenities">
                    ${amenities.slice(0, 4).map(a => '<span>' + a + '</span>').join('')}
                    ${amenities.length > 4 ? '<span>+' + (amenities.length - 4) + ' more</span>' : ''}
                </div>
            </div>
            <div class="oyo-card-footer">
                <div class="price">${formatCurrency(hotel.price || 1000)} <small>/ night</small></div>
                <button class="book-btn" onclick="event.stopPropagation();window.location.href='hotel-detail.html?id=${hotel.id}'">Book Now</button>
            </div>
        </div>`;
}

function switchCardImage(hotelId, direction) {
    const hotel = window._hotelsData ? window._hotelsData.find(h => h.id === hotelId) : null;
    if (!hotel) return;

    const images = hotel.images || [hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];
    if (!cardImageIndex[hotelId]) cardImageIndex[hotelId] = 0;

    if (direction === -1) cardImageIndex[hotelId] = (cardImageIndex[hotelId] - 1 + images.length) % images.length;
    else if (direction === 1) cardImageIndex[hotelId] = (cardImageIndex[hotelId] + 1) % images.length;
    else cardImageIndex[hotelId] = direction;

    const img = document.getElementById('cardImg_' + hotelId);
    if (img) img.src = images[cardImageIndex[hotelId]];

    document.querySelectorAll('#dots_' + hotelId + ' .image-dot').forEach((d, i) => d.classList.toggle('active', i === cardImageIndex[hotelId]));
}

// ============================================================================
// SECTION 11: HOME PAGE (Featured Hotels)
// ============================================================================

async function loadFeaturedHotels() {
    const container = document.getElementById('featuredHotels');
    if (!container) return;

    const wishlistSet = await getWishlistSetForCurrentUser();
    const hotels = await dbGet('hotels') || {};
    const list = Object.values(hotels).filter(h => h.featured).slice(0, 6);

    if (!list.length) {
        container.innerHTML = '<p class="empty-state">No hotels yet. <a href="hotels.html">Browse all</a></p>';
        return;
    }
    container.innerHTML = list.map(h => createHotelCard(h, wishlistSet)).join('');
}

// ===== ALL HOTELS ON HOMEPAGE =====
async function loadAllHotelsOnHomepage() {
    const container = document.getElementById('allHotelsList');
    if (!container) return;

    const hotels = await dbGet('hotels') || {};
    const list = Object.values(hotels);

    if (!list.length) {
        container.innerHTML = '<div class="empty-state">No hotels yet. <a href="hotels.html">Browse all</a></div>';
        return;
    }

    const wishlistSet = await getWishlistSetForCurrentUser();
    container.innerHTML = list.map(h => createHotelCard(h, wishlistSet)).join('');
}

// ============================================================================
// SECTION 12: HOTELS LISTING PAGE
// ============================================================================

async function loadAllHotels(filteredData) {
    const container = document.getElementById('hotelList');
    if (!container) return;

    const data = filteredData || Object.values(await dbGet('hotels') || {});
    window._hotelsData = data;

    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = data.length;

    if (!data.length) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-hotel empty-state-icon"></i> No hotels found.</p>';
        return;
    }

    const wishlistSet = await getWishlistSetForCurrentUser();
    container.innerHTML = data.map(h => createHotelCard(h, wishlistSet)).join('');
}

function searchHotels() {
    const loc = document.getElementById('searchLocation')?.value || '';
    window.location.href = 'hotels.html?search=' + encodeURIComponent(loc);
}

async function applyFilters() {
    const location = (document.getElementById('filterLocation')?.value || '').toLowerCase();
    const minPrice = parseInt(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('maxPrice')?.value) || 50000;
    const minRating = parseInt(document.getElementById('filterRating')?.value) || 0;

    const hotels = Object.values(await dbGet('hotels') || {});
    const filtered = hotels.filter(h => {
        const ml = !location || (h.city || '').toLowerCase().includes(location) || (h.state || '').toLowerCase().includes(location);
        const mp = (h.price || 0) >= minPrice && (h.price || 0) <= maxPrice;
        const mr = (h.rating || 0) >= minRating;
        return ml && mp && mr;
    });
    loadAllHotels(filtered);
}

function resetFilters() {
    document.getElementById('filterLocation').value = '';
    document.getElementById('minPrice').value = 0;
    document.getElementById('maxPrice').value = 50000;
    document.getElementById('filterRating').value = '0';
    loadAllHotels();
}

async function sortHotels() {
    const sortBy = document.getElementById('sortSelect')?.value;
    if (!sortBy) return;

    let sorted = Object.values(await dbGet('hotels') || {});
    switch (sortBy) {
        case 'name': sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
        case 'price-low': sorted.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
        case 'price-high': sorted.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
        case 'rating': sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }
    loadAllHotels(sorted);
}

function filterByCategory(category, el) {
    currentCategory = category;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    applyFilters();
}

// ============================================================================
// SECTION 13: HOTEL DETAIL PAGE
// ============================================================================

async function loadHotelDetail() {
    const hotelId = getUrlParam('id');
    const hotels = await dbGet('hotels') || {};
    const hotel = Object.values(hotels).find(h => h.id === hotelId);

    if (!hotel) {
        const mainLayout = document.querySelector('.detail-main-layout');
        if (mainLayout) {
            mainLayout.innerHTML = '<p class="empty-state" style="grid-column:1/-1;padding:80px 20px;">Hotel not found. <a href="hotels.html">Browse hotels</a></p>';
        }
        return;
    }

    detailImages = hotel.images || [hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];
    detailCurrentIndex = 0;

    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    setText('detailBreadcrumb', hotel.name);

    // Gallery
    updateGalleryDisplay();

    // Thumbnails
    const thumbContainer = document.getElementById('thumbnailContainer');
    if (thumbContainer) {
        thumbContainer.innerHTML = detailImages.map((img, i) =>
            '<div class="thumb ' + (i === 0 ? 'active' : '') + '" onclick="changeImage(' + i + ', this)"><img src="' + img + '" alt="view ' + (i + 1) + '" loading="lazy"></div>'
        ).join('');
    }

    setText('detailName', hotel.name);
    setHtml('detailLocation', '<i class="fas fa-map-marker-alt"></i> ' + (hotel.city || 'TBD') + ', ' + (hotel.state || ''));

    const ratingEl = document.getElementById('detailRating');
    if (ratingEl) ratingEl.innerHTML = '<i class="fas fa-star"></i> ' + (hotel.rating || 3.0);

    const reviewCount = document.getElementById('detailReviewCount');
    if (reviewCount) reviewCount.textContent = (hotel.reviewCount || Math.floor(Math.random() * 200) + 20) + ' reviews';

    const roomsLeft = document.getElementById('roomsLeftText');
    if (roomsLeft) roomsLeft.textContent = (hotel.available || 0) + ' rooms left';

    setText('detailDescription', hotel.description || 'No description yet.');
    setText('policyCheckIn', hotel.checkIn || '14:00');
    setText('policyCheckOut', hotel.checkOut || '11:00');
    setText('policyCancellation', hotel.cancellation || 'Free cancellation');
    setText('policyRefund', hotel.refund || 'Full refund');

    setHtml('detailAmenities', (hotel.amenities || ['Free WiFi']).map(a =>
        '<div class="amenity-item"><i class="fas fa-check-circle"></i> ' + a + '</div>'
    ).join(''));

    // Sample reviews
    const reviewContainer = document.getElementById('detailReviews');
    if (reviewContainer) {
        const sampleReviews = [
            { name: 'Rahul S.', date: '2 weeks ago', text: 'Amazing stay! The room was clean and staff was very helpful. Would definitely recommend.' },
            { name: 'Priya M.', date: '1 month ago', text: 'Great location and beautiful property. The food was excellent.' },
            { name: 'Amit K.', date: '3 months ago', text: 'Good value for money. Comfortable rooms and nice amenities.' }
        ];
        reviewContainer.innerHTML = sampleReviews.map(r =>
            '<div class="review-item"><div class="review-header"><div class="review-avatar">' + r.name.charAt(0) +
            '</div><div><div class="review-name">' + r.name + '</div><div class="review-date">' + r.date +
            '</div></div></div><div class="review-text">' + r.text + '</div></div>'
        ).join('');
    }

    // Pricing
    setText('detailPrice', formatCurrency(hotel.price || 1000));
    setText('detailPriceSub', hotel.price ? '₹' + hotel.price + '/night before taxes' : '');

    setDefaultDates();
    calculatePrice();

    document.getElementById('bookCheckIn')?.addEventListener('change', calculatePrice);
    document.getElementById('bookCheckOut')?.addEventListener('change', calculatePrice);
    document.getElementById('bookRoomType')?.addEventListener('change', calculatePrice);
}

// Gallery navigation
function updateGalleryDisplay() {
    const img = document.getElementById('mainImage');
    if (img) img.src = detailImages[detailCurrentIndex] || detailImages[0];
    const counter = document.getElementById('galleryCounter');
    if (counter) counter.textContent = (detailCurrentIndex + 1) + ' / ' + detailImages.length;
}

function navigateGallery(direction) {
    if (!detailImages.length) return;
    detailCurrentIndex = direction === -1
        ? (detailCurrentIndex - 1 + detailImages.length) % detailImages.length
        : (detailCurrentIndex + 1) % detailImages.length;
    updateGalleryDisplay();
    updateActiveThumb();
}

function changeImage(index, el) {
    detailCurrentIndex = index;
    updateGalleryDisplay();
    if (el) {
        document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    } else {
        updateActiveThumb();
    }
}

function updateActiveThumb() {
    document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === detailCurrentIndex));
}

function openLightbox() {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    if (lb && lbImg && detailImages.length) {
        lbImg.src = detailImages[detailCurrentIndex];
        lb.classList.add('active');
    }
}

function closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('active');
}

function switchDetailTab(tabName, btn) {
    document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.detail-tab-content').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');
}

// ===== TOGGLE BOOKING FOR OTHER PERSON =====
function toggleBookingForOther() {
    const val = document.getElementById('bookingForType')?.value;
    const otherFields = document.getElementById('otherPersonFields');
    if (otherFields) {
        otherFields.style.display = val === 'other' ? 'block' : 'none';
    }
}

// ============================================================================
// SECTION 14: BOOKING
// ============================================================================

async function bookNow() {
    if (!currentUser) {
        showToast('Please sign in first to book a hotel', 'error');
        setTimeout(() => window.location.href = 'login.html', 1200);
        return;
    }

    // Check phone in profile
    const userSnap = await db.ref('users/' + currentUser.uid).once('value');
    const userData = userSnap.val();
    if (!userData || !userData.phone) {
        showToast('Please set your mobile number in My Profile before booking', 'error');
        setTimeout(() => window.location.href = 'profile.html', 1500);
        return;
    }

    // Handle "Someone else" booking
    const bookingForType = document.getElementById('bookingForType')?.value || 'self';
    let guestName = currentUser.displayName || currentUser.email;
    let guestEmail = currentUser.email;
    let guestPhone = userData.phone || '';
    let guestWhatsapp = userData.whatsapp || '';

    if (bookingForType === 'other') {
        const otherName = document.getElementById('otherPersonName')?.value.trim();
        const otherPhone = document.getElementById('otherPersonPhone')?.value.trim();
        const otherEmail = document.getElementById('otherPersonEmail')?.value.trim();

        if (!otherName) {
            showToast('Please enter the guest name', 'error');
            return;
        }
        if (!otherPhone) {
            showToast('Please enter the guest phone number', 'error');
            return;
        }

        guestName = otherName;
        guestPhone = otherPhone;
        guestEmail = otherEmail || currentUser.email;
    }

    const hotelId = getUrlParam('id');
    if (!hotelId) return;

    const hotels = await dbGet('hotels') || {};
    const hotel = Object.values(hotels).find(h => h.id === hotelId);
    if (!hotel) return;

    const checkIn = document.getElementById('bookCheckIn')?.value;
    const checkOut = document.getElementById('bookCheckOut')?.value;
    const guests = document.getElementById('bookGuests')?.value || 2;
    const roomType = document.getElementById('bookRoomType')?.value || 'Standard';

    if (!checkIn || !checkOut) { showToast('Please select dates.', 'error'); return; }
    if (new Date(checkIn) >= new Date(checkOut)) { showToast('Check-out must be after check-in.', 'error'); return; }

    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const mult = ROOM_MULTIPLIERS[roomType] || 1;
    const rp = Math.round((hotel.price || 1000) * mult);
    const subtotal = rp * nights;

    let total = subtotal;
    let discount = 0;
    let couponInfo = null;

    if (window.appliedCoupon) {
        const offer = window.appliedCoupon;
        const offerKey = offer.offerKey || offer.id;
        if (offer.type === 'percentage') {
            discount = Math.round(subtotal * (offer.value / 100));
            if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
        } else {
            discount = Math.min(offer.value, subtotal);
        }
        total = Math.max(0, subtotal - discount);
        couponInfo = { code: offer.code, title: offer.title, discount, type: offer.type, value: offer.value };
        if (offerKey) {
            offer.usedCount = (offer.usedCount || 0) + 1;
            await dbSet('offers/' + offerKey, offer);
        }
    }

    const roomNumber = await assignRoomNumber(hotel.id, checkIn, checkOut);

    const booking = {
        id: generateBookingId(),
        userId: currentUser.uid,
        customerName: guestName,
        customerEmail: guestEmail || currentUser.email,
        customerPhone: guestPhone,
        customerWhatsapp: userData.whatsapp || '',
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomType, checkIn, checkOut,
        roomNumber,
        guests: parseInt(guests),
        bookingFor: bookingForType,
        guestName: bookingForType === 'other' ? guestName : '',
        guestPhone: bookingForType === 'other' ? guestPhone : '',
        guestEmail: bookingForType === 'other' ? guestEmail : '',
        amount: total,
        originalAmount: subtotal,
        discount: discount,
        coupon: couponInfo,
        status: 'confirmed',
        paymentStatus: 'pending',
        paymentMethod: 'pay_at_hotel',
        date: new Date().toISOString()
    };

    await dbPush('bookings', booking);

    hotel.available = Math.max(0, (hotel.available || 0) - 1);
    await dbSet('hotels/' + hotel.id, hotel);

    const now = new Date();
    const bookingDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const bookingTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let detailsHtml = '<div class="invoice-receipt">' +
        '<div class="invoice-header">' +
            '<div>' +
                '<div class="invoice-logo">BookMyHotel</div>' +
                '<div class="invoice-subtitle">Booking Confirmation</div>' +
            '</div>' +
            '<div class="invoice-meta">' +
                '<div class="invoice-date">' + bookingDate + '</div>' +
                '<div class="invoice-time">' + bookingTime + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="invoice-divider"></div>' +
        '<div class="invoice-section-title">Booking Details</div>' +
        '<div class="invoice-grid">' +
            '<div class="invoice-field"><span>Booking ID</span><strong class="booking-id-highlight">' + booking.id + '</strong></div>' +
            '<div class="invoice-field"><span>Status</span><span class="status-badge confirmed">Confirmed</span></div>' +
            '<div class="invoice-field"><span>Hotel</span><strong>' + hotel.name + '</strong></div>' +
            '<div class="invoice-field"><span>Guest</span><strong>' + guestName + '</strong></div>' +
            '<div class="invoice-field"><span>Phone</span><span>' + guestPhone + '</span></div>' +
            '<div class="invoice-field"><span>Room</span><span>' + roomNumber + ' · ' + roomType + '</span></div>' +
            '<div class="invoice-field"><span>Check In</span><span>' + formatDate(checkIn) + '</span></div>' +
            '<div class="invoice-field"><span>Check Out</span><span>' + formatDate(checkOut) + '</span></div>' +
            '<div class="invoice-field"><span>Guests</span><span>' + guests + ' Guest' + (guests > 1 ? 's' : '') + '</span></div>' +
            '<div class="invoice-field"><span>Nights</span><span>' + nights + '</span></div>' +
        '</div>';

    if (discount > 0) {
        detailsHtml += '<div class="invoice-divider"></div>' +
            '<div class="invoice-section-title">Payment Summary</div>' +
            '<div class="invoice-grid">' +
                '<div class="invoice-field"><span>Subtotal</span><span>' + formatCurrency(subtotal) + '</span></div>' +
                '<div class="invoice-field discount-row"><span>Coupon (' + couponInfo.code + ')</span><span>- ' + formatCurrency(discount) + '</span></div>' +
                '<div class="invoice-field total-row"><span>Total Paid</span><strong>' + formatCurrency(total) + '</strong></div>' +
            '</div>';
    } else {
        detailsHtml += '<div class="invoice-divider"></div>' +
            '<div class="invoice-section-title">Payment Summary</div>' +
            '<div class="invoice-grid">' +
                '<div class="invoice-field total-row"><span>Total Amount</span><strong>' + formatCurrency(total) + '</strong></div>' +
            '</div>';
    }

    detailsHtml += '<div class="invoice-divider"></div>' +
        '<div class="invoice-pay-badge"><i class="fas fa-hotel"></i> Pay at Hotel — Cash / Card / UPI accepted at check-in</div>' +
        '<div class="invoice-footer"><span class="status-badge confirmed">Confirmed</span> Instant booking confirmation</div>' +
    '</div>';

    document.getElementById('bookingDetails').innerHTML = detailsHtml;
    removeCoupon();
    openModal('bookingModal');
}

// ============================================================================
// SECTION 14.5: PROFILE PAGE
// ============================================================================

async function loadProfile() {
    if (!currentUser) {
        showToast('Please sign in first', 'error');
        setTimeout(() => window.location.href = 'login.html', 1200);
        return;
    }

    // Set defaults from Firebase auth
    const authEmail = currentUser.email || '';
    const authName = currentUser.displayName || '';

    document.getElementById('profileEmailInput').value = authEmail;
    document.getElementById('profileEmail').textContent = authEmail;
    document.getElementById('profileFullName').value = authName || (authEmail ? authEmail.split('@')[0] : 'User');
    document.getElementById('profileName').textContent = authName || (authEmail ? authEmail.split('@')[0] : 'User');
    document.getElementById('profileAvatar').textContent = (authName || 'U').charAt(0).toUpperCase();

    try {
        const snap = await db.ref('users/' + currentUser.uid).once('value');
        const data = snap.val();
        if (data) {
            if (data.name) {
                document.getElementById('profileFullName').value = data.name;
                document.getElementById('profileName').textContent = data.name;
                document.getElementById('profileAvatar').textContent = data.name.charAt(0).toUpperCase();
            }
            if (data.phone) {
                document.getElementById('profilePhone').value = data.phone;
            } else {
                document.getElementById('profilePhone').value = '';
            }
            if (data.whatsapp) {
                document.getElementById('profileWhatsApp').value = data.whatsapp;
            } else {
                document.getElementById('profileWhatsApp').value = '';
            }
        }
    } catch (e) {
        console.error('Error loading profile:', e);
    }
}

async function saveProfile(event) {
    event.preventDefault();
    if (!currentUser) { showToast('Please sign in', 'error'); return; }

    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const name = document.getElementById('profileFullName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const whatsapp = document.getElementById('profileWhatsApp').value.trim();

    if (!name) { showToast('Name is required', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Changes'; return; }
    if (!phone) { showToast('Mobile number is required for booking', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Changes'; return; }

    try {
        await currentUser.updateProfile({ displayName: name });

        const updateData = {
            name: name,
            phone: phone,
            whatsapp: whatsapp || '',
            updatedAt: new Date().toISOString()
        };
        await db.ref('users/' + currentUser.uid).update(updateData);

        document.getElementById('profileName').textContent = name;
        document.getElementById('profileAvatar').textContent = name.charAt(0).toUpperCase();
        document.getElementById('profileFullName').value = name;

        showToast('Profile updated successfully!', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
}

// ============================================================================
// SECTION 15: MY BOOKINGS PAGE
// ============================================================================

async function loadMyBookings() {
    const container = document.getElementById('myBookingsList');
    if (!container) return;

    const countEl = document.getElementById('bookingCount');
    const bookings = await dbGet('bookings') || {};
    const list = Object.values(bookings).filter(b => b.userId === currentUser.uid || b.customerEmail === currentUser.email);
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!list.length) {
        if (countEl) countEl.textContent = '0 bookings';
        container.innerHTML = '<p class="empty-state"><i class="fas fa-calendar-times empty-state-icon"></i> No bookings yet. <a href="hotels.html">Browse hotels</a></p>';
        return;
    }

    if (countEl) countEl.textContent = list.length + ' booking' + (list.length > 1 ? 's' : '');

    container.innerHTML = '<div class="bookings-grid">' + list.map(b => `
        <div class="booking-card-item">
            <div class="booking-card-header">
                <span class="booking-id">${b.id}</span>
                ${getStatusBadge(b.status)}
            </div>
            <div class="booking-card-body">
                <h3>${b.hotelName}</h3>
                <p><i class="fas fa-bed"></i> ${b.roomType} · ${b.guests} Guest${b.guests > 1 ? 's' : ''}</p>
                <p><i class="fas fa-door-open"></i> Room: <strong>${b.roomNumber || 'Not assigned yet'}</strong></p>
                <div class="booking-dates">
                    <div class="date-box">
                        <div class="date-label">Check In</div>
                        <div class="date-value">${formatDate(b.checkIn)}</div>
                    </div>
                    <div class="date-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="date-box">
                        <div class="date-label">Check Out</div>
                        <div class="date-value">${formatDate(b.checkOut)}</div>
                    </div>
                </div>
            </div>
            <div class="booking-card-footer">
                <div class="amount">${formatCurrency(b.amount)}</div>
                <div class="status-wrap">
                    <span style="font-size:12px;color:var(--gray);font-weight:500;">Payment:</span>
                    ${getStatusBadge(b.paymentStatus)}
                </div>
            </div>
        </div>
    `).join('') + '</div>';
}

// ============================================================================
// SECTION 16: COUPON SYSTEM
// ============================================================================

async function applyCoupon() {
    const code = document.getElementById('couponCode')?.value.trim().toUpperCase();
    if (!code) { showToast('Please enter a coupon code.', 'error'); return; }

    const offers = await dbGet('offers') || {};
    const offerEntry = Object.entries(offers).find(([key, o]) => o.code === code && o.status === 'active');
    if (!offerEntry) { showToast('Invalid or expired coupon code.', 'error'); return; }
    const [offerKey, offer] = offerEntry;

    const today = new Date().toISOString().split('T')[0];
    if (offer.validFrom && today < offer.validFrom) { showToast('This offer is not yet valid.', 'error'); return; }
    if (offer.validTill && today > offer.validTill) { showToast('This offer has expired.', 'error'); return; }
    if (offer.usageLimit && (offer.usedCount || 0) >= offer.usageLimit) { showToast('This offer has reached its usage limit.', 'error'); return; }

    const hotelId = getUrlParam('id');
    if (offer.scope === 'specific' && offer.hotelIds && !offer.hotelIds.includes(hotelId)) { showToast('This coupon is not applicable to this hotel.', 'error'); return; }

    const checkIn = document.getElementById('bookCheckIn')?.value;
    const checkOut = document.getElementById('bookCheckOut')?.value;
    const roomType = document.getElementById('bookRoomType')?.value || 'Standard';
    if (!checkIn || !checkOut) { showToast('Please select dates first.', 'error'); return; }

    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const mult = ROOM_MULTIPLIERS[roomType] || 1;

    const hotel = await dbGet('hotels/' + hotelId);
    if (!hotel) return;
    const rp = Math.round((hotel.price || 1000) * mult);
    const subtotal = rp * nights;

    if (subtotal < (offer.minAmount || 0)) { showToast('Minimum booking amount for this coupon is ' + formatCurrency(offer.minAmount) + '.', 'error'); return; }

    let discount = 0;
    if (offer.type === 'percentage') {
        discount = Math.round(subtotal * (offer.value / 100));
        if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
    } else {
        discount = Math.min(offer.value, subtotal);
    }
    const total = Math.max(0, subtotal - discount);

    window.appliedCoupon = { ...offer, discount, originalTotal: subtotal, finalTotal: total, offerKey };

    document.getElementById('pricePerNight').textContent = formatCurrency(rp);
    document.getElementById('nightsCount').textContent = nights;
    document.getElementById('totalAmount').textContent = formatCurrency(total);
    document.getElementById('couponStatus').innerHTML = '<span style="color:#276749;font-weight:600;"><i class="fas fa-check-circle"></i> Coupon applied! You save ' + formatCurrency(discount) + '</span>';
    document.getElementById('couponCode').value = code;
    document.getElementById('applyCouponBtn').classList.add('btn-icon');
    document.getElementById('removeCouponBtn').classList.remove('btn-icon');

    const badge = document.getElementById('couponBadge');
    if (badge) {
        badge.style.display = 'block';
        badge.innerHTML = '<div style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#E8F5E9,#C6F6D5);color:#276749;padding:8px 16px;border-radius:50px;font-size:13px;font-weight:700;border:1px solid #9AE6B4;"><i class="fas fa-tag"></i> ' + offer.title + ' (' + code + ') <span style="background:#276749;color:#fff;padding:2px 8px;border-radius:50px;font-size:11px;margin-left:4px;">-' + formatCurrency(discount) + '</span></div>';
    }
}

function removeCoupon() {
    window.appliedCoupon = null;
    document.getElementById('couponStatus').innerHTML = '';
    document.getElementById('couponCode').value = '';
    document.getElementById('applyCouponBtn').classList.remove('btn-icon');
    document.getElementById('removeCouponBtn').classList.add('btn-icon');

    const badge = document.getElementById('couponBadge');
    if (badge) {
        badge.style.display = 'none';
        badge.innerHTML = '';
    }
    calculatePrice();
}

// ============================================================================
// SECTION 17: GALLERY IMAGE HELPERS (Admin)
// ============================================================================

function openImageGallery(hotelId, hotelName) {
    galleryHotelId = hotelId;
    document.getElementById('galleryHotelName').textContent = hotelName + ' - Images';
    loadHotelImages(hotelId);
    openModal('imageGalleryModal');
}

async function loadHotelImages(hotelId) {
    const hotel = await dbGet('hotels/' + hotelId);
    if (!hotel) return;
    galleryImages = hotel.images || [hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];
    renderGalleryImages();
}

function renderGalleryImages() {
    const container = document.getElementById('galleryImages');
    container.innerHTML = galleryImages.map((img, i) =>
        '<div class="img-item ' + (i === 0 ? 'main' : '') + '" onclick="setMainImage(' + i + ')">' +
        '<img src="' + img + '" alt="Hotel image ' + (i + 1) + '" loading="lazy">' +
        '<button class="del-img" onclick="event.stopPropagation();removeGalleryImage(' + i + ')"><i class="fas fa-times"></i></button>' +
        (i === 0 ? '<span class="main-badge">Main</span>' : '') + '</div>'
    ).join('');
}

function addGalleryImage() {
    const url = document.getElementById('galleryUrlInput').value.trim();
    if (!url) { showToast('Please enter an image URL', 'error'); return; }
    if (!url.startsWith('http')) { showToast('Invalid URL - must start with http', 'error'); return; }
    galleryImages.push(url);
    document.getElementById('galleryUrlInput').value = '';
    renderGalleryImages();
    showToast('Image added! You can add unlimited images', 'success');
}

function removeGalleryImage(index) {
    if (galleryImages.length <= 1) { showToast('Cannot remove the last image', 'error'); return; }
    if (index === 0 && galleryImages.length > 1) {
        galleryImages.shift();
        renderGalleryImages();
        showToast('Main image removed. First image is now the main image', 'info');
        return;
    }
    galleryImages.splice(index, 1);
    renderGalleryImages();
    showToast('Image removed', 'info');
}

function setMainImage(index) {
    if (index === 0) return;
    const img = galleryImages.splice(index, 1)[0];
    galleryImages.unshift(img);
    renderGalleryImages();
    showToast('Set as main image', 'success');
}

async function saveGalleryImages() {
    if (!galleryHotelId || !galleryImages.length) { showToast('At least one image is required', 'error'); return; }

    const hotel = await dbGet('hotels/' + galleryHotelId);
    if (!hotel) return;

    hotel.images = galleryImages;
    hotel.image = galleryImages[0];
    await dbSet('hotels/' + galleryHotelId, hotel);
    showToast('Images saved successfully!', 'success');
    closeModal('imageGalleryModal');

    if (window.location.pathname.includes('hotels.html')) loadAllHotels();
}

// ============================================================================
// SECTION 18: WHATSAPP HELPERS
// ============================================================================

function normalizeWhatsAppNumber(phone) {
    if (!phone) return '';
    // Remove non-digits and keep leading + if present
    const trimmed = String(phone).trim();
    // WhatsApp wa.me expects country code without '+'. We'll remove '+' if present.
    const digits = trimmed.replace(/[^0-9+]/g, '');
    return digits.replace(/^\+/, '');
}

function openWhatsAppLink(phone, message) {
    const num = normalizeWhatsAppNumber(phone);
    if (!num) {
        showToast('WhatsApp number missing for this booking.', 'error');
        return;
    }
    const text = encodeURIComponent(message || '');
    const url = 'https://wa.me/' + num + '?text=' + text;
    window.open(url, '_blank');
}

function buildBookingWhatsAppMessage(b, hotel) {
    const hotelName = hotel?.name || b.hotelName || 'Hotel';
    const room = b.roomNumber || b.roomType || 'Room';
    const checkIn = b.checkIn ? formatDate(b.checkIn) : '—';
    const checkOut = b.checkOut ? formatDate(b.checkOut) : '—';
    const amount = b.amount != null ? formatCurrency(b.amount) : '₹0';

    const bookingId = b.id || 'Booking';
    const status = b.status ? String(b.status) : '';

    return (
        'Hi, booking details: %0A' +
        '• Booking ID: ' + bookingId + '%0A' +
        '• Hotel: ' + hotelName + '%0A' +
        '• Room: ' + room + '%0A' +
        '• Check-in: ' + checkIn + '%0A' +
        '• Check-out: ' + checkOut + '%0A' +
        '• Amount: ' + amount + '%0A' +
        (status ? ('• Status: ' + status + '%0A') : '') +
        '%0AThank you.'
    ).replace(/%0A/g, '\n');
}

async function getHotelWhatsAppNumber(hotelId) {
    const hotel = await dbGet('hotels/' + hotelId);

    // Prefer hotel contact fields: whatsapp → phone → contactWhatsApp → contactPhone
    const hotelPhone = (
        hotel?.whatsapp ||
        hotel?.phone ||
        hotel?.contactWhatsApp ||
        hotel?.contactPhone ||
        ''
    );
    if (hotelPhone) return hotelPhone;

    // Fallback to admin/platform support phone
    const settings = await dbGet('settings') || {};
    return settings?.supportPhone || '';
}



// ============================================================================
// SECTION 19: ADMIN PANEL
// ============================================================================


async function loadAdminPanel() {
    loadAdminStats();
    loadHotelsTable();
    loadPartnersTable();
    loadBookingsTable();
    loadUsersTable();
    loadCities();
    loadPartnerSelect();
    loadSettings();
    loadOffersTable();
}

async function loadAdminStats() {
    const hotels = await dbGet('hotels') || {};
    const bookings = await dbGet('bookings') || {};
    const users = await dbGet('users') || {};
    const partners = await dbGet('partners') || {};

    const bList = Object.values(bookings);
    const revenue = bList.reduce((s, b) => s + (b.amount || 0), 0);

    document.getElementById('totalHotelsStat').textContent = Object.values(hotels).length;
    document.getElementById('totalBookingsStat').textContent = bList.length;
    document.getElementById('activeBookingsStat').textContent = bList.filter(b => b.status === 'confirmed').length;
    document.getElementById('totalUsersStat').textContent = Object.keys(users).length;
    document.getElementById('totalPartnersStat').textContent = Object.keys(partners).length;
    document.getElementById('totalRevenueStat').textContent = formatCurrency(revenue);
}

async function loadHotelsTable() {
    const tbody = document.getElementById('hotelsTableBody');
    if (!tbody) return;

    const hotels = await dbGet('hotels') || {};
    const list = Object.values(hotels);

    tbody.innerHTML = list.length ? list.map(h => `
        <tr>
            <td>${h.id}</td>
            <td><strong>${h.name || 'Unnamed'}</strong></td>
            <td>${h.partnerName || 'N/A'}</td>
            <td>${h.city || 'N/A'}</td>
            <td>${formatCurrency(h.price || 0)}</td>
            <td>${h.rating || 0} ⭐</td>
            <td>${h.available || 0}/${h.rooms || 0}</td>
            <td>${getStatusBadge(h.status || 'active')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="editHotel('${h.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHotel('${h.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="9" class="empty-state">No hotels yet.</td></tr>';
}

async function loadPartnersTable() {
    const tbody = document.getElementById('partnersTableBody');
    if (!tbody) return;

    const partners = await dbGet('partners') || {};
    const list = Object.values(partners);

    tbody.innerHTML = list.length ? list.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><strong>${p.company || p.name || 'N/A'}</strong></td>
            <td>${p.owner || p.name || 'N/A'}</td>
            <td>${p.email || 'N/A'}</td>
            <td>${p.hotelCount || 0}</td>
            <td>${p.commission || 0}%</td>
            <td>${formatCurrency(p.revenue || 0)}</td>
            <td>${getStatusBadge(p.status || 'active')}</td>
            <td><button class="btn btn-sm btn-primary" onclick="editPartner('${p.id}')">Edit</button></td>
        </tr>
    `).join('') : '<tr><td colspan="9" class="empty-state">No partners yet.</td></tr>';
}

async function loadBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    const bookings = await dbGet('bookings') || {};
    const list = Object.values(bookings);

    tbody.innerHTML = list.length ? list.map(b => `
        <tr>
            <td>${b.id}</td>
            <td>${b.customerName || 'Guest'}</td>
            <td>${b.hotelName || 'N/A'}</td>
            <td>${b.roomNumber || b.roomType || 'Standard'}</td>
            <td>${formatDate(b.checkIn)}</td>
            <td>${formatDate(b.checkOut)}</td>
            <td>${b.guests || 1}</td>
            <td>${formatCurrency(b.amount || 0)}</td>
            <td>${getStatusBadge(b.paymentStatus || 'paid')}</td>
            <td>${getStatusBadge(b.status)}</td>
            <td>
                ${b.status === 'confirmed' ? '<button class="btn btn-sm btn-danger" onclick="cancelBooking(\'' + b.id + '\')">Cancel</button>' : ''}
                ${b.status === 'checked-in' ? '<button class="btn btn-sm btn-success" onclick="completeBooking(\'' + b.id + '\')">Done</button>' : ''}
                ${b.status === 'confirmed' ? '<button class="btn btn-sm btn-success" onclick="checkInBooking(\'' + b.id + '\')">Check In</button>' : ''}
                ${b.status === 'confirmed'
                    ? '<button class="btn btn-sm btn-accent" onclick="sendAdminWhatsAppToUser(\'' + b.id + '\')" title="WhatsApp to customer"><i class="fab fa-whatsapp"></i></button>'
                    : ''}
                ${b.status === 'confirmed'
                    ? '<button class="btn btn-sm btn-secondary" onclick="sendAdminWhatsAppToHotelManager(\'' + b.id + '\')" title="WhatsApp to hotel manager"><i class="fab fa-whatsapp"></i></button>'
                    : ''}
            </td>
        </tr>
    `).join('') : '<tr><td colspan="11" class="empty-state">No bookings yet.</td></tr>';
}

async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = await dbGet('users') || {};
    const list = Object.values(users);

    tbody.innerHTML = list.map(u => `
        <tr>
            <td>${u.uid || 'N/A'}</td>
            <td>${u.name || (u.email ? u.email.split('@')[0] : 'N/A')}</td>
            <td>${u.email || 'N/A'}</td>
            <td>${u.phone || 'N/A'}</td>
            <td><span class="status-badge ${getUserRole(u)}">${getUserRole(u).charAt(0).toUpperCase() + getUserRole(u).slice(1)}</span></td>
            <td>${u.createdAt ? formatDate(u.createdAt) : 'N/A'}</td>
            <td>${getStatusBadge('active')}</td>
        </tr>
    `).join('');
}

// ============================================================================
// SECTION 19: ADMIN CRUD - CITIES
// ============================================================================

async function loadCities() {
    const select = document.getElementById('newHotelCity');
    if (!select) return;

    const cities = await dbGet('cities') || {};
    const list = Object.values(cities);
    select.innerHTML = list.length ? list.map(c => '<option value="' + c.name + '">' + c.name + '</option>').join('') : '<option value="">Add a city first</option>';

    select.onchange = function () {
        const city = list.find(c => c.name === this.value);
        const stateField = document.getElementById('newHotelState');
        if (stateField && city) stateField.value = city.state;
    };

    const citiesList = document.getElementById('citiesList');
    if (citiesList) {
        citiesList.innerHTML = list.length
            ? list.map(c => '<span class="amenity-tag">' + c.name + ', ' + c.state + '</span>').join('')
            : '<p class="empty-state">No cities added yet.</p>';
    }
}

async function addCity(event) {
    event.preventDefault();
    const name = document.getElementById('newCityName').value.trim();
    const state = document.getElementById('newCityState').value.trim();
    if (!name) { showToast('Enter city name.', 'error'); return; }

    const city = { id: 'city_' + Date.now(), name, state: state || 'N/A' };
    await dbSet('cities/' + city.id, city);
    document.getElementById('addCityForm').reset();
    loadCities();
    showToast('City "' + name + '" added!', 'success');
}

// ============================================================================
// SECTION 20: ADMIN CRUD - HOTELS
// ============================================================================

function generateHotelId(hotelName, city) {
    const prefix = 'HTL';
    const cityCode = (city || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const namePart = (hotelName || 'HOTEL').substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
    const serial = Math.floor(100 + Math.random() * 900);
    return prefix + '_' + cityCode + '_' + namePart + '_' + serial;
}

function generateHotelPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
}

function generateHotelIdForForm() {
    const hName = document.getElementById('newHotelName')?.value || 'HOTEL';
    const city = document.getElementById('newHotelCity')?.value || 'CITY';
    const id = generateHotelId(hName, city);
    const el = document.getElementById('newHotelIdDisplay');
    if (el) el.value = id;
}

function generateHotelPasswordForForm() {
    const pwd = generateHotelPassword();
    const el = document.getElementById('newHotelPassword');
    if (el) el.value = pwd;
}

let hotelImageCount = 1;
function addImageRow() {
    if (hotelImageCount >= 10) { showToast('Maximum 10 images allowed', 'error'); return; }
    const container = document.getElementById('hotelImageInputs');
    const lastRow = container.querySelector('div:last-child');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;';
    row.innerHTML = '<input type="url" id="newHotelImage' + hotelImageCount + '" class="hotel-img-input" placeholder="Image URL ' + (hotelImageCount + 1) + '" style="flex:1;"><button type="button" class="btn btn-sm btn-danger" onclick="removeImageRow(this)" style="white-space:nowrap;">✕</button>';
    container.insertBefore(row, lastRow);
    hotelImageCount++;
    if (hotelImageCount >= 10) document.getElementById('addImgBtn').style.display = 'none';
}

function removeImageRow(btn) {
    btn.parentElement.remove();
    hotelImageCount--;
    document.getElementById('addImgBtn').style.display = 'inline-flex';
}

async function loadPartnerSelect() {
    const select = document.getElementById('newHotelPartner');
    if (!select) return;

    const partners = await dbGet('partners') || {};
    const list = Object.values(partners);
    select.innerHTML = list.length
        ? list.map(p => '<option value="' + p.id + '">' + (p.company || p.name) + '</option>').join('')
        : '<option value="">No partners</option>';
}

async function createHotelWithCredentials(event) {
    event.preventDefault();

    const hotelName = document.getElementById('newHotelName').value.trim();
    const hotelEmail = document.getElementById('newHotelEmail') ? document.getElementById('newHotelEmail').value.trim() : '';
    const city = document.getElementById('newHotelCity').value;
    const state = document.getElementById('newHotelState').value || 'N/A';
    const price = parseInt(document.getElementById('newHotelPrice').value) || 1000;
    const stars = parseInt(document.getElementById('newHotelStars').value) || 3;
    const rating = parseFloat(document.getElementById('newHotelRating').value) || 4;
    const rooms = parseInt(document.getElementById('newHotelRooms').value) || 1;
    const available = parseInt(document.getElementById('newHotelAvailable').value) || 0;
    const description = document.getElementById('newHotelDesc').value.trim();
    // Collect all image URLs from the multiple image inputs
    const imageInputs = document.querySelectorAll('.hotel-img-input');
    const images = [];
    imageInputs.forEach(inp => {
        const url = inp.value.trim();
        if (url && url.startsWith('http')) images.push(url);
    });
    if (images.length === 0) images.push('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800');
    const image = images[0];
    const amenities = (document.getElementById('newHotelAmenities').value || 'Free WiFi').split(',').map(a => a.trim()).filter(Boolean);
    const partnerId = document.getElementById('newHotelPartner').value;

    if (!hotelName || !city) { showToast('Please fill hotel name and city.', 'error'); return; }

    const hotelId = generateHotelId(hotelName, city);
    const hotelPassword = generateHotelPassword();

    const partners = await dbGet('partners') || {};
    const partner = Object.values(partners).find(p => p.id === partnerId);
    const partnerName = partner ? (partner.company || partner.name) : 'N/A';
    const hotelRefId = 'htl_' + Date.now();

    const hotel = {
        id: hotelRefId,
        hotelId: hotelId,
        hotelName: hotelName,
        hotelEmail: hotelEmail,
        partnerId: partnerId,
        partnerName: partnerName,
        name: hotelName,
        city: city,
        state: state,
        price: price,
        rating: rating,
        stars: stars,
        rooms: rooms,
        available: available,
        description: description,
        image: image,
        amenities: amenities,
        featured: true,
        status: 'active',
        checkIn: '14:00',
        checkOut: '11:00',
        cancellation: 'Free cancellation',
        refund: 'Full refund',
        createdAt: new Date().toISOString()
    };

    // Use manual Hotel ID if provided, otherwise generated
    const hotelIdField = document.getElementById('newHotelIdDisplay');
    const passwordField = document.getElementById('newHotelPassword');
    const manualPassword = passwordField ? passwordField.value.trim() : '';
    
    // If admin manually typed a password, use it; otherwise use generated
    const finalPassword = manualPassword || hotelPassword;
    if (passwordField) passwordField.value = finalPassword;
    
    // If admin manually typed a Hotel ID, use it
    const manualHotelId = hotelIdField ? hotelIdField.value.trim() : '';
    const finalHotelId = manualHotelId || hotelId;
    if (hotelIdField) hotelIdField.value = finalHotelId;

    try {
        await dbSet('hotels/' + hotelRefId, hotel);

        // Save hotel credentials for staff login via login.html
        // Hotel staff can login at login.html using:
        //   - Their Hotel Email as ID (normal customer login form)
        //   - Or the generated Hotel ID (Hotel Staff Login form)
        const credData = {
            hotelId: finalHotelId,
            hotelRefId: hotelRefId,
            hotelName: hotelName,
            email: hotelEmail || '',
            password: finalPassword,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        await dbSet('hotel-credentials/' + finalHotelId, credData);

        // Also create a user record so hotel staff can login via normal customer login
        try {
            if (hotelEmail) {
                const hotelUserData = {
                    uid: 'hotel_' + hotelRefId,
                    name: hotelName,
                    email: hotelEmail,
                    phone: '',
                    type: 'hotel',
                    role: 'hotel',
                    hotelId: hotelRefId,
                    hotelRefId: hotelRefId,
                    hotelName: hotelName,
                    emailVerified: false,
                    createdAt: new Date().toISOString()
                };
                await db.ref('users/hotel_' + hotelRefId).update(hotelUserData);
            }
        } catch (userError) {
            console.error('Failed to create user record:', userError);
        }

        const resultDiv = document.getElementById('hotelCredResult');
        if (resultDiv) {
            document.getElementById('resultHotelId').textContent = hotelEmail || hotelId;
            document.getElementById('resultHotelPassword').textContent = hotelPassword;
            document.getElementById('resultHotelName').textContent = hotelName;
            resultDiv.style.display = 'block';
        }

        showToast('Hotel "' + hotelName + '" created successfully!', 'success');
        document.getElementById('addHotelForm').reset();
        if (passwordField) passwordField.value = '';
        loadAdminStats();
        loadHotelsTable();
        loadCredHotelSelect();
        loadCredTable();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

async function addNewHotel(event) {
    await createHotelWithCredentials(event);
}

async function editHotel(id) {
    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === id);
    if (!h) return;

    document.getElementById('editHotelId').value = h.id;
    document.getElementById('editHotelName').value = h.name;
    document.getElementById('editHotelPrice').value = h.price;
    document.getElementById('editHotelRooms').value = h.rooms;
    document.getElementById('editHotelAvailable').value = h.available;
    document.getElementById('editHotelStatus').value = h.status || 'active';
    openModal('editHotelModal');
}

async function saveEditHotel(event) {
    event.preventDefault();
    const id = document.getElementById('editHotelId').value;
    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === id);
    if (!h) return;

    h.name = document.getElementById('editHotelName').value;
    h.price = parseInt(document.getElementById('editHotelPrice').value);
    h.rooms = parseInt(document.getElementById('editHotelRooms').value);
    h.available = parseInt(document.getElementById('editHotelAvailable').value);
    h.status = document.getElementById('editHotelStatus').value;
    await dbSet('hotels/' + h.id, h);
    closeModal('editHotelModal');
    loadHotelsTable();
    loadAdminStats();
    showToast('Hotel updated!', 'success');
}

async function deleteHotel(id) {
    if (!confirm('Delete this hotel?')) return;
    await dbRemove('hotels/' + id);
    loadHotelsTable();
    loadAdminStats();
    showToast('Hotel deleted.', 'info');
}

// ============================================================================
// SECTION 21: ADMIN CRUD - PARTNERS
// ============================================================================

async function editPartner(id) {
    const partners = await dbGet('partners') || {};
    const p = Object.values(partners).find(x => x.id === id);
    if (!p) return;

    document.getElementById('editPartnerId').value = p.id;
    document.getElementById('editPartnerName').value = p.company || p.name;
    document.getElementById('editPartnerCommission').value = p.commission || 0;
    document.getElementById('editPartnerStatus').value = p.status || 'active';
    openModal('editPartnerModal');
}

async function saveEditPartner(event) {
    event.preventDefault();
    const id = document.getElementById('editPartnerId').value;
    const partners = await dbGet('partners') || {};
    const p = Object.values(partners).find(x => x.id === id);
    if (!p) return;

    p.company = document.getElementById('editPartnerName').value;
    p.commission = parseInt(document.getElementById('editPartnerCommission').value);
    p.status = document.getElementById('editPartnerStatus').value;
    await dbSet('partners/' + p.id, p);
    closeModal('editPartnerModal');
    loadPartnersTable();
    showToast('Partner updated!', 'success');
}

// ============================================================================
// SECTION 22: ADMIN CRUD - USERS
// ============================================================================

async function createNewUser(event) {
    event.preventDefault();

    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const phone = document.getElementById('newUserPhone').value.trim();
    const type = document.getElementById('newUserType').value;
    const password = document.getElementById('newUserPassword').value;
    const confirm = document.getElementById('newUserConfirm').value;

    if (!name || !email || !password) { showToast('Fill required fields.', 'error'); return; }
    if (password !== confirm) { showToast('Passwords mismatch.', 'error'); return; }
    if (password.length < 6) { showToast('Password min 6 chars.', 'error'); return; }

    try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });

        const userData = { uid: cred.user.uid, name, email, phone, type, role: type, emailVerified: !!cred.user.emailVerified, createdAt: new Date().toISOString() };
        await db.ref('users/' + cred.user.uid).update(userData);

        if (type === 'partner') {
            const company = document.getElementById('newUserCompany').value.trim() || name + ' Hotels';
            const commission = parseInt(document.getElementById('newUserCommission').value) || 15;
            const partnerData = {
                id: 'prt_' + Date.now(), uid: cred.user.uid,
                company, owner: name, email, phone,
                commission, status: 'active',
                hotelCount: 0, revenue: 0,
                joinedDate: new Date().toISOString()
            };
            await dbSet('partners/' + partnerData.id, partnerData);
        }

        document.getElementById('createUserForm').reset();
        loadPartnersTable();
        loadUsersTable();
        loadAdminStats();
        loadPartnerSelect();
        showToast(type.toUpperCase() + ' "' + name + '" created!', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

// ============================================================================
// SECTION 23: ADMIN BOOKING ACTIONS
// ============================================================================

async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;

    const bookings = await dbGet('bookings') || {};
    const b = Object.values(bookings).find(x => x.id === id);
    if (!b) return;

    b.status = 'cancelled';
    b.paymentStatus = 'refunded';
    b.cancelledAt = new Date().toISOString();
    await dbSet('bookings/' + id, b);

    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === b.hotelId);
    if (h) {
        h.available = Math.min((h.rooms || 0), (h.available || 0) + 1);
        await dbSet('hotels/' + h.id, h);
    }

    loadBookingsTable();
    loadHotelsTable();
    loadAdminStats();
}

async function completeBooking(id) {
    const bookings = await dbGet('bookings') || {};
    const b = Object.values(bookings).find(x => x.id === id);
    if (!b) return;

    b.status = 'completed';
    b.checkedOutAt = new Date().toISOString();
    await dbSet('bookings/' + id, b);
    loadBookingsTable();
    loadAdminStats();
}

async function loadSettings() {
    const settings = await dbGet('settings') || {};
    document.getElementById('settingsPlatformName').value = settings.platformName || 'BookMyHotel';
    document.getElementById('settingsCommission').value = settings.commission || 15;
    document.getElementById('settingsEmail').value = settings.supportEmail || 'support@bookmyhotel.com';
    document.getElementById('settingsPhone').value = settings.supportPhone || '1800-BOOKMYHOTEL';
}

function generateBookingId() {
    // Unique-ish booking id for UI/actions. Firebase push keys already exist elsewhere.
    return 'BKG_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8).toUpperCase();
}

async function sendAdminWhatsAppToUser(bookingId) {
    try {
        const bookings = await dbGet('bookings') || {};
        const b = Object.values(bookings).find(x => x.id === bookingId);
        if (!b) { showToast('Booking not found.', 'error'); return; }

        // Ensure we have hotel info for message context
        const hotels = await dbGet('hotels') || {};
        const hotel = Object.values(hotels).find(h => h.id === b.hotelId);

        const phone = b.customerPhone || '';
        const customerWhatsapp = b.customerWhatsapp || '';
        const finalPhone = customerWhatsapp || phone;
        if (!finalPhone) { showToast('Customer phone/WhatsApp missing for this booking.', 'error'); return; }

        const msg = buildBookingWhatsAppMessage(b, hotel);
        openWhatsAppLink(finalPhone, msg);
    } catch (e) {
        showToast('Failed to open WhatsApp.', 'error');
        console.error(e);
    }
}

async function sendAdminWhatsAppToHotelManager(bookingId) {
    try {
        const bookings = await dbGet('bookings') || {};
        const b = Object.values(bookings).find(x => x.id === bookingId);
        if (!b) { showToast('Booking not found.', 'error'); return; }

        const hotel = await dbGet('hotels/' + b.hotelId);
        if (!hotel) { showToast('Hotel not found.', 'error'); return; }

        const managerPhone = await getHotelWhatsAppNumber(b.hotelId);
        if (!managerPhone) { showToast('Hotel manager WhatsApp/phone missing.', 'error'); return; }

        const msg = buildBookingWhatsAppMessage(b, hotel);
        openWhatsAppLink(managerPhone, msg);
    } catch (e) {
        showToast('Failed to open WhatsApp.', 'error');
        console.error(e);
    }
}

async function savePlatformSettings(event) {
    event.preventDefault();
    const data = {
        platformName: document.getElementById('settingsPlatformName').value,
        commission: parseInt(document.getElementById('settingsCommission').value) || 15,
        supportEmail: document.getElementById('settingsEmail').value,
        supportPhone: document.getElementById('settingsPhone').value
    };
    await dbSet('settings', data);
    showToast('Settings saved!', 'success');
}

// ============================================================================
// SECTION 24: ADMIN TAB SWITCHING
// ============================================================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector('.tab-btn[onclick*="\'' + tabName + '\'"]');
    if (btn) btn.classList.add('active');

    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');

    if (tabName === 'offers') { loadOffersTable(); loadOfferHotelOptions(); }
    if (tabName === 'hotel-credentials') loadHotelCredentials();
    if (tabName === 'add-hotel') loadPartnerSelect();
}

// ============================================================================
// SECTION 25: PARTNER DASHBOARD
// ============================================================================

async function loadPartnerDashboard() {
    if (!currentUser) return;

    const partners = await dbGet('partners') || {};
    let partner = Object.values(partners).find(p => p.uid === currentUser.uid);

    // Auto-create partner record if not found
    if (!partner) {
        const userSnap = await dbGet('users/' + currentUser.uid) || {};
        const partnerId = 'prt_' + Date.now();
        partner = {
            id: partnerId, uid: currentUser.uid,
            company: (userSnap.name ? userSnap.name + ' Hotels' : 'My Hotels'),
            owner: userSnap.name || (currentUser.displayName || 'Partner'),
            email: currentUser.email || '', phone: userSnap.phone || '',
            commission: 15, status: 'active', hotelCount: 0, revenue: 0,
            joinedDate: new Date().toISOString()
        };
        await dbSet('partners/' + partnerId, partner);
    }
    currentPartner = partner;

    document.getElementById('partnerName').textContent = partner.company || partner.name;
    document.getElementById('partnerCommission').textContent = (partner.commission || 0) + '%';
    document.getElementById('partnerJoined').textContent = partner.joinedDate ? formatDate(partner.joinedDate) : 'N/A';
    document.getElementById('partnerAvatar').textContent = (partner.company || partner.name || 'P').charAt(0);

    const hotels = await dbGet('hotels') || {};
    const partnerHotels = Object.values(hotels).filter(h => h.partnerId === partner.id);

    const bookings = await dbGet('bookings') || {};
    const partnerBookings = Object.values(bookings).filter(b => partnerHotels.some(h => h.id === b.hotelId));

    document.getElementById('partnerHotelsCount').textContent = partnerHotels.length;
    document.getElementById('partnerBookingsCount').textContent = partnerBookings.length;
    document.getElementById('partnerActiveBookings').textContent = partnerBookings.filter(b => b.status === 'confirmed').length;
    document.getElementById('partnerRevenue').textContent = formatCurrency(partnerBookings.reduce((s, b) => s + (b.amount || 0), 0));

    if ((partner.hotelCount || 0) !== partnerHotels.length) {
        db.ref('partners/' + partner.id + '/hotelCount').set(partnerHotels.length);
    }

    await loadPartnerCities();

    // Hotels table
    const ht = document.getElementById('partnerHotelsTable');
    if (ht) {
        ht.innerHTML = partnerHotels.length ? partnerHotels.map(h => `
            <tr>
                <td><strong>${h.name}</strong></td>
                <td>${h.city || 'N/A'}, ${h.state || ''}</td>
                <td>${formatCurrency(h.price || 0)}</td>
                <td>${h.rating || 0} ⭐</td>
                <td>${h.available || 0}/${h.rooms || 0}</td>
                <td>${h.featured ? '<span class="status-badge active">Yes</span>' : '<span class="status-badge inactive">No</span>'}</td>
                <td>${getStatusBadge(h.status || 'active')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-primary" onclick="window.open('hotel-manage.html?id=${h.id}','_blank')">Manage</button>
                        <button class="btn btn-sm btn-secondary" onclick="editPartnerHotel('${h.id}')">Edit</button>
                        <button class="btn btn-sm btn-secondary" onclick="window.open('hotel-detail.html?id=${h.id}','_blank')">View</button>
                        <button class="btn btn-sm btn-danger" onclick="deletePartnerHotel('${h.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="8" class="empty-state">No properties yet. Use "+ Add Property" to add one.</td></tr>';
    }

    // Bookings table
    const bt = document.getElementById('partnerBookingsTable');
    if (bt) {
        bt.innerHTML = partnerBookings.length ? partnerBookings.map(b => `
            <tr>
                <td>${b.id}</td>
                <td>${b.customerName || 'Guest'}</td>
                <td>${b.hotelName || 'N/A'}</td>
                <td>${b.roomNumber || b.roomType || 'Standard'}</td>
                <td>${formatDate(b.checkIn)}</td>
                <td>${formatDate(b.checkOut)}</td>
                <td>${b.guests || 1}</td>
                <td>${formatCurrency(b.amount || 0)}</td>
                <td>${getStatusBadge(b.paymentStatus || 'paid')}</td>
                <td>${getStatusBadge(b.status)}</td>
            </tr>
        `).join('') : '<tr><td colspan="10" class="empty-state">No bookings yet.</td></tr>';
    }

    // Inventory form
    const inv = document.getElementById('invHotelSelect');
    if (inv) {
        inv.innerHTML = partnerHotels.map(h => '<option value="' + h.id + '">' + h.name + '</option>').join('');
        inv.onchange = function () {
            const h = partnerHotels.find(x => x.id === this.value);
            if (h) {
                document.getElementById('invTotalRooms').value = h.rooms || 0;
                document.getElementById('invAvailableRooms').value = h.available || 0;
                document.getElementById('invPrice').value = h.price || 0;
            }
        };
        if (partnerHotels[0]) {
            document.getElementById('invTotalRooms').value = partnerHotels[0].rooms || 0;
            document.getElementById('invAvailableRooms').value = partnerHotels[0].available || 0;
            document.getElementById('invPrice').value = partnerHotels[0].price || 0;
        }
    }

    // Room type pricing
    const pt = document.getElementById('roomTypePricing');
    if (pt) {
        const bp = partnerHotels[0]?.price || 1000;
        pt.innerHTML = [
            { n: 'Standard', m: 1 }, { n: 'Deluxe', m: 1.4 }, { n: 'Suite', m: 1.8 }, { n: 'Penthouse', m: 2.5 }
        ].map(r => '<tr><td>' + r.n + '</td><td>' + r.m + 'x</td><td>' + formatCurrency(Math.round(bp * r.m)) + '</td></tr>').join('');
    }
}

// ============================================================================
// SECTION 26: PARTNER CITIES
// ============================================================================

async function loadPartnerCities() {
    const cities = await dbGet('cities') || {};
    partnerCitiesCache = Object.values(cities);

    const opts = partnerCitiesCache.length
        ? partnerCitiesCache.map(c => '<option value="' + c.name + '" data-state="' + c.state + '">' + c.name + ', ' + c.state + '</option>').join('')
        : '<option value="">No cities yet (ask admin)</option>';

    const addSel = document.getElementById('pNewHotelCity');
    const editSel = document.getElementById('epHotelCity');

    if (addSel) {
        addSel.innerHTML = '<option value="">Select city</option>' + opts;
        addSel.onchange = function () {
            const city = partnerCitiesCache.find(c => c.name === this.value);
            const st = document.getElementById('pNewHotelState');
            if (st) st.value = city ? city.state : '';
        };
    }
    if (editSel) {
        editSel.innerHTML = opts;
        editSel.onchange = function () {
            const city = partnerCitiesCache.find(c => c.name === this.value);
            const st = document.getElementById('epHotelState');
            if (st) st.value = city ? city.state : '';
        };
    }
}

// ============================================================================
// SECTION 27: PARTNER - ADD/EDIT/DELETE HOTELS
// ============================================================================

async function addPartnerHotel(event) {
    event.preventDefault();
    if (!currentPartner) { showToast('Partner profile not loaded. Refresh page.', 'error'); return; }

    const city = document.getElementById('pNewHotelCity').value;
    if (!city) { showToast('Please select a city.', 'error'); return; }
    const cityObj = partnerCitiesCache.find(c => c.name === city);

    const hotel = {
        id: 'htl_' + Date.now(),
        partnerId: currentPartner.id,
        partnerName: currentPartner.company || currentPartner.owner || 'N/A',
        name: document.getElementById('pNewHotelName').value.trim(),
        city: city,
        state: (cityObj && cityObj.state) || document.getElementById('pNewHotelState').value || 'N/A',
        price: parseInt(document.getElementById('pNewHotelPrice').value) || 1000,
        stars: parseInt(document.getElementById('pNewHotelStars').value) || 3,
        rating: parseFloat(document.getElementById('pNewHotelRating').value) || 4,
        rooms: parseInt(document.getElementById('pNewHotelRooms').value) || 1,
        available: parseInt(document.getElementById('pNewHotelAvailable').value) || 0,
        description: document.getElementById('pNewHotelDesc').value.trim(),
        image: document.getElementById('pNewHotelImage').value.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        amenities: (document.getElementById('pNewHotelAmenities').value || 'Free WiFi').split(',').map(a => a.trim()).filter(Boolean),
        checkIn: document.getElementById('pNewHotelCheckIn').value || '14:00',
        checkOut: document.getElementById('pNewHotelCheckOut').value || '11:00',
        cancellation: 'Free cancellation',
        refund: 'Full refund',
        featured: document.getElementById('pNewHotelFeatured').checked,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    try {
        await dbSet('hotels/' + hotel.id, hotel);
        document.getElementById('partnerAddHotelForm').reset();
        showToast('Property "' + hotel.name + '" added successfully!', 'success');
        switchPartnerTab('properties');
        loadPartnerDashboard();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

async function editPartnerHotel(id) {
    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === id);
    if (!h) return;
    if (!currentPartner || h.partnerId !== currentPartner.id) { showToast('This property does not belong to you.', 'error'); return; }

    await loadPartnerCities();
    const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val; };
    setVal('epHotelId', h.id);
    setVal('epHotelName', h.name || '');
    setVal('epHotelCity', h.city || '');
    setVal('epHotelState', h.state || '');
    setVal('epHotelPrice', h.price || 0);
    setVal('epHotelStars', String(h.stars || 3));
    setVal('epHotelRating', h.rating || 4);
    setVal('epHotelStatus', h.status || 'active');
    setVal('epHotelRooms', h.rooms || 0);
    setVal('epHotelAvailable', h.available || 0);
    setVal('epHotelDesc', h.description || '');
    setVal('epHotelImage', h.image || '');
    setVal('epHotelAmenities', (h.amenities || []).join(', '));
    setVal('epHotelCheckIn', h.checkIn || '14:00');
    setVal('epHotelCheckOut', h.checkOut || '11:00');
    setVal('epHotelCancellation', h.cancellation || 'Free cancellation');
    setVal('epHotelRefund', h.refund || 'Full refund');

    const featuredEl = document.getElementById('epHotelFeatured');
    if (featuredEl) featuredEl.checked = !!h.featured;

    openModal('editPartnerHotelModal');
}

async function savePartnerHotelProfile(event) {
    event.preventDefault();
    const id = document.getElementById('epHotelId').value;
    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === id);
    if (!h) return;
    if (!currentPartner || h.partnerId !== currentPartner.id) { showToast('This property does not belong to you.', 'error'); return; }

    const city = document.getElementById('epHotelCity').value;
    const cityObj = partnerCitiesCache.find(c => c.name === city);

    h.name = document.getElementById('epHotelName').value.trim();
    h.city = city;
    h.state = (cityObj && cityObj.state) || document.getElementById('epHotelState').value || h.state;
    h.price = parseInt(document.getElementById('epHotelPrice').value) || h.price;
    h.stars = parseInt(document.getElementById('epHotelStars').value) || 3;
    h.rating = parseFloat(document.getElementById('epHotelRating').value) || h.rating;
    h.status = document.getElementById('epHotelStatus').value;
    h.rooms = parseInt(document.getElementById('epHotelRooms').value) || 0;
    h.available = parseInt(document.getElementById('epHotelAvailable').value) || 0;
    h.description = document.getElementById('epHotelDesc').value.trim();
    h.image = document.getElementById('epHotelImage').value.trim() || h.image;
    h.amenities = (document.getElementById('epHotelAmenities').value || '').split(',').map(a => a.trim()).filter(Boolean);
    h.checkIn = document.getElementById('epHotelCheckIn').value || '14:00';
    h.checkOut = document.getElementById('epHotelCheckOut').value || '11:00';
    h.cancellation = document.getElementById('epHotelCancellation').value || 'Free cancellation';
    h.refund = document.getElementById('epHotelRefund').value || 'Full refund';
    h.featured = document.getElementById('epHotelFeatured').checked;
    h.updatedAt = new Date().toISOString();

    try {
        await dbSet('hotels/' + h.id, h);
        closeModal('editPartnerHotelModal');
        loadPartnerDashboard();
        showToast('Hotel profile updated!', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

async function deletePartnerHotel(id) {
    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === id);
    if (!h) return;
    if (!currentPartner || h.partnerId !== currentPartner.id) { showToast('This property does not belong to you.', 'error'); return; }
    if (!confirm('Delete "' + h.name + '"? This action cannot be undone.')) return;

    await dbRemove('hotels/' + id);
    loadPartnerDashboard();
    showToast('Property deleted.', 'info');
}

// ============================================================================
// SECTION 28: PARTNER TAB SWITCHING & INVENTORY
// ============================================================================

function switchPartnerTab(tabName) {
    document.querySelectorAll('.partner-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content[id^="tab-partner-"]').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector('.partner-tabs .tab-btn[onclick*="\'' + tabName + '\'"]');
    if (btn) btn.classList.add('active');
    const tab = document.getElementById('tab-partner-' + tabName);
    if (tab) tab.classList.add('active');
}

async function updatePartnerInventory(event) {
    event.preventDefault();
    const hotelId = document.getElementById('invHotelSelect').value;
    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === hotelId);
    if (!h) return;

    h.rooms = parseInt(document.getElementById('invTotalRooms').value);
    h.available = parseInt(document.getElementById('invAvailableRooms').value);
    h.price = parseInt(document.getElementById('invPrice').value);
    await dbSet('hotels/' + h.id, h);
    loadPartnerDashboard();
    showToast('Inventory updated!', 'success');
}

// ============================================================================
// SECTION 29: HOTEL MANAGE PAGE
// ============================================================================

async function loadManagePage() {
    const staffRaw = sessionStorage.getItem('hotelStaffLogin');
    const staff = staffRaw ? JSON.parse(staffRaw) : null;
    const select = document.getElementById('manageHotelSelect');

    // Staff mode: locked to their hotel
    if (staff) {
        if (select) {
            select.innerHTML = '<option value="' + staff.hotelRefId + '">' + (staff.hotelName || 'My Hotel') + '</option>';
            select.value = staff.hotelRefId;
            select.disabled = true;
        }

        const staffBadge = document.getElementById('staffHotelBadge');
        const staffBadgeName = document.getElementById('staffHotelBadgeName');
        if (staffBadge && staffBadgeName) {
            staffBadge.style.display = 'block';
            staffBadgeName.textContent = staff.hotelName || 'My Hotel';
        }

        const manageContent = document.getElementById('manageContent');
        const noHotelMsg = document.getElementById('noHotelMsg');
        if (noHotelMsg) noHotelMsg.style.display = 'none';
        if (manageContent) manageContent.style.display = 'block';

        await loadManageHotel(staff.hotelRefId);
        if (select) select.value = staff.hotelRefId;
        return;
    }

    // Partner/Admin mode
    if (!currentUser) { window.location.href = 'hotel-login.html'; return; }
    await loadManageHotelSelect();
}

async function loadManageHotelSelect() {
    const select = document.getElementById('manageHotelSelect');
    if (!select) return;
    if (!currentUser) { window.location.href = 'login.html'; return; }

    const userSnap = await db.ref('users/' + currentUser.uid).once('value');
    const userData = userSnap.val();
    const role = getUserRole(userData);

    let hotels = {};
    if (role === 'admin') {
        hotels = await dbGet('hotels') || {};
    } else {
        const partners = await dbGet('partners') || {};
        const partner = Object.values(partners).find(p => p.uid === currentUser.uid);
        if (!partner) { select.innerHTML = '<option value="">No partner profile found</option>'; return; }

        const allHotels = await dbGet('hotels') || {};
        Object.keys(allHotels).forEach(key => {
            if (allHotels[key].partnerId === partner.id) hotels[key] = allHotels[key];
        });
    }

    const list = Object.values(hotels);
    if (!list.length) { select.innerHTML = '<option value="">No hotels found</option>'; return; }

    select.innerHTML = '<option value="">-- Select a hotel --</option>' +
        list.map(h => '<option value="' + h.id + '">' + h.name + ' - ' + (h.city || '') + '</option>').join('');

    const urlId = getUrlParam('id');
    if (urlId) {
        select.value = urlId;
        loadManageHotel(urlId);
    }
}

async function loadManageHotel(hotelId) {
    if (!hotelId) {
        document.getElementById('noHotelMsg').style.display = 'block';
        document.getElementById('manageContent').style.display = 'none';
        return;
    }

    const hotels = await dbGet('hotels') || {};
    const hotel = Object.values(hotels).find(h => h.id === hotelId);
    if (!hotel) {
        document.getElementById('noHotelMsg').style.display = 'block';
        document.getElementById('manageContent').style.display = 'none';
        return;
    }

    manageHotelData = hotel;
    manageOverrideActive = false;
    document.getElementById('mgrOverridePrice').value = '';
    document.getElementById('noHotelMsg').style.display = 'none';
    document.getElementById('manageContent').style.display = 'block';

    // Staff info bar
    const setInfo = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setInfo('staffHotelIdDisplay', hotel.hotelId || hotel.id);
    setInfo('staffHotelNameDisplay', hotel.hotelName || hotel.name);
    setInfo('staffHotelLoginIdDisplay', hotel.hotelId || hotel.id);

    setManageDefaultDates();
    loadRoomTypeRates();
    loadManageAvailability();
    loadManageBookings();
    loadManageHotelProfile();
    manageSelectedRoomType = 'Standard';
    recalcManagePrice();
}

function setManageDefaultDates() {
    const t2 = getTomorrow();
    const t3 = getDayAfter();
    const ci = document.getElementById('mgrCheckIn');
    const co = document.getElementById('mgrCheckOut');
    if (ci) ci.value = getDateStr(t2);
    if (co) co.value = getDateStr(t3);
}

function loadRoomTypeRates() {
    const container = document.getElementById('roomTypeRates');
    if (!container || !manageHotelData) return;

    const basePrice = manageHotelData.price || 1000;
    container.innerHTML = Object.entries(manageRoomMultipliers).map(([type, mult]) => {
        const price = Math.round(basePrice * mult);
        const selected = manageSelectedRoomType === type ? 'selected' : '';
        return '<div class="rate-card ' + selected + '" onclick="selectManageRoomType(\'' + type + '\')">' +
            '<div class="room-type">' + type + '</div>' +
            '<div class="room-multiplier">' + mult + 'x multiplier</div>' +
            '<div class="room-price">' + formatCurrency(price) + ' <small>/ night</small></div></div>';
    }).join('');
}

function selectManageRoomType(type) {
    manageSelectedRoomType = type;
    document.querySelectorAll('.rate-card').forEach(el => {
        el.classList.toggle('selected', el.querySelector('.room-type')?.textContent === type);
    });
    recalcManagePrice();
}

function recalcManagePrice() {
    if (!manageHotelData) return;

    const checkIn = document.getElementById('mgrCheckIn')?.value;
    const checkOut = document.getElementById('mgrCheckOut')?.value;
    const guests = parseInt(document.getElementById('mgrGuests')?.value) || 2;
    const overrideVal = document.getElementById('mgrOverridePrice')?.value;

    const hasOverride = overrideVal && parseInt(overrideVal) > 0;
    const basePrice = hasOverride ? parseInt(overrideVal) : (manageHotelData.price || 1000);
    const mult = manageRoomMultipliers[manageSelectedRoomType] || 1;
    const roomPrice = Math.round(basePrice * mult);

    const totalPriceEl = document.getElementById('mgrTotalPrice');
    const priceSubEl = document.getElementById('mgrPriceSub');
    const breakdownEl = document.getElementById('priceBreakdown');

    if (!checkIn || !checkOut) {
        if (totalPriceEl) totalPriceEl.textContent = '₹0';
        if (priceSubEl) priceSubEl.textContent = 'Select check-in and check-out dates';
        if (breakdownEl) breakdownEl.style.display = 'none';
        updateManageEstimates(roomPrice);
        return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
        if (totalPriceEl) totalPriceEl.textContent = '₹0';
        if (priceSubEl) priceSubEl.textContent = 'Check-out must be after check-in';
        if (breakdownEl) breakdownEl.style.display = 'none';
        updateManageEstimates(roomPrice);
        return;
    }

    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const total = roomPrice * nights;

    if (totalPriceEl) totalPriceEl.textContent = formatCurrency(total);
    if (priceSubEl) priceSubEl.textContent = formatCurrency(roomPrice) + ' / night x ' + nights + ' night' + (nights > 1 ? 's' : '') + ' · ' + guests + ' guest' + (guests > 1 ? 's' : '');
    if (breakdownEl) breakdownEl.style.display = 'block';

    const setBd = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setBd('mgrCalcRoomType', manageSelectedRoomType);
    setBd('mgrCalcBasePrice', formatCurrency(basePrice) + (hasOverride ? ' (overridden)' : ''));
    setBd('mgrCalcMultiplier', mult + 'x');
    setBd('mgrCalcNights', nights);
    setBd('mgrCalcTotal', formatCurrency(total));

    updateManageEstimates(roomPrice);
}

function updateManageEstimates(nightlyRate) {
    const setEst = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEst('mgrEstDaily', formatCurrency(nightlyRate));
    setEst('mgrEstWeekly', formatCurrency(nightlyRate * 7));
    setEst('mgrEstMonthly', formatCurrency(nightlyRate * 30));
}

function applyOverride() {
    const val = document.getElementById('mgrOverridePrice')?.value;
    if (!val || parseInt(val) <= 0) { showToast('Enter a valid override price.', 'error'); return; }
    manageOverrideActive = true;
    recalcManagePrice();
}

function clearOverride() {
    document.getElementById('mgrOverridePrice').value = '';
    manageOverrideActive = false;
    recalcManagePrice();
}

async function saveManageChanges() {
    if (!manageHotelData) return;

    const overrideVal = document.getElementById('mgrOverridePrice')?.value;
    if (overrideVal && parseInt(overrideVal) > 0) {
        manageHotelData.price = parseInt(overrideVal);
    }

    const totRooms = document.getElementById('mgrEditTotalRooms')?.value;
    const availRooms = document.getElementById('mgrEditAvailableRooms')?.value;
    if (totRooms) manageHotelData.rooms = parseInt(totRooms);
    if (availRooms !== undefined && availRooms !== '') manageHotelData.available = parseInt(availRooms);

    const mgrCheckInEdited = document.getElementById('mgrEditCheckIn')?.value;
    const mgrCheckOutEdited = document.getElementById('mgrEditCheckOut')?.value;
    if (mgrCheckInEdited) manageHotelData.checkIn = mgrCheckInEdited;
    if (mgrCheckOutEdited) manageHotelData.checkOut = mgrCheckOutEdited;

    manageHotelData.updatedAt = new Date().toISOString();

    try {
        await dbSet('hotels/' + manageHotelData.id, manageHotelData);
        document.getElementById('manageSaveMsg').textContent = 'Price / inventory / timings updated successfully!';
        openModal('manageSaveModal');
        clearOverride();
        loadManageHotel(manageHotelData.id);
    } catch (e) {
        showToast('Error saving: ' + e.message, 'error');
    }
}

// ============================================================================
// SECTION 30: MANAGE - AVAILABILITY TAB
// ============================================================================

async function loadManageAvailability() {
    if (!manageHotelData) return;

    const total = manageHotelData.rooms || 0;
    const available = manageHotelData.available || 0;
    const booked = total - available;
    const occPct = total > 0 ? Math.round((booked / total) * 100) : 0;

    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('mgrTotalRooms', total);
    setText('mgrAvailableRooms', available);
    setText('mgrBookedRooms', Math.max(0, booked));
    setText('mgrOccupancyPct', occPct + '%');
    setText('mgrEditTotalRooms', total);
    setText('mgrEditAvailableRooms', available);

    const badgeEl = document.getElementById('mgrStatusBadge');
    if (badgeEl) badgeEl.innerHTML = getStatusBadge(manageHotelData.status || 'active');
    setText('mgrFeaturedBadge', manageHotelData.featured ? 'Yes' : 'No');
    setText('mgrCheckInTime', manageHotelData.checkIn || '14:00');
    setText('mgrCheckOutTime', manageHotelData.checkOut || '11:00');
    setText('mgrCancellation', manageHotelData.cancellation || 'Free cancellation');
    setText('mgrRefund', manageHotelData.refund || 'Full refund');
}

async function updateManageInventory() {
    if (!manageHotelData) return;

    const total = parseInt(document.getElementById('mgrEditTotalRooms').value);
    const available = parseInt(document.getElementById('mgrEditAvailableRooms').value);

    if (!total || total < 1) { showToast('Total rooms must be at least 1.', 'error'); return; }
    if (available < 0) { showToast('Available rooms cannot be negative.', 'error'); return; }
    if (available > total) { showToast('Available rooms cannot exceed total rooms.', 'error'); return; }

    manageHotelData.rooms = total;
    manageHotelData.available = available;
    manageHotelData.updatedAt = new Date().toISOString();

    try {
        await dbSet('hotels/' + manageHotelData.id, manageHotelData);
        document.getElementById('manageSaveMsg').textContent = 'Inventory updated successfully!';
        openModal('manageSaveModal');
        loadManageAvailability();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

// ============================================================================
// SECTION 31: MANAGE - HOTEL PROFILE TAB
// ============================================================================

function loadManageHotelProfile() {
    if (!manageHotelData) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('mgrEditName', manageHotelData.name || '');
    setVal('mgrEditCity', manageHotelData.city || '');
    setVal('mgrEditState', manageHotelData.state || '');
    setVal('mgrEditStars', String(manageHotelData.stars || 3));
    setVal('mgrEditRating', manageHotelData.rating || 4);
    setVal('mgrEditStatus', manageHotelData.status || 'active');
    setVal('mgrEditImage', manageHotelData.image || '');
    setVal('mgrEditDesc', manageHotelData.description || '');
    setVal('mgrEditAmenities', (manageHotelData.amenities || []).join(', '));
    setVal('mgrEditCheckIn', manageHotelData.checkIn || '14:00');
    setVal('mgrEditCheckOut', manageHotelData.checkOut || '11:00');
    setVal('mgrEditCancellation', manageHotelData.cancellation || 'Free cancellation');
    setVal('mgrEditRefund', manageHotelData.refund || 'Full refund');

    const featuredEl = document.getElementById('mgrEditFeatured');
    if (featuredEl) featuredEl.checked = !!manageHotelData.featured;
}

async function saveManageHotelProfile() {
    if (!manageHotelData) return;

    manageHotelData.name = document.getElementById('mgrEditName').value.trim();
    manageHotelData.city = document.getElementById('mgrEditCity').value.trim();
    manageHotelData.state = document.getElementById('mgrEditState').value.trim();
    manageHotelData.stars = parseInt(document.getElementById('mgrEditStars').value);
    manageHotelData.rating = parseFloat(document.getElementById('mgrEditRating').value);
    manageHotelData.status = document.getElementById('mgrEditStatus').value;
    manageHotelData.image = document.getElementById('mgrEditImage').value.trim();
    manageHotelData.description = document.getElementById('mgrEditDesc').value.trim();
    manageHotelData.amenities = document.getElementById('mgrEditAmenities').value.split(',').map(a => a.trim()).filter(Boolean);
    manageHotelData.checkIn = document.getElementById('mgrEditCheckIn').value;
    manageHotelData.checkOut = document.getElementById('mgrEditCheckOut').value;
    manageHotelData.cancellation = document.getElementById('mgrEditCancellation').value;
    manageHotelData.refund = document.getElementById('mgrEditRefund').value;
    manageHotelData.featured = document.getElementById('mgrEditFeatured').checked;
    manageHotelData.updatedAt = new Date().toISOString();

    try {
        await dbSet('hotels/' + manageHotelData.id, manageHotelData);
        document.getElementById('manageSaveMsg').textContent = 'Hotel profile updated successfully!';
        openModal('manageSaveModal');
        loadRoomTypeRates();
        loadManageAvailability();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

// ============================================================================
// SECTION 32: MANAGE - BOOKINGS TAB
// ============================================================================

async function loadManageBookings() {
    const tbody = document.getElementById('mgrBookingsTable');
    if (!tbody || !manageHotelData) return;

    const bookingsSnap = await db.ref('bookings').once('value');
    const bookings = bookingsSnap.val() || {};

    manageAllBookings = Object.entries(bookings)
        .filter(([key, b]) => b.hotelId === manageHotelData.id)
        .map(([key, b]) => ({ ...b, _firebaseKey: key }));

    if (!manageAllBookings.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No bookings for this hotel yet.</td></tr>';
        document.getElementById('mgrEstBookings').textContent = '0';
        return;
    }

    document.getElementById('mgrEstBookings').textContent = manageAllBookings.length;

    const activeList = manageAllBookings.filter(b => b.status === 'confirmed' || b.status === 'checked-in');
    const historyList = manageAllBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

    let html = '';

    if (activeList.length > 0) {
        html += '<tr><td colspan="8" style="background:var(--primary-light);padding:8px 12px;font-weight:700;font-size:13px;color:var(--primary);"><i class="fas fa-clock"></i> Active Bookings (' + activeList.length + ')</td></tr>';
        html += activeList.map(b => buildBookingRow(b)).join('');
    }

    if (historyList.length > 0) {
        html += '<tr><td colspan="8" style="background:var(--gray-100);padding:8px 12px;font-weight:700;font-size:13px;color:var(--gray-500);"><i class="fas fa-history"></i> Booking History (' + historyList.length + ')</td></tr>';
        html += historyList.map(b => buildBookingRow(b)).join('');
    }

    tbody.innerHTML = html;
}

function buildBookingRow(b) {
    let actions = '<div class="booking-actions">';
    if (b.status === 'confirmed') {
        actions += '<button class="btn btn-sm btn-primary" onclick="openCheckInModal(\'' + b._firebaseKey + '\')" title="Check in this guest"><i class="fas fa-sign-in-alt"></i> In</button>';
        actions += '<button class="btn btn-sm btn-danger" onclick="openCancelBookingModal(\'' + b._firebaseKey + '\')" title="Cancel booking"><i class="fas fa-times"></i> Cancel</button>';
    } else if (b.status === 'checked-in') {
        actions += '<button class="btn btn-sm btn-primary" onclick="openAssignRoomModal(\'' + b._firebaseKey + '\')" title="Assign/change room"><i class="fas fa-door-open"></i> Room</button>';
        actions += '<button class="btn btn-sm btn-success" onclick="openCheckOutModal(\'' + b._firebaseKey + '\')" title="Check out this guest"><i class="fas fa-sign-out-alt"></i> Out</button>';
    } else if (b.status === 'completed') {
        actions += '<span class="status-badge completed" style="font-size:11px;">✓ Completed</span>';
    } else if (b.status === 'cancelled') {
        actions += '<span class="status-badge cancelled" style="font-size:11px;">✕ Cancelled</span>';
    }
    actions += '</div>';

    const shortId = b.id ? b.id.substring(0, 10) : '—';
    const opacity = (b.status === 'completed' || b.status === 'cancelled') ? 'opacity:0.7;' : '';

    return '<tr style="' + opacity + '">' +
        '<td><small style="font-size:10px;font-family:monospace;" title="' + (b.id || '') + '">' + shortId + '</small></td>' +
        '<td><strong>' + (b.customerName || 'Guest') + '</strong><br><small style="font-size:10px;color:var(--gray);">' + (b.customerEmail || '') + '</small></td>' +
        '<td><strong style="color:var(--primary);">' + (b.roomNumber || '—') + '</strong></td>' +
        '<td>' + formatDate(b.checkIn) + (b.actualCheckIn ? '<br><small style="color:#276749;font-size:10px;">✓ ' + new Date(b.actualCheckIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + '</small>' : '') + '</td>' +
        '<td>' + formatDate(b.checkOut) + (b.actualCheckOut ? '<br><small style="color:#C53030;font-size:10px;">✓ ' + new Date(b.actualCheckOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + '</small>' : '') + '</td>' +
        '<td><strong>' + formatCurrency(b.amount || 0) + '</strong></td>' +
        '<td>' + getStatusBadge(b.status) + '</td>' +
        '<td>' + actions + '</td></tr>';
}

// ============================================================================
// SECTION 33: MANAGE - CHECK-IN / CHECK-OUT / CANCEL MODALS
// ============================================================================

function openCheckInModal(firebaseKey) {
    manageActionBookingId = firebaseKey;
    const b = manageAllBookings.find(x => x._firebaseKey === firebaseKey);
    if (!b) { showToast('Booking not found. Try refreshing.', 'error'); return; }

    document.getElementById('checkinCustomerName').textContent = b.customerName || 'Guest';
    document.getElementById('checkinRoomType').textContent = b.roomType || 'Standard';
    document.getElementById('checkinDate').textContent = formatDate(b.checkIn);
    document.getElementById('checkinCheckOut').textContent = formatDate(b.checkOut);
    document.getElementById('checkinRoomInput').value = b.roomNumber || '';
    document.getElementById('checkinRoomTypeSelect').value = b.roomType || 'Standard';

    let payInfo = document.getElementById('checkinPayInfo');
    if (!payInfo) {
        const summary = document.getElementById('checkinBookingSummary');
        payInfo = document.createElement('div');
        payInfo.id = 'checkinPayInfo';
        payInfo.style.cssText = 'background:#FFF3CD;border-radius:var(--radius-sm);padding:12px;margin-top:12px;border-left:4px solid #FFA502;';
        payInfo.innerHTML = '<p style="margin:2px 0;font-size:13px;font-weight:700;color:#856404;"><i class="fas fa-money-bill-wave"></i> Payment Pending at Hotel: <span style="font-size:18px;" id="checkinAmountToCollect">' + formatCurrency(b.amount || 0) + '</span></p>' +
            '<p style="margin:2px 0;font-size:12px;color:#856404;"><i class="fas fa-info-circle"></i> Collect this amount in cash/card/UPI at check-in</p>';
        summary.appendChild(payInfo);
    } else {
        const amountSpan = document.getElementById('checkinAmountToCollect');
        if (amountSpan) amountSpan.textContent = formatCurrency(b.amount || 0);
    }

    openModal('checkinModal');
}

async function confirmCheckIn() {
    const firebaseKey = manageActionBookingId;
    if (!firebaseKey) return;

    const roomInput = document.getElementById('checkinRoomInput').value.trim();
    const roomType = document.getElementById('checkinRoomTypeSelect').value;
    if (!roomInput) { showToast('Please enter a room number', 'error'); return; }

    const snap = await db.ref('bookings/' + firebaseKey).once('value');
    const b = snap.val();
    if (!b) { showToast('Booking not found', 'error'); return; }

    b.status = 'checked-in';
    b.actualCheckIn = new Date().toISOString();
    b.roomNumber = roomInput;
    b.roomType = roomType;

    await db.ref('bookings/' + firebaseKey).set(b);
    closeModal('checkinModal');
    showToast('Guest checked in successfully! Room: ' + roomInput, 'success');
    loadManageBookings();
    loadManageAvailability();
}

function openCheckOutModal(firebaseKey) {
    manageActionBookingId = firebaseKey;
    const b = manageAllBookings.find(x => x._firebaseKey === firebaseKey);
    if (!b) { showToast('Booking not found. Try refreshing.', 'error'); return; }

    document.getElementById('checkoutCustomerName').textContent = b.customerName || 'Guest';
    document.getElementById('checkoutRoomNumber').textContent = b.roomNumber || 'Not assigned';
    document.getElementById('checkoutCheckIn').textContent = formatDate(b.checkIn);
    document.getElementById('checkoutCheckOut').textContent = formatDate(b.checkOut);
    openModal('checkoutModal');
}

async function confirmCheckOut() {
    const firebaseKey = manageActionBookingId;
    if (!firebaseKey) return;

    const snap = await db.ref('bookings/' + firebaseKey).once('value');
    const b = snap.val();
    if (!b) { showToast('Booking not found', 'error'); return; }

    b.status = 'completed';
    b.actualCheckOut = new Date().toISOString();
    await db.ref('bookings/' + firebaseKey).set(b);

    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === b.hotelId);
    if (h) {
        h.available = Math.min((h.rooms || 0), (h.available || 0) + 1);
        await dbSet('hotels/' + h.id, h);
    }

    closeModal('checkoutModal');
    showToast('Guest checked out successfully! Room is now free.', 'success');
    loadManageBookings();
    loadManageAvailability();
}

function openAssignRoomModal(firebaseKey) {
    manageActionBookingId = firebaseKey;
    const b = manageAllBookings.find(x => x._firebaseKey === firebaseKey);
    if (!b) { showToast('Booking not found. Try refreshing.', 'error'); return; }

    document.getElementById('assignRoomCustomer').textContent = b.customerName || 'Guest';
    document.getElementById('assignRoomCurrent').textContent = b.roomNumber || 'Not assigned yet';
    document.getElementById('assignRoomInput').value = b.roomNumber || '';
    openModal('assignRoomModal');
}

async function confirmAssignRoom() {
    const firebaseKey = manageActionBookingId;
    if (!firebaseKey) return;

    const roomInput = document.getElementById('assignRoomInput').value.trim();
    if (!roomInput) { showToast('Room number cannot be empty', 'error'); return; }

    const snap = await db.ref('bookings/' + firebaseKey).once('value');
    const b = snap.val();
    if (!b) { showToast('Booking not found', 'error'); return; }

    b.roomNumber = roomInput;
    await db.ref('bookings/' + firebaseKey).set(b);
    closeModal('assignRoomModal');
    showToast('Room number updated to: ' + roomInput, 'success');
    loadManageBookings();
}

function openCancelBookingModal(firebaseKey) {
    manageActionBookingId = firebaseKey;
    const b = manageAllBookings.find(x => x._firebaseKey === firebaseKey);
    if (!b) { showToast('Booking not found. Try refreshing.', 'error'); return; }

    document.getElementById('cancelCustomerName').textContent = b.customerName || 'Guest';
    document.getElementById('cancelRoomNumber').textContent = b.roomNumber || 'Not assigned';
    openModal('cancelBookingModal');
}

async function confirmCancelBooking() {
    const firebaseKey = manageActionBookingId;
    if (!firebaseKey) { closeModal('cancelBookingModal'); return; }

    const snap = await db.ref('bookings/' + firebaseKey).once('value');
    const b = snap.val();
    if (!b) { closeModal('cancelBookingModal'); showToast('Booking not found', 'error'); return; }

    b.status = 'cancelled';
    b.paymentStatus = 'refunded';
    b.cancelledAt = new Date().toISOString();
    await db.ref('bookings/' + firebaseKey).set(b);

    const hotels = await dbGet('hotels') || {};
    const h = Object.values(hotels).find(x => x.id === b.hotelId);
    if (h) {
        h.available = Math.min((h.rooms || 0), (h.available || 0) + 1);
        await dbSet('hotels/' + h.id, h);
    }

    closeModal('cancelBookingModal');
    showToast('Booking cancelled. Room is now free.', 'success');
    loadManageBookings();
    loadManageAvailability();
}

// Legacy aliases
async function checkInBooking(id) { openCheckInModal(id); }
async function checkOutBooking(id) { openCheckOutModal(id); }
async function assignRoomNumberToBooking(id) { openAssignRoomModal(id); }

// ============================================================================
// SECTION 34: MANAGE - TAB SWITCHING
// ============================================================================

function switchManageTab(tabName) {
    document.querySelectorAll('.manage-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.manage-tab-content').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector('.manage-tab-btn[onclick*="\'' + tabName + '\'"]');
    if (btn) btn.classList.add('active');
    const tab = document.getElementById('tab-manage-' + tabName);
    if (tab) tab.classList.add('active');
}

// ============================================================================
// SECTION 35: HOTEL CREDENTIALS (Admin)
// ============================================================================

async function loadHotelCredentials() {
    loadCredHotelSelect();
    loadCredTable();
}

async function loadCredHotelSelect() {
    const select = document.getElementById('credHotelSelect');
    if (!select) return;
    const hotels = await dbGet('hotels') || {};
    const list = Object.values(hotels);
    select.innerHTML = list.length
        ? list.map(h => '<option value="' + h.id + '">' + h.name + ' - ' + (h.city || '') + '</option>').join('')
        : '<option value="">No hotels - add one first</option>';
}

async function loadCredTable() {
    const tbody = document.getElementById('hotelCredTableBody');
    if (!tbody) return;
    const creds = await dbGet('hotel-credentials') || {};
    const list = Object.values(creds);

    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hotel credentials created yet.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(c => `
        <tr>
            <td><strong>${c.hotelId}</strong></td>
            <td>${c.hotelName || 'N/A'}</td>
            <td><code style="background:var(--gray-light);padding:3px 8px;border-radius:4px;font-size:13px;">${c.password}</code></td>
            <td>${getStatusBadge(c.status || 'active')}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteHotelCredential('${c.hotelId}')">Delete</button></td>
        </tr>
    `).join('');
}

function generateCredHotelId() {
    const el = document.getElementById('credHotelId');
    const id = 'hid_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8);
    if (el) el.value = id;
    return id;
}

function generateCredPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('credPassword').value = pwd;
}

function copyToClipboard(inputId) {
    const el = document.getElementById(inputId);
    if (!el || !el.value) return;
    navigator.clipboard?.writeText(el.value).then(() => {
        showToast('Copied: ' + el.value, 'success');
    }).catch(() => {
        el.select?.();
        try { document.execCommand('copy'); } catch (e) { }
        showToast('Copied: ' + el.value, 'success');
    });
}

async function createHotelCredential(event) {
    event.preventDefault();
    const hotelRefId = document.getElementById('credHotelSelect').value;
    let hotelId = document.getElementById('credHotelId').value.trim();
    const password = document.getElementById('credPassword').value.trim();

    if (!hotelRefId || !password) { showToast('Select hotel and enter password.', 'error'); return; }

    if (!hotelId) {
        hotelId = generateCredHotelId();
        const el = document.getElementById('credHotelId');
        if (el) el.value = hotelId;
    }
    if (password.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }

    const hotels = await dbGet('hotels') || {};
    const hotel = Object.values(hotels).find(h => h.id === hotelRefId);
    if (!hotel) { showToast('Hotel not found.', 'error'); return; }

    const existing = await dbGet('hotel-credentials') || {};
    const dup = Object.values(existing).find(c => c.hotelId === hotelId);
    if (dup) { showToast('Hotel ID "' + hotelId + '" already exists.', 'error'); return; }

    const credData = { hotelId, hotelRefId, hotelName: hotel.name, password, status: 'active', createdAt: new Date().toISOString() };

    try {
        await dbSet('hotel-credentials/' + hotelId, credData);
        document.getElementById('hotelCredForm').reset();
        showToast('Credential created! Hotel "' + hotel.name + '" can now login.', 'success');
        loadCredTable();
        loadCredHotelSelect();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

async function deleteHotelCredential(hotelId) {
    if (!confirm('Delete credential for "' + hotelId + '"?')) return;
    try {
        await dbRemove('hotel-credentials/' + hotelId);
        loadCredTable();
        showToast('Credential deleted.', 'info');
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

function copyHotelCreds() {
    const hotelId = document.getElementById('resultHotelId')?.textContent || '';
    const password = document.getElementById('resultHotelPassword')?.textContent || '';
    const hotelName = document.getElementById('resultHotelName')?.textContent || '';
    const text = 'Hotel ID: ' + hotelId + '\nPassword: ' + password + '\nHotel: ' + hotelName;
    navigator.clipboard?.writeText(text).then(() => {
        showToast('Credentials copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Credentials:\n\n' + text, 'info');
    });
}

// ============================================================================
// SECTION 36: OFFERS & COUPONS (Admin + Customer Cards)
// ============================================================================

function isOfferDateValid(offer, todayStr) {
    const today = todayStr || new Date().toISOString().split('T')[0];
    if (offer.validFrom && today < offer.validFrom) return false;
    if (offer.validTill && today > offer.validTill) return false;
    return true;
}

function getOfferDiscountText(offer) {
    if (!offer) return '';
    if (offer.type === 'percentage') return offer.value + '% OFF';
    return formatCurrency(offer.value) + ' OFF';
}

function offerCardHtml(offer, opts = {}) {
    const img = opts.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
    const scopeText = offer.scope === 'all' ? 'All Hotels' : 'Selected Hotels';
    const code = (offer.code || '').toUpperCase();

    return `
        <div class="offer-tile" data-offer-code="${code}" style="background-image: radial-gradient(circle at 15% 10%, rgba(255,255,255,0.65), rgba(255,255,255,0) 38%), linear-gradient(135deg, rgba(255,71,87,0.10), rgba(212,175,55,0.14));">
            <div class="offer-tile-bg">
                <img src="${img}" alt="offer" loading="lazy" />
            </div>
            <div class="offer-tile-top">
                <span class="offer-badge ${offer.status === 'active' ? 'active' : ''}"><i class="fas fa-tags"></i> ${scopeText}</span>
                <span class="offer-valid"><i class="fas fa-calendar-alt"></i> ${offer.validTill ? 'Till ' + offer.validTill : 'Valid'}</span>
            </div>

            <div class="offer-tile-body">
                <div class="offer-title">${offer.title || 'Offer'}</div>
                <div class="offer-discount">${getOfferDiscountText(offer)}</div>
                <div class="offer-code">Use code: <b>${code}</b></div>
                ${offer.description ? `<div class="offer-desc">${offer.description}</div>` : ''}
            </div>

            <div class="offer-tile-actions">
                ${opts.actionHtml || ''}
            </div>
        </div>
    `;
}

async function loadOffersCardsForHotelsPage() {
    const container = document.getElementById('offersCardsHotelsPage');
    if (!container) return;

    const offers = await dbGet('offers') || {};
    const offersList = Object.values(offers);

    const today = new Date().toISOString().split('T')[0];
    const activeOffers = offersList
        .filter(o => (o.status === 'active' || o.status === 'Active' || !o.status) && isOfferDateValid(o, today));

    if (!activeOffers.length) {
        container.innerHTML = '<div class="empty-state" style="padding:30px 0;">No active offers right now.</div>';
        return;
    }

    const hotels = await dbGet('hotels') || {};
    const hotelsArr = Object.values(hotels);

    // Pick a representative hotel for each offer (as per your rule)
    const hotelForOffer = (offer) => {
        if (offer.scope === 'specific' && Array.isArray(offer.hotelIds) && offer.hotelIds.length) {
            const firstId = offer.hotelIds[0];
            return hotelsArr.find(h => h.id === firstId) || hotelsArr[0];
        }
        return hotelsArr[0];
    };

    const cards = activeOffers.map(o => {
        const h = hotelForOffer(o);
        const actionHtml = h ? `
            <button class="btn btn-primary" style="padding:10px 14px;" onclick="window.location.href='hotel-detail.html?id=${h.id}&offerCode=${encodeURIComponent(o.code)}'">
                <i class="fas fa-bolt"></i> View & Apply
            </button>` : '';
        return offerCardHtml(o, { image: h?.image || (hotelsArr[0]?.image), actionHtml });
    }).join('');

    container.innerHTML = `<div class="offers-cards-grid">${cards}</div>`;
}

async function loadOffersCardsForHotelDetail() {
    const container = document.querySelector('#offersCardsHotelDetail');
    if (!container) return;

    const hotelId = getUrlParam('id');
    if (!hotelId) {
        container.innerHTML = '';
        return;
    }

    const offers = await dbGet('offers') || {};
    const offersList = Object.values(offers);
    const today = new Date().toISOString().split('T')[0];

    const hotels = await dbGet('hotels') || {};
    const hotel = Object.values(hotels).find(h => h.id === hotelId);

    const applicable = offersList.filter(o => {
        if (!(o.status === 'active' || o.status === 'Active' || !o.status)) return false;
        if (!isOfferDateValid(o, today)) return false;
        if (o.scope === 'all') return true;
        if (o.scope === 'specific' && Array.isArray(o.hotelIds) && o.hotelIds.includes(hotelId)) return true;
        return false;
    });

    if (!applicable.length) {
        container.innerHTML = '<div class="empty-state" style="padding:20px 0;">No active offers for this hotel.</div>';
        return;
    }

    const cards = applicable.map(o => {
        const actionHtml = `
            <button class="btn btn-accent" style="padding:10px 14px;" onclick="setOfferCodeAndApply('${o.code}')">
                <i class="fas fa-tag"></i> Apply
            </button>`;
        return offerCardHtml(o, { image: hotel?.image, actionHtml });
    }).join('');

    container.innerHTML = `<div class="offers-cards-grid">${cards}</div>`;
}

function setOfferCodeAndApply(offerCode) {
    const codeInput = document.getElementById('couponCode');
    if (!codeInput) return;
    codeInput.value = (offerCode || '').toUpperCase();

    // Ensure buttons exist before calling apply
    const applyBtn = document.getElementById('applyCouponBtn');
    if (applyBtn) applyBtn.style.display = 'inline-flex';
    // applyCoupon() already validates & updates totals
    if (typeof applyCoupon === 'function') applyCoupon();
}

async function initOffersForCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('hotels.html')) {
        await loadOffersCardsForHotelsPage();
        return;
    }
    if (path.includes('hotel-detail.html')) {
        await loadOffersCardsForHotelDetail();
        const offerCode = getUrlParam('offerCode');
        if (offerCode) {
            const codeInput = document.getElementById('couponCode');
            if (codeInput) codeInput.value = (offerCode || '').toUpperCase();
            if (typeof applyCoupon === 'function') {
                setTimeout(() => applyCoupon(), 250);
            }
        }
        return;
    }
    // Also load offers on index.html
    if (path.includes('index.html') || path.endsWith('/hotel-booking/') || path.endsWith('/hotel-booking')) {
        await loadOffersCardsForHotelsPage();
        return;
    }
}

async function loadOffersTable() {

    const tbody = document.getElementById('offersTableBody');
    if (!tbody) return;

    const offers = await dbGet('offers') || {};
    const hotels = await dbGet('hotels') || {};
    const hotelMap = Object.values(hotels).reduce((m, h) => { m[h.id] = h.name; return m; }, {});

    const entries = Object.entries(offers);
    if (!entries.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No offers created yet.</td></tr>';
        return;
    }

    entries.sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));

    tbody.innerHTML = entries.map(([key, o]) => {
        const scopeText = o.scope === 'all' ? 'All Hotels' : (o.hotelIds || []).map(id => hotelMap[id] || id).join(', ') || 'Specific';
        const usageText = o.usageLimit ? (o.usedCount || 0) + ' / ' + o.usageLimit : (o.usedCount || 0) + ' used';
        return '<tr>' +
            '<td><code style="background:var(--gray-light);padding:4px 10px;border-radius:4px;font-weight:700;font-size:13px;">' + (o.code || '') + '</code></td>' +
            '<td><strong>' + (o.title || '') + '</strong><br><small>' + (o.description || '') + '</small></td>' +
            '<td>' + (o.type === 'percentage' ? 'Percentage' : 'Fixed') + '</td>' +
            '<td>' + (o.type === 'percentage' ? o.value + '%' : formatCurrency(o.value)) + '</td>' +
            '<td>' + scopeText + '</td>' +
            '<td>' + (o.validFrom ? formatDate(o.validFrom) : 'N/A') + ' → ' + (o.validTill ? formatDate(o.validTill) : 'N/A') + '</td>' +
            '<td>' + usageText + '</td>' +
            '<td>' + getStatusBadge(o.status || 'active') + '</td>' +
            '<td><div class="action-btns"><button class="btn btn-sm btn-primary" onclick="editOffer(\'' + key + '\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn btn-sm btn-secondary" onclick="toggleOfferStatus(\'' + key + '\')"><i class="fas fa-power-off"></i></button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteOffer(\'' + key + '\')"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('');
}

async function saveOffer(event) {
    event.preventDefault();
    const id = document.getElementById('offerId').value;
    const code = document.getElementById('offerCode').value.trim().toUpperCase();
    const title = document.getElementById('offerTitle').value.trim();
    const type = document.getElementById('offerType').value;
    const value = parseFloat(document.getElementById('offerValue').value);
    const scope = document.getElementById('offerScope').value;
    const minAmount = parseFloat(document.getElementById('offerMinAmount').value) || 0;
    const maxDiscount = parseFloat(document.getElementById('offerMaxDiscount').value) || 0;
    const validFrom = document.getElementById('offerValidFrom').value;
    const validTill = document.getElementById('offerValidTill').value;
    const usageLimit = parseInt(document.getElementById('offerUsageLimit').value) || 0;
    const status = document.getElementById('offerStatus').value;
    const description = document.getElementById('offerDescription').value.trim();

    if (!code || !title || !value) { showToast('Please fill all required fields.', 'error'); return; }
    if (new Date(validFrom) >= new Date(validTill)) { showToast('Valid Till must be after Valid From.', 'error'); return; }

    const hotelIds = scope === 'specific' ? Array.from(document.getElementById('offerHotels').selectedOptions).map(o => o.value) : [];

    const offerData = { code, title, type, value, scope, hotelIds, minAmount, maxDiscount: maxDiscount > 0 ? maxDiscount : null, validFrom, validTill, usageLimit: usageLimit > 0 ? usageLimit : null, usedCount: 0, status, description, createdAt: new Date().toISOString() };

    if (id) {
        const existing = await dbGet('offers/' + id);
        offerData.usedCount = existing?.usedCount || 0;
        offerData.createdAt = existing?.createdAt || new Date().toISOString();
        offerData.id = id;
        await dbSet('offers/' + id, offerData);
        showToast('Offer updated!', 'success');
    } else {
        const newId = 'ofr_' + Date.now();
        offerData.id = newId;
        await dbSet('offers/' + newId, offerData);
        showToast('Offer created!', 'success');
    }

    resetOfferForm();
    loadOffersTable();
}

async function editOffer(id) {
    const offer = await dbGet('offers/' + id);
    if (!offer) return;

    currentOfferId = id;
    const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val; };
    setVal('offerId', id);
    setVal('offerCode', offer.code || '');
    setVal('offerTitle', offer.title || '');
    setVal('offerType', offer.type || 'percentage');
    setVal('offerValue', offer.value || '');
    setVal('offerScope', offer.scope || 'all');
    setVal('offerMinAmount', offer.minAmount || 0);
    setVal('offerMaxDiscount', offer.maxDiscount || '');
    setVal('offerValidFrom', offer.validFrom || '');
    setVal('offerValidTill', offer.validTill || '');
    setVal('offerUsageLimit', offer.usageLimit || '');
    setVal('offerStatus', offer.status || 'active');
    setVal('offerDescription', offer.description || '');
    document.getElementById('offerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Offer';

    toggleOfferHotelSelect();
    if (offer.scope === 'specific' && offer.hotelIds) {
        setTimeout(() => {
            offer.hotelIds.forEach(hid => {
                const opt = document.getElementById('offerHotels').querySelector('option[value="' + hid + '"]');
                if (opt) opt.selected = true;
            });
        }, 50);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function toggleOfferStatus(id) {
    const offer = await dbGet('offers/' + id);
    if (!offer) return;
    offer.status = offer.status === 'active' ? 'inactive' : 'active';
    await dbSet('offers/' + id, offer);
    loadOffersTable();
}

async function deleteOffer(id) {
    if (!confirm('Delete this offer?')) return;
    await dbRemove('offers/' + id);
    loadOffersTable();
    showToast('Offer deleted.', 'info');
}

function resetOfferForm() {
    document.getElementById('offerForm').reset();
    document.getElementById('offerId').value = '';
    currentOfferId = null;
    document.getElementById('offerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Create Offer';
    document.getElementById('offerValidFrom').value = new Date().toISOString().split('T')[0];
    const t = new Date();
    t.setDate(t.getDate() + 30);
    document.getElementById('offerValidTill').value = t.toISOString().split('T')[0];
    toggleOfferHotelSelect();
}

function toggleOfferHotelSelect() {
    const scope = document.getElementById('offerScope').value;
    document.getElementById('offerHotelSelectGroup').style.display = scope === 'specific' ? 'block' : 'none';
}

async function loadOfferHotelOptions() {
    const select = document.getElementById('offerHotels');
    if (!select) return;
    const hotels = await dbGet('hotels') || {};
    const list = Object.values(hotels);
    select.innerHTML = list.length
        ? list.map(h => '<option value="' + h.id + '">' + h.name + ' - ' + (h.city || '') + '</option>').join('')
        : '<option value="">No hotels</option>';
}

// ============================================================================
// SECTION 37: ROLE TAB SWITCHING (Legacy)
// ============================================================================

function switchRoleTab(role) {
    // Role tabs are removed; kept for backward compatibility
    return;
}

// ============================================================================
// SECTION 38: DOCUMENT INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname;

    initPageLoad();
    initScrollReveal();
    initThemeToggle();
    document.querySelectorAll('.btn, .btn-search, .btn-nav').forEach(addRippleEffect);

    // Firebase Auth state listener
    firebase.auth().onAuthStateChanged(async function (user) {
        currentUser = user;
        updateNav();

        if (user) {
            try { await ensureUserRecord(user); } catch (e) { console.error('ensureUserRecord failed:', e); }
        }

        // Page routing
        if (path.includes('admin.html')) {
            if (!user) { window.location.href = 'login.html'; return; }
            checkUserType('admin').then(() => loadAdminPanel());
            return;
        }

        if (path.includes('partner.html')) {
            if (!user) { window.location.href = 'login.html'; return; }
            checkUserType('partner').then(() => loadPartnerDashboard());
            return;
        }

        if (path.includes('hotel-manage.html')) {
            const staffHotel = sessionStorage.getItem('hotelStaffLogin');
            const staffHotelAuto = localStorage.getItem('hotelStaffAutoLogin');
            const staffData = staffHotel ? JSON.parse(staffHotel) : (staffHotelAuto ? JSON.parse(staffHotelAuto) : null);

            if (!user && !staffData) { window.location.href = 'login.html'; return; }

            if (staffData) {
                updateNav();
                loadManagePage();
                return;
            }

            updateNav();
            checkUserType('hotel').then(success => {
                if (!success) {
                    db.ref('users/' + user.uid).once('value').then(snap => {
                        const role = getUserRole(snap.val());
                        if (role === 'partner') window.location.href = 'partner.html';
                        else if (role === 'admin') window.location.href = 'admin.html';
                    });
                }
            });
            return;
        }

        if (path.includes('login.html')) {
            if (!user) {
                updateNav();
                checkAutoSignIn();
                return;
            }
            try {
                const snap = await db.ref('users/' + user.uid).once('value');
                const role = getUserRole(snap.val());
                const redirects = { admin: 'admin.html', partner: 'partner.html', hotel: 'hotel-manage.html?uid=' + user.uid };
                window.location.href = redirects[role] || 'index.html';
            } catch (e) {
                window.location.href = 'index.html';
            }
            return;
        }

        if (path.includes('profile.html')) {
            if (!user) { window.location.href = 'login.html'; return; }
            loadProfile();
            return;
        }

        if (path.includes('my-bookings.html')) {
            if (!user) { window.location.href = 'login.html'; return; }
            loadMyBookings();
            return;
        }

        // Default: index / hotels / hotel-detail
        if (path.includes('index.html') || path.endsWith('/hotel-booking/') || path.endsWith('/hotel-booking')) {
            loadFeaturedHotels();
            loadAllHotelsOnHomepage();
        }

        if (path.includes('hotels.html')) {
            showSkeleton('hotelList', 6);
            loadAllHotels();
            const s = getUrlParam('search');
            if (s) {
                const el = document.getElementById('filterLocation');
                if (el) el.value = s;
                applyFilters();
            }
        }

        if (path.includes('hotel-detail.html')) loadHotelDetail();

        // Load offers for relevant pages
        initOffersForCurrentPage();
    });

    // Mobile menu
    const h = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav-menu');
    let backdrop = document.querySelector('.nav-backdrop');

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);
    }

    function openMobileMenu() {
        if (!nav) return;
        nav.classList.add('active');
        if (h) h.classList.add('active');
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        if (!nav) return;
        nav.classList.remove('active');
        if (h) h.classList.remove('active');
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (h) {
        h.addEventListener('click', () => {
            if (nav && nav.classList.contains('active')) closeMobileMenu();
            else openMobileMenu();
        });
    }

    backdrop.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992) closeMobileMenu();
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) closeMobileMenu();
    });

    // Header scroll effect
    window.addEventListener('scroll', function () {
        const header = document.querySelector('.header');
        if (window.scrollY > 10) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // Add reveal classes
    document.querySelectorAll('.section-title, .section-subtitle, .feature-card, .hotel-card, .stat-card').forEach(el => {
        if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right') && !el.classList.contains('reveal-scale')) {
            el.classList.add('reveal');
        }
    });

    setTimeout(initScrollReveal, 500);
});