#!/bin/bash

# Comprehensive cleanup analysis for Shapero Astro project

echo "🔍 Comprehensive Cleanup Analysis"
echo "================================="

# Check for TODO comments
echo -e "\n📝 TODO Comments:"
echo "----------------"
grep -r "TODO\|FIXME\|HACK\|XXX" src --include="*.astro" --include="*.ts" --include="*.js" --include="*.css" -n 2>/dev/null || echo "No TODOs found ✅"

# Check for console.log statements
echo -e "\n🔍 Console.log statements:"
echo "-------------------------"
grep -r "console\." src --include="*.astro" --include="*.ts" --include="*.js" -n 2>/dev/null || echo "No console statements found ✅"

# Check for commented out code blocks
echo -e "\n💬 Large commented code blocks (5+ lines):"
echo "-----------------------------------------"
find src -type f \( -name "*.astro" -o -name "*.ts" -o -name "*.js" -o -name "*.css" \) -exec awk '
    /^[[:space:]]*(\/\/|\/\*|<!--)/ { 
        comment_lines++; 
        if (comment_lines == 1) start_line = NR; 
        last_file = FILENAME; 
        last_line = NR;
    } 
    !/^[[:space:]]*(\/\/|\/\*|<!--|$)/ { 
        if (comment_lines >= 5) {
            print last_file ":" start_line "-" last_line " (" comment_lines " lines)"
        }
        comment_lines = 0;
    }
' {} \; | head -10

# Check for unused dependencies
echo -e "\n📦 Package.json dependencies check:"
echo "----------------------------------"
echo "Dependencies:"
cat package.json | grep -A20 '"dependencies"' | grep '":' | sed 's/[",]//g' | awk '{print "  " $1}'

echo -e "\nDev Dependencies:"
cat package.json | grep -A20 '"devDependencies"' | grep '":' | sed 's/[",]//g' | awk '{print "  " $1}'

# Check for empty or very small files
echo -e "\n📄 Empty or very small files (<50 bytes):"
echo "----------------------------------------"
find src -type f -size -50c | grep -v ".git" || echo "No empty files found ✅"

# Check for duplicate CSS classes
echo -e "\n🎨 Potential duplicate CSS classes:"
echo "----------------------------------"
echo "Checking for similar component styles that could be consolidated..."
# Extract class definitions and count occurrences
grep -h "class=" src/**/*.astro | \
    grep -o 'class="[^"]*"' | \
    sed 's/class="//g;s/"//g' | \
    tr ' ' '\n' | \
    sort | uniq -c | \
    sort -rn | \
    awk '$1 > 5 {print "  " $2 " (used " $1 " times)"}' | \
    head -10

# Check build output size
echo -e "\n📊 Build output analysis:"
echo "------------------------"
if [ -d "dist" ]; then
    echo "Total dist size: $(du -sh dist | cut -f1)"
    echo "Largest files:"
    find dist -type f -size +100k -exec ls -lh {} \; | awk '{print "  " $9 " (" $5 ")"}'
else
    echo "No dist directory found. Run 'npm run build' first."
fi

# Check for TypeScript errors
echo -e "\n🔍 TypeScript configuration:"
echo "---------------------------"
if [ -f "tsconfig.json" ]; then
    echo "TypeScript config found ✅"
    # Run tsc to check for errors
    echo "Checking for TypeScript errors..."
    npx tsc --noEmit 2>&1 | head -20 || echo "No TypeScript errors ✅"
else
    echo "No TypeScript config found"
fi

# Identify potential performance optimizations
echo -e "\n⚡ Performance optimization opportunities:"
echo "----------------------------------------"
echo "1. Large images that could be optimized:"
find public -type f \( -name "*.jpg" -o -name "*.png" \) -size +500k -exec ls -lh {} \; | awk '{print "   " $9 " (" $5 ")"}'

echo -e "\n2. Components with inline styles (could use CSS classes):"
grep -r "style=" src --include="*.astro" -l | head -10

echo -e "\n3. Potential lazy-loading opportunities:"
grep -r "<img" src --include="*.astro" | grep -v "loading=" | wc -l | awk '{print "   " $1 " images without loading attribute"}'

# Summary recommendations
echo -e "\n📋 Cleanup Summary & Recommendations:"
echo "===================================="
echo "1. Run ./cleanup-unused-files.sh to remove identified unused files"
echo "2. Remove 4.3M of unused images (see image-usage-report.txt)"
echo "3. Consider consolidating duplicate CSS classes"
echo "4. Add loading='lazy' to images below the fold"
echo "5. Review and remove any large commented code blocks"
echo ""
echo "💡 Quick wins:"
echo "  - Removing unused files will reduce project size"
echo "  - Removing unused images will save 4.3M"
echo "  - CSS consolidation could improve maintainability"
echo ""
echo "To execute cleanup:"
echo "  ./cleanup-unused-files.sh"
echo "  rm -rf public/lovable-uploads  # Remove original unoptimized images"
echo "  # Remove specific unused optimized images from the report"