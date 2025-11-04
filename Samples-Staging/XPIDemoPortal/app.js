/*
 * XPI Portal Application Logic - Core
 * app.js
 */

// Define the global App object
const App = {};

(function(App) {
    // --- State ---
    App.state = {
        isLoggedIn: false,
        currentUser: null, // { firstName, lastName, avatarUrl }
        xpiBaseUrl: 'https://xpi-api.gowrike.space/',
        initializedModules: new Set(),
    };

    // --- Constants ---
    App.MODULE_CONFIG = [
        { code: 'MOD.C', name: 'Campaign Submission', hash: '#campaign-submission', type: 'User-defined' },
        { code: 'MAS.DemoCient', name: 'Demo Client', hash: '#demo-client', type: 'User-defined' },
        { code: 'MAS.XPICFMapping', name: 'XPI Field Mapping', hash: '#xpi-cf-mapping', type: 'User-defined' },
        { code: 'MOD.A', name: 'Admin', hash: '#admin', type: 'Built-in' },
        { code: 'MOD.B', name: 'Login', hash: '#login', type: 'Built-in' },
    ];
    
    App.MASTER_DATA_SCHEMAS = {
        'demoxpiclients': {
            title: 'Demo Clients',
            fields: [
                { id: 'id', label: 'ID', readonly: true },
                { id: 'value', label: 'Value', required: true },
                { id: 'note', label: 'Note' },
                { id: 'fincode', label: 'FinCode' },
                { id: 'code', label: 'Code' },
            ],
            odataContext: 'https://api.wrikexpi.groupm.com/api/v1/v1.0/demoxpiclients' // Example, will use dynamic URL
        },
        'xpicfmapping': {
            title: 'XPI CF Mapping',
            fields: [
                { id: 'id', label: 'ID', readonly: true },
                { id: 'value', label: 'Value', required: true },
                { id: 'CF Name', label: 'CF Name' }, // Handle spaces in key
            ],
            odataContext: 'https://api.wrikexpi.groupm.com/api/v1/v1.0/xpicfmapping' // Example, will use dynamic URL
        }
    };

    // --- DOM Cache ---
    App.dom = {};
})(App);

// === Styling Module ===
(function(App) {
    const STYLE_MAP = {
        'styled-body': 'bg-gray-900 text-gray-100',
        'styled-sidebar': 'w-64 bg-gray-800 flex flex-col h-full transition-all duration-300 z-30',
        'styled-sidebar-hidden': 'w-20 bg-gray-800 flex flex-col h-full transition-all duration-300 z-30',
        'styled-main-content': 'flex-1 h-full bg-gray-900 transition-all duration-300',
        'styled-btn-icon': 'p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500',
        'styled-user-profile': 'p-4 border-t border-gray-700 flex items-center',
        'styled-nav-link': 'flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white',
        'styled-nav-link-active': 'flex items-center p-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-lg',
        'styled-h2': 'text-3xl font-bold text-white mb-6',
        'styled-form-card': 'bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl',
        'styled-label': 'block text-sm font-medium text-gray-300 mb-2',
        'styled-input': 'block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
        'styled-select': 'block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
        'styled-btn-primary': 'px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 disabled:opacity-50',
        'styled-btn-secondary': 'px-5 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 disabled:opacity-50',
        'styled-btn-danger': 'px-5 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 disabled:opacity-50',
        'styled-pre-error': 'p-4 bg-red-900 bg-opacity-50 border border-red-700 text-red-200 rounded-lg text-left text-sm overflow-x-auto',
        'styled-pre-success': 'p-4 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg text-left text-sm overflow-x-auto',
        'styled-modal-backdrop': 'fixed inset-0 bg-black bg-opacity-75 z-40',
        'styled-modal-dialog': 'bg-gray-800 rounded-xl shadow-2xl p-6 z-50 w-full flex flex-col fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'styled-table': 'min-w-full divide-y divide-gray-700',
        'styled-table-header': 'bg-gray-700',
        'styled-table-th': 'px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider',
        'styled-table-td': 'px-4 py-3 whitespace-nowrap text-sm text-gray-100',
        'styled-tag': 'flex items-center bg-indigo-600 text-white text-sm font-medium px-2.5 py-1 rounded-full',
        'styled-tag-remove': 'ml-2 -mr-1 text-indigo-100 hover:text-white cursor-pointer',
    };

    function apply() {
        console.log('Applying dynamic styles...');
        Object.entries(STYLE_MAP).forEach(([placeholder, styles]) => {
            document.querySelectorAll(`.${placeholder}`).forEach(el => {
                const originalClasses = el.className;
                const newClasses = originalClasses.replace(placeholder, styles);
                el.className = newClasses;
            });
        });
        console.log('Dynamic styles applied.');
    }

    App.Styling = { 
        apply,
        getStyles: (key) => STYLE_MAP[key] // Expose for Sidebar
    };
})(App);

