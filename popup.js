/**
 * CyberShield Popup Script
 * Displays security status and detected issues
 */

/**
 * Get current tab and ask content script for page status
 */
function getPageStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        // Send message to content script
        chrome.tabs.sendMessage(
            tab.id,
            { type: 'GET_PAGE_STATUS' },
            (response) => {
                if (!response) {
                    showLoadingError();
                    return;
                }

                updatePopupUI(response);
            }
        );
    });
}

/**
 * Update popup UI based on page status
 */
function updatePopupUI(status) {
    const statusCard = document.getElementById('statusCard');
    const issuesSection = document.getElementById('issuesSection');
    const safeSection = document.getElementById('safeSection');
    const issuesList = document.getElementById('issuesList');

    // Update status card
    const statusDot = statusCard.querySelector('.status-dot');
    const statusLabel = statusCard.querySelector('.status-label');
    const statusDomain = statusCard.querySelector('.status-domain');

    statusDomain.textContent = `Domain: ${status.domain}`;

    if (status.risks.length === 0) {
        // Page is safe
        statusDot.className = 'status-dot safe';
        statusLabel.textContent = '✅ Safe';
        statusCard.style.borderColor = '#27ae60';

        issuesSection.style.display = 'none';
        safeSection.style.display = 'block';
    } else {
        // Page has risks
        statusDot.className = 'status-dot warning';
        statusLabel.textContent = '⚠️ Suspicious';
        statusCard.style.borderColor = '#e74c3c';

        // Display issues
        issuesList.innerHTML = '';
        status.risks.forEach((risk) => {
            const issueItem = document.createElement('div');
            issueItem.className = 'issue-item';
            issueItem.textContent = risk;
            issuesList.appendChild(issueItem);
        });

        issuesSection.style.display = 'block';
        safeSection.style.display = 'none';
    }

    // Add connection status
    if (!status.isSecure) {
        const connectionIssue = document.createElement('div');
        connectionIssue.className = 'issue-item critical';
        connectionIssue.innerHTML = '<strong>🔓 Unencrypted Connection:</strong> This page uses HTTP instead of HTTPS. Do not enter sensitive information.';
        issuesList.insertBefore(connectionIssue, issuesList.firstChild);
    }
}

/**
 * Show error if page is not analyzable
 */
function showLoadingError() {
    const statusCard = document.getElementById('statusCard');
    const statusDot = statusCard.querySelector('.status-dot');
    const statusLabel = statusCard.querySelector('.status-label');

    statusDot.className = 'status-dot unknown';
    statusLabel.textContent = 'Unable to analyze';
    statusCard.style.borderColor = '#95a5a6';
}

// Load page status when popup opens
getPageStatus();

// Refresh status every 2 seconds (for dynamic changes)
setInterval(getPageStatus, 2000);
