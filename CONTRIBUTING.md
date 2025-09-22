# Contributing to Dave Shapiro SEO & AI Consulting Site

Thank you for your interest in contributing! This guide will help you get started.

## 🎯 Our Standards

We maintain high standards for performance and user experience:

- **Performance**: All changes must maintain 100/100 PageSpeed scores
- **Accessibility**: WCAG 2.1 AA compliance required
- **Mobile-first**: Test on mobile devices before desktop
- **SEO**: Follow SEO best practices for all content

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- Basic knowledge of Astro and Tailwind CSS
- Understanding of SEO principles

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/shaphero.github.io.git
   cd shaphero.github.io
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Process

### 1. Before You Start

- Check existing [issues](https://github.com/shaphero/shaphero.github.io/issues) to avoid duplicates
- For major changes, open an issue first to discuss
- Read the [CLAUDE.md](./CLAUDE.md) file for project conventions

### 2. Making Changes

#### Code Style

- **Components**: Use PascalCase (e.g., `HeroSection.astro`)
- **Files**: Use kebab-case (e.g., `seo-success.astro`)
- **CSS**: Prefer Tailwind utilities over custom CSS
- **JavaScript**: Keep it minimal, use async/await

#### Content Guidelines

- Start with user pain points, not solutions
- Use data and evidence to support claims
- Include real examples and case studies
- Keep paragraphs short and scannable
- Add relevant internal links

#### Component Development

When creating new components:

```astro
---
// Props interface at the top
interface Props {
  title: string;
  description?: string;
}

// Destructure props with defaults
const { title, description = '' } = Astro.props;
---

<!-- Use semantic HTML -->
<section class="...">
  <h2>{title}</h2>
  {description && <p>{description}</p>}
</section>
```

### 3. Testing Your Changes

Run these checks before submitting:

```bash
# Build the site
npm run build

# Preview the build
npm run preview

# Check PageSpeed (use Chrome DevTools or web.dev)
# Score must be 95+ on all metrics
```

#### Testing Checklist

- [ ] Build completes without errors
- [ ] No console errors in browser
- [ ] PageSpeed score remains 95+
- [ ] Works on mobile viewport
- [ ] Internal links are valid
- [ ] Images are optimized (WebP format preferred)
- [ ] Meta tags are unique per page

### 4. Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```bash
feat(homepage): add FAQ section with Reddit insights
fix(seo): correct schema markup for blog posts
docs: update README with new build commands
perf: optimize image loading with lazy loading
```

## 🔄 Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README.md if you've added new features
4. Submit PR with clear description:

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Build succeeds
- [ ] PageSpeed 95+
- [ ] Mobile responsive
- [ ] No console errors

## Screenshots (if applicable)
Before/after screenshots

## Checklist
- [ ] My code follows the project style
- [ ] I've tested on mobile
- [ ] I've updated documentation
- [ ] All links work
```

## 🏗️ Project Structure

Key directories to understand:

```
src/
├── components/     # Reusable Astro components
│   ├── common/    # Shared across pages
│   └── [page]/    # Page-specific components
├── pages/         # Routes (file = route)
├── layouts/       # Page templates
└── styles/        # Global CSS (minimal)
```

## 🤖 Working with AI Assistants

If using Claude Code, Cursor, or similar tools:

1. The `CLAUDE.md` file provides project context
2. Reference it for coding standards
3. AI-generated code must still meet all standards
4. Review AI suggestions carefully

## 📚 Resources

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PageSpeed Insights](https://pagespeed.web.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## ❓ Getting Help

- Open an [issue](https://github.com/shaphero/shaphero.github.io/issues) for bugs
- Contact dave@daveshap.com for questions
- Check existing issues and PRs first

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors.

### Expected Behavior

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Trolling or inflammatory comments
- Publishing others' private information

## 📄 License

By contributing, you agree that your contributions will be under the same license as the project.

---

Thank you for contributing to making this site better! 🚀