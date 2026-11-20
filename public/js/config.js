window.CONFIG = {
  SUPABASE_URL: "https://hzstzxqiszexavvoiwqx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3R6eHFpc3pleGF2dm9pd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNTUyNzUsImV4cCI6MjExMDYzMTI3NX0.7IFzSkzURIJKZ6cFqoYJlW5u2z16homa71bGwedpYKY",
  EVENT_START: "2026-11-30T09:00:00+05:30",
  EVENT_END: "2026-11-30T14:00:00+05:30",
  PROBLEM_STATEMENTS: [
    "Problem Statement 1",
    "Problem Statement 2",
    "Problem Statement 3"
  ],
  DEPARTMENTS: [
    { name: "CSE", allied: true },
    { name: "CSE (Cyber Security)", allied: true },
    { name: "CSE (AI & ML)", allied: true },
    { name: "AI & Data Science", allied: true },
    { name: "Information Technology", allied: true },
    { name: "CSBS", allied: true },
    { name: "ECE", allied: false },
    { name: "EEE", allied: false },
    { name: "Mechanical", allied: false },
    { name: "Civil", allied: false },
    { name: "Biomedical", allied: false },
    { name: "Other", allied: false }
  ],
  EVENTS: [
    {
      id: "hackathon",
      name: "Cyber Hackathon / Buildathon",
      time: "9:00 am - 2:00 pm",
      from: 9,
      to: 14,
      desc: "Pick one of 3 problem statements and build a platform or tool. Citans team up with staff and students.",
      audience: "Open to all Citans. Team of 3 to 4 (students and staff can team up)",
      team: { min: 3, max: 4 },
      qr: "assets/CTF & HACK.jpeg"
    },
    {
      id: "ctf",
      name: "Capture the Flag",
      time: "9:00 am - 2:00 pm",
      from: 9,
      to: 14,
      desc: "A virtual cybersecurity experience across 5 domains.",
      audience: "All CIT students. Team of exactly 2",
      team: { min: 2, max: 2 },
      qr: "assets/CTF & HACK.jpeg"
    },
    {
      id: "workshop",
      name: "Cybersecurity Workshop",
      time: "10:00 am - 2:00 pm",
      from: 10,
      to: 14,
      desc: "What cybersecurity is, the threats to watch for, and a look at the recent attacks from this October.",
      audience: "Open to students of all departments and staff. Individual registration",
      team: { min: 1, max: 1 },
      qr: "assets/WORKSHOP.jpeg"
    }
  ]
};
