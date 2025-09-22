# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 🚨 Do NOT

- Open a public GitHub issue
- Post about it on social media
- Share details publicly before it's fixed

### ✅ Do

1. Email dave@daveshap.com immediately
2. Include "SECURITY" in the subject line
3. Provide detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 48 hours
- **Resolution Target**: Within 7 days for critical issues

## Security Best Practices

### API Keys and Secrets

- **NEVER** commit API keys or secrets to the repository
- Use environment variables for all sensitive data
- Add `.env` to `.gitignore` (already configured)
- Rotate credentials regularly

### Content Security

#### Current Implementation
```html
<!-- CSP Headers via meta tags -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

#### JavaScript Security
- Minimal JavaScript usage (< 5KB total)
- No third-party scripts except analytics
- All user inputs sanitized
- No eval() or dynamic code execution

### Dependencies

#### Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Auto-fix when possible
npm audit fix

# Check outdated packages
npm outdated
```

#### Current Security Measures
- Dependabot alerts enabled
- Weekly dependency reviews
- Only essential dependencies used
- Static site generation (no runtime vulnerabilities)

### GitHub Configuration

#### Branch Protection
- Main branch protected
- Requires PR reviews
- No force pushes
- Status checks required

#### Actions Security
- Minimal permissions
- No secret exposure in logs
- Trusted actions only
- Regular workflow audits

## Static Site Security Advantages

As a static site, we have inherent security benefits:

### ✅ Immune To
- SQL injection
- Server-side code execution
- Database breaches
- Session hijacking
- Most OWASP Top 10 vulnerabilities

### ⚠️ Still Important
- XSS prevention in any dynamic content
- Proper CORS configuration
- Secure headers
- HTTPS enforcement
- Input validation on contact forms

## Security Checklist for Contributors

Before submitting code:

- [ ] No hardcoded secrets or API keys
- [ ] No sensitive data in comments
- [ ] Dependencies updated and audited
- [ ] User inputs properly sanitized
- [ ] No use of eval() or innerHTML with user data
- [ ] External links use rel="noopener noreferrer"
- [ ] Forms include CSRF protection where applicable

## Third-Party Services

### Currently Integrated
- GitHub Pages (hosting)
- GitHub Actions (CI/CD)
- Google Analytics (analytics)

### Security Review Required For
- New third-party scripts
- External API integrations
- Form handlers
- Analytics tools

## Incident Response

### If a Security Issue is Discovered

1. **Immediate Actions**
   - Assess scope and impact
   - Implement temporary mitigation
   - Document the issue

2. **Communication**
   - Notify affected parties if data exposed
   - Prepare security advisory
   - Update this document with lessons learned

3. **Resolution**
   - Deploy permanent fix
   - Verify fix effectiveness
   - Monitor for similar issues

## Security Headers

Recommended headers for production:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Contact

**Security Contact**: Dave Shapiro
**Email**: dave@daveshap.com
**Response Time**: Within 24 hours

---

*This security policy is regularly reviewed and updated. Last update: December 2025*