// === Storage Helper ===
(function(App) {
    const local = {
        get: (key) => localStorage.getItem(key),
        set: (key, value) => localStorage.setItem(key, value),
        remove: (key) => localStorage.removeItem(key),
        getObject: (key) => {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch (e) {
                return null;
            }
        },
        setObject: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Failed to save object to localStorage:', e);
            }
        }
    };
    const session = {
        get: (key) => sessionStorage.getItem(key),
        set: (key, value) => sessionStorage.setItem(key, value),
        remove: (key) => sessionStorage.removeItem(key),
        getObject: (key) => {
            try {
                return JSON.parse(sessionStorage.getItem(key));
            } catch (e) {
                return null;
            }
        },
        setObject: (key, value) => {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Failed to save object to sessionStorage:', e);
            }
        }
    };
    App.Storage = { local, session };
})(App);

// === Config Module ===
(function(App) {
    function init() {
        const storedUrl = App.Storage.local.get('xpiBaseUrl');
        if (storedUrl) {
            App.state.xpiBaseUrl = storedUrl;
        } else {
            App.Storage.local.set('xpiBaseUrl', App.state.xpiBaseUrl);
        }
    }
    function get(key) { return App.state[key]; }
    function set(key, value) { 
        App.state[key] = value; 
        if (key === 'xpiBaseUrl') {
            App.Storage.local.set('xpiBaseUrl', value);
        }
    }
    App.Config = { init, get, set };
})(App);

// === API Helper ===
(function(App) {
    async function fetchWithLogs(url, options = {}) {
        const logId = `log_${Date.now()}_${Math.random()}`;
        
        // 1. Log Request (scrubbed)
        try {
            const scrubbedOptions = JSON.parse(JSON.stringify(options)); // Deep copy
            if (scrubbedOptions.headers && scrubbedOptions.headers['Authorization']) {
                scrubbedOptions.headers['Authorization'] = 'Bearer [REDACTED]';
            }
            App.DevTool.logRequest(logId, url, options.method || 'GET', scrubbedOptions);
        } catch (e) {
            console.error('Failed to log request:', e);
        }

        // 2. Perform Fetch
        let response;
        let responseData = null;
        let errorData = null;

        try {
            response = await fetch(url, options);
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                errorData = responseData;
                responseData = null;
                throw new Error(`HTTP error! status: ${response.status}`);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            errorData = errorData || { error: error.message };
            
            App.DevTool.logResponse(logId, response ? response.status : 500, errorData);
            throw errorData;
        }

        // 3. Log Success Response
        App.DevTool.logResponse(logId, response.status, responseData);
        return responseData;
    }
    App.Api = { fetchWithLogs };
})(App);

