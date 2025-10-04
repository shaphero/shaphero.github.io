import 'dotenv/config';
import { createCoreClient } from './src/lib/content-pipeline/core-api-client.js';

async function testCoreAPI() {
  console.log('Testing CORE API...\n');

  const coreClient = createCoreClient();

  if (!coreClient) {
    console.log('❌ CORE API client not initialized');
    return;
  }

  console.log('✅ CORE API client initialized\n');

  // Test simple search
  console.log('Testing search for "artificial intelligence"...');
  try {
    const results = await coreClient.searchPapers('artificial intelligence', { limit: 3 });
    console.log(`Found ${results.length} papers:`);
    results.forEach((paper, i) => {
      console.log(`\n${i + 1}. ${paper.title}`);
      console.log(`   Authors: ${paper.authors?.join(', ') || 'Unknown'}`);
      console.log(`   Year: ${paper.date?.getFullYear() || 'Unknown'}`);
      console.log(`   Citations: ${paper.citationCount || 0}`);
      console.log(`   URL: ${paper.url}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testCoreAPI();
