# Sagar Classes – static website (HTML + CSS + JS only)

```
sagar-classes-website/
├── index.html            Home page
├── html/                 All other pages
│   ├── about.html  academic.html  facilities.html  functions.html
│   ├── toppers.html  contact.html  staff-attendance.html
│   └── admin.html        Admin panel
├── css/
│   ├── style.css         Main site styles
│   └── admin.css         Admin panel styles
├── js/
│   ├── store.js          Data storage (browser localStorage)
│   ├── script.js         Public pages: notice ticker, attendance + enquiry forms
│   └── admin.js          Admin panel: login, add/edit/delete, attendance register, downloads
└── images/
    └── logo.jpeg
```

## Run
No install, no server, no database. Double-click `index.html` (or upload the folder to any static host
such as GitHub Pages / Netlify).

## Admin
Open `html/admin.html` → login **admin / admin@123**.
Change it in the browser console: `SCStore.setAdmin('myuser','a-strong-password')`.

## Data
Saved in the browser's localStorage (first load fills sample students, staff, toppers, events, notices).
* Data stays in that one browser/device; visitors' attendance/enquiries are saved on their own device.
* Backup: `SCStore.exportJSON()` in the console.  Reset to samples: `SCStore.reset()`.
* Excel downloads are `.xls`; PDF opens a print view – choose "Save as PDF".
