#!/bin/bash

# Script to check which images are actually used in the codebase

echo "🔍 Checking image usage in Shapero Astro project..."
echo "=================================================="

# Create temporary files for tracking
USED_IMAGES="/tmp/used_images.txt"
ALL_IMAGES="/tmp/all_images.txt"
UNUSED_IMAGES="/tmp/unused_images.txt"

# Clear temp files
> "$USED_IMAGES"
> "$ALL_IMAGES"

# Find all images in public directory
echo -e "\n📁 Finding all images in public directory..."
find public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" -o -name "*.gif" -o -name "*.ico" \) | sort > "$ALL_IMAGES"
TOTAL_IMAGES=$(wc -l < "$ALL_IMAGES")
echo "Found $TOTAL_IMAGES images"

# Search for image references in code
echo -e "\n🔍 Searching for image references in code..."

# Search in .astro files
echo "  Checking .astro files..."
grep -r -h -o -E '(src|href)=["\047][^"\047]*\.(jpg|jpeg|png|webp|svg|gif|ico)["\047]' src --include="*.astro" 2>/dev/null | \
    sed -E 's/(src|href)=["\047]//g' | sed 's/["\047]//g' | sort -u >> "$USED_IMAGES"

# Search in .css files
echo "  Checking .css files..."
grep -r -h -o -E 'url\(["\047]?[^"\047)]*\.(jpg|jpeg|png|webp|svg|gif)["\047]?\)' src --include="*.css" 2>/dev/null | \
    sed -E 's/url\(["\047]?//g' | sed 's/["\047]?\)//g' | sort -u >> "$USED_IMAGES"

# Search in .ts/.js files
echo "  Checking .ts/.js files..."
grep -r -h -o -E '["\047][^"\047]*\.(jpg|jpeg|png|webp|svg|gif|ico)["\047]' src --include="*.ts" --include="*.js" 2>/dev/null | \
    sed 's/["\047]//g' | sort -u >> "$USED_IMAGES"

# Also check for images referenced in frontmatter or props
echo "  Checking for dynamic image references..."
grep -r -h -E "(image|logo|icon|src)" src --include="*.astro" | \
    grep -o -E '["\047][^"\047]*\.(jpg|jpeg|png|webp|svg|gif|ico)["\047]' | \
    sed 's/["\047]//g' | sort -u >> "$USED_IMAGES"

# Remove duplicates and clean up paths
sort -u "$USED_IMAGES" | sed 's/^\.\///' | sed 's/^\///' > "$USED_IMAGES.tmp"
mv "$USED_IMAGES.tmp" "$USED_IMAGES"

# Compare and find unused images
echo -e "\n📊 Analyzing results..."
while IFS= read -r image; do
    image_name=$(basename "$image")
    image_path=$(echo "$image" | sed 's/^public\///')
    
    # Check if image is referenced (by full path or just filename)
    if ! grep -q -E "(^|/)$image_name$|$image_path" "$USED_IMAGES"; then
        echo "$image" >> "$UNUSED_IMAGES"
    fi
done < "$ALL_IMAGES"

# Display results
echo -e "\n📈 Summary:"
echo "==========="
USED_COUNT=$(sort -u "$USED_IMAGES" | wc -l)
UNUSED_COUNT=$(wc -l < "$UNUSED_IMAGES" 2>/dev/null || echo 0)

echo "Total images: $TOTAL_IMAGES"
echo "Referenced images: $USED_COUNT"
echo "Potentially unused: $UNUSED_COUNT"

if [ -s "$UNUSED_IMAGES" ]; then
    echo -e "\n⚠️  Potentially unused images:"
    echo "==============================="
    while IFS= read -r image; do
        size=$(du -h "$image" 2>/dev/null | cut -f1)
        echo "  $image ($size)"
    done < "$UNUSED_IMAGES"
    
    # Calculate total size of unused images
    TOTAL_SIZE=$(du -ch $(cat "$UNUSED_IMAGES") 2>/dev/null | tail -1 | cut -f1)
    echo -e "\nTotal size of unused images: $TOTAL_SIZE"
fi

echo -e "\n✅ Used images:"
echo "==============="
sort -u "$USED_IMAGES" | head -20
if [ "$USED_COUNT" -gt 20 ]; then
    echo "... and $((USED_COUNT - 20)) more"
fi

# Save detailed report
REPORT_FILE="image-usage-report.txt"
echo -e "Image Usage Report - $(date)\n" > "$REPORT_FILE"
echo "Total images: $TOTAL_IMAGES" >> "$REPORT_FILE"
echo "Referenced images: $USED_COUNT" >> "$REPORT_FILE"
echo "Potentially unused: $UNUSED_COUNT" >> "$REPORT_FILE"
echo -e "\nUsed Images:\n============" >> "$REPORT_FILE"
sort -u "$USED_IMAGES" >> "$REPORT_FILE"
echo -e "\nPotentially Unused Images:\n=========================" >> "$REPORT_FILE"
cat "$UNUSED_IMAGES" 2>/dev/null >> "$REPORT_FILE"

echo -e "\n📄 Detailed report saved to: $REPORT_FILE"

# Cleanup temp files
rm -f "$USED_IMAGES" "$ALL_IMAGES" "$UNUSED_IMAGES"