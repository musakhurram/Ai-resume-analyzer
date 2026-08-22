require("dotenv").config();
const invokeGeminiAi = require("./ai.service");

const selfDescription = `
I am a passionate Full-Stack JavaScript Developer with over 2 years of experience building modern, responsive, and scalable web applications. I have a strong foundation in the MERN stack (MongoDB, Express.js, React, Node.js) along with clean code practices, RESTful API design, and database modeling. I am a quick learner who thrives in agile team environments and enjoys solving complex technical challenges.
`.trim();

const resume = `
John Doe
Full-Stack Developer | Email: john.doe@example.com | GitHub: github.com/johndoe | LinkedIn: linkedin.com/in/johndoe

SUMMARY:
Results-driven Full-Stack Developer with 2+ years of experience designing and implementing full-stack web applications using React.js, Node.js, Express.js, and MongoDB. Proven track record in developing secure authentication systems, optimizing database queries, and integrating third-party APIs.

EXPERIENCE:
Software Engineer | AlphaTech Solutions (2023 - Present)
- Developed and maintained RESTful APIs using Node.js and Express.js, serving 50k+ monthly active users.
- Designed responsive front-end user interfaces using React.js, Redux Toolkit, and Tailwind CSS.
- Implemented secure user authentication using JWT and bcrypt.
- Collaborated with cross-functional teams to deliver sprint goals on time.

Junior Web Developer | WebCraft Studios (2022 - 2023)
- Built interactive web pages using HTML5, CSS3, JavaScript (ES6+), and React.
- Integrated MongoDB schemas and performed CRUD operations using Mongoose.
- Fixed bugs and improved front-end performance by 25%.

SKILLS:
- Languages: JavaScript (ES6+), TypeScript, HTML5, CSS3/SASS, SQL
- Front-End: React.js, Redux Toolkit, Tailwind CSS, Vite
- Back-End: Node.js, Express.js, REST APIs, JWT, WebSockets
- Databases: MongoDB, Mongoose, PostgreSQL
- Tools & DevOps: Git, GitHub, Docker, Postman, Linux

EDUCATION:
Bachelor of Science in Computer Science | XYZ University (Graduated 2022)
`.trim();

const jobDescription = `
Job Title: Full Stack Developer (MERN Stack)
Company: NextGen Innovators
Location: Remote / Hybrid

About the Role:
We are looking for a skilled Full-Stack MERN Developer to join our engineering team. You will be responsible for building scalable web applications, designing robust backend APIs, and creating responsive, intuitive user interfaces.

Key Responsibilities:
- Design and develop scalable full-stack applications using React.js, Node.js, Express.js, and MongoDB.
- Build clean, secure, and well-documented RESTful APIs.
- Implement state management using Redux Toolkit or React Context API.
- Optimize database queries and schema designs with Mongoose.
- Write clean, maintainable, and testable code.
- Collaborate with designers, product managers, and other engineers in an agile setting.

Requirements:
- 2+ years of hands-on experience in full-stack development with MERN stack.
- Strong proficiency in JavaScript (ES6+), React.js, Node.js, and Express.js.
- Solid understanding of MongoDB, Mongoose, and data modeling.
- Experience with authentication & authorization mechanisms (JWT, OAuth, Cookies).
- Familiarity with version control (Git/GitHub) and REST API testing (Postman).
- Experience with TypeScript, Docker, or AWS is a plus.
- Good communication and teamwork skills.
`.trim();

module.exports = {
  selfDescription,
  resume,
  jobDescription,
};


// If run directly: node temp.js
if (require.main === module) {
  const prompt = `
You are an expert technical interviewer and career coach.
Analyze the following candidate's profile against the given Job Description:

---
JOB DESCRIPTION:
${jobDescription}

---
RESUME:
${resume}

---
SELF DESCRIPTION:
${selfDescription}

---
Provide a brief assessment including:
1. Match Score (0 - 100)
2. Key Strengths
3. Skill Gaps
4. 3 Sample Technical & Behavioral Interview Questions
`;

  console.log("Invoking Gemini AI with test input...\n");
  invokeGeminiAi(prompt)
    .then(() => {
      console.log("\nSuccessfully generated AI response!");
    })
    .catch((err) => {
      console.error("Error invoking AI:", err);
    });
}
