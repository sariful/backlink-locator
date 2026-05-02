let targetDomains = [];
let foundLinks = [];
let scanTimeout = null;

chrome.storage.sync.get(['targetDomains'], (result) => {
    if (result.targetDomains && result.targetDomains.length > 0) {
        targetDomains = result.targetDomains;
        scanLinks();
        observeDOM(); // Start observing for dynamic content/SPAs
    }
});

function observeDOM() {
    // Watch for changes in the DOM (like lazy-loaded content or SPA page changes)
    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        for (const mutation of mutations) {
            // Only care about newly added nodes or changed href attributes
            if (mutation.addedNodes.length > 0 || mutation.type === 'attributes') {
                shouldScan = true;
                break;
            }
        }

        if (shouldScan) {
            // Debounce the scan to avoid freezing the browser on massive DOM updates
            clearTimeout(scanTimeout);
            scanTimeout = setTimeout(() => {
                scanLinks();
            }, 500); // Wait 500ms after the last change before scanning
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href']
    });
}

function scanLinks() {
    const links = document.querySelectorAll('a');
    foundLinks = []; // Reset the list so we don't get duplicates on re-scans

    links.forEach((link, index) => {
        try {
            if (!link.href) return;

            // Handle relative URLs if they somehow get picked up, but href usually resolves to absolute
            const url = new URL(link.href);
            const currentHostname = window.location.hostname;

            const isTarget = targetDomains.some(domain => {
                // Strip protocols and www if user pasted them
                const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                
                // If the current website is the target domain itself, skip it
                if (currentHostname === cleanDomain || currentHostname.endsWith('.' + cleanDomain)) {
                    return false;
                }

                // Match domain exactly or subdomains
                return url.hostname === cleanDomain || url.hostname.endsWith('.' + cleanDomain);
            });

            if (isTarget) {
                // Determine rel status
                let relStatus = link.getAttribute('rel') || '';
                const originalRel = relStatus;
                relStatus = relStatus.toLowerCase();

                let relType = 'dofollow'; // default if no nofollow is found
                if (relStatus.includes('nofollow')) {
                    relType = 'nofollow';
                }
                if (relStatus.includes('ugc')) {
                    relType += ' ugc';
                }
                if (relStatus.includes('sponsored')) {
                    relType += ' sponsored';
                }

                // Give it a title for native hover tooltip on the link itself
                link.title = `Target Link | Rel: ${originalRel || 'None'} (${relType})`;

                // Give it a unique ID to scroll to if needed
                const linkId = `locator-link-${index}`;
                if (!link.id) {
                    link.id = linkId;
                }

                foundLinks.push({
                    element: link,
                    id: link.id,
                    href: link.href,
                    text: link.innerText.trim().substring(0, 50) || 'Image/Empty Link',
                    rel: relType,
                    originalRel: originalRel || 'None'
                });
            }
        } catch (e) {
            // Ignore invalid URLs
        }
    });

    if (foundLinks.length > 0) {
        updateWidget();
    } else {
        removeWidget();
    }
}

function updateWidget() {
    let widget = document.getElementById('link-locator-widget');
    let isExpanded = false;

    // If widget already exists, remember if it was open before we destroy it
    if (widget) {
        isExpanded = widget.classList.contains('expanded');
        widget.remove();
    }

    widget = document.createElement('div');
    widget.id = 'link-locator-widget';
    if (isExpanded) {
        widget.classList.add('expanded');
    }

    const header = document.createElement('div');
    header.id = 'link-locator-header';
    header.innerHTML = `<span>${foundLinks.length} target link(s) found</span> <span id="locator-toggle" style="margin-left: 10px;">${isExpanded ? '▲' : '▼'}</span>`;

    header.addEventListener('click', () => {
        widget.classList.toggle('expanded');
        const toggle = document.getElementById('locator-toggle');
        toggle.innerText = widget.classList.contains('expanded') ? '▲' : '▼';
    });

    const list = document.createElement('ul');
    list.id = 'link-locator-list';

    foundLinks.forEach(item => {
        const li = document.createElement('li');
        li.className = 'link-locator-item';
        li.title = `Rel: ${item.originalRel}`; // Tooltip on hover in the widget

        li.innerHTML = `
      <span class="link-locator-url">${item.href}</span>
      <span class="link-locator-rel">${item.rel.toUpperCase()}</span>
    `;

        li.addEventListener('click', () => {
            // Scroll to element
            item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Highlight temporarily
            item.element.classList.add('link-locator-highlight');
            setTimeout(() => {
                item.element.classList.remove('link-locator-highlight');
            }, 2000);
        });

        list.appendChild(li);
    });

    widget.appendChild(header);
    widget.appendChild(list);
    document.body.appendChild(widget);
}

function removeWidget() {
    const widget = document.getElementById('link-locator-widget');
    if (widget) {
        widget.remove();
    }
}
