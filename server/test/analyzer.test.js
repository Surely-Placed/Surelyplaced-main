import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, bandOf, scanResume } from '../src/ats/analyzer.js';

const SAMPLE_RESUME = `
Jane Doe
jane.doe@email.com | (555) 123-4567 | linkedin.com/in/janedoe

Summary
Data engineer with Python, SQL and Airflow experience.

Experience
Data Engineer — Acme Corp
• Built ETL pipelines in Python and Airflow, cutting runtime 35%
• Designed PostgreSQL schemas and optimized queries for analytics
• Partnered with stakeholders on data governance initiatives

Education
B.S. Computer Science, State University

Skills
Python, SQL, Airflow, PostgreSQL, AWS, Docker, Git
`.trim();

const SAMPLE_JD = `
We are hiring a Data Engineer to build scalable data pipelines.
Requirements: Python, SQL, Airflow, PostgreSQL, AWS, Docker, Kubernetes, ETL, data governance.
You will work with stakeholders, design dimensional models, and improve data quality.
Experience with Spark, Snowflake, or dbt is a plus. Strong communication and Agile experience preferred.
This role is on-site hybrid. Must be authorized to work in the United States.
`.trim();

describe('ATS analyzer', () => {
  it('match mode produces expected score shape and band', () => {
    const r = scanResume(SAMPLE_RESUME, {
      mode: 'match',
      company: 'Acme Bank',
      role: 'Data Engineer',
      jd: SAMPLE_JD,
    });
    assert.ok(r.score >= 0 && r.score <= 100);
    assert.equal(typeof r.band, 'string');
    assert.equal(typeof r.message, 'string');
    const [band] = bandOf(r.score);
    assert.equal(r.band, band);
    const full = analyze(SAMPLE_RESUME, {
      mode: 'match',
      company: 'Acme Bank',
      role: 'Data Engineer',
      jd: SAMPLE_JD,
    });
    assert.equal(full.score, r.score);
  });

  it('general mode scores without a job description', () => {
    const r = scanResume(SAMPLE_RESUME, {
      mode: 'general',
      company: '',
      role: '',
      jd: '',
    });
    assert.ok(r.score >= 0 && r.score <= 100);
    assert.ok(r.band.length > 0);
  });
});
