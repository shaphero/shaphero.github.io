#!/bin/bash

# Cleanup script for Shapero Astro project
# This script safely removes unused files identified in the codebase audit

echo "🧹 Starting cleanup of unused files..."
echo "This script will move files to a .backup directory first for safety"

# Create backup directory with timestamp
BACKUP_DIR=".backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Created backup directory: $BACKUP_DIR"

# Function to safely move files
safe_remove() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "  Moving: $file"
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        mv "$file" "$BACKUP_DIR/$file"
    else
        echo "  ⚠️  File not found: $file"
    fi
}

echo -e "\n📋 Moving duplicate/unused components..."
safe_remove "src/components/HeroSection-Complete.astro"
safe_remove "src/components/HeroSection.astro"
safe_remove "src/components/ClientLogos.astro"
safe_remove "src/components/ResultsSection 2.astro"
safe_remove "src/layouts/BaseLayout 2.astro"

echo -e "\n📋 Moving unused CSS..."
safe_remove "src/styles/global.css"

echo -e "\n📋 Moving example page..."
safe_remove "src/pages/example-page.astro"

echo -e "\n📋 Moving components only used in example page..."
echo "⚠️  These components are only used in example-page.astro:"
echo "   - src/components/common/Testimonials.astro"
echo "   - src/components/common/AboutSection.astro"
read -p "Do you want to remove these as well? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "src/components/common/Testimonials.astro"
    safe_remove "src/components/common/AboutSection.astro"
fi

echo -e "\n✅ Cleanup complete!"
echo "📁 Backup created at: $BACKUP_DIR"
echo ""
echo "To restore files, run:"
echo "  mv $BACKUP_DIR/* ."
echo ""
echo "To permanently delete the backup, run:"
echo "  rm -rf $BACKUP_DIR"