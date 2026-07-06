Company Sales Platform — internal company website

WHAT IS INCLUDED
- Dashboard
- Daily checklist
- CRM Leads
- Follow-up queue
- Daily reports
- Message templates
- Sales Playbook
- Admin dashboard
- Local backup/export
- Firebase-ready sync structure

HOW TO OPEN LOCALLY
1. Unzip the folder.
2. Open index.html in a browser.
3. Data saves in this browser/device while Firebase is off.

IMPORTANT: GITHUB PAGES WITHOUT FIREBASE
If you upload this to GitHub Pages without Firebase, every manager will have their own separate local data only.
Leads will NOT sync between managers.

HOW TO ENABLE SHARED SYNC
1. Go to https://console.firebase.google.com
2. Create a new project.
3. Enable Firestore Database.
4. Enable Authentication if you want real login later.
5. Open firebase-config.js.
6. Paste your Firebase config.
7. Change:
   const FIREBASE_ENABLED = false;
   to:
   const FIREBASE_ENABLED = true;
8. Upload the folder to GitHub Pages, Vercel, Netlify, or Firebase Hosting.

WHERE TO SEE THE COMMON DATABASE
Option 1: Inside the site -> Admin Dashboard.
Option 2: Firebase Console -> Firestore Database.

NOTE ABOUT SECURITY
This MVP syncs shared company data to one document. For real company use, add Firebase Authentication and Firestore security rules so only approved company emails can access the CRM.
