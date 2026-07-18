# TODO - Navigation Fix (Desktop + Mobile)

## Plan Summary
Fix header user navigation so **My Profile**, **My Bookings**, and **Admin/Partner** appear correctly on both desktop and mobile hamburger menu.

## Steps
- [ ] Update `js/script.js` `updateNav()` to render **simple links inside mobile drawer** (no dropdown), and keep avatar dropdown for desktop.
- [ ] Update `css/style.css` to style `#navAuth` links properly inside mobile drawer and ensure dropdown doesn’t break on touch.
- [ ] (If needed) standardize any page header markup for `id="navAuth"` (most pages already have it).
- [ ] Test manually on desktop + mobile:
  - [ ] Sign in customer → desktop avatar dropdown shows links
  - [ ] Sign in customer → hamburger menu shows links directly (no need avatar click)
  - [ ] Sign in admin/partner → correct panel link appears in both desktop + mobile

