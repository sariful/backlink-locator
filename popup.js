document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('domains');
    const saveBtn = document.getElementById('save');
    const status = document.getElementById('status');

    chrome.storage.sync.get(['targetDomains'], (result) => {
        if (result.targetDomains) {
            textarea.value = result.targetDomains.join('\n');
        }
    });

    saveBtn.addEventListener('click', () => {
        const domains = textarea.value.split(/[\n,]/).map(d => d.trim()).filter(d => d);
        chrome.storage.sync.set({ targetDomains: domains }, () => {
            status.style.display = 'block';
            setTimeout(() => { status.style.display = 'none'; }, 2000);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });
});
