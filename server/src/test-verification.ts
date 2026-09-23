/**
 * =========================================================================
 * Comprehensive End-to-End Test & Verification Suite for EduMentor AI
 * Phase 2: Academic Curriculum-Based Personalized Learning Platform
 * =========================================================================
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting EduMentor AI Academic Curriculum Verification Suite...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    testsTotal++;
    if (condition) {
      testsPassed++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    }
  }

  // 1. Health Endpoint
  console.log('1. Testing System Health & API Availability:');
  const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
  assert(healthRes.status === 'ok', 'API Server health check is operational');
  assert(healthRes.app === 'EDUMENTOR AI', 'API reports EDUMENTOR AI');
  assert(healthRes.version === '2.0.0', 'API reports Version 2.0.0 (Curriculum-Based)');

  // 2. Authentication, RBAC & Academic Profile
  console.log('\n2. Testing Authentication, RBAC & Mapped Academic Profile:');
  const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@edumentor.ai', password: 'password123' }),
  }).then((r) => r.json());
  assert(studentLogin.success === true, 'Student login succeeded with valid credentials');
  assert(studentLogin.user.role === 'student', 'Student role verified');
  assert(studentLogin.profile.degree_code === 'BTECH', 'Student profile mapped to B.Tech degree');
  assert(studentLogin.profile.branch_code === 'CSE_AIML', 'Student profile mapped to CSE AIML branch');
  assert(studentLogin.profile.semester_number === 5, 'Student profile mapped to Semester 5');
  assert(studentLogin.profile.university_code === 'AKTU', 'Student profile mapped to AKTU university');
  const studentToken = studentLogin.token;

  const teacherLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@edumentor.ai', password: 'password123' }),
  }).then((r) => r.json());
  assert(teacherLogin.success === true, 'Teacher login succeeded');
  assert(teacherLogin.user.role === 'teacher', 'Teacher role verified');
  const teacherToken = teacherLogin.token;

  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@edumentor.ai', password: 'password123' }),
  }).then((r) => r.json());
  assert(adminLogin.success === true, 'Admin login succeeded');
  assert(adminLogin.user.role === 'admin', 'Admin role verified');
  const adminToken = adminLogin.token;

  // Test RBAC
  const studentAccessAdmin = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentAccessAdmin.status === 403, 'RBAC prevents Student from accessing Admin endpoints (HTTP 403)');

  // 3. Strict Semester-Based Curriculum Filtering
  console.log('\n3. Testing Strict Semester-Based Curriculum Filtering:');
  const studentCurriculum = await fetch(`${BASE_URL}/curriculum/student`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  assert(studentCurriculum.success === true, 'Student curriculum retrieved');
  assert(studentCurriculum.subjects.length === 4, `Student has exactly 4 subjects for Semester 5 (Found: ${studentCurriculum.subjects.length})`);

  const currentSubjectCodes = studentCurriculum.subjects.map((s: any) => s.code);
  assert(currentSubjectCodes.includes('CS302'), 'Semester 5 includes Database Management Systems (CS302)');
  assert(currentSubjectCodes.includes('CS301'), 'Semester 5 includes Operating Systems (CS301)');
  assert(currentSubjectCodes.includes('CS303'), 'Semester 5 includes Computer Networks (CS303)');
  assert(currentSubjectCodes.includes('CS401'), 'Semester 5 includes Artificial Intelligence & ML (CS401)');
  assert(!currentSubjectCodes.includes('CS201'), 'Irrelevant Semester 3 DSA subject is strictly excluded from Semester 5');
  assert(!currentSubjectCodes.includes('CS103'), 'Irrelevant Semester 1 Python subject is strictly excluded from Semester 5');

  // 4. Subject -> Units (I to V) -> Topics Hierarchy
  console.log('\n4. Testing Subject Units (I to V) & Rich Academic Notes:');
  const dbmsSubject = studentCurriculum.subjects.find((s: any) => s.code === 'CS302');
  const subjectDetail = await fetch(`${BASE_URL}/subjects/${dbmsSubject.id}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  assert(subjectDetail.success === true, 'DBMS Subject detail retrieved');
  assert(subjectDetail.subject.units.length === 5, 'DBMS has exactly 5 Units (UNIT I to UNIT V)');

  const unit4 = subjectDetail.subject.units.find((u: any) => u.unit_number === 4);
  assert(unit4 !== undefined, 'UNIT IV is present');
  assert(unit4.title.includes('Normalization'), 'UNIT IV covers Relational Design & Normalization');
  assert(unit4.topics.length > 0, 'UNIT IV contains topics');

  const normTopic = unit4.topics.find((t: any) => t.slug === 'database-normalization');
  assert(normTopic !== undefined, 'Topic Database Normalization is mapped to UNIT IV');

  const topicDetail = await fetch(`${BASE_URL}/topics/${normTopic.id}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  assert(topicDetail.success === true, 'Topic details retrieved');
  assert(topicDetail.topic.learningMaterial !== null, 'Rich academic learning material exists for topic');
  assert(topicDetail.topic.learningMaterial.learning_objectives.length > 0, 'Learning objectives are populated');
  assert(topicDetail.topic.learningMaterial.important_definitions.includes('Lossless Join'), 'Important definitions include Lossless Join');
  assert(topicDetail.topic.learningMaterial.exam_points.length > 0, 'High-frequency exam points are populated');

  // Topic Completion
  const completeTopic = await fetch(`${BASE_URL}/topics/${normTopic.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  assert(completeTopic.success === true, 'Student marked topic as completed');
  assert(completeTopic.progress.subjectProgressPercentage > 0, 'Subject progress percentage rolled up');

  // 5. Multi-Tier Assessments: Diagnostic & Unit Tests
  console.log('\n5. Testing Multi-Tier Assessments (Diagnostic, Unit Test, Re-test):');
  const allTests = await fetch(`${BASE_URL}/tests?subjectId=${dbmsSubject.id}`).then((r) => r.json());
  assert(allTests.success === true, 'Assessments list retrieved');
  assert(allTests.tests.some((t: any) => t.test_type === 'diagnostic_test'), 'Diagnostic test is available');
  assert(allTests.tests.some((t: any) => t.test_type === 'unit_test'), 'Unit test is available');
  assert(allTests.tests.some((t: any) => t.test_type === 'subject_test'), 'Subject test is available');

  // Test 5A: Submit Diagnostic Test
  const diagTest = allTests.tests.find((t: any) => t.test_type === 'diagnostic_test');
  const diagTestDetail = await fetch(`${BASE_URL}/tests/${diagTest.id}`).then((r) => r.json());
  assert(diagTestDetail.assessment.questions.length > 0, 'Diagnostic test questions loaded without exposing is_correct');
  assert(diagTestDetail.assessment.questions[0].options.every((o: any) => o.is_correct === undefined), 'Security: Correct answers not leaked to client');

  // Submit diagnostic test with passing answers
  const diagQuestion = diagTestDetail.assessment.questions[0];
  const diagSubmission = await fetch(`${BASE_URL}/tests/${diagTest.id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      answers: { [diagQuestion.id]: diagQuestion.options[0].id },
      timeTakenSeconds: 300,
    }),
  }).then((r) => r.json());
  assert(diagSubmission.success === true, 'Diagnostic test submitted and graded');
  assert(diagSubmission.result.percentage >= 0, `Diagnostic score percentage calculated: ${diagSubmission.result.percentage}%`);

  // Test 5B: Submit Unit Test with low score to verify Explainable AI Trigger
  const unitTest = allTests.tests.find((t: any) => t.test_type === 'unit_test');
  const unitTestDetail = await fetch(`${BASE_URL}/tests/${unitTest.id}`).then((r) => r.json());
  const firstQ = unitTestDetail.assessment.questions[0];

  const unitTestSubmission = await fetch(`${BASE_URL}/tests/${unitTest.id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      answers: {}, // 0 correct -> 0% to trigger low-score XAI recommendation
      timeTakenSeconds: 400,
    }),
  }).then((r) => r.json());
  assert(unitTestSubmission.success === true, 'Unit test evaluated successfully');
  assert(unitTestSubmission.result.percentage === 0, 'Test score evaluated at 0%');
  assert(unitTestSubmission.result.recommendation !== null, 'Explainable AI recommendation engine triggered');
  assert(unitTestSubmission.result.recommendation.explanationMarkdown.includes('Adaptive Explainable AI Attribution'), 'Explicit XAI attribution included in recommendation');
  const parentAttemptId = unitTestSubmission.attemptId;

  // Test 5C: Re-Test Improvement Loop
  const retestSubmission = await fetch(`${BASE_URL}/tests/${unitTest.id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      isRetest: true,
      parentAttemptId,
      answers: { [firstQ.id]: firstQ.options[1].id }, // Score points
      timeTakenSeconds: 250,
    }),
  }).then((r) => r.json());
  assert(retestSubmission.success === true, 'Re-test submitted successfully');
  assert(retestSubmission.result.isRetest === true, 'Attempt flagged as re-test');
  assert(retestSubmission.result.improvementDelta !== null, `Improvement Delta (+Δ%) calculated: +${retestSubmission.result.improvementDelta}%`);

  // 6. University Previous Year Questions (PYQ)
  console.log('\n6. Testing University Previous Year Questions (PYQs):');
  const pyqFilters = await fetch(`${BASE_URL}/pyq/filters`).then((r) => r.json());
  assert(pyqFilters.success === true, 'PYQ filter options retrieved');
  assert(pyqFilters.filters.universities.includes('AKTU'), 'AKTU university is available in PYQ filters');

  const pyqList = await fetch(`${BASE_URL}/pyq?university=AKTU&subjectId=${dbmsSubject.id}`).then((r) => r.json());
  assert(pyqList.success === true, 'Filtered PYQs retrieved');
  assert(pyqList.pyqs.length > 0, `Found ${pyqList.pyqs.length} AKTU DBMS PYQs`);
  assert(pyqList.pyqs[0].solution_notes.length > 0, 'PYQ contains comprehensive step-by-step solution notes');

  // 7. Dynamic Admin CMS (Zero Hardcoding Architecture)
  console.log('\n7. Testing Dynamic Admin CMS Curriculum Expansion:');
  const timestamp = Date.now();
  const newSubjectPayload = {
    category: 'Core Computer Science',
    name: `Cloud DevOps Engineering ${timestamp}`,
    code: `CLD${timestamp.toString().slice(-4)}`,
    slug: `cloud-devops-${timestamp}`,
    description: 'Cloud native computing, containers, Kubernetes, and CI/CD pipelines.',
    branchId: studentLogin.profile.branch_id,
    semesterId: studentLogin.profile.semester_id,
  };

  const createSubjectRes = await fetch(`${BASE_URL}/admin/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(newSubjectPayload),
  }).then((r) => r.json());
  assert(createSubjectRes.success === true, 'Admin dynamically created new subject and mapped to Semester 5');
  assert(createSubjectRes.subjectId > 0, 'New subject ID returned');

  // Verify that student immediately sees this new subject in their Semester 5 curriculum!
  const refreshedCurriculum = await fetch(`${BASE_URL}/curriculum/student`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  const newlyAddedFound = refreshedCurriculum.subjects.some((s: any) => s.id === createSubjectRes.subjectId);
  assert(newlyAddedFound === true, 'Dynamically created subject immediately appeared for student in Semester 5 without frontend code changes!');

  // Clean up created subject
  await fetch(`${BASE_URL}/admin/subjects/${createSubjectRes.subjectId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  // Final Summary
  console.log(`\n========================================================`);
  console.log(`🎯 VERIFICATION COMPLETE: ${testsPassed} / ${testsTotal} Assertions Passed`);
  console.log(`========================================================\n`);

  if (testsPassed === testsTotal) {
    console.log('🎉 ALL SYSTEM & CURRICULUM ARCHITECTURE TESTS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
