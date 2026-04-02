/**
 * CyberShield Content Script
 * Main logic for password strength detection and phishing/social engineering warnings
 */

// ========== PASSWORD STRENGTH ANALYZER ==========

class PasswordStrengthAnalyzer {
    constructor() {
        this.detectedFields = new WeakMap();
        this.strengthMeters = new Map();
    }

    /**
     * Evaluate password strength based on multiple criteria
     * @param {string} password - The password to evaluate
     * @returns {object} - { strength: 'Weak'|'Medium'|'Strong', score: 0-100, message: string }
     */
    evaluateStrength(password) {
        let score = 0;

        // Length check (0-30 points)
        if (password.length >= 8) score += 10;
        if (password.length >= 12) score += 10;
        if (password.length >= 16) score += 10;

        // Uppercase check (0-20 points)
        if (/[A-Z]/.test(password)) score += 20;

        // Lowercase check (0-20 points)
        if (/[a-z]/.test(password)) score += 20;

        // Numbers check (0-15 points)
        if (/[0-9]/.test(password)) score += 15;

        // Special characters check (0-15 points)
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

        // Determine strength level
        let strength, message;
        if (score < 30) {
            strength = 'Weak';
            message = '❌ Very Weak Password';
        } else if (score < 50) {
            strength = 'Weak';
            message = '⚠️ Weak Password - Add uppercase, numbers, special chars';
        } else if (score < 75) {
            strength = 'Medium';
            message = '⚠️ Medium Password - Add more length or special chars';
        } else {
            strength = 'Strong';
            message = '✅ Strong Password';
        }

        return { strength, score, message };
    }

    /**
     * Create a floating strength meter UI
     */
    createStrengthMeter(inputField) {
        // Check if meter already exists
        if (this.strengthMeters.has(inputField)) {
            return this.strengthMeters.get(inputField);
        }

        const meter = document.createElement('div');
        meter.className = 'cybershield-strength-meter';
        meter.innerHTML = `
      <div class="strength-header">
        <span class="strength-label">Password Strength:</span>
        <span class="strength-level">Weak</span>
      </div>
      <div class="strength-bar">
        <div class="strength-fill"></div>
      </div>
      <div class="strength-message">Enter a password...</div>
    `;

        // Insert meter near the password field
        inputField.parentNode.insertBefore(meter, inputField.nextSibling);

        this.strengthMeters.set(inputField, meter);
        return meter;
    }

    /**
     * Update strength meter display
     */
    updateStrengthMeter(inputField, password) {
        if (!password) {
            if (this.strengthMeters.has(inputField)) {
                const meter = this.strengthMeters.get(inputField);
                meter.querySelector('.strength-level').textContent = 'Weak';
                meter.querySelector('.strength-message').textContent = 'Enter a password...';
                meter.querySelector('.strength-fill').style.width = '0%';
                meter.querySelector('.strength-fill').style.backgroundColor = '#ccc';
            }
            return;
        }

        const evaluation = this.evaluateStrength(password);
        const meter = this.strengthMeters.get(inputField);

        if (!meter) return;

        const levelSpan = meter.querySelector('.strength-level');
        const messageDiv = meter.querySelector('.strength-message');
        const fillBar = meter.querySelector('.strength-fill');

        levelSpan.textContent = evaluation.strength;
        messageDiv.textContent = evaluation.message;
        fillBar.style.width = evaluation.score + '%';

        // Color code the bar
        if (evaluation.score < 50) {
            fillBar.style.backgroundColor = '#e74c3c'; // Red
            meter.style.borderColor = '#e74c3c';
        } else if (evaluation.score < 75) {
            fillBar.style.backgroundColor = '#f39c12'; // Orange
            meter.style.borderColor = '#f39c12';
        } else {
            fillBar.style.backgroundColor = '#27ae60'; // Green
            meter.style.borderColor = '#27ae60';
        }
    }

    /**
     * Find all password fields and attach listeners
     */
    attachPasswordListeners() {
        const passwordFields = document.querySelectorAll('input[type="password"]');

        passwordFields.forEach((field) => {
            // Avoid duplicate listeners
            if (this.detectedFields.has(field)) return;

            this.detectedFields.set(field, true);

            // Create strength meter
            this.createStrengthMeter(field);

            // Listen to input events
            field.addEventListener('input', (e) => {
                this.updateStrengthMeter(field, e.target.value);
            });

            // Listen to focus events (ensure meter is visible)
            field.addEventListener('focus', () => {
                const meter = this.strengthMeters.get(field);
                if (meter) meter.style.display = 'block';
            });

            // Listen to blur events
            field.addEventListener('blur', () => {
                const meter = this.strengthMeters.get(field);
                if (meter && !field.value) {
                    meter.style.display = 'none';
                }
            });
        });
    }
}

// ========== PHISHING & SOCIAL ENGINEERING DETECTOR ==========

class PhishingDetector {
    constructor() {
        this.suspiciousKeywords = [
            'urgent',
            'verify now',
            'confirm identity',
            'account suspended',
            'click immediately',
            'unusual activity',
            'update account',
            'validate information',
            're-enter password',
            'secure your account',
            'limited time',
            'act now',
            'threat detected',
            'unauthorized access',
            'claim reward',
            'unlock account'
        ];

        this.warningBannerShown = false;
    }

