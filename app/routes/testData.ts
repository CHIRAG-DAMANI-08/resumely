// Random test data generator for quick testing
export const testDataSets = [
  {
    companyName: "TechFlow AI",
    jobTitle: "Senior Full-Stack Engineer",
    jobDescription: "We're looking for a Senior Full-Stack Engineer with 5+ years of experience in React, Node.js, and cloud infrastructure. Must have experience with TypeScript, microservices architecture, and CI/CD pipelines. You'll lead a team of 3-4 engineers and mentor junior developers."
  },
  {
    companyName: "DataViz Solutions",
    jobTitle: "Data Scientist",
    jobDescription: "Join our analytics team as a Data Scientist. You'll work with Python, SQL, and machine learning frameworks to build predictive models. Experience with Pandas, scikit-learn, and TensorFlow required. Must have 3+ years in data analysis roles."
  },
  {
    companyName: "CloudNine Systems",
    jobTitle: "DevOps Engineer",
    jobDescription: "Seeking a DevOps Engineer to manage our Kubernetes clusters and CI/CD infrastructure. Strong Docker, Terraform, and AWS knowledge required. Must be able to automate deployment processes and improve system reliability. 4+ years experience preferred."
  },
  {
    companyName: "PixelStudio Creative",
    jobTitle: "UI/UX Designer",
    jobDescription: "Looking for a talented UI/UX Designer to create beautiful interfaces for our web and mobile products. Proficiency in Figma, prototyping, and user research required. 3+ years designing for mobile-first applications. Portfolio required."
  },
  {
    companyName: "SecureVault Inc",
    jobTitle: "Security Engineer",
    jobDescription: "Protect our platform as a Security Engineer. You'll conduct penetration testing, code reviews, and security audits. Knowledge of OWASP, cryptography, and network security essential. 5+ years in cybersecurity roles required."
  },
  {
    companyName: "MobileFirst Apps",
    jobTitle: "iOS Developer",
    jobDescription: "Develop high-performance iOS applications using Swift and SwiftUI. You'll work on a large-scale app with millions of users. Experience with CocoaPods, Xcode, and iOS testing frameworks required. 3+ years iOS development minimum."
  },
  {
    companyName: "WebScale Ventures",
    jobTitle: "Backend Engineer",
    jobDescription: "Build scalable backend systems handling millions of requests per day. Expertise in Java, Spring Boot, and PostgreSQL required. Experience with distributed systems and message queues (Kafka, RabbitMQ) a plus. 4+ years backend development."
  },
  {
    companyName: "AI Research Labs",
    jobTitle: "Machine Learning Engineer",
    jobDescription: "Work on cutting-edge ML projects involving NLP and computer vision. Python, PyTorch, and TensorFlow expertise required. You'll collaborate with researchers and deploy models to production. PhD or 5+ years ML experience preferred."
  },
  {
    companyName: "E-Commerce Pro",
    jobTitle: "Frontend Engineer",
    jobDescription: "Create responsive, performant user interfaces for our e-commerce platform. React, TypeScript, and CSS expertise required. You'll optimize for mobile and implement accessibility standards. 2-3 years frontend development experience."
  },
  {
    companyName: "FinTech Innovations",
    jobTitle: "Product Manager",
    jobDescription: "Lead product strategy for our fintech platform. You'll gather requirements, define roadmaps, and collaborate with engineering. Experience with payment systems and regulatory compliance required. 6+ years product management."
  }
];

export const getRandomTestData = () => {
  return testDataSets[Math.floor(Math.random() * testDataSets.length)];
};

export const getAllTestData = () => testDataSets;
