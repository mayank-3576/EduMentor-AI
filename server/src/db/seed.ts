import bcrypt from 'bcryptjs';
import { initSchema, run, queryOne, db } from './index.js';

export async function seedDatabase() {
  console.log('🚀 Initializing database schema...');
  initSchema();

  console.log('🌱 Starting comprehensive academic curriculum data seeding...');

  // Clear existing data cleanly in reverse foreign key order
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM search_history;
    DELETE FROM bookmarks;
    DELETE FROM coding_submissions;
    DELETE FROM dsa_problems;
    DELETE FROM user_path_progress;
    DELETE FROM learning_path_steps;
    DELETE FROM learning_paths;
    DELETE FROM recommendations;
    DELETE FROM topic_performance;
    DELETE FROM unit_performance;
    DELETE FROM subject_performance;
    DELETE FROM topic_progress;
    DELETE FROM learning_progress;
    DELETE FROM scores;
    DELETE FROM assessment_answers;
    DELETE FROM assessment_attempts;
    DELETE FROM assessment_questions;
    DELETE FROM assessments;
    DELETE FROM quiz_answers;
    DELETE FROM quiz_attempts;
    DELETE FROM quiz_questions;
    DELETE FROM quizzes;
    DELETE FROM question_options;
    DELETE FROM questions;
    DELETE FROM pyq_records;
    DELETE FROM learning_materials;
    DELETE FROM learning_contents;
    DELETE FROM lessons;
    DELETE FROM modules;
    DELETE FROM courses;
    DELETE FROM resources;
    DELETE FROM subtopics;
    DELETE FROM topics;
    DELETE FROM units;
    DELETE FROM curriculum_mappings;
    DELETE FROM subjects;
    DELETE FROM teacher_profiles;
    DELETE FROM student_profiles;
    DELETE FROM users;
    DELETE FROM semesters;
    DELETE FROM academic_years;
    DELETE FROM branches;
    DELETE FROM degrees;
    DELETE FROM regulations;
    DELETE FROM universities;
  `);

  // 1. Academic Hierarchy (Universities, Regulations, Degrees, Branches, Years, Semesters)
  console.log('🏛️ Seeding Universities, Degrees, Branches & Semesters...');

  const aktuRes = run(
    `INSERT INTO universities (name, code, state) VALUES (?, ?, ?)`,
    ['Dr. A.P.J. Abdul Kalam Technical University', 'AKTU', 'Uttar Pradesh']
  );
  const aktuId = aktuRes.lastInsertRowid;

  const autoRes = run(
    `INSERT INTO universities (name, code, state) VALUES (?, ?, ?)`,
    ['Autonomous Engineering Institutions (Affiliated / Deemed)', 'AUTONOMOUS', 'All India']
  );
  const autoId = autoRes.lastInsertRowid;

  const jntuRes = run(
    `INSERT INTO universities (name, code, state) VALUES (?, ?, ?)`,
    ['Jawaharlal Nehru Technological University', 'JNTUH', 'Telangana']
  );
  const jntuId = jntuRes.lastInsertRowid;

  // Regulations
  run(`INSERT INTO regulations (university_id, code, year_introduced) VALUES (?, 'R20', 2020)`, [aktuId]);
  run(`INSERT INTO regulations (university_id, code, year_introduced) VALUES (?, 'NEP2020', 2022)`, [aktuId]);
  run(`INSERT INTO regulations (university_id, code, year_introduced) VALUES (?, 'R22', 2022)`, [autoId]);

  // Degrees
  const btechRes = run(
    `INSERT INTO degrees (name, code, duration_years) VALUES (?, ?, ?)`,
    ['Bachelor of Technology', 'BTECH', 4]
  );
  const btechId = btechRes.lastInsertRowid;

  // Branches
  const branchesData = [
    { name: 'Computer Science & Engineering', code: 'CSE' },
    { name: 'Computer Science & Engineering (AI & ML)', code: 'CSE_AIML' },
    { name: 'Computer Science & Engineering (Data Science)', code: 'CSE_DS' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics & Communication Engineering', code: 'ECE' },
  ];

  const branchMap: Record<string, number> = {};
  for (const b of branchesData) {
    const res = run(
      `INSERT INTO branches (degree_id, name, code) VALUES (?, ?, ?)`,
      [btechId, b.name, b.code]
    );
    branchMap[b.code] = res.lastInsertRowid;
  }

  // Academic Years (1 to 4)
  const yearMap: Record<number, number> = {};
  for (let y = 1; y <= 4; y++) {
    const res = run(
      `INSERT INTO academic_years (year_number, name) VALUES (?, ?)`,
      [y, `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`]
    );
    yearMap[y] = res.lastInsertRowid;
  }

  // Semesters (1 to 8)
  const semesterMap: Record<number, number> = {};
  for (let s = 1; s <= 8; s++) {
    const yearNum = Math.ceil(s / 2);
    const res = run(
      `INSERT INTO semesters (academic_year_id, semester_number, name) VALUES (?, ?, ?)`,
      [yearMap[yearNum], s, `Semester ${s}`]
    );
    semesterMap[s] = res.lastInsertRowid;
  }

  // 2. Users (Student, Teacher, Admin)
  console.log('👥 Seeding Users & Profiles...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Student Persona: Aarav Sharma -> AKTU, B.Tech, CSE AIML, 3rd Year, Semester 5
  const studentUser = run(
    `INSERT INTO users (name, email, password_hash, role, avatar_url)
     VALUES (?, ?, ?, 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')`,
    ['Aarav Sharma', 'student@edumentor.ai', passwordHash]
  );
  const studentId = studentUser.lastInsertRowid;

  run(
    `INSERT INTO student_profiles (
      user_id, university_id, degree_id, branch_id, academic_year_id, semester_id,
      target_score, current_streak, total_study_minutes, target_goal, bio
    ) VALUES (?, ?, ?, ?, ?, ?, 75.0, 7, 720, 'B.Tech CSE AIML Semester 5 Mastery & GATE 2027', '3rd Year Computer Science & AI/ML student at AKTU.')`,
    [studentId, aktuId, btechId, branchMap['CSE_AIML'], yearMap[3], semesterMap[5]]
  );

  // Teacher Persona: Dr. Priya Ramanujan
  const teacherUser = run(
    `INSERT INTO users (name, email, password_hash, role, avatar_url)
     VALUES (?, ?, ?, 'teacher', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150')`,
    ['Dr. Priya Ramanujan', 'teacher@edumentor.ai', passwordHash]
  );
  const teacherId = teacherUser.lastInsertRowid;

  run(
    `INSERT INTO teacher_profiles (user_id, department, designation, specialization, bio)
     VALUES (?, 'Computer Science & Engineering', 'Associate Professor', 'Database Systems & AI Architecture', 'Ph.D. in Computer Science with 12+ years of university teaching experience.')`,
    [teacherId]
  );

  // Admin Persona: System Administrator
  const adminUser = run(
    `INSERT INTO users (name, email, password_hash, role, avatar_url)
     VALUES (?, ?, ?, 'admin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')`,
    ['System Administrator', 'admin@edumentor.ai', passwordHash]
  );
  const adminId = adminUser.lastInsertRowid;

  // 3. Subjects
  console.log('📚 Seeding Subjects...');
  const subjectsData = [
    // Semester 5 Subjects for CSE & CSE AIML
    {
      category: 'Databases',
      name: 'Database Management Systems',
      code: 'CS302',
      slug: 'database-management-systems',
      description: 'Relational data modeling, SQL optimization, Normalization (1NF to BCNF), Transaction Processing, ACID properties, and B-Tree indexing.',
      icon: 'Database',
      color_accent: 'blue',
      order_index: 1,
      targetSemester: 5,
    },
    {
      category: 'Core Computer Science',
      name: 'Operating Systems',
      code: 'CS301',
      slug: 'operating-systems',
      description: 'Process scheduling, concurrency primitives, thread synchronization, memory management, virtual memory paging, and deadlock mitigation.',
      icon: 'Cpu',
      color_accent: 'emerald',
      order_index: 2,
      targetSemester: 5,
    },
    {
      category: 'Core Computer Science',
      name: 'Computer Networks',
      code: 'CS303',
      slug: 'computer-networks',
      description: 'ISO-OSI and TCP/IP protocol suites, congestion control, packet routing, DNS, TLS/SSL, and modern socket communication.',
      icon: 'Network',
      color_accent: 'cyan',
      order_index: 3,
      targetSemester: 5,
    },
    {
      category: 'AI & Data',
      name: 'Artificial Intelligence & Machine Learning',
      code: 'CS401',
      slug: 'artificial-intelligence-machine-learning',
      description: 'Statistical learning theory, supervised/unsupervised paradigms, neural architectures, loss functions, heuristic search, and Explainable AI (XAI).',
      icon: 'BrainCircuit',
      color_accent: 'rose',
      order_index: 4,
      targetSemester: 5,
    },

    // Other Semesters (to prove strict semester-based filtering)
    {
      category: 'Data Structures & Algorithms',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      slug: 'data-structures-algorithms',
      description: 'Foundational and advanced algorithms, algorithmic complexities, trees, graphs, dynamic programming, and competitive interview patterns.',
      icon: 'Binary',
      color_accent: 'indigo',
      order_index: 5,
      targetSemester: 3,
    },
    {
      category: 'Programming',
      name: 'Modern C++ Programming',
      code: 'CS102',
      slug: 'modern-cpp-programming',
      description: 'Object-oriented patterns, RAII, smart pointers, templates, Standard Template Library (STL), and modern C++20 language features.',
      icon: 'Code',
      color_accent: 'purple',
      order_index: 6,
      targetSemester: 2,
    },
    {
      category: 'Programming',
      name: 'Python for Developers & AI',
      code: 'CS103',
      slug: 'python-for-developers',
      description: 'High-performance idiomatic Python, generators, decorators, multiprocessing, NumPy, and backend API frameworks.',
      icon: 'Terminal',
      color_accent: 'amber',
      order_index: 7,
      targetSemester: 1,
    },
    {
      category: 'Backend Development',
      name: 'Backend Architecture & Node.js',
      code: 'CS305',
      slug: 'backend-architecture-nodejs',
      description: 'RESTful API contracts, asynchronous event loop, microservices, JWT authentication, caching strategies, and API security.',
      icon: 'Server',
      color_accent: 'teal',
      order_index: 8,
      targetSemester: 6,
    },
    {
      category: 'Frontend Development',
      name: 'Frontend Development & React',
      code: 'CS205',
      slug: 'frontend-development-react',
      description: 'Semantic HTML5, responsive CSS grid/flexbox, modern ES6+ JavaScript, React hooks, state management, and rendering optimization.',
      icon: 'Layout',
      color_accent: 'orange',
      order_index: 9,
      targetSemester: 6,
    },
    {
      category: 'Aptitude & Interview',
      name: 'Aptitude & Campus Placement Prep',
      code: 'APT101',
      slug: 'aptitude-placement-prep',
      description: 'Quantitative abilities, logical reasoning, data interpretation, technical interview role-play, and resume formulation.',
      icon: 'GraduationCap',
      color_accent: 'violet',
      order_index: 10,
      targetSemester: 7,
    },
  ];

  const subjectMap: Record<string, number> = {};
  for (const s of subjectsData) {
    const res = run(
      `INSERT INTO subjects (category, name, code, slug, description, icon, color_accent, order_index, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [s.category, s.name, s.code, s.slug, s.description, s.icon, s.color_accent, s.order_index]
    );
    const subId = res.lastInsertRowid;
    subjectMap[s.slug] = subId;

    // Map to curriculum: map to both CSE and CSE_AIML for its target semester
    const targetSemId = semesterMap[s.targetSemester];
    run(
      `INSERT OR IGNORE INTO curriculum_mappings (university_id, degree_id, branch_id, semester_id, subject_id)
       VALUES (?, ?, ?, ?, ?)`,
      [aktuId, btechId, branchMap['CSE_AIML'], targetSemId, subId]
    );
    run(
      `INSERT OR IGNORE INTO curriculum_mappings (university_id, degree_id, branch_id, semester_id, subject_id)
       VALUES (?, ?, ?, ?, ?)`,
      [aktuId, btechId, branchMap['CSE'], targetSemId, subId]
    );
  }

  // 4. Units (Units I through V for each subject)
  console.log('📑 Seeding Units I through V for subjects...');

  interface UnitSpec {
    subjectSlug: string;
    unitNumber: number;
    title: string;
    description: string;
  }

  const unitsData: UnitSpec[] = [
    // DBMS Units
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 1,
      title: 'UNIT I: Introduction to Database Systems & ER Modeling',
      description: 'Database system concepts, architecture, 3-schema architecture, data independence, Entity-Relationship (ER) model, Extended ER constructs, and mapping ER diagrams to relational schemas.',
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 2,
      title: 'UNIT II: Relational Data Model & Relational Algebra',
      description: 'Relational model concepts, relational integrity constraints (entity, referential, domain), relational algebra operators (selection, projection, joins, division), and tuple relational calculus.',
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 3,
      title: 'UNIT III: SQL Queries, Constraints & Views',
      description: 'Data Definition Language (DDL), Data Manipulation Language (DML), complex nested subqueries, aggregate functions, GROUP BY / HAVING, triggers, assertions, and materialized views.',
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      title: 'UNIT IV: Relational Database Design & Normalization',
      description: 'Pitfalls in relational design, functional dependencies, Armstrong axioms, 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), lossless join decomposition, and dependency preservation.',
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 5,
      title: 'UNIT V: Transaction Management, Concurrency Control & Recovery',
      description: 'Transaction processing, ACID properties, serializability, lock-based concurrency control (2PL), deadlock prevention/detection, timestamp ordering, and log-based recovery techniques.',
    },

    // Operating Systems Units
    {
      subjectSlug: 'operating-systems',
      unitNumber: 1,
      title: 'UNIT I: Operating System Architecture & System Calls',
      description: 'OS functions, kernel architectures (monolithic vs microkernel), dual-mode operation, system calls mechanism, and OS services.',
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 2,
      title: 'UNIT II: Process Management & CPU Scheduling',
      description: 'Process Control Block (PCB), process state transitions, context switching, threads, and scheduling algorithms (FCFS, SJF, Round Robin, Multi-level feedback queues).',
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 3,
      title: 'UNIT III: Process Synchronization & Deadlocks',
      description: 'Critical Section problem, Peterson algorithm, semaphores, mutex locks, monitors, classic synchronization problems, deadlock conditions, Bankers algorithm, and detection.',
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 4,
      title: 'UNIT IV: Memory Management & Virtual Memory',
      description: 'Contiguous memory allocation, paging hardware, segmentation, virtual memory demand paging, page replacement algorithms (FIFO, LRU, Optimal), and thrashing.',
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 5,
      title: 'UNIT V: File Systems & Storage Structure',
      description: 'File concept, directory structures, disk allocation methods, free space management, disk scheduling algorithms (SSTF, SCAN, C-SCAN), and RAID levels.',
    },

    // Computer Networks Units
    {
      subjectSlug: 'computer-networks',
      unitNumber: 1,
      title: 'UNIT I: Physical Layer & Reference Models',
      description: 'Data communication components, transmission media, OSI 7-layer model vs TCP/IP 4-layer model, switching techniques, and physical layer transmission impairments.',
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 2,
      title: 'UNIT II: Data Link Layer & Medium Access Control',
      description: 'Framing, error detection (CRC, Parity), error correction (Hamming code), flow control (Stop-and-Wait, Go-Back-N, Selective Repeat), and MAC protocols (CSMA/CD, CSMA/CA).',
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 3,
      title: 'UNIT III: Network Layer & Routing Protocols',
      description: 'IPv4 addressing, subnetting, CIDR, IPv6, routing algorithms (Distance Vector, Link State), OSPF, BGP, ARP, ICMP, and NAT.',
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 4,
      title: 'UNIT IV: Transport Layer & Congestion Control',
      description: 'Transport layer services, UDP, TCP 3-way handshake, TCP connection teardown, TCP flow control sliding window, and TCP congestion control (Slow Start, Congestion Avoidance).',
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 5,
      title: 'UNIT V: Application Layer & Network Security',
      description: 'DNS, HTTP/1.1 vs HTTP/2 vs HTTP/3, SMTP, FTP, cryptography fundamentals, symmetric/asymmetric encryption, SSL/TLS handshake, and firewalls.',
    },

    // AI & Machine Learning Units
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 1,
      title: 'UNIT I: Foundations of AI & State-Space Search',
      description: 'Turing test, rational agents, state space representation, uninformed search (BFS, DFS), informed heuristic search (A* search, Greedy Best-First, Hill Climbing), and game playing.',
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 2,
      title: 'UNIT II: Knowledge Representation & Logic',
      description: 'Propositional logic, First-Order Predicate Logic (FOPL), inference rules, unification, resolution theorem proving, ontologies, and semantic networks.',
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 3,
      title: 'UNIT III: Supervised Machine Learning',
      description: 'Linear regression, logistic regression, decision trees, entropy, information gain, Random Forests, Support Vector Machines (SVM), and cross-validation.',
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 4,
      title: 'UNIT IV: Unsupervised Learning & Clustering',
      description: 'K-Means clustering, hierarchical clustering, DBSCAN, Principal Component Analysis (PCA) for dimensionality reduction, and evaluation metrics (Silhouette score).',
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 5,
      title: 'UNIT V: Deep Learning & Explainable AI (XAI)',
      description: 'Artificial neural networks, backpropagation algorithm, activation functions, convolutional neural networks, Explainable AI principles, SHAP, and LIME interpretability.',
    },
  ];

  const unitMap: Record<string, number> = {}; // key: `${subjectSlug}_${unitNumber}`
  for (const u of unitsData) {
    const sId = subjectMap[u.subjectSlug];
    if (sId) {
      const res = run(
        `INSERT INTO units (subject_id, unit_number, title, description, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [sId, u.unitNumber, u.title, u.description, u.unitNumber]
      );
      unitMap[`${u.subjectSlug}_${u.unitNumber}`] = res.lastInsertRowid;
    }
  }

  // 5. Topics linked to Units
  console.log('📌 Seeding Topics linked to Units...');

  interface TopicSpec {
    subjectSlug: string;
    unitNumber: number;
    name: string;
    slug: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    order: number;
  }

  const topicsData: TopicSpec[] = [
    // DBMS Topics
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 1,
      name: 'ER Modeling & Schema Design',
      slug: 'er-modeling-schema-design',
      description: 'Entity sets, relationship sets, cardinality ratios, participation constraints, and converting ER models into relational schemas.',
      difficulty: 'Beginner',
      order: 1,
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 2,
      name: 'Relational Algebra & Tuple Calculus',
      slug: 'relational-algebra-tuple-calculus',
      description: 'Selection, projection, Cartesian product, theta joins, natural joins, division operator, and tuple calculus equivalence.',
      difficulty: 'Intermediate',
      order: 2,
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 3,
      name: 'Advanced SQL & Subqueries',
      slug: 'advanced-sql-subqueries',
      description: 'Correlated subqueries, window functions, common table expressions (CTEs), and integrity constraint enforcement.',
      difficulty: 'Intermediate',
      order: 3,
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      name: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
      slug: 'database-normalization',
      description: 'Functional dependencies, 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), lossless join decomposition, and dependency preservation.',
      difficulty: 'Intermediate',
      order: 4,
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 5,
      name: 'Transactions, ACID & Concurrency Control',
      slug: 'transactions-acid',
      description: 'ACID guarantees, conflict serializability, view serializability, Two-Phase Locking (2PL), deadlock handling, and WAL logging.',
      difficulty: 'Advanced',
      order: 5,
    },

    // Operating Systems Topics
    {
      subjectSlug: 'operating-systems',
      unitNumber: 1,
      name: 'OS Architecture & System Calls',
      slug: 'os-architecture-system-calls',
      description: 'User mode vs kernel mode, trap instructions, system calls (fork, exec, wait), and microkernel vs monolithic design.',
      difficulty: 'Beginner',
      order: 1,
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 2,
      name: 'CPU Scheduling Algorithms',
      slug: 'process-scheduling',
      description: 'Preemptive vs non-preemptive scheduling, Round Robin, Shortest Remaining Time First (SRTF), Priority Scheduling, and Gantt charts.',
      difficulty: 'Intermediate',
      order: 2,
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 3,
      name: 'Process Synchronization & Deadlocks',
      slug: 'synchronization-deadlocks',
      description: 'Semaphores, Mutex locks, Dining Philosophers problem, Readers-Writers problem, and Bankers algorithm for deadlock avoidance.',
      difficulty: 'Advanced',
      order: 3,
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 4,
      name: 'Virtual Memory & Page Replacement',
      slug: 'virtual-memory-paging',
      description: 'Paging mechanism, Translation Lookaside Buffer (TLB), effective access time, FIFO, LRU, and Belady anomaly.',
      difficulty: 'Intermediate',
      order: 4,
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 5,
      name: 'Disk Scheduling & File Allocation',
      slug: 'disk-scheduling-file-allocation',
      description: 'FCFS, SSTF, SCAN, C-SCAN, C-LOOK disk scheduling, inode structures, and contiguous vs indexed allocation.',
      difficulty: 'Beginner',
      order: 5,
    },

    // Computer Networks Topics
    {
      subjectSlug: 'computer-networks',
      unitNumber: 1,
      name: 'OSI 7-Layer vs TCP/IP Model',
      slug: 'osi-tcp-reference-models',
      description: 'Encapsulation, decapsulation, responsibilities of each layer, and protocol mapping across OSI and Internet models.',
      difficulty: 'Beginner',
      order: 1,
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 2,
      name: 'Error Detection & Sliding Window Protocols',
      slug: 'error-detection-sliding-window',
      description: 'Cyclic Redundancy Check (CRC), 16-bit checksum, Stop-and-Wait ARQ, Go-Back-N, and Selective Repeat protocol efficiency.',
      difficulty: 'Intermediate',
      order: 2,
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 3,
      name: 'IP Addressing, Subnetting & Routing',
      slug: 'ip-addressing-routing',
      description: 'Classless Inter-Domain Routing (CIDR), variable length subnet masks (VLSM), Distance Vector vs Link State routing (Dijkstra).',
      difficulty: 'Intermediate',
      order: 3,
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 4,
      name: 'TCP Flow & Congestion Control',
      slug: 'tcp-ip-flow-control',
      description: 'TCP 3-way handshake, AIMD, Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery, and UDP comparison.',
      difficulty: 'Advanced',
      order: 4,
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 5,
      name: 'DNS, HTTP/3 & Application Protocols',
      slug: 'application-protocols-security',
      description: 'Hierarchical DNS resolution, HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3 QUIC, TLS handshake, and asymmetric RSA/ECC keys.',
      difficulty: 'Intermediate',
      order: 5,
    },

    // AI & Machine Learning Topics
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 1,
      name: 'State-Space & A* Heuristic Search',
      slug: 'heuristic-search-a-star',
      description: 'Problem formulation, 8-puzzle problem, admissible and consistent heuristics, optimality proofs of A* algorithm.',
      difficulty: 'Intermediate',
      order: 1,
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 2,
      name: 'First-Order Logic & Resolution',
      slug: 'first-order-logic-resolution',
      description: 'Converting English to Predicate Calculus, Clausal Form, Skolemization, Most General Unifier (MGU), and Resolution refutation.',
      difficulty: 'Intermediate',
      order: 2,
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 3,
      name: 'Supervised Learning & Decision Trees',
      slug: 'supervised-learning-trees',
      description: 'Information Gain, Gini Impurity, ID3 / C4.5 algorithm, pruning, bias-variance tradeoff, and regularized regression (L1/L2).',
      difficulty: 'Beginner',
      order: 3,
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 4,
      name: 'K-Means Clustering & PCA',
      slug: 'clustering-pca',
      description: 'K-Means Lloyd algorithm, Elbow method, Principal Component Analysis covariance matrix decomposition, and eigenvalue selection.',
      difficulty: 'Intermediate',
      order: 4,
    },
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 5,
      name: 'Deep Neural Networks & Explainable AI',
      slug: 'deep-learning-xai',
      description: 'Multilayer perceptrons, backpropagation chain rule, vanishing gradients, Explainable AI feature attributions (SHAP & LIME).',
      difficulty: 'Advanced',
      order: 5,
    },
  ];

  const topicMap: Record<string, number> = {};
  for (const t of topicsData) {
    const sId = subjectMap[t.subjectSlug];
    const uId = unitMap[`${t.subjectSlug}_${t.unitNumber}`];
    const res = run(
      `INSERT INTO topics (subject_id, unit_id, name, slug, description, difficulty_level, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sId, uId, t.name, t.slug, t.description, t.difficulty, t.order]
    );
    topicMap[t.slug] = res.lastInsertRowid;
  }

  // 6. Rich Academic Notes (`learning_materials`) for Topics
  console.log('📖 Seeding Rich Academic Learning Materials...');

  // Rich notes for Database Normalization
  const normTopicId = topicMap['database-normalization'];
  run(
    `INSERT INTO learning_materials (
      topic_id, learning_objectives, concept_explanation, important_definitions,
      examples_json, diagrams_markdown, exam_points, common_mistakes, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normTopicId,
      `- Master the mathematical definitions of Functional Dependencies (FDs) and Armstrong Axioms.\n- Differentiate between 1NF, 2NF, 3NF, and Boyce-Codd Normal Form (BCNF).\n- Apply lossless join decomposition and dependency preservation tests to relational schemas.\n- Identify and eliminate insertion, update, and deletion anomalies.`,
      `### What is Database Normalization?
Database Normalization is the systematic technique of organizing relational database schemas to minimize data redundancy and prevent data modification anomalies (Insertion, Deletion, and Update anomalies). 

First formulated by Edgar F. Codd in 1970, normalization proceeds through a sequence of formal tests known as **Normal Forms (NF)**. A table is in a higher normal form if and only if it satisfies all the conditions of the preceding lower normal forms plus specific dependency constraints.

#### Functional Dependency (FD) Definition
Given relation schema $R$ and subsets of attributes $X, Y \subseteq R$, a **Functional Dependency** $X \rightarrow Y$ holds on $R$ if and only if for any legal database instance $r(R)$, whenever two tuples $t_1, t_2 \in r$ agree on attribute set $X$, they must also agree on attribute set $Y$:
$$t_1[X] = t_2[X] \implies t_1[Y] = t_2[Y]$$

#### The Normal Forms Hierarchy
1. **First Normal Form (1NF)**: All attributes contain atomic (indivisible) values. No repeating groups or multivalued attributes.
2. **Second Normal Form (2NF)**: Must be in 1NF and have **no partial dependencies** (every non-prime attribute must be fully functionally dependent on every candidate key).
3. **Third Normal Form (3NF)**: Must be in 2NF and have **no transitive dependencies** (for every non-trivial FD $X \rightarrow A$, either $X$ is a Super Key or $A$ is a Prime Attribute).
4. **Boyce-Codd Normal Form (BCNF)**: Must be in 3NF and for **every non-trivial FD $X \rightarrow A$, $X$ must be a Super Key**. BCNF eliminates all redundancy based on functional dependencies.`,
      `**Super Key**: A set of attributes within a table whose values can uniquely identify a tuple.\n\n**Candidate Key**: A minimal super key (a super key from which no attribute can be removed without losing the uniqueness property).\n\n**Prime Attribute**: An attribute that is a member of ANY candidate key.\n\n**Non-Prime Attribute**: An attribute that does not belong to any candidate key.\n\n**Lossless Join Decomposition**: A decomposition of schema $R$ into $R_1, R_2$ is lossless if and only if $R_1 \cap R_2 \rightarrow R_1$ or $R_1 \cap R_2 \rightarrow R_2$.`,
      JSON.stringify([
        {
          title: '3NF vs BCNF Comparison Example',
          code_or_text: `Relation: R(Student, Subject, Teacher)\nDependencies:\n1. (Student, Subject) -> Teacher\n2. Teacher -> Subject\n\nCandidate Keys: (Student, Subject) and (Student, Teacher)\nPrime Attributes: {Student, Subject, Teacher}\nNon-Prime Attributes: {}\n\nAnalysis for 3NF:\nFor FD (Student, Subject) -> Teacher: LHS is a Super Key -> Valid in 3NF.\nFor FD Teacher -> Subject: LHS is not a Super Key, BUT RHS (Subject) is a Prime Attribute -> Valid in 3NF!\n\nAnalysis for BCNF:\nTeacher -> Subject violates BCNF because Teacher is NOT a Super Key!\nDecomposition for BCNF: R1(Teacher, Subject) and R2(Teacher, Student).`,
          explanation: 'This classical problem shows that R is in 3NF but not in BCNF. Decomposing into BCNF loses the original functional dependency (Student, Subject) -> Teacher, demonstrating the fundamental trade-off between BCNF and dependency preservation.',
        },
      ]),
      `\`\`\`text
+-------------------------------------------------------+
|                 Normalization Hierarchy               |
|                                                       |
|  +-------------------------------------------------+  |
|  | BCNF: For all X -> A, X is a Super Key          |  |
|  |                                                 |  |
|  |  +-------------------------------------------+  |  |
|  |  | 3NF: X is Super Key OR A is Prime Attr    |  |  |
|  |  |                                           |  |  |
|  |  |  +-------------------------------------+  |  |  |
|  |  |  | 2NF: No partial dependency on keys  |  |  |  |
|  |  |  |                                     |  |  |  |
|  |  |  |  +-------------------------------+  |  |  |  |
|  |  |  |  | 1NF: Atomic attribute values  |  |  |  |  |
|  |  |  |  +-------------------------------+  |  |  |  |
|  |  |  +-------------------------------------+  |  |  |
|  |  +-------------------------------------------+  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
\`\`\``,
      `1. **University Exam Question Weight**: Normalization accounts for 15-20 marks in Section B & C in AKTU/Autonomous exams.\n2. **Decomposition Check**: Always explicitly show the intersection $R_1 \cap R_2$ and test if it determines $R_1$ or $R_2$ to prove lossless join.\n3. **Transitive Dependency Trick**: In 3NF, remember the second clause: $A$ is a prime attribute! Students often forget that an RHS prime attribute saves the FD from violating 3NF.`,
      `1. **Assuming all single-attribute candidate keys have partial dependencies**: A relation with a single-attribute candidate key is ALWAYS automatically in 2NF.\n2. **Confusing Super Key with Candidate Key**: A candidate key has zero redundant attributes. Super keys can have extraneous attributes.\n3. **Decomposing without checking dependency preservation**: BCNF does NOT guarantee dependency preservation; 3NF does!`,
      `Database Normalization eliminates modification anomalies through rigorous functional dependency analysis. Always compute attribute closures $(X)^+$ to find candidate keys, inspect LHS/RHS of all non-trivial FDs against normal form definitions, and evaluate lossless decomposition using intersection closure.`
    ]
  );

  // Rich notes for OS CPU Scheduling
  const schedTopicId = topicMap['process-scheduling'];
  run(
    `INSERT INTO learning_materials (
      topic_id, learning_objectives, concept_explanation, important_definitions,
      examples_json, diagrams_markdown, exam_points, common_mistakes, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      schedTopicId,
      `- Understand CPU burst and I/O burst cycles.\n- Calculate Turnaround Time, Waiting Time, and Response Time using Gantt charts.\n- Evaluate FCFS, SJF (Preemptive/SRTF), Priority, and Round Robin scheduling.\n- Analyze convoy effect and starvation mitigations.`,
      `### CPU Scheduling in Modern Operating Systems
CPU scheduling is the basis of multi-programmed operating systems. By switching the CPU among processes, the operating system makes the computer more productive.

#### Scheduling Metrics
- **Turnaround Time ($TAT$)**: $\\text{Completion Time} - \\text{Arrival Time}$
- **Waiting Time ($WT$)**: $\\text{Turnaround Time} - \\text{Burst Time}$
- **Response Time ($RT$)**: Time from process arrival until its first CPU allocation.
- **Throughput**: Number of processes completed per unit time.

#### Preemptive vs Non-Preemptive
- **Non-Preemptive**: Once the CPU has been allocated to a process, the process keeps the CPU until it releases it, either by terminating or switching to waiting state.
- **Preemptive**: The operating system can interrupt a running process and assign the CPU to a higher priority process (e.g. Round Robin, SRTF).`,
      `**Context Switch**: Saving the state of the old process and loading the saved state for the new process.\n\n**Convoy Effect**: Short processes waiting for one big CPU-bound process to release the CPU in FCFS scheduling.\n\n**Starvation**: Indefinite waiting of lower priority processes caused by a steady stream of higher priority processes.\n\n**Aging**: A technique of gradually increasing the priority of processes that wait in the system for a long time.`,
      JSON.stringify([
        {
          title: 'Round Robin Calculation (Quantum = 2ms)',
          code_or_text: `Processes:\nP1: Arrival=0, Burst=5\nP2: Arrival=1, Burst=3\nP3: Arrival=2, Burst=1\n\nGantt Chart:\n[0--2 P1] -> [2--4 P2] -> [4--5 P3] -> [5--7 P1] -> [7--8 P2] -> [8--9 P1]\n\nCompletion Times: P1=9, P2=8, P3=5\nTurnaround Times: P1=9-0=9, P2=8-1=7, P3=5-2=3\nAverage TAT = (9 + 7 + 3) / 3 = 6.33 ms\nWaiting Times: P1=9-5=4, P2=7-3=4, P3=3-1=2\nAverage WT = (4 + 4 + 2) / 3 = 3.33 ms`,
          explanation: 'Round Robin provides bounded response time and prevents starvation. The choice of time quantum is critical: too large reverts to FCFS, too small increases context switch overhead.',
        },
      ]),
      `\`\`\`text
Gantt Chart Timeline:
|  P1  |  P2  |  P3  |  P1  |  P2  |  P1  |
0      2      4      5      7      8      9
\`\`\``,
      `1. **Section C Favorite**: Gantt chart numerical problem (10 marks) on SJF vs Round Robin appears every semester.\n2. **Formula Double Check**: Always verify $WT = TAT - BT$. If $WT < 0$, your calculation has an error.`,
      `1. Forgetting arrival time differences when building the ready queue.\n2. In SRTF, not recalculating remaining burst time when a new process arrives.`,
      `CPU scheduling balances throughput, latency, and fairness. Round Robin and SRTF provide optimal response and waiting times respectively.`
    ]
  );

  // 7. Questions (Question Bank with Unit mapping, PYQs, University, and Year)
  console.log('❓ Seeding Questions Bank & Assessment Questions...');

  interface QSpec {
    subjectSlug: string;
    unitNumber: number;
    topicSlug: string;
    questionText: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questionType: 'mcq' | 'pyq';
    university?: string;
    examYear?: number;
    marks: number;
    explanation: string;
    options: { text: string; isCorrect: boolean }[];
  }

  const questionsData: QSpec[] = [
    // DBMS Unit IV Normalization Questions
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      questionText: 'A relation R with schema (A, B, C, D) has the following functional dependencies: {AB -> C, C -> D, D -> A}. What are all the candidate keys of R?',
      difficulty: 'Medium',
      questionType: 'pyq',
      university: 'AKTU',
      examYear: 2023,
      marks: 5,
      explanation: 'Computing closures: (AB)+ = {A,B,C,D} -> AB is a candidate key. Since D -> A, replacing A with D gives (BD)+ = {B,D,A,C} -> BD is a candidate key. Since C -> D, replacing D with C gives (BC)+ = {B,C,D,A} -> BC is a candidate key. Therefore, the candidate keys are AB, BC, and BD.',
      options: [
        { text: 'AB only', isCorrect: false },
        { text: 'AB, BC, and BD', isCorrect: true },
        { text: 'AB and CD', isCorrect: false },
        { text: 'AB, AC, and AD', isCorrect: false },
      ],
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      questionText: 'Which normal form is strictly based on the concept of "full functional dependency" and prohibits partial dependencies on any candidate key?',
      difficulty: 'Easy',
      questionType: 'mcq',
      university: 'AKTU',
      examYear: 2022,
      marks: 2,
      explanation: 'Second Normal Form (2NF) requires that the relation is in 1NF and no non-prime attribute is partially dependent on any candidate key.',
      options: [
        { text: 'First Normal Form (1NF)', isCorrect: false },
        { text: 'Second Normal Form (2NF)', isCorrect: true },
        { text: 'Third Normal Form (3NF)', isCorrect: false },
        { text: 'Boyce-Codd Normal Form (BCNF)', isCorrect: false },
      ],
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      questionText: 'A relation R(A, B, C, D) has functional dependencies F = {A -> B, B -> C, C -> D, D -> A}. In which highest normal form is relation R?',
      difficulty: 'Medium',
      questionType: 'pyq',
      university: 'Autonomous',
      examYear: 2024,
      marks: 5,
      explanation: 'Since A -> B -> C -> D -> A forms a full cycle, every single attribute (A), (B), (C), and (D) is a candidate key. In every FD X -> Y, the left hand side X is a candidate key (and hence a Super Key). Thus, R is in Boyce-Codd Normal Form (BCNF).',
      options: [
        { text: '1NF', isCorrect: false },
        { text: '2NF', isCorrect: false },
        { text: '3NF', isCorrect: false },
        { text: 'BCNF', isCorrect: true },
      ],
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      questionText: 'What is the fundamental condition for a decomposition of schema R into R1 and R2 to be a Lossless Join Decomposition?',
      difficulty: 'Medium',
      questionType: 'mcq',
      university: 'AKTU',
      examYear: 2021,
      marks: 3,
      explanation: 'By Codd and Ullman theorem, a decomposition is lossless if and only if the common attribute set (R1 ∩ R2) forms a super key of either R1 or R2, i.e., (R1 ∩ R2) -> R1 or (R1 ∩ R2) -> R2.',
      options: [
        { text: 'R1 ∩ R2 must be empty (disjoint schemas)', isCorrect: false },
        { text: '(R1 ∩ R2) -> R1 or (R1 ∩ R2) -> R2', isCorrect: true },
        { text: 'R1 ∪ R2 must equal the primary key', isCorrect: false },
        { text: 'Both R1 and R2 must be in BCNF', isCorrect: false },
      ],
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      questionText: 'Under what condition does 3NF preserve functional dependencies while BCNF might fail to preserve them?',
      difficulty: 'Hard',
      questionType: 'pyq',
      university: 'AKTU',
      examYear: 2023,
      marks: 5,
      explanation: 'In 3NF, the rule allows an FD X -> A where X is not a super key IF A is a prime attribute. In BCNF, X must strictly be a super key. When decomposing to enforce BCNF, dependencies where the LHS is not a super key but the RHS is prime can be split across tables and lost.',
      options: [
        { text: 'When the relation has no composite keys', isCorrect: false },
        { text: 'When candidate keys overlap and non-trivial FDs have prime attributes on the RHS', isCorrect: true },
        { text: 'When multi-valued dependencies exist', isCorrect: false },
        { text: 'When the relation is already in 2NF', isCorrect: false },
      ],
    },

    // DBMS Unit V Transactions & ACID Questions
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 5,
      topicSlug: 'transactions-acid',
      questionText: 'Which property of ACID transactions guarantees that concurrent execution of transactions results in a system state equivalent to some serial execution order?',
      difficulty: 'Easy',
      questionType: 'mcq',
      university: 'AKTU',
      examYear: 2023,
      marks: 2,
      explanation: 'Isolation ensures that concurrent transactions execute without interfering with one another, guaranteeing serializability.',
      options: [
        { text: 'Atomicity', isCorrect: false },
        { text: 'Consistency', isCorrect: false },
        { text: 'Isolation', isCorrect: true },
        { text: 'Durability', isCorrect: false },
      ],
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 5,
      topicSlug: 'transactions-acid',
      questionText: 'In Strict Two-Phase Locking (Strict 2PL), when are exclusive locks held by a transaction released?',
      difficulty: 'Medium',
      questionType: 'pyq',
      university: 'Autonomous',
      examYear: 2024,
      marks: 5,
      explanation: 'Strict 2PL requires that all exclusive (write) locks held by a transaction be held until the transaction commits or aborts, preventing cascading rollbacks.',
      options: [
        { text: 'Immediately after the write operation completes', isCorrect: false },
        { text: 'At the start of the shrinking phase', isCorrect: false },
        { text: 'Only after the transaction terminates (commit or abort)', isCorrect: true },
        { text: 'Whenever another transaction requests a shared lock', isCorrect: false },
      ],
    },

    // OS Unit II Process & CPU Scheduling Questions
    {
      subjectSlug: 'operating-systems',
      unitNumber: 2,
      topicSlug: 'process-scheduling',
      questionText: 'Consider 3 processes P1, P2, P3 with burst times 10, 4, 2 arriving at time 0. If Shortest Job First (SJF Non-preemptive) scheduling is used, what is the average waiting time?',
      difficulty: 'Medium',
      questionType: 'pyq',
      university: 'AKTU',
      examYear: 2023,
      marks: 5,
      explanation: 'Execution order: P3 (0 to 2), P2 (2 to 6), P1 (6 to 16). Waiting times: P3 = 0, P2 = 2, P1 = 6. Average WT = (0 + 2 + 6) / 3 = 8 / 3 = 2.67 ms.',
      options: [
        { text: '2.67 ms', isCorrect: true },
        { text: '4.33 ms', isCorrect: false },
        { text: '5.33 ms', isCorrect: false },
        { text: '8.00 ms', isCorrect: false },
      ],
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 2,
      topicSlug: 'process-scheduling',
      questionText: 'What is the phenomenon called when CPU-bound long processes cause I/O-bound short processes to wait indefinitely in FCFS scheduling?',
      difficulty: 'Easy',
      questionType: 'mcq',
      marks: 2,
      explanation: 'The Convoy Effect occurs in FCFS when smaller processes queue behind a long CPU-intensive process.',
      options: [
        { text: 'Thrashing', isCorrect: false },
        { text: 'Convoy Effect', isCorrect: true },
        { text: 'Belady Anomaly', isCorrect: false },
        { text: 'Starvation', isCorrect: false },
      ],
    },

    // OS Unit III Synchronization & Deadlocks Questions
    {
      subjectSlug: 'operating-systems',
      unitNumber: 3,
      topicSlug: 'synchronization-deadlocks',
      questionText: 'Which of the following conditions is NOT one of Coffman four necessary conditions for deadlock occurrence?',
      difficulty: 'Easy',
      questionType: 'mcq',
      university: 'AKTU',
      examYear: 2022,
      marks: 2,
      explanation: 'The four Coffman conditions are: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. Preemption breaks deadlocks; "No Preemption" is required for deadlocks to occur.',
      options: [
        { text: 'Mutual Exclusion', isCorrect: false },
        { text: 'Hold and Wait', isCorrect: false },
        { text: 'Preemptive Resource Allocation', isCorrect: true },
        { text: 'Circular Wait', isCorrect: false },
      ],
    },

    // Computer Networks Unit IV TCP & Congestion Control Questions
    {
      subjectSlug: 'computer-networks',
      unitNumber: 4,
      topicSlug: 'tcp-ip-flow-control',
      questionText: 'During TCP Congestion Control, what action does the sender take upon receiving 3 duplicate ACKs (Triple Duplicate ACK)?',
      difficulty: 'Medium',
      questionType: 'pyq',
      university: 'AKTU',
      examYear: 2024,
      marks: 5,
      explanation: 'Receiving 3 duplicate ACKs triggers Fast Retransmit (retransmitting the lost segment without waiting for RTO timer) and enters Fast Recovery, setting cwnd to ssthresh + 3*MSS.',
      options: [
        { text: 'Resets cwnd to 1 MSS and restarts Slow Start', isCorrect: false },
        { text: 'Performs Fast Retransmit and enters Fast Recovery', isCorrect: true },
        { text: 'Doubles the receiver advertised window', isCorrect: false },
        { text: 'Terminates the TCP connection with a RST segment', isCorrect: false },
      ],
    },

    // AI & Machine Learning Unit I Heuristic Search Questions
    {
      subjectSlug: 'artificial-intelligence-machine-learning',
      unitNumber: 1,
      topicSlug: 'heuristic-search-a-star',
      questionText: 'In the A* Search algorithm, what condition must the heuristic function h(n) satisfy to guarantee finding an optimal solution in tree search?',
      difficulty: 'Medium',
      questionType: 'pyq',
      university: 'AKTU',
      examYear: 2023,
      marks: 5,
      explanation: 'For tree search, h(n) must be Admissible, meaning it never overestimates the actual cost from node n to the nearest goal state (h(n) <= h*(n)). For graph search, Consistency is required.',
      options: [
        { text: 'h(n) must always be zero', isCorrect: false },
        { text: 'h(n) must be Admissible (never overestimate)', isCorrect: true },
        { text: 'h(n) must be strictly monotonic decreasing', isCorrect: false },
        { text: 'h(n) must equal the path cost g(n)', isCorrect: false },
      ],
    },
  ];

  const questionIdMap: number[] = [];
  const dbmsUnit4QIds: number[] = [];
  const dbmsAllQIds: number[] = [];

  for (const q of questionsData) {
    const sId = subjectMap[q.subjectSlug];
    const uId = unitMap[`${q.subjectSlug}_${q.unitNumber}`];
    const tId = topicMap[q.topicSlug];

    const res = run(
      `INSERT INTO questions (
        subject_id, unit_id, topic_id, question_text, difficulty, question_type,
        university, exam_year, marks, explanation, points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sId, uId, tId, q.questionText, q.difficulty, q.questionType,
        q.university || 'AKTU', q.examYear || 2023, q.marks, q.explanation, q.marks * 2
      ]
    );
    const qId = res.lastInsertRowid;
    questionIdMap.push(qId);

    if (q.subjectSlug === 'database-management-systems') {
      dbmsAllQIds.push(qId);
      if (q.unitNumber === 4) {
        dbmsUnit4QIds.push(qId);
      }
    }

    for (const opt of q.options) {
      run(
        `INSERT INTO question_options (question_id, option_text, is_correct)
         VALUES (?, ?, ?)`,
        [qId, opt.text, opt.isCorrect ? 1 : 0]
      );
    }
  }

  // 8. Multi-Tier Assessments
  console.log('🧪 Seeding Unified Multi-Tier Assessments (Diagnostic, Unit, Subject, Mock, Quizzes)...');

  const dbmsSubId = subjectMap['database-management-systems'];
  const dbmsUnit4Id = unitMap['database-management-systems_4'];

  // Diagnostic Test for DBMS
  const diagTestRes = run(
    `INSERT INTO assessments (
      subject_id, unit_id, topic_id, test_type, title, description,
      time_limit_minutes, passing_score, total_questions, difficulty, created_by
    ) VALUES (?, NULL, NULL, 'diagnostic_test', 'DBMS Diagnostic Baseline Assessment', 'Initial diagnostic evaluation to measure your baseline mastery of Database Management Systems before starting the semester.', 25, 50.0, 5, 'Medium', ?)`,
    [dbmsSubId, teacherId]
  );
  const diagTestId = diagTestRes.lastInsertRowid;
  for (let i = 0; i < Math.min(5, dbmsAllQIds.length); i++) {
    run(`INSERT INTO assessment_questions (assessment_id, question_id, order_index) VALUES (?, ?, ?)`, [diagTestId, dbmsAllQIds[i], i + 1]);
  }

  // Topic Quiz for Database Normalization
  const topicQuizRes = run(
    `INSERT INTO assessments (
      subject_id, unit_id, topic_id, test_type, title, description,
      time_limit_minutes, passing_score, total_questions, difficulty, created_by
    ) VALUES (?, ?, ?, 'topic_quiz', 'Database Normalization Concept Quiz', 'Targeted practice on functional dependencies, 1NF, 2NF, 3NF, and BCNF decomposition rules.', 15, 60.0, 5, 'Medium', ?)`,
    [dbmsSubId, dbmsUnit4Id, normTopicId, teacherId]
  );
  const topicQuizId = topicQuizRes.lastInsertRowid;
  for (let i = 0; i < dbmsUnit4QIds.length; i++) {
    run(`INSERT INTO assessment_questions (assessment_id, question_id, order_index) VALUES (?, ?, ?)`, [topicQuizId, dbmsUnit4QIds[i], i + 1]);
  }

  // Unit Test for Unit IV Normalization
  const unitTestRes = run(
    `INSERT INTO assessments (
      subject_id, unit_id, topic_id, test_type, title, description,
      time_limit_minutes, passing_score, total_questions, difficulty, created_by
    ) VALUES (?, ?, NULL, 'unit_test', 'UNIT IV Test: Relational Database Design & Normalization', 'Comprehensive academic evaluation covering all topics in UNIT IV: Functional Dependencies, Multivalued Dependencies, and Normal Forms.', 30, 60.0, 5, 'Medium', ?)`,
    [dbmsSubId, dbmsUnit4Id, teacherId]
  );
  const unitTestId = unitTestRes.lastInsertRowid;
  for (let i = 0; i < dbmsUnit4QIds.length; i++) {
    run(`INSERT INTO assessment_questions (assessment_id, question_id, order_index) VALUES (?, ?, ?)`, [unitTestId, dbmsUnit4QIds[i], i + 1]);
  }

  // Full Subject Test for DBMS
  const subjectTestRes = run(
    `INSERT INTO assessments (
      subject_id, unit_id, topic_id, test_type, title, description,
      time_limit_minutes, passing_score, total_questions, difficulty, created_by
    ) VALUES (?, NULL, NULL, 'subject_test', 'Comprehensive DBMS End-Semester Examination', 'Full syllabus mock test covering Units I through V formatted per AKTU university examination pattern.', 45, 60.0, 7, 'Hard', ?)`,
    [dbmsSubId, teacherId]
  );
  const subjectTestId = subjectTestRes.lastInsertRowid;
  for (let i = 0; i < dbmsAllQIds.length; i++) {
    run(`INSERT INTO assessment_questions (assessment_id, question_id, order_index) VALUES (?, ?, ?)`, [subjectTestId, dbmsAllQIds[i], i + 1]);
  }

  // Combined Mock Test for Semester 5
  const mockTestRes = run(
    `INSERT INTO assessments (
      subject_id, unit_id, topic_id, test_type, title, description,
      time_limit_minutes, passing_score, total_questions, difficulty, created_by
    ) VALUES (?, NULL, NULL, 'mock_test', 'B.Tech Semester 5 Combined Mock Exam', 'Simulated multi-subject university exam testing DBMS, OS, Networks, and AI core competencies.', 60, 65.0, 10, 'Hard', ?)`,
    [dbmsSubId, teacherId]
  );
  const mockTestId = mockTestRes.lastInsertRowid;
  for (let i = 0; i < questionIdMap.length; i++) {
    run(`INSERT INTO assessment_questions (assessment_id, question_id, order_index) VALUES (?, ?, ?)`, [mockTestId, questionIdMap[i], i + 1]);
  }

  // 9. Previous Year Questions (`pyq_records`)
  console.log('🏛️ Seeding University Previous Year Questions (PYQs)...');

  const pyqData = [
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      university: 'AKTU',
      year: 2024,
      season: 'May/June',
      question: 'Explain Boyce-Codd Normal Form (BCNF) with a suitable example. How does it differ from Third Normal Form (3NF)? When does BCNF decomposition fail to preserve dependencies?',
      marks: 10,
      solution: `### Detailed Solution (AKTU 2024):
1. **Definition of BCNF**: A relation schema $R$ is in BCNF with respect to a set of functional dependencies $F$ if, for all functional dependencies in $F^+$ of the form $X \\rightarrow Y$, where $X \\subseteq R$ and $Y \\subseteq R$, at least one of the following holds:
   - $X \\rightarrow Y$ is trivial (i.e., $Y \\subseteq X$)
   - $X$ is a superkey for $R$.

2. **Difference from 3NF**:
   - In 3NF, the condition allows $X \\rightarrow Y$ even if $X$ is not a superkey, PROVIDED that each attribute in $Y$ is a prime attribute (part of some candidate key).
   - In BCNF, this relaxed condition for prime attributes is disallowed. Thus, BCNF is strictly stronger than 3NF.

3. **Dependency Preservation Trade-off**:
   - In relation $R(A, B, C)$ with $F = \\{AB \\rightarrow C, C \\rightarrow B\\}$, candidate keys are $AB$ and $AC$.
   - $C \\rightarrow B$ satisfies 3NF because $B$ is prime, but violates BCNF because $C$ is not a super key.
   - Decomposing into BCNF yields $R_1(C, B)$ and $R_2(C, A)$, which loses the original dependency $AB \\rightarrow C$.`,
      difficulty: 'Hard' as const,
    },
    {
      subjectSlug: 'database-management-systems',
      unitNumber: 4,
      topicSlug: 'database-normalization',
      university: 'Autonomous',
      year: 2023,
      season: 'Dec/Jan',
      question: 'Given relation schema R(A, B, C, D, E) and set of FDs: F = {A -> BC, CD -> E, B -> D, E -> A}. Find all candidate keys of R and determine its highest normal form.',
      marks: 7,
      solution: `### Step-by-Step Solution:
1. **Compute Attribute Closures**:
   - $(A)^+ = \\{A, B, C, D, E\\} \\implies A$ is a candidate key.
   - Since $E \\rightarrow A$, $(E)^+ = \\{E, A, B, C, D\\} \\implies E$ is a candidate key.
   - Since $CD \\rightarrow E$, $(CD)^+ = \\{C, D, E, A, B\\} \\implies CD$ is a candidate key.
   - Since $B \\rightarrow D$, $(BC)^+ = \\{B, C, D, E, A\\} \\implies BC$ is a candidate key.
   - **Candidate Keys**: $\\{A, E, CD, BC\\}$.

2. **Prime and Non-Prime Attributes**:
   - Prime Attributes: $\\{A, B, C, D, E\\}$.
   - Non-Prime Attributes: $\\emptyset$ (empty set!).

3. **Normal Form Check**:
   - Since there are no non-prime attributes, partial dependency cannot exist $\\implies$ 2NF holds.
   - Transitive dependency to non-prime cannot exist $\\implies$ 3NF holds.
   - For $B \\rightarrow D$: $B$ is NOT a superkey. Therefore, BCNF is violated.
   - **Highest Normal Form: 3NF.**`,
      difficulty: 'Medium' as const,
    },
    {
      subjectSlug: 'operating-systems',
      unitNumber: 2,
      topicSlug: 'process-scheduling',
      university: 'AKTU',
      year: 2023,
      season: 'May/June',
      question: 'Compare Round Robin and Shortest Remaining Time First (SRTF) CPU scheduling algorithms. Draw the Gantt chart and calculate Average Waiting Time for 4 processes.',
      marks: 10,
      solution: `### Comparative Analysis & Solution:
1. **SRTF**: Optimal average waiting time, but suffers from starvation of long processes and requires prior knowledge of next CPU burst.
2. **Round Robin**: Fair, interactive, starvation-free with bounded response time, but performance is strictly dependent on quantum length.
3. Gantt chart analysis shows SRTF minimizes waiting time at the expense of higher preemption frequency.`,
      difficulty: 'Medium' as const,
    },
    {
      subjectSlug: 'computer-networks',
      unitNumber: 4,
      topicSlug: 'tcp-ip-flow-control',
      university: 'AKTU',
      year: 2024,
      season: 'May/June',
      question: 'Describe TCP Congestion Control mechanisms: Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery with a neat diagram.',
      marks: 10,
      solution: `### Detailed Technical Solution:
- **Slow Start**: Exponential increase of cwnd ($+1$ MSS per ACK) until ssthresh is reached.
- **Congestion Avoidance**: Additive increase ($+1$ MSS per RTT) to probe bandwidth conservatively.
- **Fast Retransmit**: Detects loss via 3 duplicate ACKs before timeout expires.
- **Fast Recovery**: Sets $ssthresh = cwnd / 2$ and skips slow start.`,
      difficulty: 'Hard' as const,
    },
  ];

  for (const pyq of pyqData) {
    const sId = subjectMap[pyq.subjectSlug];
    const uId = unitMap[`${pyq.subjectSlug}_${pyq.unitNumber}`];
    const tId = topicMap[pyq.topicSlug];
    run(
      `INSERT INTO pyq_records (
        subject_id, unit_id, topic_id, university, year, exam_season,
        question_text, marks, solution_notes, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sId, uId, tId, pyq.university, pyq.year, pyq.season, pyq.question, pyq.marks, pyq.solution, pyq.difficulty]
    );
  }

  // 10. Student Initial Performance, Attempts & Explainable AI Recommendation
  console.log('📊 Seeding Student Performance Rollups & Explainable AI Engine State...');

  // Student Aarav took the Unit IV Quiz on Database Normalization 2 days ago and scored 48.0% (Needs Improvement)
  const normAttempt = run(
    `INSERT INTO assessment_attempts (
      user_id, assessment_id, test_type, score, max_score, percentage, passed, time_taken_seconds, attempted_at
    ) VALUES (?, ?, 'topic_quiz', 24.0, 50.0, 48.0, 0, 520, datetime('now', '-2 days'))`,
    [studentId, topicQuizId]
  );
  const normAttemptId = normAttempt.lastInsertRowid;

  // Answers for attempt
  for (let i = 0; i < dbmsUnit4QIds.length; i++) {
    const isCorrect = i < 2 ? 1 : 0; // 2 out of 5 correct
    run(
      `INSERT INTO assessment_answers (attempt_id, question_id, is_correct, time_spent_seconds)
       VALUES (?, ?, ?, 60)`,
      [normAttemptId, dbmsUnit4QIds[i], isCorrect]
    );
  }

  // Topic Performance: Normalization -> 48.0% (needs_improvement)
  run(
    `INSERT INTO topic_performance (
      user_id, topic_id, unit_id, quizzes_attempted, total_questions, correct_answers, average_score, mastery_level, last_updated_at
    ) VALUES (?, ?, ?, 1, 5, 2, 48.0, 'needs_improvement', datetime('now', '-2 days'))`,
    [studentId, normTopicId, dbmsUnit4Id]
  );

  // Unit Performance: DBMS Unit IV -> average 48.0% (needs_improvement)
  run(
    `INSERT INTO unit_performance (
      user_id, unit_id, subject_id, tests_attempted, average_score, completed_topics_count, total_topics_count, mastery_level, last_updated_at
    ) VALUES (?, ?, ?, 1, 48.0, 0, 1, 'needs_improvement', datetime('now', '-2 days'))`,
    [studentId, dbmsUnit4Id, dbmsSubId]
  );

  // Other units for DBMS
  for (let u = 1; u <= 5; u++) {
    if (u !== 4) {
      const uId = unitMap[`database-management-systems_${u}`];
      if (uId) {
        run(
          `INSERT INTO unit_performance (
            user_id, unit_id, subject_id, tests_attempted, average_score, completed_topics_count, total_topics_count, mastery_level, last_updated_at
          ) VALUES (?, ?, ?, 0, 0.0, 0, 1, 'needs_improvement', datetime('now'))`,
          [studentId, uId, dbmsSubId]
        );
      }
    }
  }

  // Subject Performance for DBMS
  run(
    `INSERT INTO subject_performance (
      user_id, subject_id, tests_attempted, average_score, diagnostic_completed, diagnostic_score, progress_percentage, last_updated_at
    ) VALUES (?, ?, 1, 48.0, 0, 0.0, 20.0, datetime('now', '-2 days'))`,
    [studentId, dbmsSubId]
  );

  // Active Explainable AI Recommendation with Transparent Pedagogical Attribution
  run(
    `INSERT INTO recommendations (
      user_id, topic_id, unit_id, reason_title, explanation_markdown,
      triggering_test_id, current_score, target_score, score_delta, priority, status
    ) VALUES (?, ?, ?, ?, ?, ?, 48.0, 75.0, -27.0, 'high', 'active')`,
    [
      studentId,
      normTopicId,
      dbmsUnit4Id,
      'Targeted Revision: BCNF vs 3NF Decomposition in Database Normalization',
      `### ⚠️ Transparent Explainable AI Diagnostic & Pedagogical Attribution

**Attribution Analysis:**
- **Why this was recommended:** Your Unit IV performance on *"Database Normalization"* is **48.0%**, which is **27.0% below** your target benchmark of **75.0%**.
- **Triggering Assessment:** *"Database Normalization Concept Quiz"* (Attempted 2 days ago).
- **Identified Weakness:** System detected incorrect answers specifically on questions distinguishing 3NF prime attribute allowance from strict BCNF superkey enforcement.

**Recommended Action:**
1. Review the textbook notes in **UNIT IV: Relational Database Design**.
2. Solve the 2 university previous year questions (AKTU 2024 & Autonomous 2023).
3. Take the targeted **Re-Test** to verify your score improvement and update your dashboard trajectory!`,
      topicQuizId,
    ]
  );

  // Notification for student
  run(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES (?, 'Personalized AI Recommendation Generated', 'Your score of 48.0% in DBMS Unit IV triggered an adaptive recommendation.', 'recommendation', '/recommendations')`,
    [studentId]
  );

  // 11. Curated Resources
  const resourcesData = [
    {
      subjectSlug: 'database-management-systems',
      topicSlug: 'database-normalization',
      title: 'Complete Guide to Functional Dependencies & Normal Forms (1NF to BCNF)',
      type: 'Notes' as const,
      url: 'https://gateoverflow.in/database-normalization-guide',
      description: 'Comprehensive academic notes explaining closures, canonical cover, and testing for lossless decomposition.',
      difficulty: 'Intermediate' as const,
    },
    {
      subjectSlug: 'database-management-systems',
      topicSlug: 'database-normalization',
      title: 'Stanford University Database Normalization Lecture Series',
      type: 'Video' as const,
      url: 'https://youtube.com/watch?v=stanford-dbms-norm',
      description: 'Prof. Jennifer Widom explains functional dependencies and Boyce-Codd normal forms with step-by-step proofs.',
      difficulty: 'Beginner' as const,
    },
    {
      subjectSlug: 'operating-systems',
      topicSlug: 'process-scheduling',
      title: 'Operating Systems CPU Scheduling: Concepts & Solved GATE Problems',
      type: 'Notes' as const,
      url: 'https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/',
      description: 'Gantt chart calculations for turnaround time, waiting time, and priority inversions.',
      difficulty: 'Beginner' as const,
    },
  ];

  for (const r of resourcesData) {
    const sId = subjectMap[r.subjectSlug];
    const tId = topicMap[r.topicSlug];
    run(
      `INSERT INTO resources (subject_id, topic_id, title, type, url, description, difficulty, is_external)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [sId, tId, r.title, r.type, r.url, r.description, r.difficulty]
    );
  }

  // 12. DSA Problems (Retain DSA arena features)
  const dsaProblemsData = [
    {
      topicSlug: 'er-modeling-schema-design', // linked to first topic or fallback
      title: 'Two Sum II - Input Array Is Sorted',
      slug: 'two-sum-ii-sorted',
      difficulty: 'Easy' as const,
      problemStatement: `Given a **1-indexed** array of integers \`numbers\` that is already **sorted in non-decreasing order**, find two numbers such that they add up to a specific \`target\` number.\n\nReturn the indices of the two numbers, \`index1\` and \`index2\`, added by one as an integer array \`[index1, index2]\` of length 2.\n\nThe tests are generated such that there is **exactly one solution**. You **may not** use the same element twice. Your solution must use only $O(1)$ additional space.`,
      inputFormat: 'numbers = [2,7,11,15], target = 9',
      outputFormat: '[1,2]',
      constraints: '2 <= numbers.length <= 3 * 10^4\n-1000 <= numbers[i] <= 1000\nnumbers is sorted in non-decreasing order\n-1000 <= target <= 1000',
      sampleCases: JSON.stringify([
        {
          input: 'numbers = [2,7,11,15], target = 9',
          output: '[1,2]',
          explanation: 'The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2].',
        },
      ]),
      starterCode: JSON.stringify({
        javascript: `function twoSum(numbers, target) {\n  let left = 0, right = numbers.length - 1;\n  while (left < right) {\n    const sum = numbers[left] + numbers[right];\n    if (sum === target) return [left + 1, right + 1];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [];\n}`,
        python: `def twoSum(numbers: list[int], target: int) -> list[int]:\n    left, right = 0, len(numbers) - 1\n    while left < right:\n        curr_sum = numbers[left] + numbers[right]\n        if curr_sum == target:\n            return [left + 1, right + 1]\n        elif curr_sum < target:\n            left += 1\n        else:\n            right -= 1\n    return []`,
      }),
      solutionExplanation: `Because the array is already sorted, we can initialize two pointers: \`left = 0\` and \`right = numbers.length - 1\`. If the sum is less than the target, incrementing \`left\` increases the sum. If the sum is greater than the target, decrementing \`right\` decreases the sum. This guarantees finding the pair in $O(N)$ time with $O(1)$ extra memory.`,
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  ];

  for (const p of dsaProblemsData) {
    const topicId = topicMap[p.topicSlug] || normTopicId;
    run(
      `INSERT INTO dsa_problems (
        topic_id, title, slug, difficulty, problem_statement, input_format,
        output_format, constraints, sample_cases_json, starter_code_json,
        solution_explanation, time_complexity, space_complexity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        topicId, p.title, p.slug, p.difficulty, p.problemStatement, p.inputFormat,
        p.outputFormat, p.constraints, p.sampleCases, p.starterCode,
        p.solutionExplanation, p.timeComplexity, p.spaceComplexity
      ]
    );
  }

  console.log('✅ Academic Curriculum Database seeded successfully!');
  console.log('🎓 Student Profile: Aarav Sharma -> AKTU | B.Tech | CSE (AI & ML) | 3rd Year | Semester 5');
  console.log('📚 Semester 5 Subjects: DBMS, Operating Systems, Computer Networks, AI & Machine Learning');
}

// Execute if run directly
seedDatabase().catch((err) => {
  console.error('❌ Database seeding failed:', err);
  process.exit(1);
});
