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
        xpiBaseUrl: 'https://api.wrikexpi.groupm.com/',
        urlLandingPage: 'https://app-eu.wrike.com/open.htm?id=1802549085',
        initializedModules: new Set(),
    };

    // --- Constants ---
    App.MODULE_CONFIG = [
        { code: 'MOD.L', name: 'Home', hash: '#landing-page', type: 'User-defined', icon: 'home' },
        { code: 'MAS.BB8Client', name: 'BB8 Clients', hash: '#demo-client', type: 'User-defined', icon: 'clients' },
        { code: 'MOD.Campaign', name: 'BB8 Campaigns', hash: '#campaigns', type: 'User-defined', icon: 'megaphone' },
        //{ code: 'MAS.XPICFMapping', name: 'XPI Field Mapping', hash: '#xpi-cf-mapping', type: 'User-defined', icon: 'mapping' },
        { code: 'MAS.WrikeAgencies', name: 'Wrike Agencies', hash: '#wrike-agencies', type: 'User-defined', icon: 'mapping' },
        { code: 'MOD.C', name: 'Wrike Campaign Submission', hash: '#campaign-submission', type: 'User-defined', icon: 'campaign' },
        { code: 'MOD.V', name: 'Task Viewer', hash: '#task-viewer', type: 'User-defined', icon: 'viewer' },
        { code: 'MOD.A', name: 'Admin', hash: '#admin', type: 'Built-in', icon: 'admin' },
        { code: 'MOD.B', name: 'Login', hash: '#login', type: 'Built-in', icon: 'login' },
    ];
    
    App.MASTER_DATA_SCHEMAS = {
        'demoxpiclients': {
            title: 'BB8 Clients',
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
        },
        'agencies': {
            title: 'Wrike Agencies',
            fields: [
                { id: 'value', label: 'Value', required: true }],
            type: "value"
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
        'styled-nav-icon': 'w-6 h-6 flex-shrink-0',
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
        // Initialize all configurable keys from localStorage
        ['xpiBaseUrl', 'urlLandingPage'].forEach(key => {
            const storedValue = App.Storage.local.get(key);
            if (storedValue) {
                App.state[key] = storedValue;
            } else {
                // If not in storage, set it from the initial state
                App.Storage.local.set(key, App.state[key]);
            }
        });
    }
    function get(key) { return App.state[key]; }
    function set(key, value) { 
        App.state[key] = value; 
        // Persist configurable keys to localStorage
        const persistKeys = ['xpiBaseUrl', 'urlLandingPage'];
        if (persistKeys.includes(key)) {
            App.Storage.local.set(key, value);
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
            const authUrl = `${baseUrl}?accountId=3128883&autoRedirect=1&redirectUri=${encodeURIComponent(redirectUri)}&client_id=${clientId}`;
            
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
                window.location.hash = '#landing-page';
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
                    {
                        document.getElementById('module-campaign-submission').classList.remove('hidden');
                        let prefilledData = null;
                        if (params.has('prefilled')) {
                            try {
                                prefilledData = JSON.parse(params.get('prefilled'));
                                window.history.replaceState({}, document.title, window.location.pathname + hash); // Clean URL
                            } catch (e) { console.error("Failed to parse 'prefilled' JSON data:", e); }
                        }
                        initModule('campaign-submission', () => App.SubmitWrikeCampaign.init(prefilledData), false);
                    }
                    break;
                case '#demo-client':
                    document.getElementById('module-master-data').classList.remove('hidden');
                    initModule('demo-client', () => App.MasterData.init('demoxpiclients'), true);
                    break;
                case '#xpi-cf-mapping':
                    document.getElementById('module-master-data').classList.remove('hidden');
                    initModule('xpi-cf-mapping', () => App.MasterData.init('xpicfmapping'), true);
                    break;
                case '#wrike-agencies':
                    document.getElementById('module-master-data').classList.remove('hidden');
                    initModule('wrike-agencies', () => App.MasterData.init('agencies'), true);
                    break;
                case '#campaigns':
                    document.getElementById('module-campaign').classList.remove('hidden');
                    initModule('campaigns', App.CampaignsModule.init, false);
                    break;
                case '#task-viewer':
                    document.getElementById('module-task-viewer').classList.remove('hidden');
                    initModule('task-viewer', App.TaskViewerModule.init, false);
                    break;
                case '#landing-page':
                    document.getElementById('module-landing-page').classList.remove('hidden');
                    initModule('landing-page', App.LandingPageModule.init, true); // Force re-init
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

    const ICON_MAP = {
        'campaign': `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/></svg>`,
        'megaphone': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-megaphone-fill" viewBox="0 0 16 16"><path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0zm-1 .724c-2.067.95-4.539 1.481-7 1.656v6.237a25 25 0 0 1-1.088.085c-.053-.002-.107-.004-.16-.006H4c-.72 0-1.554.135-2.22.404.16.04.324.079.49.114.164.036.332.068.503.095l.353.05a1 1 0 0 0 .728-.184l.38-.329a1 1 0 0 0-.115-.152l-.662-.551a.5.5 0 0 1 .33-1.003l.82.164a1 1 0 0 0 .986-.803l.255-1.435a.5.5 0 0 1 .916-.034l.256 1.436a1 1 0 0 0 .986.803l.82-.164a.5.5 0 0 1 .33 1.003l-.662.551a1 1 0 0 0-.115.152l.38.329a1 1 0 0 0 .728.184l.353-.05a12.7 12.7 0 0 0 .503-.095 4.9 4.9 0 0 0 .49-.114c-.666-.269-1.5-.404-2.22-.404h-.16c-.053.002-.107.004-.16.006a25 25 0 0 1-1.088-.085z"/></svg>`,
        'clients': `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16"><path d="M15 14v1H1v-1l.5-1a.5.5 0 0 1 .5-1H6a.5.5 0 0 1 .5.5c0 .253.189.463.43.59a.5.5 0 0 0 .44 0c.24-.127.43-.337.43-.59a.5.5 0 0 1 .5-.5h3.5a.5.5 0 0 1 .5 1l.5 1ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M4 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2 7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1H2v-1Z"/></svg>`,
        'mapping': `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-diagram-3" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM0 11.5A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/></svg>`,
        'viewer': `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>`,
        'home': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house-door-fill" viewBox="0 0 16 16"><path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5z"/></svg>`,
        'default': `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>`
    };

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
                    <span class="styled-nav-icon">${ICON_MAP[m.icon] || ICON_MAP['default']}</span>
                    <span class="nav-link-text ml-3">${m.name}</span>
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

// === Task Viewer Module ===
(function(App) {
    let dom = {};

    function init() {
        dom.form = document.getElementById('task-viewer-form');
        dom.permalinkInput = document.getElementById('task-viewer-permalink');
        dom.contentArea = document.getElementById('task-viewer-content-area');

        if (!dom.form) return; // Already initialized

        dom.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const permalink = dom.permalinkInput.value.trim();
            if (permalink) {
                fetchTask(permalink);
            }
        });
    }

    function showLoading() {
        dom.contentArea.innerHTML = `
            <div class="p-12 flex flex-col items-center justify-center text-gray-400">
                <div class="animate-spin h-10 w-10 text-indigo-500" role="status">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <span class="mt-4 text-lg font-medium">Loading Task Details...</span>
            </div>`;
    }

    function displayError(title, message) {
        dom.contentArea.innerHTML = `
            <div class="p-8 bg-red-900/50 border border-red-700 rounded-lg">
                <h3 class="text-xl font-semibold text-white">${title}</h3>
                <p class="mt-2 text-red-200">${message}</p>
            </div>`;
    }

    function displayContent(title, descriptionHtml) {
        dom.contentArea.innerHTML = `
            <h3 class="text-2xl font-bold text-white mb-4 pb-4 border-b border-gray-700">${title}</h3>
            <div class="prose prose-lg prose-invert max-w-none">${descriptionHtml || '<p>No description provided.</p>'}</div>
        `;
        // Disable any checkboxes in the rendered HTML for a read-only view
        dom.contentArea.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = true);
    }

    async function fetchTask(permalinkOrId) {
        showLoading();
        const token = App.Auth.getToken();
        if (!token) {
            displayError('Authentication Error', 'No authentication token found. Please log in.');
            return;
        }

        // Determine if it's a full permalink or just an ID
        let permalink = permalinkOrId;
        if (/^\d+$/.test(permalinkOrId)) { // It's just an ID
            permalink = `https://app-eu.wrike.com/open.htm?id=${permalinkOrId}`;
        }

        const url = `${App.Config.get('xpiBaseUrl')}api/v1/wrikexpi/amoeba/wrikeapi/tasks?permalink=${encodeURIComponent(permalink)}&fields=[description]`;

        try {
            const response = await App.Api.fetchWithLogs(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.success && response.data && response.data.length > 0) {
                const task = response.data[0];
                displayContent(task.title, task.description);
            } else {
                throw new Error(response.message || 'API response was successful, but no task data was found.');
            }
        } catch (error) {
            console.error('Task Viewer fetch error:', error);
            const errorMessage = typeof error === 'object' ? (error.message || JSON.stringify(error)) : error.toString();
            displayError('Failed to Load Task', `There was a problem retrieving the task details. (Error: ${errorMessage})`);
        }
    }

    App.TaskViewerModule = { init };
})(App);

