# Sagar Classes – static website (HTML + CSS + JS only)

No PHP, no MySQL, no install. Everything runs in the browser.

```
SAGAR-TUTION/
├── index.html              Home
├── html/                   about · academic · facilities · functions · toppers · contact
│                           staff-attendance · admin
├── css/
│   ├── style.css           Main styles
│   ├── admin.css           Admin panel styles
│   ├── responsive.css      Responsive layer
│   └── common.css          Hover/focus system, footer, admin spacing, mobile admin lists (loaded last)
├── js/
│   ├── store.js            Data storage (localStorage), ranking, attendance rules, Excel/PDF export
│   ├── script.js           Public pages: notices, toppers, events, attendance + enquiry forms
│   ├── admin.js            Admin panel: login, add/edit/delete, attendance register
│   ├── layout.js           One navbar + footer shared by every page
│   └── theme.js            Light (default) / Dark switch
└── images/logo.jpeg
```

## Run
Open `index.html` in a browser, or upload the folder to any static host (GitHub Pages, Netlify).

## Admin
Open `html/admin.html` and log in with **admin / admin@123**.
Change the login from the browser console: `SCStore.setAdmin('myuser', 'a-strong-password')`.

On small screens the admin panel shows stats, tabs and tables as horizontal swipe lists.

## Data
* Stored in the browser's localStorage (sample data is created on first load), so it stays on that device only.
* Photos are uploaded from the admin panel, resized in the browser; the class logo is used when there is none.
* Attendance can be marked only for students / staff that exist in the admin lists.
* Topper rank is calculated from the score inside each class; the home page shows #1 of every class.
* Backup: `SCStore.exportJSON()` · Reset to samples: `SCStore.reset()`.
* Excel downloads are `.xls`; PDF opens a print view – choose "Save as PDF".

## Edit the menu / footer
Change `js/layout.js` once; every page updates.
