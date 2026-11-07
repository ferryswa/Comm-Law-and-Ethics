// Induction material (English). Key points cite documents held in the Legal Repository (Indonesian master).
// Videos are not yet produced: the player shows a clearly labelled placeholder.

export const COMPETENCIES = [
  { id: 'pers', label: 'Press Law', short: 'Press', lesson: 'l1' },
  { id: 'digital', label: 'Digital Law (ITE)', short: 'Digital', lesson: 'l2' },
  { id: 'etika', label: 'Ethics', short: 'Ethics', lesson: 'l3' },
  { id: 'risiko', label: 'Editorial Risk', short: 'Risk', lesson: 'l4' },
];

export const LESSONS = [
  {
    id: 'l1',
    no: '01',
    title: 'Fundamentals of Press Law',
    minutes: 15,
    competency: 'pers',
    summary:
      'The framework of Law No. 40 of 1999 on the Press: press freedom, the Right of Reply and Right of Correction, the Press Council, and legal protection and criminal provisions.',
    refs: ['uu-40-1999', 'mk-145-2025'],
    chapters: [
      {
        t: 0,
        title: 'Press freedom as a basic right',
        points: [
          'Art. 4(1): press freedom is guaranteed as a basic right of citizens.',
          'Art. 4(2): the national press is not subject to censorship, banning, or broadcast prohibition.',
          'Art. 4(4): journalists hold the Right to Refuse (Hak Tolak) when accounting for their reporting before the law.',
        ],
      },
      {
        t: 240,
        title: 'Right of Reply and Right of Correction',
        points: [
          'Art. 5(2) and (3): the press must serve the Right of Reply (Hak Jawab) and the Right of Correction (Hak Koreksi).',
          'The Right of Reply lets a person respond to or refute reported facts that damage their reputation.',
          'Art. 18(2): a press company that breaches Art. 5(1) and (2) faces a fine of up to IDR 500 million.',
        ],
      },
      {
        t: 480,
        title: 'The Press Council and self-regulation',
        points: [
          'Art. 15: the Press Council (Dewan Pers) is independent; its members include no government representatives.',
          'Its functions include setting and supervising the Journalism Code of Ethics.',
          'It advises on and seeks to resolve public complaints about press coverage.',
        ],
      },
      {
        t: 690,
        title: 'Protecting journalists (Art. 8 and 18)',
        points: [
          'Art. 8: journalists receive legal protection in carrying out their profession.',
          'Art. 18(1): obstructing press freedom carries up to 2 years in prison or a fine of up to IDR 500 million.',
          'Constitutional Court Decision 145/PUU-XXIII/2025: criminal or civil action against journalists may proceed only after the Right of Reply, Right of Correction, and ethics review by the Press Council.',
        ],
      },
    ],
  },
  {
    id: 'l2',
    no: '02',
    title: 'Digital Journalism & the ITE Law',
    minutes: 20,
    competency: 'digital',
    summary:
      'How the Electronic Information and Transactions (ITE) Law evolved from 2008 to 2024, its defamation and false-news provisions, and the Constitutional Court rulings that narrow them.',
    refs: ['uu-11-2008', 'uu-19-2016', 'uu-1-2024', 'mk-105-2024', 'mk-115-2024'],
    chapters: [
      {
        t: 0,
        title: 'The ITE Law: 2008, 2016, 2024',
        points: [
          'Law No. 11 of 2008 was enacted on 21 April 2008.',
          'It was first amended by Law No. 19 of 2016 (25 November 2016).',
          'Second amendment: Law No. 1 of 2024, enacted and in force on 2 January 2024.',
        ],
      },
      {
        t: 300,
        title: 'From Art. 27(3) to Art. 27A',
        points: [
          'Decision 50/PUU-VI/2008: the Court upheld Art. 27(3) and tied its interpretation to Articles 310 and 311 of the Criminal Code (KUHP).',
          'Law 1/2024 moves attacks on honour or reputation to Art. 27A jo. Art. 45(4).',
          'Decision 105/PUU-XXII/2024: "another person" excludes government institutions, groups with a specific identity, institutions, corporations, professions, and public offices.',
        ],
      },
      {
        t: 660,
        title: 'False news and the meaning of "riot"',
        points: [
          'Art. 28(3) of Law 1/2024 prohibits spreading false information that causes riots in society.',
          'Decision 115/PUU-XXII/2024: a riot means a disturbance of public order in physical space, not in digital or cyber space.',
          'Decision 78/PUU-XXI/2023: Articles 14 and 15 of Law 1/1946 (false news causing public disorder) no longer have binding legal force.',
        ],
      },
      {
        t: 960,
        title: 'Journalistic work in digital spaces',
        points: [
          'Disputes over journalistic work go first through the Press Law mechanism and the Press Council (see Decision 145/PUU-XXIII/2025).',
          'Good practice: keep personal accounts separate from official newsroom channels. Personal posts risk not being treated as journalistic work.',
          'Document your verification steps. Newsroom records are evidence of good faith.',
        ],
      },
    ],
  },
  {
    id: 'l3',
    no: '03',
    title: 'Journalism Code of Ethics',
    minutes: 20,
    competency: 'etika',
    summary:
      'The eleven articles of the Journalism Code of Ethics (KEJ, Press Council Regulation No. 6/Peraturan-DP/V/2008) and how they apply in daily reporting.',
    refs: ['kej-2008', 'ppms-2012', 'dp-3-2024'],
    chapters: [
      {
        t: 0,
        title: 'Independent, accurate, balanced (Art. 1–3)',
        points: [
          'Art. 1: journalists are independent and produce accurate, balanced reporting without bad faith.',
          'Art. 2: journalists use professional methods in their work.',
          'Art. 3: journalists test information, report in a balanced way, keep fact separate from judgemental opinion, and apply the presumption of innocence.',
        ],
      },
      {
        t: 300,
        title: 'Protecting identity and privacy (Art. 5 and 9)',
        points: [
          'Art. 5: do not name or broadcast the identity of victims of sexual crimes, or of children who commit crimes.',
          'Interpretation of Art. 5: a child is a person under 16 years old and unmarried.',
          "Art. 9: respect a source's right to a private life, except in the public interest.",
        ],
      },
      {
        t: 600,
        title: 'Integrity and sources (Art. 6–7)',
        points: [
          'Art. 6: journalists do not abuse their profession and do not accept bribes.',
          'Art. 7: the Right to Refuse protects sources, and journalists honour embargoes, background information, and "off the record" agreements.',
        ],
      },
      {
        t: 870,
        title: 'Corrections, Right of Reply, and the Press Council (Art. 10–11)',
        points: [
          'Art. 10: promptly retract, correct, and fix inaccurate reports, with an apology to the audience.',
          'Art. 11: serve the Right of Reply and Right of Correction proportionally.',
          'The Press Council makes the final assessment of KEJ breaches; sanctions are imposed by journalist organisations and/or press companies.',
        ],
      },
    ],
  },
  {
    id: 'l4',
    no: '04',
    title: 'Editorial Risk & Case Simulation',
    minutes: 25,
    competency: 'risiko',
    summary:
      'Map legal and ethical risk before publishing, then practise with three fictional cases based on the Cyber Media Reporting Guidelines (PPMS).',
    refs: ['ppms-2012', 'kej-2008', 'mk-145-2025'],
    chapters: [
      {
        t: 0,
        title: 'Mapping editorial risk',
        points: [
          'Four lenses: factual accuracy, legal risk (Press Law, ITE Law), ethics (KEJ), and impact on vulnerable people.',
          'Escalate review for criminal allegations, children, victims of sexual violence, and ethnic, religious, or racial (SARA) issues.',
        ],
      },
      {
        t: 360,
        title: 'Case 1 (fictional): an unverified story',
        points: [
          'PPMS: in principle, every story must be verified.',
          'The exception applies only if the public interest is urgent, the first source is named and credible, the subject cannot be reached, and readers are told.',
          'The notice goes at the end of the same story, in brackets and italics; verification results go in a linked update.',
        ],
      },
      {
        t: 780,
        title: 'Case 2 (fictional): a takedown request',
        points: [
          'PPMS: a story may not be removed because of censorship by parties outside the newsroom.',
          "Exceptions: SARA, decency, a child's future, a victim's trauma, or other grounds set by the Press Council.",
          'A removal must state its reason and be announced. Point the complainant to the Right of Reply.',
        ],
      },
      {
        t: 1140,
        title: 'Case 3 (fictional): reader comments',
        points: [
          'Cyber media must provide an easy-to-find complaint mechanism for user-generated content.',
          'Reported user content that breaches the rules must be edited or removed within 2 x 24 hours of the complaint.',
        ],
      },
      {
        t: 1380,
        title: 'Pre-publication checklist',
        points: [
          'Has everyone accused been asked for a response?',
          'Are the identities of sexual-crime victims and child offenders protected?',
          'Are fact and opinion clearly separated, and is a correction ready to be linked if needed?',
        ],
      },
    ],
  },
];

export const TOTAL_MINUTES = LESSONS.reduce((s, l) => s + l.minutes, 0);