// === Landing Page Module ===
(function(App) {
    let dom = {};

    function init() {
        dom.contentArea = document.getElementById('landing-page-content-area');
        dom.wrikeLink = document.getElementById('landing-page-wrike-link');

        const permalink = App.Config.get('urlLandingPage');

        if (permalink) {
            fetchContent(permalink);
        } else {
            displayError('Not Configured', 'The landing page URL has not been set in the Admin configuration.');
        }
    }

    function showLoading() {
        dom.contentArea.innerHTML = `
            <div class="p-12 flex flex-col items-center justify-center text-gray-400">
                <div class="animate-spin h-10 w-10 text-indigo-500" role="status">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <span class="mt-4 text-lg font-medium">Loading Content...</span>
            </div>`;
    }

    function displayError(title, message) {
        dom.wrikeLink.classList.add('hidden');
        dom.contentArea.innerHTML = `
            <div class="p-8 bg-red-900/50 border border-red-700 rounded-lg">
                <h3 class="text-xl font-semibold text-white">${title}</h3>
                <p class="mt-2 text-red-200">${message}</p>
            </div>`;
    }

    function displayContent(title, descriptionHtml, permalink) {
        dom.wrikeLink.href = permalink;
        dom.wrikeLink.classList.remove('hidden');

        dom.contentArea.innerHTML = `
            <h3 class="text-2xl font-bold text-white mb-4 pb-4 border-b border-gray-700">${title}</h3>
            <div class="prose prose-lg prose-invert max-w-none">${descriptionHtml || '<p>No description provided.</p>'}</div>
        `;
        // Disable any checkboxes in the rendered HTML for a read-only view
        dom.contentArea.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = true);
    }

    async function fetchContent(permalink) {
        showLoading();
        const token = App.Auth.getToken();
        if (!token) {
            displayError('Authentication Error', 'No authentication token found. Please log in.');
            return;
        }

        const url = `${App.Config.get('xpiBaseUrl')}api/v1/wrikexpi/amoeba/wrikeapi/tasks?permalink=${encodeURIComponent(permalink)}&fields=[description]`;

        try {
            const response = await App.Api.fetchWithLogs(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.success && response.data && response.data.length > 0) {
                const task = response.data[0];
                displayContent(task.title, task.description, permalink);
            } else {
                throw new Error(response.message || 'API response was successful, but no task data was found.');
            }
        } catch (error) {
            console.error('Landing Page fetch error:', error);
            const errorMessage = typeof error === 'object' ? (error.message || JSON.stringify(error)) : error.toString();
            displayError('Failed to Load Content', `There was a problem retrieving the content. (Error: ${errorMessage})`);
        }
    }

    App.LandingPageModule = { init };
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
