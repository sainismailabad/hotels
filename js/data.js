// ===== BookMyHotel - Local Storage Data Layer (Legacy Fallback) =====

function initData() {
    if (!localStorage.getItem('bookmyhotel_users')) {
        const defaultUsers = [
            { id: 'usr_1', name: 'Admin', email: 'admin@bookmyhotel.com', password: 'admin123', phone: '+91 9999999999', type: 'admin', createdAt: new Date().toISOString() },
            { id: 'usr_2', name: 'Vikram Hotels', email: 'vikram@bookmyhotel.com', password: 'partner123', phone: '+91 9988776655', type: 'partner', company: 'Vikram Hotels Pvt Ltd', commission: 15, createdAt: new Date().toISOString() },
            { id: 'usr_3', name: 'Rahul Sharma', email: 'rahul@bookmyhotel.com', password: 'customer123', phone: '+91 9876543210', type: 'customer', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('bookmyhotel_users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('bookmyhotel_hotels')) localStorage.setItem('bookmyhotel_hotels', JSON.stringify([]));
    if (!localStorage.getItem('bookmyhotel_bookings')) localStorage.setItem('bookmyhotel_bookings', JSON.stringify([]));
    if (!localStorage.getItem('bookmyhotel_partners')) localStorage.setItem('bookmyhotel_partners', JSON.stringify([]));
    if (!localStorage.getItem('bookmyhotel_settings')) {
        localStorage.setItem('bookmyhotel_settings', JSON.stringify({
            platformName: 'BookMyHotel',
            commission: 15,
            supportEmail: 'support@bookmyhotel.com',
            supportPhone: '1800-BOOKMYHOTEL'
        }));
    }
}

function getUsers() { return JSON.parse(localStorage.getItem('bookmyhotel_users') || '[]'); }
function getHotels() { return JSON.parse(localStorage.getItem('bookmyhotel_hotels') || '[]'); }
function getBookings() { return JSON.parse(localStorage.getItem('bookmyhotel_bookings') || '[]'); }
function getPartners() { return JSON.parse(localStorage.getItem('bookmyhotel_partners') || '[]'); }
function getSettings() { return JSON.parse(localStorage.getItem('bookmyhotel_settings') || '{}'); }

function saveUsers(data) { localStorage.setItem('bookmyhotel_users', JSON.stringify(data)); }
function saveHotels(data) { localStorage.setItem('bookmyhotel_hotels', JSON.stringify(data)); }
function saveBookings(data) { localStorage.setItem('bookmyhotel_bookings', JSON.stringify(data)); }
function savePartners(data) { localStorage.setItem('bookmyhotel_partners', JSON.stringify(data)); }
function saveSettings(data) { localStorage.setItem('bookmyhotel_settings', JSON.stringify(data)); }

function generateId(prefix) {
    const key = 'bookmyhotel_counter_' + prefix;
    const count = parseInt(localStorage.getItem(key) || '1000') + 1;
    localStorage.setItem(key, count.toString());
    return prefix + '_' + count;
}

function generateBookingId() {
    const key = 'bookmyhotel_counter_booking';
    const count = parseInt(localStorage.getItem(key) || '1000') + 1;
    localStorage.setItem(key, count.toString());
    const year = new Date().getFullYear();
    return 'BMH-' + year + '-' + String(count).padStart(5, '0');
}

function getPartnerName(partnerId) {
    const partners = getPartners();
    const p = partners.find(x => x.id === partnerId);
    return p ? p.companyName : 'N/A';
}

initData();