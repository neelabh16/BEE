require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User.model');
const Portfolio = require('./models/Portfolio.model');
const Project = require('./models/Project.model');
const Community = require('./models/Community.model');
const Discussion = require('./models/Discussion.model');
const CodexEntry = require('./models/CodexEntry.model');
const Hackathon = require('./models/Hackathon.model');
const Activity = require('./models/Activity.model');
const Bookmark = require('./models/Bookmark.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devverse';

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding.');

    // Clear collections
    console.log('Clearing existing records...');
    await Promise.all([
      User.deleteMany({}),
      Portfolio.deleteMany({}),
      Project.deleteMany({}),
      Community.deleteMany({}),
      Discussion.deleteMany({}),
      CodexEntry.deleteMany({}),
      Hackathon.deleteMany({}),
      Activity.deleteMany({}),
      Bookmark.deleteMany({}),
    ]);
    console.log('Cleared existing records.');

    // Hash sample password
    const samplePassword = 'password123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(samplePassword, salt);

    // 1. Create Users
    console.log('Seeding users...');
    const usersData = [
      {
        displayName: 'Alex Chen',
        username: 'alexchen',
        email: 'alex@devverse.io',
        password: hashedPassword,
        role: 'admin',
        title: 'Principal Systems Architect',
        bio: 'Distributed systems tinkerer, Rust & Node enthusiast, building scalable distributed architectures and high-throughput real-time APIs.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
        skills: ['Node.js', 'React', 'MongoDB', 'Go', 'Docker', 'Kubernetes', 'Redis'],
        interests: ['Distributed Systems', 'Cloud Architecture', 'Database Internals'],
        githubUrl: 'https://github.com',
        linkedinUrl: 'https://linkedin.com',
        location: 'San Francisco, CA',
        score: 450,
      },
      {
        displayName: 'Maya Patel',
        username: 'mayapatel',
        email: 'maya@devverse.io',
        password: hashedPassword,
        role: 'user',
        title: 'Full Stack & AI Engineer',
        bio: 'Passionate about bridging generative AI workflows with delightful React web applications.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
        skills: ['React', 'Python', 'TypeScript', 'TailwindCSS', 'PyTorch', 'Next.js'],
        interests: ['LLM Fine-tuning', 'UI Design', 'Open Source'],
        githubUrl: 'https://github.com',
        twitterUrl: 'https://twitter.com',
        location: 'Seattle, WA',
        score: 380,
      },
      {
        displayName: 'Devon Vance',
        username: 'devonvance',
        email: 'devon@devverse.io',
        password: hashedPassword,
        role: 'user',
        title: 'DevOps & Cloud Engineer',
        bio: 'Automating everything from CI/CD pipelines to Terraform infrastructure on AWS and GCP.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
        skills: ['AWS', 'Docker', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Linux'],
        interests: ['Site Reliability', 'Zero Trust', 'Microservices'],
        githubUrl: 'https://github.com',
        location: 'Austin, TX',
        score: 290,
      },
      {
        displayName: 'Elena Rostova',
        username: 'elenarostova',
        email: 'elena@devverse.io',
        password: hashedPassword,
        role: 'user',
        title: 'Cybersecurity & AppSec Researcher',
        bio: 'Hunting vulnerabilities, breaking crypto protocols, and building bulletproof defensive security tooling.',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
        skills: ['Python', 'C++', 'Security Auditing', 'OAuth2', 'Cryptography', 'Linux'],
        interests: ['AppSec', 'Penetration Testing', 'Smart Contracts'],
        githubUrl: 'https://github.com',
        location: 'Berlin, Germany',
        score: 340,
      },
    ];

    const users = await User.insertMany(usersData);
    const [alex, maya, devon, elena] = users;

    // 2. Create Portfolios
    console.log('Seeding portfolios...');
    await Portfolio.insertMany([
      {
        user: alex._id,
        headline: alex.title,
        about: alex.bio,
        skills: alex.skills,
        experience: [
          {
            role: 'Staff Engineer',
            company: 'CloudScale Labs',
            startDate: '2023',
            endDate: 'Present',
            description: 'Leading global API gateway team handling 500k req/sec.',
          },
          {
            role: 'Senior Software Engineer',
            company: 'Nexus Grid',
            startDate: '2020',
            endDate: '2023',
            description: 'Architected streaming pipeline using Kafka and MongoDB replica sets.',
          },
        ],
        achievements: [
          {
            title: 'Speaker at Conf42 Microservices',
            description: 'Keynote on zero-downtime distributed MongoDB migrations',
            date: '2024',
          },
        ],
        socialLinks: {
          github: alex.githubUrl,
          linkedin: alex.linkedinUrl,
        },
        isPublic: true,
      },
      {
        user: maya._id,
        headline: maya.title,
        about: maya.bio,
        skills: maya.skills,
        experience: [
          {
            role: 'AI Applications Lead',
            company: 'Synthetica',
            startDate: '2022',
            endDate: 'Present',
            description: 'Building multi-agent autonomous coding assistants in React & FastAPI.',
          },
        ],
        achievements: [
          {
            title: 'Global Hackathon Winner - GenAI 2024',
            description: 'First prize for AI pair programming playground',
            date: '2024',
          },
        ],
        socialLinks: {
          github: maya.githubUrl,
          twitter: maya.twitterUrl,
        },
        isPublic: true,
      },
      {
        user: devon._id,
        headline: devon.title,
        about: devon.bio,
        skills: devon.skills,
        experience: [
          {
            role: 'SRE Lead',
            company: 'StackOps',
            startDate: '2021',
            endDate: 'Present',
            description: 'Managed multi-cloud AWS EKS clusters with 99.99% uptime SLA.',
          },
        ],
        isPublic: true,
      },
      {
        user: elena._id,
        headline: elena.title,
        about: elena.bio,
        skills: elena.skills,
        experience: [
          {
            role: 'Security Consultant',
            company: 'CyberDefend',
            startDate: '2022',
            endDate: 'Present',
            description: 'Conducting web application and smart contract penetration testing.',
          },
        ],
        isPublic: true,
      },
    ]);

    // 3. Create Projects
    console.log('Seeding projects...');
    const p1 = new Project({
      title: 'DevPulse - Realtime API Monitor',
      description: 'A lightweight distributed health and latency telemetry dashboard for microservices with zero-overhead synthetic probes.',
      category: 'devtools',
      technologies: ['Node.js', 'React', 'MongoDB', 'Redis', 'TailwindCSS'],
      githubUrl: 'https://github.com/example/devpulse',
      liveUrl: 'https://devpulse.example.com',
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
      owner: alex._id,
      likes: [maya._id, devon._id],
      likesCount: 2,
      bookmarks: [maya._id],
      bookmarksCount: 1,
      status: 'published',
    });
    await p1.save();

    const p2 = new Project({
      title: 'NeuralDraft - AI Code Storyboard',
      description: 'Interactive canvas transforming natural language architecture specs into executable boilerplate and database diagrams.',
      category: 'ai-ml',
      technologies: ['React', 'Python', 'TailwindCSS', 'FastAPI'],
      githubUrl: 'https://github.com/example/neuraldraft',
      liveUrl: 'https://neuraldraft.example.com',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop',
      owner: maya._id,
      likes: [alex._id, elena._id, devon._id],
      likesCount: 3,
      bookmarks: [alex._id],
      bookmarksCount: 1,
      status: 'published',
    });
    await p2.save();

    const p3 = new Project({
      title: 'KubeGuard - SRE Incident Automator',
      description: 'Automated Kubernetes pod failure remediation with slack alerts, memory profiling dumps, and dynamic replica tuning.',
      category: 'cloud',
      technologies: ['Go', 'Docker', 'Kubernetes', 'AWS'],
      githubUrl: 'https://github.com/example/kubeguard',
      liveUrl: 'https://kubeguard.example.com',
      coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=450&fit=crop',
      owner: devon._id,
      likes: [alex._id],
      likesCount: 1,
      status: 'published',
    });
    await p3.save();

    // 4. Create Communities
    console.log('Seeding communities...');
    const c1 = new Community({
      name: 'Full Stack Architects',
      description: 'A space for sharing deep technical architecture, distributed system blueprints, MERN optimizations, and database scaling.',
      topic: 'fullstack',
      owner: alex._id,
      members: [alex._id, maya._id, devon._id, elena._id],
      membersCount: 4,
      avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&h=200&fit=crop',
    });
    await c1.save();

    const c2 = new Community({
      name: 'AI Engineering & LLMs',
      description: 'Discussing real-world LLM deployments, RAG pipelines, fine-tuning, latency optimization, and developer toolkits.',
      topic: 'ai-ml',
      owner: maya._id,
      members: [maya._id, alex._id],
      membersCount: 2,
      avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=200&fit=crop',
    });
    await c2.save();

    const c3 = new Community({
      name: 'Cloud & Platform Engineering',
      description: 'Docker, Kubernetes, zero-downtime deployments, CI/CD pipelines, and cloud security strategies.',
      topic: 'devops',
      owner: devon._id,
      members: [devon._id, alex._id, elena._id],
      membersCount: 3,
      avatar: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
    });
    await c3.save();

    // 5. Create Discussions
    console.log('Seeding discussions...');
    await Discussion.create({
      title: 'Managing high-cardinality queries in MongoDB replica sets',
      content: 'When scaling to hundreds of millions of events, compound indexing and index prefix rules become critical. What strategies are you using for query sharding and TTL collections?',
      community: c1._id,
      author: alex._id,
      isPinned: true,
      replies: [
        {
          content: 'We migrated our time-series logs to separate bucket collections with compound keys on tenantId + createdAt. Saw a 6x query speedup!',
          author: devon._id,
        },
        {
          content: 'Also make sure to watch out for index size exceeding your WiredTiger cache limit, otherwise disk I/O explodes.',
          author: maya._id,
        },
      ],
      repliesCount: 2,
    });

    // 6. Create Codex Entries
    console.log('Seeding codex logs...');
    const codex1 = new CodexEntry({
      title: 'Post-Mortem: The 3 AM Event Loop Stall in Node.js',
      category: 'incidents',
      content: 'Last week our primary API service suffered sudden latency spikes reaching 15 seconds. After memory profiling, we discovered a synchronous JSON.parse on a 45MB webhook payload that completely blocked the libuv event loop. Here is how we resolved it with worker threads and streaming parsers...',
      tags: ['Node.js', 'Performance', 'Incident', 'Debugging'],
      author: alex._id,
      bookmarks: [maya._id, devon._id],
      bookmarksCount: 2,
    });
    await codex1.save();

    const codex2 = new CodexEntry({
      title: 'Optimizing Token Streaming Latency in React Frontends',
      category: 'performance',
      content: 'When consuming streaming completions from LLM endpoints using Server-Sent Events, frequent React setState calls trigger heavy layout thrashing. By throttling reconciliation with requestAnimationFrame and micro-batching token chunks, we cut client-side memory by 70%.',
      tags: ['React', 'Performance', 'AI', 'Frontend'],
      author: maya._id,
      bookmarks: [alex._id],
      bookmarksCount: 1,
    });
    await codex2.save();

    // 7. Create Hackathons
    console.log('Seeding hackathons...');
    const h1 = new Hackathon({
      title: 'DevVerse Winter Hackathon 2026',
      description: 'Build open-source tools that empower developers to collaborate, debug faster, and ship with confidence. 48 hours of intense coding with live mentor office hours.',
      category: 'open',
      difficulty: 'all-levels',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      rules: 'All code must be written during the hackathon period. Open source licenses required.',
      judgingCriteria: 'Innovation (30%), Technical Polish (30%), Practical Developer Utility (40%).',
      prizes: '$10,000 Grand Prize, Cloud credits, DevVerse Champion badges.',
      maxParticipants: 500,
      organizer: alex._id,
      participants: [alex._id, maya._id, devon._id, elena._id],
      participantsCount: 4,
      technologies: ['React', 'Node.js', 'MongoDB', 'AI'],
      coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=450&fit=crop',
      status: 'upcoming',
      isSampleData: true,
    });
    await h1.save();

    console.log('Database seeding completed successfully!');
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
