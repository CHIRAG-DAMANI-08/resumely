# Mock Test Data for Resume Upload Testing

## Test Company/Job Data #1
```
Company Name: TechFlow AI
Job Title: Senior Full-Stack Engineer
Job Description: We're looking for a Senior Full-Stack Engineer with 5+ years of experience in React, Node.js, and cloud infrastructure. Must have experience with TypeScript, microservices architecture, and CI/CD pipelines. You'll lead a team of 3-4 engineers and mentor junior developers. Competitive salary, remote work, and excellent benefits package.
```

## Test Company/Job Data #2
```
Company Name: DataViz Solutions
Job Title: Data Scientist
Job Description: Join our analytics team as a Data Scientist. You'll work with Python, SQL, and machine learning frameworks to build predictive models. Experience with Pandas, scikit-learn, and TensorFlow required. Must have 3+ years in data analysis roles. We offer flexible hours, learning budget, and stock options.
```

## Test Company/Job Data #3
```
Company Name: CloudNine Systems
Job Title: DevOps Engineer
Job Description: Seeking a DevOps Engineer to manage our Kubernetes clusters and CI/CD infrastructure. Strong Docker, Terraform, and AWS knowledge required. Must be able to automate deployment processes and improve system reliability. 4+ years experience preferred. Excellent medical coverage and remote-first culture.
```

## Test Company/Job Data #4
```
Company Name: PixelStudio Creative
Job Title: UI/UX Designer
Job Description: Looking for a talented UI/UX Designer to create beautiful interfaces for our web and mobile products. Proficiency in Figma, prototyping, and user research required. 3+ years designing for mobile-first applications. Portfolio required. Join a creative team with unlimited coffee and collaborative workspace.
```

## Test Company/Job Data #5
```
Company Name: SecureVault Inc
Job Title: Security Engineer
Job Description: Protect our platform as a Security Engineer. You'll conduct penetration testing, code reviews, and security audits. Knowledge of OWASP, cryptography, and network security essential. 5+ years in cybersecurity roles required. Work on cutting-edge security challenges with a talented team.
```

## Test Company/Job Data #6
```
Company Name: MobileFirst Apps
Job Title: iOS Developer
Job Description: Develop high-performance iOS applications using Swift and SwiftUI. You'll work on a large-scale app with millions of users. Experience with CocoaPods, Xcode, and iOS testing frameworks required. 3+ years iOS development minimum. Competitive compensation with professional development opportunities.
```

---

## Instructions

**For Testing Upload Bug:**

1. **First Upload (Resume #1):**
   - Copy "Test Company/Job Data #1" into the form
   - Upload your first resume PDF
   - Wait for analysis
   - **In browser console (F12), copy the entire `data` object that gets logged**
   - Note the URL in address bar (e.g., `/resume/abc-123-def`)

2. **Second Upload (Resume #2):**
   - Go back to upload page
   - Copy "Test Company/Job Data #2" into the form
   - Upload a **DIFFERENT** resume PDF (different content/file)
   - Wait for analysis
   - **In browser console, copy the entire `data` object**
   - Note the URL (should be different, e.g., `/resume/xyz-789-uvw`)

3. **Paste both console outputs here so I can compare:**
   - Are UUIDs different?
   - Are paths different?
   - Are the resumes being read correctly?

---

## What to Look For in Console Output

The `data` object logged should look like:
```json
{
  "id": "unique-uuid-here",
  "resumePath": "resumes/user-uuid/resume-uuid/resume.pdf",
  "imagePath": "resumes/user-uuid/resume-uuid/resume.png",
  "companyName": "Company Name",
  "jobTitle": "Job Title",
  "jobDescription": "Job description...",
  "feedback": { ...analysis results... }
}
```

**Key things to check:**
- `id` should be **different** for each upload
- `resumePath` should be **different** for each upload
- Both should include your `user-uuid` in the path