    /**
     * Check if page uses HTTPS
     */
    isHTTPS() {
        return window.location.protocol === 'https:';
    }

    /**
     * Check for suspicious keywords in page content
     */
    checkSuspiciousKeywords() {
        const bodyText = document.body.innerText.toLowerCase();
        const found = [];

        this.suspiciousKeywords.forEach((keyword) => {
            if (bodyText.includes(keyword)) {
                found.push(keyword);
            }
        });

        return found;
    }

    /**
     * Check for sensitive information requested in forms (email, phone, password together)
     */
    checkSensitiveFormFields() {
        const forms = document.querySelectorAll('form');
        let issues = [];

        forms.forEach((form) => {
            const inputs = form.querySelectorAll('input[type="email"], input[type="password"], input[type="tel"], input[name*="phone"], input[name*="password"], input[name*="email"]');

            // If form has multiple sensitive fields, flag it
            if (inputs.length >= 2) {
                let hasPassword = false;
                let hasEmail = false;
                let hasPhone = false;

                inputs.forEach((input) => {
                    const type = input.type.toLowerCase();
                    const name = input.name.toLowerCase();

                    if (type === 'password' || name.includes('password')) hasPassword = true;
                    if (type === 'email' || name.includes('email')) hasEmail = true;
                    if (type === 'tel' || name.includes('phone')) hasPhone = true;
                });

                if ((hasPassword && hasEmail) || (hasEmail && hasPhone) || (hasPassword && hasPhone)) {
                    issues.push('Form asking for multiple sensitive fields at once');
                }
            }
        });

        return issues;
    }

    /**
     * Basic domain reputation check
     */
    checkDomainReputation() {
        const domain = window.location.hostname;
        const issues = [];

        // Check for randomized domains (suspicious)
        if (/^[a-z0-9]{20,}$/.test(domain)) {
            issues.push('Domain uses suspicious random characters');
        }

        // Check for domains that look like legitimate ones but are slightly off
        const commonDomains = ['google', 'facebook', 'amazon', 'microsoft', 'apple', 'paypal', 'bank'];
        const domainLower = domain.toLowerCase();

        commonDomains.forEach((common) => {
            if (domainLower.includes(common) && !domainLower.endsWith(common + '.com') && !domainLower.endsWith(common + '.org')) {
                issues.push(`Domain appears to mimic "${common}"`);
            }
        });

        return issues;
    }

    /**
     * Perform comprehensive phishing detection
     */
    detectPhishingRisks() {
        const risks = [];

        // Check HTTPS
        if (!this.isHTTPS()) {
            risks.push('⚠️ Page uses HTTP instead of HTTPS - Insecure connection!');
        }

        // Check for suspicious keywords
        const keywords = this.checkSuspiciousKeywords();
        if (keywords.length > 0) {
            risks.push(`⚠️ Page contains suspicious keywords: ${keywords.slice(0, 3).join(', ')}`);
        }

        // Check for sensitive form fields
        const formIssues = this.checkSensitiveFormFields();
        risks.push(...formIssues.map(issue => `⚠️ ${issue}`));

        // Check domain reputation
        const domainIssues = this.checkDomainReputation();
        risks.push(...domainIssues.map(issue => `⚠️ ${issue}`));

        return risks;
    }

    /**
     * Create and display warning banner
     */
    createWarningBanner(risks) {
        if (this.warningBannerShown) return;

        const banner = document.createElement('div');
        banner.id = 'cybershield-warning-banner';
        banner.className = 'cybershield-warning-banner';
        banner.innerHTML = `
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <strong>Potential phishing or social engineering risk detected</strong>
          <ul class="warning-list">
            ${risks.map((risk) => `<li>${risk}</li>`).join('')}
          </ul>
        </div>
        <button class="warning-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;

        document.body.insertBefore(banner, document.body.firstChild);
        this.warningBannerShown = true;
    }
}

// ========== INITIALIZE EXTENSION ==========

const passwordAnalyzer = new PasswordStrengthAnalyzer();
const phishingDetector = new PhishingDetector();

// Detect password fields on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        passwordAnalyzer.attachPasswordListeners();
        runPhishingDetection();
    });
} else {
    passwordAnalyzer.attachPasswordListeners();
    runPhishingDetection();
}

// Detect dynamically added password fields
const observer = new MutationObserver(() => {
    passwordAnalyzer.attachPasswordListeners();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/**
 * Run phishing detection and show warning if needed
 */
function runPhishingDetection() {
    const risks = phishingDetector.detectPhishingRisks();

    if (risks.length > 0) {
        phishingDetector.createWarningBanner(risks);

        // Send message to popup
        chrome.runtime.sendMessage({
            type: 'PHISHING_RISKS_DETECTED',
            risks: risks
        }).catch(() => {
            // Popup not open, ignore error
        });
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_PAGE_STATUS') {
        const risks = phishingDetector.detectPhishingRisks();
        sendResponse({
            isSecure: phishingDetector.isHTTPS(),
            risks: risks,
            domain: window.location.hostname
        });
    }
});
