// 15 multiple-choice questions. Each cites a document in the Legal Repository.
export const PASSING_PCT = 80;

export const QUESTIONS = [
  {
    id: 'q1',
    comp: 'pers',
    q: 'Under Art. 4(2) of Law No. 40 of 1999, the national press is not subject to…',
    options: [
      'Taxes and regional levies',
      'Censorship, banning, or broadcast prohibition',
      'Mandatory registration with the Press Council',
      'The duty to serve the Right of Reply',
    ],
    answer: 1,
    why: 'Art. 4(2) states that the national press is not subject to censorship, banning, or broadcast prohibition.',
    ref: 'uu-40-1999',
  },
  {
    id: 'q2',
    comp: 'pers',
    q: 'The right of a person to respond to or refute reported facts that damage their reputation is called…',
    options: ['Right to Refuse (Hak Tolak)', 'Right of Correction (Hak Koreksi)', 'Right of Reply (Hak Jawab)', 'Copyright'],
    answer: 2,
    why: 'Art. 1(11) of the Press Law defines the Right of Reply. The Right of Correction fixes errors of information; the Right to Refuse protects a source’s identity.',
    ref: 'uu-40-1999',
  },
  {
    id: 'q3',
    comp: 'pers',
    q: 'A press company that fails to serve the Right of Reply (breaching Art. 5(2) of the Press Law) can be fined up to…',
    options: ['IDR 50 million', 'IDR 100 million', 'IDR 500 million', 'IDR 1 billion'],
    answer: 2,
    why: 'Art. 18(2) of the Press Law: breaches of Art. 5(1) and (2) and Art. 13 carry a fine of up to IDR 500,000,000.',
    ref: 'uu-40-1999',
  },
  {
    id: 'q4',
    comp: 'pers',
    q: 'Which body sets and supervises the Journalism Code of Ethics?',
    options: ['Indonesian Broadcasting Commission (KPI)', 'Ministry of Communication and Digital Affairs', 'Press Council (Dewan Pers)', 'Indonesian Journalists Association (PWI)'],
    answer: 2,
    why: 'Art. 15(2)(c) of the Press Law gives this function to the Press Council.',
    ref: 'uu-40-1999',
  },
  {
    id: 'q5',
    comp: 'risiko',
    q: 'An official feels harmed by your investigative story and plans to sue the journalist directly in a civil court. Under the Court’s reading of Art. 8 of the Press Law (Decision 145/PUU-XXIII/2025), what should come first?',
    options: [
      'A formal legal warning letter to the editor-in-chief',
      'The Right of Reply, Right of Correction, and resolution of any alleged ethics breach through the Press Council',
      'A request to the Ministry to block access to the story',
      'Court-annexed mediation at the district court',
    ],
    answer: 1,
    why: 'The Court read "legal protection" so that criminal or civil sanctions apply only after the Right of Reply, Right of Correction, and any alleged KEJ breach are resolved through the Press Council (a restorative-justice approach).',
    ref: 'mk-145-2025',
  },
  {
    id: 'q6',
    comp: 'digital',
    q: 'Law No. 1 of 2024 is…',
    options: [
      'A replacement for the Press Law',
      'The first amendment to Law No. 11 of 2008',
      'The second amendment to Law No. 11 of 2008 on Electronic Information and Transactions (ITE)',
      'The Personal Data Protection Law',
    ],
    answer: 2,
    why: 'Law 1/2024 is the Second Amendment to Law 11/2008 on ITE. The first amendment was Law 19/2016.',
    ref: 'uu-1-2024',
  },
  {
    id: 'q7',
    comp: 'digital',
    q: 'Following Decision 105/PUU-XXII/2024, who can NOT be the victim of an attack on honour under Art. 27A of the ITE Law?',
    options: [
      'A citizen defamed on social media',
      'An official as an individual',
      'A government institution, institution, corporation, profession, or public office',
      'A journalist as an individual',
    ],
    answer: 2,
    why: 'The Court held that "another person" must be read as excluding government institutions, groups with a specific identity, institutions, corporations, professions, and public offices.',
    ref: 'mk-105-2024',
  },
  {
    id: 'q8',
    comp: 'digital',
    q: 'Decision 115/PUU-XXII/2024 interprets the word "riot" (kerusuhan) in Art. 28(3) of the ITE Law as…',
    options: [
      'Heated debate or uproar on social media',
      'A disturbance of public order in physical space, not in digital or cyber space',
      'Any post that goes viral',
      'A public complaint filed with the police',
    ],
    answer: 1,
    why: 'The ruling reads "riot" as a condition that disturbs public order in physical space, not a condition in digital or cyber space.',
    ref: 'mk-115-2024',
  },
  {
    id: 'q9',
    comp: 'digital',
    q: 'In Decision 50/PUU-VI/2008 the Court upheld Art. 27(3) of the ITE Law and held that its interpretation cannot be separated from…',
    options: ['Articles 310 and 311 of the Criminal Code (KUHP)', 'Art. 28E of the 1945 Constitution alone', 'The Journalism Code of Ethics', 'The Cyber Media Reporting Guidelines'],
    answer: 0,
    why: 'The Court tied Art. 27(3) to the general defamation offences in Articles 310 and 311 of the Criminal Code.',
    ref: 'mk-50-2008',
  },
  {
    id: 'q10',
    comp: 'etika',
    q: 'Art. 1 of the Journalism Code of Ethics says Indonesian journalists are independent and produce reporting that is…',
    options: [
      'Fast, viral, and exclusive',
      'Accurate, balanced, and without bad faith',
      'Aligned with the owner’s interests',
      'Approved by sources before publication',
    ],
    answer: 1,
    why: 'Art. 1 KEJ: independent, accurate, balanced, and without bad faith.',
    ref: 'kej-2008',
  },
  {
    id: 'q11',
    comp: 'etika',
    q: 'The interpretation of Art. 5 KEJ (protecting the identity of child offenders) defines a "child" as a person who is…',
    options: ['Under 18 years old', 'Under 16 years old and unmarried', 'Under 21 years old', 'Still in school'],
    answer: 1,
    why: 'Interpretation of Art. 5 KEJ: a child is a person under 16 years old and unmarried.',
    ref: 'kej-2008',
  },
  {
    id: 'q12',
    comp: 'etika',
    q: 'When a cyber medium publishes an unverified story under the PPMS exception, the notice to readers goes…',
    options: [
      'On the "About Us" page',
      'At the end of the same story, in brackets and italics',
      'On the newsroom’s social media',
      'Nowhere; no notice is needed',
    ],
    answer: 1,
    why: 'PPMS point 2: the notice is placed at the end of the same story, in brackets and in italics.',
    ref: 'ppms-2012',
  },
  {
    id: 'q13',
    comp: 'etika',
    q: 'Reported user-generated content (e.g. reader comments) that breaches the rules must be edited or removed within…',
    options: ['1 x 24 hours', '2 x 24 hours of receiving the complaint', '7 working days', 'After a Press Council ruling'],
    answer: 1,
    why: 'PPMS: no later than 2 x 24 hours after the complaint is received.',
    ref: 'ppms-2012',
  },
  {
    id: 'q14',
    comp: 'risiko',
    q: 'Your newsroom publishes a Right of Reply from a person named in a story. Under PPMS, the reply must be…',
    options: [
      'Published as a separate article with no link',
      'Linked to the original story, with the time of publication shown',
      'A replacement for the original story, which is then deleted',
      'Approved by the Press Council before publication',
    ],
    answer: 1,
    why: 'PPMS point 4: corrections and replies must be linked to the related story and show when they were published.',
    ref: 'ppms-2012',
  },
  {
    id: 'q15',
    comp: 'risiko',
    q: 'A corporation asks you to remove a story because it "damages our image". No SARA, decency, child, or victim-trauma issue is involved. What does PPMS call for?',
    options: [
      'Remove the story to avoid a lawsuit',
      'Decline the removal and offer the Right of Reply',
      'Quietly edit the story without a note',
      'Hide the story from search engines',
    ],
    answer: 1,
    why: 'PPMS point 5: a story may not be removed because of censorship by parties outside the newsroom. The Right of Reply is the remedy.',
    ref: 'ppms-2012',
  },
];

// Sample previous attempt (demo data): 13/15 correct, wrong on q8 and q15.
export const SAMPLE_ATTEMPT_ANSWERS = Object.fromEntries(
  QUESTIONS.map((q) => {
    if (q.id === 'q8') return [q.id, 0];
    if (q.id === 'q15') return [q.id, 0];
    return [q.id, q.answer];
  })
);

// Scores answers against a question set. Returns a snapshot so later edits to the bank do not change history.
export function scoreAnswers(answers, questions = QUESTIONS, passingPct = PASSING_PCT) {
  let correct = 0;
  const byComp = {};
  for (const q of questions) {
    byComp[q.comp] ??= { correct: 0, total: 0 };
    byComp[q.comp].total += 1;
    if (answers[q.id] === q.answer) {
      correct += 1;
      byComp[q.comp].correct += 1;
    }
  }
  const total = questions.length || 1;
  const pct = Math.round((correct / total) * 100);
  return { correct, total: questions.length, pct, passed: pct >= passingPct, passingPct, byComp };
}
