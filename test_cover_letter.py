#!/usr/bin/env python3
import requests
import json

# Test resume data
test_resume = """Alex Johnson
alex@example.com
(555) 123-4567

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience in full-stack development.

WORK EXPERIENCE
Senior Software Engineer | Tech Corp | 2021-Present
- Led team of 5 engineers on microservices architecture
- Increased system performance by 40%
- Managed AWS infrastructure and deployment

SKILLS
Python, JavaScript, Node.js, React, PostgreSQL, MongoDB, AWS

EDUCATION
Bachelor of Science in Computer Science | State University | 2019
"""

# Test job description
test_job_desc = """We're looking for a Senior Software Engineer with Python and AWS expertise. Must have 5+ years experience. React and Node.js knowledge a plus."""

# Send request
try:
    print("🚀 Testing Cover Letter Generation API...")
    print(f"📍 Endpoint: http://localhost:3001/api/cover-letter")
    
    response = requests.post(
        'http://localhost:3001/api/cover-letter',
        json={
            'resumeText': test_resume,
            'jobDescription': test_job_desc,
            'jobTitle': 'Senior Software Engineer',
            'companyName': 'TechCorp Inc',
            'tone': 'professional'
        },
        timeout=60
    )
    
    print(f"✅ Response Status: {response.status_code}")
    
    result = response.json()
    
    if response.status_code == 200:
        print("\n🎉 SUCCESS! Cover Letter API is working!\n")
        print(f"✅ PDF URL: {result.get('pdfUrl', 'N/A')[:60]}...")
        print(f"✅ PDF Expires: {result.get('pdfExpiresAt')}")
        print(f"✅ Credits Used: {result.get('creditsUsed')}")
        print(f"✅ Cover Letter Text Preview:")
        text = result.get('coverLetterText', '')
        print(f"   {text[:200]}...")
    else:
        print(f"\n❌ Error: {result.get('error')}")
        
except Exception as e:
    print(f"❌ Request failed: {str(e)}")
