export interface Sample {
  label: string;
  filename: string;
  content: string;
}

export const SAMPLES: Sample[] = [
  {
    label: "Leaky config",
    filename: "config.env",
    content: `# Production configuration
AWS_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE
api_key = "EXAMPLE-do-not-use-abcdef123456"
DATABASE_URL = http://db.internal.example.com:5432
support_email = support@example.com
`,
  },
  {
    label: "Customer record",
    filename: "customer.txt",
    content: `Customer: Jane Doe
SSN: 123-45-6789
Card on file: 4111 1111 1111 1111
Contact: jane.doe@gmail.com
Notes: CONFIDENTIAL - internal only
`,
  },
  {
    label: "Marketing copy",
    filename: "landing.md",
    content: `Our platform is 100% secure and risk-free.
We guarantee your data will never be breached.
Sign up today at http://promo.example.com
`,
  },
  {
    label: "Clean note",
    filename: "notes.txt",
    content: `Reminder: review the quarterly roadmap and prepare
slides for the team sync on Thursday afternoon.
`,
  },
];
