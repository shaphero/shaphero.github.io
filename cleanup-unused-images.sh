#!/bin/bash

# Script to clean up unused images identified in the analysis

echo "🖼️  Cleaning up unused images..."
echo "==============================="

# Create backup directory
BACKUP_DIR=".image-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Created backup directory: $BACKUP_DIR"

# Function to safely move images
safe_move_image() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "  Moving: $file"
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        mv "$file" "$BACKUP_DIR/$file"
    fi
}

# Move unused UUID-named optimized images
echo -e "\n📋 Moving unused optimized images..."
safe_move_image "public/optimized/cd9a7000-36bd-4196-9427-19d44f49a74b-mobile.jpg"
safe_move_image "public/optimized/cd9a7000-36bd-4196-9427-19d44f49a74b-mobile.webp"
safe_move_image "public/optimized/cd9a7000-36bd-4196-9427-19d44f49a74b-placeholder.jpg"
safe_move_image "public/optimized/cd9a7000-36bd-4196-9427-19d44f49a74b.jpg"
safe_move_image "public/optimized/cd9a7000-36bd-4196-9427-19d44f49a74b.webp"
safe_move_image "public/optimized/e7355d6e-542f-4c2b-8fa7-1604e1ce5b88-mobile.jpg"
safe_move_image "public/optimized/e7355d6e-542f-4c2b-8fa7-1604e1ce5b88-mobile.webp"
safe_move_image "public/optimized/e7355d6e-542f-4c2b-8fa7-1604e1ce5b88-placeholder.jpg"
safe_move_image "public/optimized/e7355d6e-542f-4c2b-8fa7-1604e1ce5b88.jpg"
safe_move_image "public/optimized/e7355d6e-542f-4c2b-8fa7-1604e1ce5b88.webp"
safe_move_image "public/optimized/ecd9fbaa-bfef-4db6-82c4-9041166d934a-mobile.jpg"
safe_move_image "public/optimized/ecd9fbaa-bfef-4db6-82c4-9041166d934a-mobile.webp"
safe_move_image "public/optimized/ecd9fbaa-bfef-4db6-82c4-9041166d934a-placeholder.jpg"
safe_move_image "public/optimized/ecd9fbaa-bfef-4db6-82c4-9041166d934a.jpg"
safe_move_image "public/optimized/ecd9fbaa-bfef-4db6-82c4-9041166d934a.webp"
safe_move_image "public/optimized/ef56f7cd-731d-473d-96ad-4500896f5f9d-mobile.jpg"
safe_move_image "public/optimized/ef56f7cd-731d-473d-96ad-4500896f5f9d-mobile.webp"
safe_move_image "public/optimized/ef56f7cd-731d-473d-96ad-4500896f5f9d-placeholder.jpg"
safe_move_image "public/optimized/ef56f7cd-731d-473d-96ad-4500896f5f9d.jpg"
safe_move_image "public/optimized/ef56f7cd-731d-473d-96ad-4500896f5f9d.webp"

# Move lovable-uploads directory (original unoptimized images)
echo -e "\n📋 Moving lovable-uploads directory..."
if [ -d "public/lovable-uploads" ]; then
    echo "  Moving entire lovable-uploads directory"
    mv "public/lovable-uploads" "$BACKUP_DIR/public/"
else
    echo "  lovable-uploads directory not found"
fi

echo -e "\n✅ Image cleanup complete!"
echo "📁 Backup created at: $BACKUP_DIR"
echo ""
echo "Space saved: ~4.3M"
echo ""
echo "To restore images, run:"
echo "  mv $BACKUP_DIR/public/* public/"
echo ""
echo "To permanently delete the backup, run:"
echo "  rm -rf $BACKUP_DIR"