// === UI Feedback (Toast, Modals, Spinner) ===
(function(App) {
    function showSpinner() { App.dom.spinner.classList.remove('hidden'); }
    function hideSpinner() { App.dom.spinner.classList.add('hidden'); }

    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        const baseClasses = 'px-4 py-3 rounded-lg shadow-lg text-white font-semibold text-sm';
        const typeClasses = type === 'success' 
            ? 'bg-green-600' 
            : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
        
        toast.className = `${baseClasses} ${typeClasses}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function showModal(modalElement) {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) modalBackdrop.classList.remove('hidden');
        if (modalElement) {
            modalElement.classList.remove('hidden');
            modalElement.classList.add('flex');
        }
    }

    function hideModal(modalElement) {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) modalBackdrop.classList.add('hidden');
        if (modalElement) {
            modalElement.classList.add('hidden');
            modalElement.classList.remove('flex');
        }
    }

    App.UI = { showSpinner, hideSpinner, showToast, showModal, hideModal };
})(App);

// === Authentication Module ===
(function(App) {
    function init() {
        const token = App.Storage.session.get('token');
        const user = App.Storage.session.getObject('user');
        if (token && user) {
            App.state.isLoggedIn = true;
            App.state.currentUser = user;
        }
    }

    async function login() {
        App.UI.showSpinner();
        try {
            const timestamp = Date.now().toString();
            const random = Math.random().toString();
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(timestamp + random));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const clientId = hexHash.slice(-7);
            
            App.Storage.session.set('clientId', clientId);
            
            const baseUrl = App.Config.get('xpiBaseUrl');
            const redirectUri = window.location.origin + window.location.pathname;
            const authUrl = `${baseUrl}?accountId=3128883&redirectUri=${encodeURIComponent(redirectUri)}&client_id=${clientId}`;
            
            window.location.href = authUrl;
        } catch (error) {
            console.error('Login failed:', error);
            App.UI.hideSpinner();
            App.UI.showToast('Login failed. Could not generate client ID.', 'error');
        }
    }

    async function handleCallback(code, clientId) {
        const view = document.getElementById('login-callback-view');
        const msgEl = document.getElementById('login-callback-message');
        const errEl = document.getElementById('login-callback-error');
        const startOverBtn = document.getElementById('login-start-over-btn');
        
        startOverBtn.onclick = () => window.location.href = window.location.pathname;
        msgEl.textContent = 'Exchanging token...';

        try {
            const baseUrl = App.Config.get('xpiBaseUrl');
            const tokenUrl = `${baseUrl}api/v1/wrikexpi/token/exchange?code=${code}&client_id=${clientId}&grant_type=authorization_code`;
            const tokenResponse = await App.Api.fetchWithLogs(tokenUrl);
            
            if (!tokenResponse.success || !tokenResponse.data) {
                throw new Error(tokenResponse.message || 'Token exchange failed.');
            }
            
            const { token, credentials } = tokenResponse.data;
            if (!token || !credentials || !credentials.username || !credentials.password) {
                throw new Error('Invalid token response structure.');
            }

            App.Storage.session.set('token', token);
            msgEl.textContent = 'Token received. Verifying profile...';

            const profileUrl = `${baseUrl}api/v1/wrikexpi/amoeba/wrikeapi/contacts?me`;
            const basicAuth = btoa(`${credentials.username}:${credentials.password}`);
            
            const profileResponse = await App.Api.fetchWithLogs(profileUrl, {
                headers: { 'Authorization': `Basic ${basicAuth}` }
            });

            if (!profileResponse.success || !profileResponse.data || profileResponse.data.length === 0) {
                throw new Error(profileResponse.message || 'Profile verification failed.');
            }

            const profile = profileResponse.data[0];
            const user = {
                firstName: profile.firstName,
                lastName: profile.lastName,
                avatarUrl: profile.avatarUrl
            };

            App.Storage.session.setObject('user', user);
            App.state.isLoggedIn = true;
            App.state.currentUser = user;
            
            msgEl.textContent = `${user.firstName} ${user.lastName} login successfully. Redirecting...`;
            App.Sidebar.updateProfile(user);
            
            setTimeout(() => {
                window.location.hash = '#campaign-submission';
            }, 2000);

        } catch (error) {
            console.error('Callback handling failed:', error);
            msgEl.textContent = 'Login failed. We were unable to verify your account.';
            msgEl.classList.add('text-red-400');
            errEl.textContent = typeof error === 'object' ? JSON.stringify(error, null, 2) : error.toString();
            errEl.classList.remove('hidden');
            startOverBtn.classList.remove('hidden');
            document.getElementById('login-callback-spinner').classList.add('hidden');
            App.Storage.session.remove('token');
        }
    }
    
    function logout() {
        App.Storage.session.remove('token');
        App.Storage.session.remove('user');
        App.Storage.session.remove('clientId');
        App.state.isLoggedIn = false;
        App.state.currentUser = null;
        window.location.href = window.location.pathname;
    }

    App.Auth = { 
        init, 
        login, 
        handleCallback, 
        logout,
        isLoggedIn: () => App.state.isLoggedIn,
        getToken: () => App.Storage.session.get('token'),
        getUser: () => App.state.currentUser
    };
})(App);

// === Router Module ===
(function(App) {
    function init() {
        window.addEventListener('hashchange', route);
        route(); // Initial route
    }

    function route() {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        
        hideAllModules();
        App.UI.hideSpinner();

        if (params.has('code')) {
            const code = params.get('code');
            const clientId = App.Storage.session.get('clientId');
            
            document.getElementById('module-login').classList.remove('hidden');
            document.getElementById('login-authenticate-view').classList.add('hidden');
            document.getElementById('login-callback-view').classList.remove('hidden');

            if (!code || !clientId) {
                document.getElementById('login-callback-message').textContent = 'Error: Missing code or client ID. Redirecting...';
                document.getElementById('login-callback-spinner').classList.add('hidden');
                setTimeout(() => window.location.href = window.location.pathname, 10000);
            } else {
                App.Auth.handleCallback(code, clientId);
            }
            window.history.replaceState({}, document.title, window.location.pathname + hash);

        } else if (hash === '#admin') {
            document.getElementById('module-admin').classList.remove('hidden');
            initModule('admin', App.AdminModule.init);
            App.Sidebar.updateActive(hash);

        } else if (!App.Auth.isLoggedIn()) {
            document.getElementById('module-login').classList.remove('hidden');
            document.getElementById('login-authenticate-view').classList.remove('hidden');
            document.getElementById('login-callback-view').classList.add('hidden');
            initModule('login', App.LoginModule.init);
            App.Sidebar.updateActive('#login');

        } else {
            App.Sidebar.updateActive(hash);
            switch (hash) {
                case '#campaign-submission':
                    document.getElementById('module-campaign-submission').classList.remove('hidden');
                    initModule('campaign-submission', App.CampaignModule.init, false);
                    break;
                case '#demo-client':
                    document.getElementById('module-master-data').classList.remove('hidden');
                    initModule('demo-client', () => App.MasterData.init('demoxpiclients'), true);
                    break;
                case '#xpi-cf-mapping':
                    document.getElementById('module-master-data').classList.remove('hidden');
                    initModule('xpi-cf-mapping', () => App.MasterData.init('xpicfmapping'), true);
                    break;
                default:
                    window.location.hash = '#campaign-submission';
            }
        }
    }

    function hideAllModules() {
        document.querySelectorAll('.module-container').forEach(mod => mod.classList.add('hidden'));
    }

    function initModule(moduleName, initFn, force = false) {
        if (force || !App.state.initializedModules.has(moduleName)) {
            console.log(`Lazily initializing module: ${moduleName}`);
            try {
                initFn();
                App.state.initializedModules.add(moduleName);
            } catch (e) {
                console.error(`Failed to initialize module ${moduleName}:`, e);
                App.UI.showToast(`Error loading module ${moduleName}.`, 'error');
            }
        }
    }

    App.Router = { init };
})(App);

// === Sidebar Module ===
(function(App) {
    let isExpanded = true;
    let dom = {};

    function getEl(id) {
        if (!dom[id]) {
            dom[id] = document.getElementById(id);
            if (!dom[id]) {
                console.error(`Failed to find element #${id}`);
            }
        }
        return dom[id];
    }

    function init() {
        const toggleBtn = getEl('sidebar-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggle);
        }
        
        const logoutLink = getEl('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                App.Auth.logout();
            });
        }

        buildNav();
        if (App.Auth.isLoggedIn()) {
            updateProfile(App.Auth.getUser());
        }
    }

    function buildNav() {
        const navLinks = getEl('sidebar-nav-links');
        if (!navLinks) return;

        const userModules = App.MODULE_CONFIG.filter(m => m.type === 'User-defined');
        navLinks.innerHTML = userModules.map(m => `
            <li>
                <a href="${m.hash}" class="styled-nav-link" data-hash="${m.hash}">
                    <span class="nav-link-text">${m.name}</span>
                </a>
            </li>
        `).join('');
        
        App.Styling.apply();
    }

    function updateProfile(user) {
        if (user) {
            const userName = getEl('user-name');
            const userAvatar = getEl('user-avatar');
            const userProfile = getEl('user-profile');

            if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
            if (userAvatar) {
                userAvatar.src = user.avatarUrl;
                userAvatar.onerror = () => { userAvatar.src = `https://placehold.co/40x40/667eea/ffffff?text=${user.firstName.charAt(0)}`; };
            }
            if (userProfile) userProfile.classList.remove('hidden');
        }
    }

    function toggle() {
        isExpanded = !isExpanded;
        
        const sidebar = getEl('sidebar');
        const logo = getEl('sidebar-logo');
        const userProfile = getEl('user-profile');
        const navLinks = getEl('sidebar-nav-links');

        if (!sidebar || !logo || !userProfile || !navLinks) {
            console.error("Missing critical sidebar elements for toggle.");
            return;
        }

        // Get style definitions directly
        const expandedClasses = App.Styling.getStyles('styled-sidebar');
        const hiddenClasses = App.Styling.getStyles('styled-sidebar-hidden');

        if (isExpanded) {
            // Manually swap classes
            sidebar.classList.remove(...hiddenClasses.split(' '));
            sidebar.classList.add(...expandedClasses.split(' '));

            logo.textContent = 'XPI';
            logo.classList.remove('opacity-0');
            userProfile.classList.remove('opacity-0');
            navLinks.querySelectorAll('.nav-link-text').forEach(el => el.classList.remove('hidden'));
        } else {
            // Manually swap classes
            sidebar.classList.remove(...expandedClasses.split(' '));
            sidebar.classList.add(...hiddenClasses.split(' '));

            logo.textContent = 'X';
            logo.classList.add('opacity-0');
            userProfile.classList.add('opacity-0');
            navLinks.querySelectorAll('.nav-link-text').forEach(el => el.classList.add('hidden'));
        }
    }

    function updateActive(hash) {
        const navLinks = getEl('sidebar-nav-links');
        if (!navLinks) return;

        navLinks.querySelectorAll('a').forEach(link => {
            link.classList.remove('styled-nav-link-active', ...App.Styling.getStyles('styled-nav-link-active').split(' '));
            link.classList.add('styled-nav-link', ...App.Styling.getStyles('styled-nav-link').split(' '));
            
            if (link.dataset.hash === hash) {
                link.classList.remove('styled-nav-link', ...App.Styling.getStyles('styled-nav-link').split(' '));
                link.classList.add('styled-nav-link-active', ...App.Styling.getStyles('styled-nav-link-active').split(' '));
            }
        });
    }

    App.Sidebar = { init, updateProfile, updateActive };
})(App);

