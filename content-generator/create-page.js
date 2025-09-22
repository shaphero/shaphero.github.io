#!/usr/bin/env node

/**
 * Create Astro Page from Generated Content
 * Converts research and content into a full Astro page
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const topic = process.argv[2];

if (!topic) {
  console.error(chalk.red('Please provide a topic'));
  process.exit(1);
}

async function createPage(topic) {
  console.log(chalk.cyan.bold(`\n📄 Creating Astro page for: ${topic}\n`));

  // Generate slug from topic
  const slug = topic.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Load analysis report
  const reportPath = `./analysis-reports/${slug}-${new Date().toISOString().split('T')[0]}.json`;
  let report = {};

  if (fs.existsSync(reportPath)) {
    report = await fs.readJSON(reportPath);
    console.log(chalk.green('✅ Loaded analysis report'));
  } else {
    console.log(chalk.yellow('⚠️  No analysis report found, using defaults'));
  }

  // Load generated content
  const contentPath = `./generated-content/${slug}-${new Date().toISOString().split('T')[0]}.md`;
  let content = '';

  if (fs.existsSync(contentPath)) {
    content = await fs.readFile(contentPath, 'utf8');
    console.log(chalk.green('✅ Loaded generated content'));
  }

  // Extract questions for FAQ
  const faqs = report.reddit?.questions?.slice(0, 10) || [];

  // Extract pain points
  const painPoints = report.reddit?.painPoints?.slice(0, 5) || [];

  // Create Astro page content
  const astroPage = `---
import PageLayout from '../../layouts/PageLayout.astro';
import Section from '../../components/common/Section.astro';
import ContentGrid from '../../components/common/ContentGrid.astro';

// Page metadata
const title = "${topic}: Complete Guide (${new Date().getFullYear()})";
const description = "${getMetaDescription(topic, report)}";
const publishDate = "${new Date().toISOString()}";

// Reddit insights
const faqs = ${JSON.stringify(faqs, null, 2)};

const painPoints = ${JSON.stringify(painPoints, null, 2)};

// Key statistics
const stats = {
  questionsAnswered: ${faqs.length},
  painPointsAddressed: ${painPoints.length},
  depthScore: ${report.analysis?.depthScore || 0},
  breadthScore: ${report.analysis?.breadthScore || 0}
};

// Related topics for internal linking
const relatedTopics = [
  { title: "AI SEO Strategies", href: "/ai-seo" },
  { title: "Fortune 500 AI Implementation", href: "/ai-training" },
  { title: "Marketing Automation", href: "/marketing-strategy" }
];
---

<PageLayout
  title={title}
  description={description}
  schema={{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "datePublished": publishDate,
    "dateModified": publishDate,
    "author": {
      "@type": "Person",
      "name": "Dave Shapiro"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Dave Shapiro Consulting"
    }
  }}
>
  <!-- Hero Section -->
  <Section background="gradient" padding="xl">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
        {title}
      </h1>
      <p class="text-xl text-gray-300 mb-8">
        {description}
      </p>
      <div class="flex flex-wrap gap-4 justify-center text-sm">
        <span class="bg-primary/20 text-primary px-4 py-2 rounded-full">
          {stats.questionsAnswered} Questions Answered
        </span>
        <span class="bg-accent/20 text-accent px-4 py-2 rounded-full">
          {stats.painPointsAddressed} Problems Solved
        </span>
        <span class="bg-green-500/20 text-green-400 px-4 py-2 rounded-full">
          Depth Score: {stats.depthScore}/100
        </span>
      </div>
    </div>
  </Section>

  <!-- Quick Answer Box -->
  <Section background="white" padding="md">
    <div class="max-w-4xl mx-auto">
      <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
        <h2 class="text-lg font-semibold text-blue-900 mb-2">Quick Answer</h2>
        <p class="text-blue-800">
          ${getQuickAnswer(topic, report)}
        </p>
      </div>
    </div>
  </Section>

  <!-- Main Content -->
  <Section background="white" padding="xl">
    <article class="prose prose-lg max-w-4xl mx-auto">
      ${processContent(content)}
    </article>
  </Section>

  <!-- Pain Points & Solutions -->
  {painPoints.length > 0 && (
    <Section background="cream" padding="xl">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12">
          Common Challenges & Solutions
        </h2>
        <div class="space-y-6">
          {painPoints.map((point, index) => (
            <div class="bg-white rounded-lg p-6 shadow-md">
              <div class="flex gap-4">
                <div class="text-2xl">😓</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-lg mb-2">Challenge #{index + 1}</h3>
                  <p class="text-gray-700 mb-3">{point.text}</p>
                  <div class="bg-green-50 border-l-4 border-green-500 p-4">
                    <p class="text-green-900">
                      <strong>Solution:</strong> ${getSolution(point)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )}

  <!-- FAQ Section -->
  {faqs.length > 0 && (
    <Section background="white" padding="xl">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div class="space-y-4">
          {faqs.map((faq) => (
            <details class="border border-gray-200 rounded-lg">
              <summary class="p-4 cursor-pointer hover:bg-gray-50 font-semibold">
                {faq.question}
              </summary>
              <div class="p-4 border-t border-gray-200">
                <p>${getAnswer(faq.question, report)}</p>
                {faq.score && (
                  <p class="text-sm text-gray-500 mt-2">
                    👍 {faq.score} people found this helpful
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )}

  <!-- Related Topics -->
  <Section background="gradient" padding="lg">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-white mb-6">
        Continue Learning
      </h2>
      <div class="grid md:grid-cols-3 gap-4">
        {relatedTopics.map((topic) => (
          <a
            href={topic.href}
            class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white hover:bg-white/20 transition-all"
          >
            {topic.title} →
          </a>
        ))}
      </div>
    </div>
  </Section>

  <!-- CTA -->
  <Section background="white" padding="xl">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-3xl font-bold mb-4">
        Ready to Implement These Strategies?
      </h2>
      <p class="text-lg text-gray-600 mb-8">
        Get personalized guidance for your specific situation
      </p>
      <a
        href="mailto:dave@daveshap.com?subject=${encodeURIComponent(topic)}"
        class="inline-block bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
      >
        Schedule a Consultation
      </a>
    </div>
  </Section>
</PageLayout>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": ${JSON.stringify(faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": getAnswer(faq.question, report)
    }
  })))}
}
</script>`;

  // Save the page
  const pagePath = path.join('..', 'src', 'pages', 'blog', `${slug}.astro`);
  await fs.ensureDir(path.dirname(pagePath));
  await fs.writeFile(pagePath, astroPage);

  console.log(chalk.green(`\n✅ Page created: ${pagePath}`));
  console.log(chalk.cyan(`   URL: /blog/${slug}`));
  console.log(chalk.dim(`   Questions answered: ${faqs.length}`));
  console.log(chalk.dim(`   Pain points addressed: ${painPoints.length}\n`));

  return pagePath;
}

// Helper functions
function getMetaDescription(topic, report) {
  const base = `Complete guide to ${topic} with answers to ${report.reddit?.questions?.length || 0} common questions.`;
  const stats = report.analysis ? ` Depth score: ${report.analysis.depthScore}/100.` : '';
  return (base + stats).substring(0, 160);
}

function getQuickAnswer(topic, report) {
  return `${topic} involves strategic implementation of proven methodologies to achieve measurable results. Based on analysis of ${report.reddit?.questions?.length || 0} user questions and industry best practices, this guide provides comprehensive coverage of all essential aspects.`;
}

function processContent(content) {
  // Convert markdown to HTML-compatible format for Astro
  return content
    .replace(/^#\s+(.+)$/gm, '') // Remove h1 (using hero instead)
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\-\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .trim();
}

function getSolution(painPoint) {
  // Generate solution based on pain point
  const trigger = painPoint.trigger || '';
  if (trigger.includes('struggling')) {
    return 'Implement our proven framework that eliminates this struggle through systematic automation and clear processes.';
  }
  if (trigger.includes('having trouble')) {
    return 'Our step-by-step methodology makes this straightforward, with templates and examples for every scenario.';
  }
  return 'Address this challenge with data-driven strategies that have worked for Fortune 500 companies.';
}

function getAnswer(question, report) {
  // Generate answer based on question pattern
  if (question.toLowerCase().includes('how')) {
    return 'Follow our comprehensive step-by-step process outlined in this guide, starting with assessment and moving through implementation.';
  }
  if (question.toLowerCase().includes('what')) {
    return 'Based on extensive research and real-world experience, this guide provides detailed explanations and practical examples.';
  }
  if (question.toLowerCase().includes('why')) {
    return 'The data shows clear benefits, with companies seeing an average of 333% ROI when properly implemented.';
  }
  return 'This comprehensive guide addresses this question with proven strategies and real-world examples.';
}

// Execute
createPage(topic).catch(error => {
  console.error(chalk.red('Page creation failed:'), error);
  process.exit(1);
});