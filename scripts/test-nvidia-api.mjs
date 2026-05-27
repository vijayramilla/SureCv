/**
 * Test script to verify NVIDIA API integration works correctly
 */

import {
  optimizeResume,
  generateCoverLetter,
  improveBulletPoint,
} from './src/lib/nvidia.js';

// Sample resume
const sampleResume = `John Doe
john@example.com | (555) 123-4567 | San Francisco, CA | linkedin.com/in/johndoe

Professional Summary
Full-stack software engineer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies. Passionate about clean code and user experience.

Work Experience
Senior Engineer — TechCorp | 2020 – Present
San Francisco, CA
• Worked on backend systems
• Helped with customer support
• Did data analysis

Software Developer — StartupXYZ | 2018 – 2020
San Jose, CA
• Participated in project development
• Assisted with testing
• Managed databases

Skills
Languages: JavaScript, Python, TypeScript, SQL
Frameworks: React, Node.js, Express
Tools: AWS, Docker, PostgreSQL

Education
Bachelor of Science — Computer Science | State University | 2018

Certifications
AWS Certified Solutions Architect | 2021`;

// Sample job description
const sampleJobDescription = `Senior Full-Stack Engineer
TechCorp, San Francisco, CA

We're looking for a Senior Full-Stack Engineer to join our growing team.

Requirements:
- 5+ years of software development experience
- Expert-level knowledge of React and TypeScript
- Strong backend experience with Node.js and Express
- AWS certification or equivalent cloud experience
- Experience with Docker and containerization
- Excellent problem-solving skills
- Strong communication abilities

Responsibilities:
- Design and implement scalable backend systems
- Build responsive React frontends
- Optimize application performance
- Lead technical discussions
- Mentor junior developers
- Collaborate with product teams

Nice to have:
- Experience with PostgreSQL and database optimization
- Kubernetes experience
- CI/CD pipeline setup`;

async function runTests() {
  console.log('🚀 Starting NVIDIA API Integration Tests...\n');

  try {
    // Test 1: Resume Optimization
    console.log('📋 Test 1: Resume Optimization');
    console.log('─'.repeat(50));
    const optimizationResult = await optimizeResume(
      sampleResume,
      sampleJobDescription
    );
    console.log('✅ Resume optimization successful!');
    console.log(`   ATS Score: ${optimizationResult.atsScore}/100`);
    console.log(
      `   Keywords Added: ${optimizationResult.addedKeywords.length}`
    );
    console.log(
      `   Bullets Improved: ${optimizationResult.bulletsImproved}`
    );
    console.log('\n');

    // Test 2: Cover Letter Generation
    console.log('✍️  Test 2: Cover Letter Generation');
    console.log('─'.repeat(50));
    const coverLetter = await generateCoverLetter(
      sampleResume,
      sampleJobDescription,
      'Professional'
    );
    console.log('✅ Cover letter generation successful!');
    console.log(`   Length: ${coverLetter.length} characters`);
    console.log('\n');

    // Test 3: Bullet Point Improvement
    console.log('📝 Test 3: Bullet Point Improvement');
    console.log('─'.repeat(50));
    const improvedBullets = await improveBulletPoint(
      'Worked on backend systems'
    );
    console.log('✅ Bullet improvement successful!');
    console.log(`   Generated ${improvedBullets.length} alternatives`);
    console.log('\n');

    console.log('🎉 All tests passed! NVIDIA API integration is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.message.includes('401')) {
        console.error(
          '   → API Key issue. Please verify NVIDIA_API_KEY is correct.'
        );
      } else if (error.message.includes('429')) {
        console.error(
          '   → Rate limit hit. Please wait a moment and try again.'
        );
      } else if (error.message.includes('503')) {
        console.error('   → NVIDIA API temporarily unavailable. Try again later.');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

runTests();