// === Developer Tool Module ===
(function(App) {
    let isVisible = false;
    let dom = {};
    const LOG_KEY = 'xpiDevLogs';

    function init() {
        dom.toggleBtn = document.getElementById('dev-tool-toggle');
        dom.dialog = document.getElementById('dev-tool-dialog');
        dom.closeBtn = document.getElementById('dev-tool-close-btn');
        dom.purgeBtn = document.getElementById('dev-tool-purge-btn');
        dom.logBody = document.getElementById('dev-tool-log-body');
        
        dom.payloadModal = document.getElementById('modal-payload-viewer');
        dom.payloadContent = document.getElementById('payload-viewer-content');
        dom.payloadCloseBtn = document.getElementById('payload-viewer-close-btn');

        if (!dom.toggleBtn || !dom.dialog || !dom.closeBtn || !dom.purgeBtn || !dom.payloadModal) {
            console.warn("Developer tool UI elements not found. Tool will be disabled.");
            return;
        }

        dom.toggleBtn.addEventListener('click', toggle);
        dom.closeBtn.addEventListener('click', hide);
        dom.purgeBtn.addEventListener('click', purge);
        dom.payloadCloseBtn.addEventListener('click', () => App.UI.hideModal(dom.payloadModal));
    }

    function toggle() {
        isVisible = !isVisible;
        if (isVisible) {
            show();
        } else {
            hide();
        }
    }

    function show() {
        dom.dialog.classList.remove('hidden');
        dom.dialog.classList.add('flex');
        loadLogs();
    }

    function hide() {
        dom.dialog.classList.add('hidden');
        dom.dialog.classList.remove('flex');
    }

    function getLogs() {
        return App.Storage.local.getObject(LOG_KEY) || {};
    }

    function saveLogs(logs) {
        App.Storage.local.setObject(LOG_KEY, logs);
    }

    function logRequest(id, url, method, options) {
        if (!dom.toggleBtn) return; // Do not log if tool is not initialized
        const logs = getLogs();
        logs[id] = {
            id,
            timestamp: new Date().toISOString(),
            url,
            method,
            status: 'Pending...',
            request: options.body || null,
            response: null
        };
        saveLogs(logs);
    }

    function logResponse(id, status, data) {
        if (!dom.toggleBtn) return; // Do not log if tool is not initialized
        const logs = getLogs();
        if (logs[id]) {
            logs[id].status = status;
            logs[id].response = data;
            saveLogs(logs);
            if (isVisible) {
                loadLogs(); // Refresh view if open
            }
        }
    }

    function loadLogs() {
        const logs = getLogs();
        const sortedLogs = Object.values(logs).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        dom.logBody.innerHTML = '';
        
        if (sortedLogs.length === 0) {
            dom.logBody.innerHTML = '<tr><td colspan="6" class="styled-table-td text-center text-gray-400">No logs yet.</td></tr>';
            App.Styling.apply();
            return;
        }
        
        sortedLogs.forEach(log => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700';
            
            const statusColor = log.status >= 400 ? 'text-red-400' : (log.status >= 200 ? 'text-green-400' : 'text-yellow-400');
            
            tr.innerHTML = `
                <td class="styled-table-td text-xs text-gray-400">${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td class="styled-table-td font-semibold ${statusColor}">${log.status}</td>
                <td class="styled-table-td text-xs">${log.method}</td>
                <td class="styled-table-td text-xs truncate max-w-xs" title="${log.url}">${log.url}</td>
                <td class="styled-table-td">
                    ${log.request ? `<button class="styled-btn-secondary !px-2 !py-1 text-xs" data-log-id="${log.id}" data-type="request">View</button>` : 'N/A'}
                </td>
                <td class="styled-table-td">
                    ${log.response ? `<button class="styled-btn-secondary !px-2 !py-1 text-xs" data-log-id="${log.id}" data-type="response">View</button>` : 'N/A'}
                </td>
            `;
            
            tr.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const logId = btn.dataset.logId;
                    const type = btn.dataset.type;
                    showPayload(logs[logId][type]);
                });
            });
            
            dom.logBody.appendChild(tr);
        });
        App.Styling.apply();
    }

    function showPayload(payload) {
        try {
            dom.payloadContent.textContent = JSON.stringify(payload, null, 2);
            dom.payloadContent.className = 'styled-pre-success text-sm';
        } catch (e) {
            dom.payloadContent.textContent = 'Error parsing payload.';
            dom.payloadContent.className = 'styled-pre-error text-sm';
        }
        App.Styling.apply();
        App.UI.showModal(dom.payloadModal);
    }

    function purge() {
        if (confirm('Are you sure you want to purge all API logs?')) {
            App.Storage.local.remove(LOG_KEY);
            loadLogs();
        }
    }

    App.DevTool = { init, logRequest, logResponse };
})(App);

// === Main App Init ===
(function(App) {
    App.init = function() {
        console.log('XPI Portal initializing...');
        App.dom.spinner = document.getElementById('loading-spinner');
        
        App.Styling.apply();
        App.Config.init();
        App.Auth.init();
        App.Sidebar.init();
        App.DevTool.init();
        App.Router.init(); // This will start the routing
        
        console.log('XPI Portal initialized.');
    }
})(App);
