export const MIN_WORDS = 100;

export const ESSAYS = [
  {
    id: 'e1',
    comp: 'etika',
    title: 'Verifying a single-source story',
    prompt:
      'Fictional case: your news site receives documents from one anonymous source alleging that a regional agency head misused aid funds. The agency head cannot be reached before deadline. Explain whether the story may be published, which conditions the Cyber Media Reporting Guidelines (PPMS) require, and which ethical duties apply under the Journalism Code of Ethics (KEJ).',
    rubric: ['States the verification principle and its exception (PPMS point 2)', 'Applies KEJ Art. 1 and 3 (accuracy, balance, presumption of innocence)', 'Explains the update and linking steps'],
  },
  {
    id: 'e2',
    comp: 'digital',
    title: 'A police report against a journalist',
    prompt:
      'A journalist is reported to the police under Art. 27A of the ITE Law after writing criticism of a state-owned enterprise (BUMN). Analyse the journalist’s legal position with reference to Constitutional Court Decisions 105/PUU-XXII/2024 and 145/PUU-XXIII/2025, then set out the steps the newsroom should take.',
    rubric: ['Distinguishes individuals from corporations as "another person" (Decision 105/2024)', 'Explains the Press Council-first sequence (Decision 145/2025)', 'Concrete, proportionate newsroom steps'],
  },
  {
    id: 'e3',
    comp: 'risiko',
    title: 'SOP for Right of Reply and takedowns',
    prompt:
      'Draft a short SOP (5–7 steps) for the digital desk to handle (a) Right of Reply requests and (b) story takedown requests. Include who decides, time limits, and how decisions are disclosed to readers.',
    rubric: ['A Right of Reply flow linked to the original story', 'Takedown criteria in line with PPMS point 5', 'Roles, time limits, and transparency to the public'],
  },
];

export const SAMPLE_ESSAY_TEXT = {
  e1: `In principle the story is not ready to publish, because the Cyber Media Reporting Guidelines require every story to be verified, especially one that could harm another party. The exception applies only when all four conditions are met: the public interest is urgent, the first source is named, credible and competent, the subject cannot be located or interviewed, and readers are told that the story still needs further verification.

Here the source is anonymous, so the second condition fails. The newsroom should hold the story, test the authenticity of the documents, find a second source, and keep trying to reach the agency head.

Under the Journalism Code of Ethics, Article 1 requires accurate and balanced reporting, while Article 3 requires journalists to test information and apply the presumption of innocence. If the story is later published and develops, verification results belong in an update linked to the original story.`,
  e2: `Decision 105/PUU-XXII/2024 holds that "another person" in Article 27A of the ITE Law does not include government institutions, institutions, corporations, professions, or public offices. A state-owned enterprise, as a corporation, therefore cannot be the victim of an attack on honour under that article, so a report made on its behalf lacks a legal basis.

The article is also journalistic work. Decision 145/PUU-XXIII/2025 reads the legal protection in Article 8 of the Press Law so that criminal or civil action may proceed only after the Right of Reply, the Right of Correction, and any alleged ethics breach have been resolved through the Press Council.

Newsroom steps: confirm in writing that the piece is journalistic work, prepare the verification records, offer the company a Right of Reply, coordinate with the Press Council, and give the journalist legal support.`,
};
