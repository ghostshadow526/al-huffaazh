# **App Name**: Al-Huffaazh Academy Portal

## Core Features:

- Secure Student Record Creation: Teachers can create student records with details like name, class, and photo, securely storing the data.
- ImageKit Integration for Media: Integration with ImageKit for secure image uploads (student photos, fee receipts) using the provided credentials.
- QR Code Generation: Auto-generate QR codes for each student, linking to a secure student ID page. LLM determines when a fresh code is appropriate tool.
- Parent Fee Receipt Uploads: Parents can upload fee receipts, which are stored using ImageKit and trigger payment notifications to admins.
- Admin Payment Confirmation: Branch and super admins can confirm payments, updating the payment status in the database.
- Role-Based Access Control: Implementation of role-based access control (super_admin, branch_admin, teacher, parent) using Firebase Auth.
- Student ID Page Generation: The system automatically generates the student ID page which displays school logo, student's photo and non-sensitive student details

## Style Guidelines:

- Primary color: Light green (#CFF7E6) to reflect the academy's branding.
- Background color: White (#FFFFFF) for a clean and modern look.
- Accent color: Dark green (#0E7A5A) for calls to action and important headings, providing contrast.
- Use 'Inter' sans-serif font for body and headings to ensure readability and a modern feel.
- Simple, clear icons to represent actions and data, maintaining a user-friendly interface.
- Clean and structured layout with neat cards for student lists and payment information.
- Subtle animations and transitions to enhance user experience without being distracting.