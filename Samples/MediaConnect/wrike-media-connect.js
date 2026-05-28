(function() {
    const currentScript = document.currentScript;
    if (!currentScript) {
        console.error('Wrike Media Connect: Unable to locate script tag.');
        return;
    }

    const mode = currentScript.getAttribute('data-mode') || 'display'; // 'display', 'create', or 'update'
    const targetId = currentScript.getAttribute('data-target');
    const campaignId = currentScript.getAttribute('data-campaign-id');
    const rawCreationPayload = currentScript.getAttribute('data-creation-payload');
    const rawUpdatePayload = currentScript.getAttribute('data-update-payload');
    let creationPayload = null;
    let updatePayload = null;

    if (!targetId) {
        console.error('Wrike Media Connect: Missing required data-target attribute.');
        return;
    }

    if ((mode === 'display' || mode === 'update') && !campaignId) {
        console.error(`Wrike Media Connect: Missing data-campaign-id attribute for ${mode} mode.`);
        return;
    }

    if (mode === 'create') {
        try {
            if (rawCreationPayload) {
                creationPayload = JSON.parse(rawCreationPayload);
            } else {
                console.error('Wrike Media Connect: Missing data-creation-payload attribute for create mode.');
                return;
            }
        } catch (e) {
            console.error('Wrike Media Connect: Invalid data-creation-payload JSON.', e);
            return;
        }
    }

    if (mode === 'update' && rawUpdatePayload) {
        try {
            updatePayload = JSON.parse(rawUpdatePayload);
        } catch (e) {
            console.error('Wrike Media Connect: Invalid data-update-payload JSON.', e);
            return;
        }
    }

    const rawDisplayAttr = currentScript.getAttribute('data-display-attr');
    const rawCallbackAttr = currentScript.getAttribute('data-callback-attr');
    
    let displayAttr = ['campaignname', 'campaignstartdate', 'campaignenddate', 'status', 'client', 'debtor'];
    try { if (rawDisplayAttr) displayAttr = JSON.parse(rawDisplayAttr); } catch (e) { console.warn('Invalid data-display-attr JSON'); }
    
    let callbackAttr = [];
    try { if (rawCallbackAttr) callbackAttr = JSON.parse(rawCallbackAttr); } catch (e) { console.warn('Invalid data-callback-attr JSON'); }

    const colors = {
        primary: currentScript.getAttribute('data-color-primary') || '#1E40AF',
        background: currentScript.getAttribute('data-color-background') || '#FFFFFF',
        text: currentScript.getAttribute('data-color-text') || '#111827',
        accent: currentScript.getAttribute('data-color-accent') || '#3B82F6'
    };

    const defaultLabelMap = {
        'campaignname': 'Campaign Name',
        'campaignstartdate': 'Start Date',
        'campaignenddate': 'End Date',
        'status': 'Status',
        'client': 'Client',
        'debtor': 'Debtor',
        'campaignbudget': 'Budget',
        'currency': 'Currency'
    };

    let labelMap = { ...defaultLabelMap };
    try {
        const storedMappingsJSON = localStorage.getItem('wmc_cfg_label_map');
        if (storedMappingsJSON) {
            const storedMappings = JSON.parse(storedMappingsJSON);
            if (Array.isArray(storedMappings)) {
                const customMap = storedMappings.reduce((acc, mapping) => {
                    if (mapping.key) {
                        // If label is empty, use the key itself as the label.
                        acc[mapping.key] = mapping.label || mapping.key;
                    }
                    return acc;
                }, {});
                // The user's custom map takes precedence over defaults.
                labelMap = { ...defaultLabelMap, ...customMap };
            }
        }
    } catch (e) {
        console.warn('Wrike Media Connect: Could not parse custom label map from localStorage.', e);
    }

    // Configuration
    let baseUrl = localStorage.getItem('wmc_cfg_xpi_base_url') || 'https://xpi-api.gowrike.space/';
    baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const clientId = localStorage.getItem('wmc_cfg_xpi_client_id') || 'MediaConnectWidget';
    
    function initWidget() {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) {
            console.error(`Wrike Media Connect: Target element #${targetId} not found.`);
            return;
        }

        // Attach Shadow DOM to isolate styles
        const shadow = targetEl.attachShadow({ mode: 'open' });
        
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: ${colors.text};
                background-color: ${colors.background};
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
                width: 100%;
                max-width: 400px;
                min-width: 280px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .header {
                background-color: ${colors.primary};
                color: #ffffff;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .header-title {
                font-weight: 600;
                font-size: 14px;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .header-actions button, .header-actions a {
                background: none;
                border: none;
                color: #ffffff;
                cursor: pointer;
                margin-left: 8px;
                text-decoration: none;
                font-size: 14px;
            }
            .body {
                padding: 16px;
                font-size: 13px;
            }
            .row {
                display: flex;
                margin-bottom: 8px;
            }
            .row:last-child {
                margin-bottom: 0;
            }
            .label {
                font-weight: 600;
                width: 40%;
                color: #4b5563;
            }
            .value {
                width: 60%;
                word-break: break-word;
            }
            .footer {
                border-top: 1px solid #e5e7eb;
                padding: 8px 16px;
                font-size: 11px;
                color: #6b7280;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .btn {
                background-color: ${colors.accent};
                color: #ffffff;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                width: 100%;
                font-size: 14px;
            }
            .btn:hover {
                opacity: 0.9;
            }
            .error-msg {
                color: #dc2626;
                margin-bottom: 12px;
                font-size: 13px;
            }
            .success-banner {
                background-color: #d1fae5;
                border: 1px solid #6ee7b7;
                color: #065f46;
                padding: 10px 12px;
                border-radius: 4px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
                font-weight: 500;
            }
            .success-banner button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                color: #065f46;
                padding: 0 0 0 8px;
                line-height: 1;
            }
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background-color: #fff;
                border-radius: 8px;
                width: 90%;
                height: 90%;
                max-width: 1200px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            .modal-header {
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #e5e7eb;
            }
            .modal-title {
                font-weight: 600;
                font-size: 16px;
                color: #111827;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .modal-header .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                line-height: 1;
                padding: 0 8px;
            }
            .modal-body {
                flex-grow: 1;
                padding: 0;
                overflow: hidden;
            }
            .modal-body iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
        `;
        shadow.appendChild(style);

        const container = document.createElement('div');
        shadow.appendChild(container);

        function openWrikeDialog(campaignName) {
            const entityType = 'ApiV4Folder'; // From Wrike-InlineDialog.md
            const iframeUrl = `https://app-eu.wrike.com/frontend/ts_wrike_embeddable_work_item_app/index.html?entityId=${campaignId}&entityType=${entityType}`;

            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            modalOverlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <span class="modal-title" title="${campaignName || 'Wrike Item'}">${campaignName || 'Wrike Item'}</span>
                        <button class="close-btn" title="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <iframe src="${iframeUrl}"></iframe>
                    </div>
                </div>
            `;

            shadow.appendChild(modalOverlay);

            const closeModal = () => {
                if (modalOverlay.parentNode === shadow) {
                    shadow.removeChild(modalOverlay);
                }
            };

            modalOverlay.querySelector('.close-btn').addEventListener('click', closeModal);

            modalOverlay.addEventListener('click', (e) => {
                // Close if clicking on the overlay, but not on the content
                if (e.target === modalOverlay) {
                    closeModal();
                }
            });
        }

        function dispatchData(data) {
            const payload = {};
            callbackAttr.forEach(attr => {
                payload[attr] = data[attr] || '';
            });
            targetEl.dispatchEvent(new CustomEvent('wrike-media-connect:data', { detail: payload }));
        }

        function dispatchError(code, message) {
            targetEl.dispatchEvent(new CustomEvent('wrike-media-connect:error', { detail: { code, message } }));
        }

        function formatDate(dateStr) {
            if (!dateStr) return '—';
            try {
                return new Intl.DateTimeFormat(navigator.language).format(new Date(dateStr));
            } catch(e) {
                return dateStr;
            }
        }

        let lastFetchedData = null;

        // BroadcastChannel syncs auth state across all widget instances (same page + cross-tab)
        const authChannel = (() => {
            try { return new BroadcastChannel('wmc_auth_channel'); } catch(e) { return null; }
        })();
        if (authChannel) {
            authChannel.addEventListener('message', (e) => {
                if (e.data && e.data.type === 'wmc_token_changed') renderUI();
            });
        }

        function renderUI() {
            // Normalise: callback.html may have written wmc_auth_token before standardisation
            const legacyToken = localStorage.getItem('wmc_auth_token');
            if (legacyToken && !localStorage.getItem('wmc_oauth_token')) {
                localStorage.setItem('wmc_oauth_token', legacyToken);
            }
            const token = localStorage.getItem('wmc_oauth_token');
            if (!token) {
                const buttonText = mode === 'create' ? 'Connect to Create Campaign'
                                 : mode === 'update' ? 'Connect to Update Campaign'
                                 : 'Connect to Wrike';
                renderLogin('', buttonText);
            } else {
                if (mode === 'create') {
                    renderCreateForm();
                } else {
                    fetchCampaignData(token);
                }
            }
        }

        function renderLogin(errorMsg = '', buttonText = 'Connect to Wrike') {
            container.innerHTML = `
                <div class="header">
                    <h3 class="header-title">Wrike Media Connect</h3>
                </div>
                <div class="body">
                    ${errorMsg ? `<div class="error-msg">${errorMsg}</div>` : '<p style="margin-top:0; margin-bottom: 16px;">Authentication required to view campaign.</p>'}
                    <button class="btn" id="login-btn">${buttonText}</button>
                </div>
            `;
            shadow.getElementById('login-btn').addEventListener('click', handleLogin);
        }

        function handleLogin() {
            let scriptUrl = new URL(currentScript.src, window.location.href);
            let callbackPath = new URL('callback.html', scriptUrl.origin + scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/') + 1)).href;
            
            const redirectUri = encodeURIComponent(callbackPath);
            const state = btoa(JSON.stringify({ baseUrl, clientId })); // Pass config safely
            const authUrl = `${baseUrl}?accountId=3128883&client_id=${clientId}&autoRedirect=1&redirectUri=${redirectUri}&state=${state}&environmentId=e9cc03d5-b645-4720-b6e4-d260ae0027bb`;
            
            window.open(authUrl, 'WrikeAuth', 'width=600,height=700');
            
        let pollInterval;
        let timeoutId;

        const cleanup = () => {
            window.removeEventListener('message', onMessage);
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutId) clearTimeout(timeoutId);
        };

        // Polling catches the token when postMessage is blocked (e.g. cross-origin popup)
        pollInterval = setInterval(() => {
            try {
                const token = localStorage.getItem('wmc_oauth_token') || localStorage.getItem('wmc_auth_token');
                if (token) {
                    cleanup();
                    localStorage.setItem('wmc_oauth_token', token);
                    if (authChannel) authChannel.postMessage({ type: 'wmc_token_changed' });
                    renderUI();
                }
            } catch (err) {
                console.warn('Wrike Media Connect: Error accessing localStorage', err);
                cleanup();
            }
        }, 1000);

        // Safety fallback: Stop polling after 5 minutes
        timeoutId = setTimeout(() => {
            if (pollInterval) clearInterval(pollInterval);
        }, 5 * 60 * 1000);

            const onMessage = function(e) {
                if (e.data && e.data.type === 'wmc_auth_success') {
                    cleanup();
                    localStorage.setItem('wmc_oauth_token', e.data.token);
                    if (authChannel) authChannel.postMessage({ type: 'wmc_token_changed' });
                    renderUI();
                } else if (e.data === 'wmc_auth_error' || (e.data && e.data.type === 'wmc_auth_error')) {
                    cleanup();
                    renderLogin('Authentication failed. Please try again.');
                }
            };
            window.addEventListener('message', onMessage);
        }

        function handleLogout() {
            localStorage.removeItem('wmc_oauth_token');
            localStorage.removeItem('wmc_auth_token');
            if (authChannel) authChannel.postMessage({ type: 'wmc_token_changed' });
            renderUI();
        }

        function renderCreateForm(errorMsg = '', isSubmitting = false) {
            container.innerHTML = `
                <div class="header">
                    <h3 class="header-title">Create New Wrike Campaign</h3>
                    <div class="header-actions">
                        <button id="logout-btn" title="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="display: block; width: 14px; height: 14px;">
                                <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"></path>
                                <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="body">
                    ${errorMsg ? `<div class="error-msg">${errorMsg}</div>` : '<p style="margin-top:0; margin-bottom: 16px;">Ready to create a new campaign using the provided configuration.</p>'}
                    <button class="btn" id="create-campaign-btn" ${isSubmitting ? 'disabled' : ''}>
                        ${isSubmitting ? 'Creating...' : 'Create Campaign'}
                    </button>
                </div>
            `;
            shadow.getElementById('logout-btn').addEventListener('click', handleLogout);
            if (!isSubmitting) {
                shadow.getElementById('create-campaign-btn').addEventListener('click', handleCreateCampaign);
            }
        }

        async function handleCreateCampaign() {
            const token = localStorage.getItem('wmc_oauth_token');
            if (!token) {
                renderLogin('Session expired. Please reconnect.', 'Connect to Create Campaign');
                return;
            }

            renderCreateForm('', true); // Show submitting state

            try {
                // Allow for dynamic timestamp in payload
                let payloadString = JSON.stringify(creationPayload);
                payloadString = payloadString.replace('{{timestamp}}', new Date().toISOString());
                const finalPayload = JSON.parse(payloadString);

                const response = await fetch(`${baseUrl}api/v1/wrikexpi/campaign`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(finalPayload)
                });

                if (response.status === 401) {
                    renderLogin('Session expired. Please reconnect.', 'Connect to Create Campaign');
                    return;
                }

                const resData = await response.json();

                if (!response.ok || !resData.success) {
                    const errorMessage = (resData.data && resData.data.error_description) || resData.message || `HTTP ${response.status}`;
                    throw new Error(errorMessage);
                }
                
                const newCampaign = resData.data || {};
                const newCampaignId = newCampaign.id;
                const newCampaignPermalink = newCampaign.permalink;

                if (!newCampaignId) {
                    throw new Error('Campaign created, but no ID was returned in the response.');
                }

                // Dispatch success event
                targetEl.dispatchEvent(new CustomEvent('wrike-media-connect:created', { detail: { id: newCampaignId, permalink: newCampaignPermalink } }));

                // Render success state
                container.innerHTML = `
                    <div class="header">
                        <h3 class="header-title">Success!</h3>
                    </div>
                    <div class="body">
                        <p style="margin-top:0; margin-bottom: 16px;">Campaign created successfully.</p>
                        <div class="row">
                            <div class="label">ID</div>
                            <div class="value" style="word-break: break-all;">${newCampaignId}</div>
                        </div>
                        <div class="row" style="margin-top: 8px;">
                            <div class="label">Link</div>
                            <div class="value"><a href="${newCampaignPermalink}" target="_blank" style="color: ${colors.accent};">Open in Wrike</a></div>
                        </div>
                        <button class="btn" id="create-another-btn" style="margin-top: 16px;">Create Another</button>
                    </div>
                `;
                shadow.getElementById('create-another-btn').addEventListener('click', renderCreateForm);
            } catch (error) {
                dispatchError('CAMPAIGN_CREATION_FAILED', error.message);
                renderCreateForm(`Failed to create campaign: ${error.message}`);
            }
        }

        async function fetchCampaignData(token) {
            container.innerHTML = `
                <div class="header">
                    <h3 class="header-title">Loading...</h3>
                </div>
                <div class="body">
                    <p>Fetching campaign details...</p>
                </div>
            `;
            
            try {
                const response = await fetch(`${baseUrl}api/v1/wrikexpi/campaign/${campaignId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401) {
                    renderLogin('Session expired. Please reconnect.');
                    return;
                }

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const resData = await response.json();
                const data = resData.data || resData; // Accommodate standard API wrappers

                lastFetchedData = data;
                dispatchData(data);
                if (mode === 'update') {
                    renderUpdateWidget(data);
                } else {
                    renderCampaign(data);
                }

            } catch (error) {
                dispatchError('CAMPAIGN_FETCH_FAILED', error.message);
                container.innerHTML = `
                    <div class="header">
                        <h3 class="header-title">Error</h3>
                    </div>
                    <div class="body">
                        <div class="error-msg">Failed to load campaign: ${error.message}</div>
                        <button class="btn" id="retry-btn">Retry</button>
                    </div>
                `;
                shadow.getElementById('retry-btn').addEventListener('click', () => fetchCampaignData(token));
            }
        }

        function renderCampaign(data) {
            let rowsHtml = '';
            displayAttr.forEach(attr => {
                let val = data[attr] || '—';
                if (val !== '—' && (attr === 'campaignstartdate' || attr === 'campaignenddate')) {
                    val = formatDate(data[attr]);
                } else if (attr === 'status' && !data[attr]) {
                    val = '—';
                }
                
                const label = labelMap[attr] || attr;
                
                rowsHtml += `
                    <div class="row">
                        <div class="label">${label}</div>
                        <div class="value">${val}</div>
                    </div>
                `;
            });

            const permalink = data.permalink || '';
            const now = new Date().toLocaleTimeString(navigator.language);

            container.innerHTML = `
                <div class="header">
                    <h3 class="header-title" title="${data.campaignname || 'Campaign Details'}">${data.campaignname || 'Campaign Details'}</h3>
                    <div class="header-actions">
                        <button id="refresh-btn" title="Manual Refresh">🔄</button>
                        ${permalink ? `<button id="open-in-wrike-btn" title="Open in Wrike">↗</button>` : ''}
                        <button id="logout-btn" title="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="display: block; width: 14px; height: 14px;">
                                <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"></path>
                                <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="body">
                    ${rowsHtml}
                </div>
                <div class="footer">
                    <span>Updated: ${now}</span>
                    <span title="Connected">⚡</span>
                </div>
            `;

            shadow.getElementById('refresh-btn').addEventListener('click', () => fetchCampaignData(localStorage.getItem('wmc_oauth_token')));
            shadow.getElementById('logout-btn').addEventListener('click', handleLogout);
            const openInWrikeBtn = shadow.getElementById('open-in-wrike-btn');
            if (openInWrikeBtn) {
                openInWrikeBtn.addEventListener('click', () => openWrikeDialog(data.campaignname));
            }
        }

        function renderUpdateWidget(data, isSubmitting = false, errorMsg = '') {
            let rowsHtml = '';
            displayAttr.forEach(attr => {
                let val = data[attr] || '—';
                if (val !== '—' && (attr === 'campaignstartdate' || attr === 'campaignenddate')) {
                    val = formatDate(data[attr]);
                } else if (attr === 'status' && !data[attr]) {
                    val = '—';
                }
                const label = labelMap[attr] || attr;
                rowsHtml += `
                    <div class="row">
                        <div class="label">${label}</div>
                        <div class="value">${val}</div>
                    </div>
                `;
            });

            const permalink = data.permalink || '';
            const now = new Date().toLocaleTimeString(navigator.language);

            container.innerHTML = `
                <div class="header">
                    <h3 class="header-title" title="${data.campaignname || 'Update Campaign'}">${data.campaignname || 'Update Campaign'}</h3>
                    <div class="header-actions">
                        <button id="refresh-btn" title="Refresh">🔄</button>
                        ${permalink ? `<button id="open-in-wrike-btn" title="Open in Wrike">↗</button>` : ''}
                        <button id="logout-btn" title="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="display: block; width: 14px; height: 14px;">
                                <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"></path>
                                <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="body">
                    ${errorMsg ? `<div class="error-msg">${errorMsg}</div>` : ''}
                    ${rowsHtml}
                    <button class="btn" id="update-btn" style="margin-top: 12px;" ${isSubmitting ? 'disabled' : ''}>
                        ${isSubmitting ? 'Updating...' : 'Update to Wrike'}
                    </button>
                </div>
                <div class="footer">
                    <span>Loaded: ${now}</span>
                    <span title="Connected">⚡</span>
                </div>
            `;

            shadow.getElementById('refresh-btn').addEventListener('click', () => fetchCampaignData(localStorage.getItem('wmc_oauth_token')));
            shadow.getElementById('logout-btn').addEventListener('click', handleLogout);
            const openInWrikeBtn = shadow.getElementById('open-in-wrike-btn');
            if (openInWrikeBtn) {
                openInWrikeBtn.addEventListener('click', () => openWrikeDialog(data.campaignname));
            }
            if (!isSubmitting) {
                shadow.getElementById('update-btn').addEventListener('click', handleUpdateCampaign);
            }
        }

        async function handleUpdateCampaign() {
            const token = localStorage.getItem('wmc_oauth_token');
            if (!token) {
                renderLogin('Session expired. Please reconnect.', 'Connect to Update Campaign');
                return;
            }

            // Dynamic payload from host app takes precedence over static attribute payload
            let payload = updatePayload;
            try {
                const dynamicPayload = targetEl.dataset.wmcUpdatePayload;
                if (dynamicPayload) payload = JSON.parse(dynamicPayload);
            } catch (e) {
                console.warn('Wrike Media Connect: Invalid dynamic update payload on target element.', e);
            }

            if (!payload || Object.keys(payload).length === 0) {
                dispatchError('UPDATE_PAYLOAD_MISSING', 'No update payload provided.');
                renderUpdateWidget(lastFetchedData, false, 'No update payload provided. Set data-update-payload or targetEl.dataset.wmcUpdatePayload.');
                return;
            }

            renderUpdateWidget(lastFetchedData, true);

            try {
                const response = await fetch(`${baseUrl}api/v1/wrikexpi/campaign/${campaignId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.status === 401) {
                    renderLogin('Session expired. Please reconnect.', 'Connect to Update Campaign');
                    return;
                }

                const resData = await response.json();

                if (!response.ok || !resData.success) {
                    const errorMessage = (resData.data && resData.data.error_description) || resData.message || `HTTP ${response.status}`;
                    throw new Error(errorMessage);
                }

                const updatedData = resData.data || lastFetchedData;
                lastFetchedData = updatedData;

                targetEl.dispatchEvent(new CustomEvent('wrike-media-connect:updated', { detail: updatedData }));

                renderUpdateSuccess(updatedData);

            } catch (error) {
                dispatchError('CAMPAIGN_UPDATE_FAILED', error.message);
                renderUpdateWidget(lastFetchedData, false, `Failed to update campaign: ${error.message}`);
            }
        }

        function renderUpdateSuccess(data) {
            let rowsHtml = '';
            displayAttr.forEach(attr => {
                let val = data[attr] || '—';
                if (val !== '—' && (attr === 'campaignstartdate' || attr === 'campaignenddate')) {
                    val = formatDate(data[attr]);
                } else if (attr === 'status' && !data[attr]) {
                    val = '—';
                }
                const label = labelMap[attr] || attr;
                rowsHtml += `
                    <div class="row">
                        <div class="label">${label}</div>
                        <div class="value">${val}</div>
                    </div>
                `;
            });

            const permalink = data.permalink || '';
            const now = new Date().toLocaleTimeString(navigator.language);

            container.innerHTML = `
                <div class="header">
                    <h3 class="header-title" title="${data.campaignname || 'Campaign'}">${data.campaignname || 'Campaign'}</h3>
                    <div class="header-actions">
                        ${permalink ? `<button id="open-in-wrike-btn" title="Open in Wrike">↗</button>` : ''}
                        <button id="logout-btn" title="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="display: block; width: 14px; height: 14px;">
                                <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"></path>
                                <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="body">
                    <div class="success-banner">
                        Campaign updated successfully
                        <button id="dismiss-success-btn" title="Dismiss">✕</button>
                    </div>
                    ${rowsHtml}
                </div>
                <div class="footer">
                    <span>Updated: ${now}</span>
                    <span title="Connected">⚡</span>
                </div>
            `;

            shadow.getElementById('dismiss-success-btn').addEventListener('click', () => renderCampaign(data));
            shadow.getElementById('logout-btn').addEventListener('click', handleLogout);
            const openInWrikeBtn = shadow.getElementById('open-in-wrike-btn');
            if (openInWrikeBtn) {
                openInWrikeBtn.addEventListener('click', () => openWrikeDialog(data.campaignname));
            }
        }

        targetEl.dispatchEvent(new CustomEvent('wrike-media-connect:ready'));
        renderUI();
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();