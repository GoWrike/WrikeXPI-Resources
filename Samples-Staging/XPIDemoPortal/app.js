/*
 * XPI Portal Application Logic
 * app.js
 */

// === Main App Module ===
const App = (function() {
    
    // --- State ---
    let state = {
        isLoggedIn: false,
        currentUser: null, // { firstName, lastName, avatarUrl }
        xpiBaseUrl: 'https://xpi-api.gowrike.space/',
        initializedModules: new Set(),
    };

    // --- Constants ---
    const MODULE_CONFIG = [
        { code: 'MOD.C', name: 'Campaign Submission', hash: '#campaign-submission', type: 'User-defined' },
        { code: 'MAS.DemoCient', name: 'Demo Client', hash: '#demo-client', type: 'User-defined' },
        { code: 'MAS.XPICFMapping', name: 'XPI Field Mapping', hash: '#xpi-cf-mapping', type: 'User-defined' },
        { code: 'MOD.A', name: 'Admin', hash: '#admin', type: 'Built-in' },
        { code: 'MOD.B', name: 'Login', hash: '#login', type: 'Built-in' },
    ];
    
    const MASTER_DATA_SCHEMAS = {
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
    // Caching elements on-demand as modules are initialized
    const dom = {};

    // --- Initialization ---
    function init() {
        console.log('XPI Portal initializing...');
        dom.spinner = document.getElementById('loading-spinner');
        
        Styling.apply();
        Config.init();
        Auth.init();
        Sidebar.init();
        DevTool.init();
        Router.init();
        
        console.log('XPI Portal initialized.');
    }

    // === Styling Module ===
    // Applies Tailwind classes dynamically based on placeholder classes
    const Styling = (function() {
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
                    // This logic preserves other classes and replaces the placeholder
                    const originalClasses = el.className;
                    const newClasses = originalClasses.replace(placeholder, styles);
                    el.className = newClasses;
                });
            });
            console.log('Dynamic styles applied.');
        }

        return { apply };
    })();

    // === Storage Helper ===
    const Storage = (function() {
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
        return { local, session };
    })();

    // === Config Module ===
    const Config = (function() {
        function init() {
            const storedUrl = Storage.local.get('xpiBaseUrl');
            if (storedUrl) {
                state.xpiBaseUrl = storedUrl;
            } else {
                Storage.local.set('xpiBaseUrl', state.xpiBaseUrl);
            }
        }
        function get(key) { return state[key]; }
        function set(key, value) { 
            state[key] = value; 
            if (key === 'xpiBaseUrl') {
                Storage.local.set('xpiBaseUrl', value);
            }
        }
        return { init, get, set };
    })();

    // === API Helper ===
    const Api = (function() {
        async function fetchWithLogs(url, options = {}) {
            const logId = `log_${Date.now()}_${Math.random()}`;
            
            // 1. Log Request (scrubbed)
            try {
                const scrubbedOptions = JSON.parse(JSON.stringify(options)); // Deep copy
                if (scrubbedOptions.headers && scrubbedOptions.headers['Authorization']) {
                    scrubbedOptions.headers['Authorization'] = 'Bearer [REDACTED]';
                }
                DevTool.logRequest(logId, url, options.method || 'GET', scrubbedOptions);
            } catch (e) {
                console.error('Failed to log request:', e);
            }

            // 2. Perform Fetch
            let response;
            let responseData = null;
            let errorData = null;

            try {
                response = await fetch(url, options);
                
                // Try to parse JSON, fall back to text
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else {
                    responseData = await response.text();
                }

                if (!response.ok) {
                    // If not OK, treat responseData as errorData
                    errorData = responseData;
                    responseData = null;
                    // Throw an error to be caught below
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

            } catch (error) {
                console.error('Fetch error:', error);
                errorData = errorData || { error: error.message }; // Use parsed error data if available
                
                // 3. Log Error Response
                DevTool.logResponse(logId, response ? response.status : 500, errorData);
                throw errorData; // Re-throw the error data
            }

            // 3. Log Success Response
            DevTool.logResponse(logId, response.status, responseData);
            return responseData;
        }

        return { fetchWithLogs };
    })();

    // === UI Feedback (Toast, Modals, Spinner) ===
    const UI = (function() {
        function showSpinner() { dom.spinner.classList.remove('hidden'); }
        function hideSpinner() { dom.spinner.classList.add('hidden'); }

        function showToast(message, type = 'success') {
            const toastContainer = document.getElementById('toast-container');
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

        const modalBackdrop = document.getElementById('modal-backdrop');
        
        function showModal(modalElement) {
            modalBackdrop.classList.remove('hidden');
            modalElement.classList.remove('hidden');
            modalElement.classList.add('flex');
        }

        function hideModal(modalElement) {
            modalBackdrop.classList.add('hidden');
            modalElement.classList.add('hidden');
            modalElement.classList.remove('flex');
        }

        return { showSpinner, hideSpinner, showToast, showModal, hideModal };
    })();

    // === Authentication Module ===
    const Auth = (function() {
        function init() {
            const token = Storage.session.get('token');
            const user = Storage.session.getObject('user');
            if (token && user) {
                state.isLoggedIn = true;
                state.currentUser = user;
            }
        }

        async function login() {
            UI.showSpinner();
            try {
                // 1. Generate clientId
                const timestamp = Date.now().toString();
                const random = Math.random().toString();
                const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(timestamp + random));
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                const clientId = hexHash.slice(-7);
                
                // 2. Store clientId
                Storage.session.set('clientId', clientId);
                
                // 3. Construct URL and redirect
                const baseUrl = Config.get('xpiBaseUrl');
                const redirectUri = window.location.origin + window.location.pathname;
                const authUrl = `${baseUrl}?accountId=3128883&redirectUri=${encodeURIComponent(redirectUri)}&client_id=${clientId}`;
                
                window.location.href = authUrl;
            } catch (error) {
                console.error('Login failed:', error);
                UI.hideSpinner();
                UI.showToast('Login failed. Could not generate client ID.', 'error');
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
                // 1. Exchange Token
                const baseUrl = Config.get('xpiBaseUrl');
                const tokenUrl = `${baseUrl}api/v1/wrikexpi/token/exchange?code=${code}&client_id=${clientId}&grant_type=authorization_code`;
                const tokenResponse = await Api.fetchWithLogs(tokenUrl);
                
                if (!tokenResponse.success || !tokenResponse.data) {
                    throw new Error(tokenResponse.message || 'Token exchange failed.');
                }
                
                const { token, credentials } = tokenResponse.data;
                if (!token || !credentials || !credentials.username || !credentials.password) {
                    throw new Error('Invalid token response structure.');
                }

                // Store token IMMEDIATELY
                Storage.session.set('token', token);
                msgEl.textContent = 'Token received. Verifying profile...';

                // 2. Verify Profile
                const profileUrl = `${baseUrl}api/v1/wrikexpi/amoeba/wrikeapi/contacts?me`;
                const basicAuth = btoa(`${credentials.username}:${credentials.password}`); // Password is used here and then discarded
                
                const profileResponse = await Api.fetchWithLogs(profileUrl, {
                    headers: {
                        'Authorization': `Basic ${basicAuth}`
                    }
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

                // 3. Store user, update state
                Storage.session.setObject('user', user);
                state.isLoggedIn = true;
                state.currentUser = user;
                
                // 4. Success feedback
                msgEl.textContent = `${user.firstName} ${user.lastName} login successfully. Redirecting...`;
                Sidebar.updateProfile(user); // Update sidebar immediately
                
                // Redirect to main app
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
                Storage.session.remove('token'); // Clean up partial login
            }
        }
        
        function logout() {
            Storage.session.remove('token');
            Storage.session.remove('user');
            Storage.session.remove('clientId');
            state.isLoggedIn = false;
            state.currentUser = null;
            window.location.href = window.location.pathname; // Redirect to base URL
        }

        return { 
            init, 
            login, 
            handleCallback, 
            logout,
            isLoggedIn: () => state.isLoggedIn,
            getToken: () => Storage.session.get('token'),
            getUser: () => state.currentUser
        };
    })();

    // === Router Module ===
    const Router = (function() {
        function init() {
            window.addEventListener('hashchange', route);
            route(); // Initial route
        }

        function route() {
            const hash = window.location.hash;
            const params = new URLSearchParams(window.location.search);
            
            hideAllModules();
            UI.hideSpinner(); // Hide spinner on route change

            if (params.has('code')) {
                // OAuth Callback
                const code = params.get('code');
                const clientId = Storage.session.get('clientId');
                
                document.getElementById('module-login').classList.remove('hidden');
                document.getElementById('login-authenticate-view').classList.add('hidden');
                document.getElementById('login-callback-view').classList.remove('hidden');

                if (!code || !clientId) {
                    document.getElementById('login-callback-message').textContent = 'Error: Missing code or client ID. Redirecting...';
                    document.getElementById('login-callback-spinner').classList.add('hidden');
                    setTimeout(() => window.location.href = window.location.pathname, 10000);
                } else {
                    Auth.handleCallback(code, clientId);
                }
                // Clear query params
                window.history.replaceState({}, document.title, window.location.pathname + hash);

            } else if (hash === '#admin') {
                // Admin Module
                document.getElementById('module-admin').classList.remove('hidden');
                initModule('admin', AdminModule.init);
                Sidebar.updateActive(hash);

            } else if (!Auth.isLoggedIn()) {
                // Not logged in -> Show Login
                document.getElementById('module-login').classList.remove('hidden');
                document.getElementById('login-authenticate-view').classList.remove('hidden');
                document.getElementById('login-callback-view').classList.add('hidden');
                initModule('login', LoginModule.init);
                Sidebar.updateActive('#login');

            } else {
                // Logged in routes
                Sidebar.updateActive(hash);
                switch (hash) {
                    case '#campaign-submission':
                        document.getElementById('module-campaign-submission').classList.remove('hidden');
                        initModule('campaign-submission', CampaignModule.init);
                        break;
                    case '#demo-client':
                        document.getElementById('module-master-data').classList.remove('hidden');
                        initModule('demo-client', () => MasterData.init('demoxpiclients'));
                        break;
                    case '#xpi-cf-mapping':
                        document.getElementById('module-master-data').classList.remove('hidden');
                        initModule('xpi-cf-mapping', () => MasterData.init('xpicfmapping'));
                        break;
                    default:
                        // Default to campaign submission if logged in
                        window.location.hash = '#campaign-submission';
                }
            }
        }

        function hideAllModules() {
            document.querySelectorAll('.module-container').forEach(mod => mod.classList.add('hidden'));
        }

        function initModule(moduleName, initFn) {
            if (!state.initializedModules.has(moduleName)) {
                console.log(`Lazily initializing module: ${moduleName}`);
                try {
                    initFn();
                    state.initializedModules.add(moduleName);
                } catch (e) {
                    console.error(`Failed to initialize module ${moduleName}:`, e);
                    UI.showToast(`Error loading module ${moduleName}.`, 'error');
                }
            }
        }

        return { init };
    })();

    // === Sidebar Module ===
    const Sidebar = (function() {
        let isExpanded = true;
        let dom = {}; // Cache

        // Helper to get and cache a DOM element
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
                    Auth.logout();
                });
            }

            buildNav();
            if (Auth.isLoggedIn()) {
                updateProfile(Auth.getUser());
            }
        }

        function buildNav() {
            const navLinks = getEl('sidebar-nav-links');
            if (!navLinks) return;

            const userModules = MODULE_CONFIG.filter(m => m.type === 'User-defined');
            navLinks.innerHTML = userModules.map(m => `
                <li>
                    <a href="${m.hash}" class="styled-nav-link" data-hash="${m.hash}">
                        <span class="nav-link-text">${m.name}</span>
                    </a>
                </li>
            `).join('');
            
            // Re-apply styles to new elements
            Styling.apply();
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

            // sidebar.classList.toggle('styled-sidebar-hidden');
            // sidebar.classList.toggle('styled-sidebar');
            
            if (isExpanded) {
                sidebar.classList.remove('styled-sidebar-hidden');
                sidebar.classList.add('styled-sidebar');

                logo.textContent = 'XPI';
                logo.classList.remove('opacity-0');
                userProfile.classList.remove('opacity-0');
                navLinks.querySelectorAll('.nav-link-text').forEach(el => el.classList.remove('hidden'));
            } else {
                sidebar.classList.remove('styled-sidebar');
                sidebar.classList.add('styled-sidebar-hidden');

                logo.textContent = 'X';
                logo.classList.add('opacity-0');
                userProfile.classList.add('opacity-0');
                navLinks.querySelectorAll('.nav-link-text').forEach(el => el.classList.add('hidden'));
            }

            // CRITICAL: Re-apply styles to replace the placeholder we just added.
            Styling.apply();
        }

        function updateActive(hash) {
            const navLinks = getEl('sidebar-nav-links');
            if (!navLinks) return;

            navLinks.querySelectorAll('a').forEach(link => {
                link.classList.remove('styled-nav-link-active');
                link.classList.add('styled-nav-link');
                if (link.dataset.hash === hash) {
                    link.classList.add('styled-nav-link-active');
                    link.classList.remove('styled-nav-link');
                }
            });
        }

        return { init, updateProfile, updateActive };
    })();

    // === Developer Tool Module ===
    const DevTool = (function() {
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

            dom.toggleBtn.addEventListener('click', toggle);
            dom.closeBtn.addEventListener('click', hide);
            dom.purgeBtn.addEventListener('click', purge);
            dom.payloadCloseBtn.addEventListener('click', () => UI.hideModal(dom.payloadModal));
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
            return Storage.local.getObject(LOG_KEY) || {};
        }

        function saveLogs(logs) {
            Storage.local.setObject(LOG_KEY, logs);
        }

        function logRequest(id, url, method, options) {
            const logs = getLogs();
            logs[id] = {
                id,
                timestamp: new Date().toISOString(),
                url,
                method,
                status: 'Pending...',
                request: options.body ? JSON.parse(options.body) : null,
                response: null
            };
            saveLogs(logs);
        }

        function logResponse(id, status, data) {
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
                Styling.apply();
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
            Styling.apply(); // Re-style new elements
        }

        function showPayload(payload) {
            try {
                dom.payloadContent.textContent = JSON.stringify(payload, null, 2);
                dom.payloadContent.className = 'styled-pre-success text-sm';
            } catch (e) {
                dom.payloadContent.textContent = 'Error parsing payload.';
                dom.payloadContent.className = 'styled-pre-error text-sm';
            }
            Styling.apply();
            UI.showModal(dom.payloadModal);
        }

        function purge() {
            if (confirm('Are you sure you want to purge all API logs?')) {
                Storage.local.remove(LOG_KEY);
                loadLogs();
            }
        }

        return { init, logRequest, logResponse };
    })();

    // === Module: Admin ===
    const AdminModule = (function() {
        let dom = {};
        function init() {
            dom.form = document.getElementById('admin-form');
            dom.urlInput = document.getElementById('config-xpiBaseUrl');
            
            dom.urlInput.value = Config.get('xpiBaseUrl');
            
            dom.form.addEventListener('submit', (e) => {
                e.preventDefault();
                Config.set('xpiBaseUrl', dom.urlInput.value);
                UI.showToast('Configuration saved successfully!', 'success');
            });
        }
        return { init };
    })();

    // === Module: Login ===
    const LoginModule = (function() {
        function init() {
            document.getElementById('login-btn').addEventListener('click', Auth.login);
        }
        return { init };
    })();

    // === Module: Campaign Submission ===
    const CampaignModule = (function() {
        let dom = {};
        let tags = ['Twitter']; // Default tag

        function init() {
            dom.form = document.getElementById('campaign-form');
            dom.submitBtn = document.getElementById('campaign-submit-btn');
            dom.resultPre = document.getElementById('campaign-result-pre');
            
            dom.tagsInput = document.getElementById('cf-selectedchannels-input');
            dom.tagsContainer = document.getElementById('cf-selectedchannels-tags');
            
            dom.clientSelect = document.getElementById('cf-client');
            dom.debtorSelect = document.getElementById('cf-debtor');
            dom.agencySelect = document.getElementById('cf-agency');
            
            dom.form.addEventListener('submit', handleSubmit);
            dom.tagsInput.addEventListener('keydown', handleTagInput);
            
            renderTags();
            loadDropdowns();
        }
        
        function renderTags() {
            dom.tagsContainer.innerHTML = '';
            tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'styled-tag';
                tagEl.innerHTML = `
                    ${tag}
                    <span class="styled-tag-remove" data-tag="${tag}">&times;</span>
                `;
                tagEl.querySelector('.styled-tag-remove').addEventListener('click', removeTag);
                dom.tagsContainer.appendChild(tagEl);
            });
            Styling.apply(); // Style new tags
        }
        
        function handleTagInput(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const newTag = dom.tagsInput.value.trim();
                if (newTag && !tags.includes(newTag)) {
                    tags.push(newTag);
                    renderTags();
                }
                dom.tagsInput.value = '';
            }
        }
        
        function removeTag(e) {
            const tagToRemove = e.target.dataset.tag;
            tags = tags.filter(tag => tag !== tagToRemove);
            renderTags();
        }

        async function loadDropdowns() {
            UI.showSpinner();
            try {
                const baseUrl = Config.get('xpiBaseUrl');
                const token = Auth.getToken();
                const headers = { 'Authorization': `Bearer ${token}` };
                
                const [clients, debtors, agencies] = await Promise.all([
                    Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/v1.0/value/clients-grm-mys`, { headers }),
                    Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/v1.0/value/debtors-grm-mys`, { headers }),
                    Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/v1.0/value/agencies`, { headers })
                ]);

                populateSelect(dom.clientSelect, clients.value);
                populateSelect(dom.debtorSelect, debtors.value);
                populateSelect(dom.agencySelect, agencies.value);
                
                // Set default values from form if they exist in the loaded data
                // Example: dom.clientSelect.value = 'Adidas Group'; (if it exists)
                
            } catch (error) {
                console.error('Failed to load dropdowns:', error);
                UI.showToast('Failed to load form data. Please refresh.', 'error');
            } finally {
                UI.hideSpinner();
            }
        }
        
        function populateSelect(selectEl, data) {
            if (!data || !Array.isArray(data)) return;
            selectEl.innerHTML = '<option value="">Select an option...</option>';
            data.forEach(item => {
                selectEl.innerHTML += `<option value="${item.value}">${item.value}</option>`;
            });
        }

        async function handleSubmit(e) {
            e.preventDefault();
            dom.submitBtn.disabled = true;
            dom.submitBtn.textContent = 'Submitting...';
            dom.resultPre.classList.add('hidden');
            UI.showSpinner();

            try {
                const formData = new FormData(dom.form);
                const payload = {
                    type: formData.get('type'),
                    space: formData.get('space'),
                    entity: formData.get('entity'),
                    varientId: parseInt(formData.get('varientId'), 10),
                    fields: {}
                };
                
                const formFields = [
                    'requestedstartdate', 'agency', 'brand', 'client', 'debtor', 'currency', 'pod',
                    'campaignname', 'campaignstartdate', 'campaignenddate', 'campaignobjective',
                    'requestormarket', 'optin', 'porequired', 'overallbudget'
                ];
                
                formFields.forEach(field => {
                    payload.fields[field] = formData.get(field);
                });
                
                // Add tags
                payload.fields.selectedchannels = tags;
                
                const baseUrl = Config.get('xpiBaseUrl');
                const token = Auth.getToken();
                
                const response = await Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/campaign`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                
                dom.resultPre.textContent = JSON.stringify(response, null, 2);
                dom.resultPre.className = 'styled-pre-success mt-6';
                dom.resultPre.classList.remove('hidden');
                UI.showToast('Campaign submitted successfully!', 'success');
                dom.form.reset(); // Clear form
                tags = [];
                renderTags();

            } catch (error) {
                dom.resultPre.textContent = JSON.stringify(error, null, 2);
                dom.resultPre.className = 'styled-pre-error mt-6';
                dom.resultPre.classList.remove('hidden');
                UI.showToast('Submission failed. Please check details.', 'error');
            } finally {
                dom.submitBtn.disabled = false;
                dom.submitBtn.textContent = 'Submit Campaign';
                UI.hideSpinner();
            }
        }
        
        return { init };
    })();

    // === Module: Master Data ===
    const MasterData = (function() {
        let currentSlug = null;
        let currentSchema = null;
        let currentData = [];
        let dom = {};
        let currentInstance = null; // The cloned template node
        
        // Modal DOM
        const modal = document.getElementById('modal-master-data');
        const modalTitle = document.getElementById('master-data-modal-title');
        const modalForm = document.getElementById('master-data-form');
        const modalFormFields = document.getElementById('master-data-form-fields');
        const modalIdField = document.getElementById('master-data-id');
        const modalCancelBtn = document.getElementById('master-data-cancel-btn');
        
        // Delete Modal DOM
        const deleteModal = document.getElementById('modal-delete-confirm');
        const deleteCancelBtn = document.getElementById('delete-cancel-btn');
        const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

        function init(slug) {
            currentSlug = slug;
            currentSchema = MASTER_DATA_SCHEMAS[slug];
            if (!currentSchema) {
                console.error(`No schema found for slug: ${slug}`);
                return;
            }
            
            // Clear container and clone template
            const container = document.getElementById('module-master-data');
            container.innerHTML = ''; // Clear previous instance
            const template = document.getElementById('master-data-template');
            currentInstance = template.content.cloneNode(true);
            
            // --- Scope DOM queries to the cloned instance ---
            dom.title = currentInstance.querySelector('[data-template-id="title"]');
            dom.loadBtn = currentInstance.querySelector('[data-template-id="load-btn"]');
            dom.createBtn = currentInstance.querySelector('[data-template-id="create-btn"]');
            dom.tableHead = currentInstance.querySelector('[data-template-id="table-head"]');
            dom.tableBody = currentInstance.querySelector('[data-template-id="table-body"]');
            dom.noData = currentInstance.querySelector('[data-template-id="no-data"]');
            
            // --- Configure Template ---
            dom.title.textContent = currentSchema.title;
            
            // Build table header
            const headerRow = document.createElement('tr');
            currentSchema.fields.forEach(field => {
                headerRow.innerHTML += `<th class="styled-table-th">${field.label}</th>`;
            });
            headerRow.innerHTML += `<th class="styled-table-th">Actions</th>`;
            dom.tableHead.appendChild(headerRow);
            
            // --- Bind Events ---
            dom.loadBtn.addEventListener('click', loadData);
            dom.createBtn.addEventListener('click', () => showEditModal(null));
            modalForm.onsubmit = (e) => { e.preventDefault(); saveData(); };
            modalCancelBtn.onclick = () => UI.hideModal(modal);
            deleteCancelBtn.onclick = () => UI.hideModal(deleteModal);

            // Append to DOM and apply styles
            container.appendChild(currentInstance);
            Styling.apply();
            
            // Auto-load data
            loadData();
        }

        async function loadData() {
            UI.showSpinner();
            dom.noData.classList.add('hidden');
            try {
                const baseUrl = Config.get('xpiBaseUrl');
                const token = Auth.getToken();
                const url = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}`;
                
                const response = await Api.fetchWithLogs(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                currentData = response.value || [];
                renderTable();
                
            } catch (error) {
                console.error('Failed to load master data:', error);
                UI.showToast('Failed to load data.', 'error');
                dom.tableBody.innerHTML = '';
                dom.noData.classList.remove('hidden');
            } finally {
                UI.hideSpinner();
            }
        }
        
        function renderTable() {
            dom.tableBody.innerHTML = '';
            if (currentData.length === 0) {
                dom.noData.classList.remove('hidden');
                return;
            }
            
            currentData.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-700 hover:bg-gray-700';
                
                let rowHtml = '';
                currentSchema.fields.forEach(field => {
                    const value = item[field.id] || (item[field.label] !== undefined ? item[field.label] : null); // Handle "CF Name"
                    rowHtml += `<td class="styled-table-td">${value || 'N/A'}</td>`;
                });
                
                rowHtml += `
                    <td class="styled-table-td space-x-2">
                        <button class="styled-btn-secondary !px-2 !py-1 text-xs" data-id="${item.id}">Edit</button>
                        <button class="styled-btn-danger !px-2 !py-1 text-xs" data-id="${item.id}">Delete</button>
                    </td>
                `;
                tr.innerHTML = rowHtml;
                
                // Bind row buttons
                tr.querySelector('.styled-btn-secondary').addEventListener('click', (e) => {
                    const itemToEdit = currentData.find(d => d.id === e.target.dataset.id);
                    showEditModal(itemToEdit);
                });
                tr.querySelector('.styled-btn-danger').addEventListener('click', (e) => {
                    showDeleteModal(e.target.dataset.id);
                });
                
                dom.tableBody.appendChild(tr);
            });
            Styling.apply(); // Style new buttons
        }

        function showEditModal(item) {
            modalTitle.textContent = item ? `Edit ${currentSchema.title}` : `Create ${currentSchema.title}`;
            modalIdField.value = item ? item.id : '';
            
            modalFormFields.innerHTML = '';
            currentSchema.fields.forEach(field => {
                if (field.readonly && item) { // Only show read-only for existing items
                    modalFormFields.innerHTML += `
                        <div class="mb-4">
                            <label class="styled-label">${field.label}</label>
                            <input type="text" class="styled-input bg-gray-600" value="${item[field.id] || ''}" readonly>
                        </div>
                    `;
                } else if (!field.readonly) {
                    const isRequired = field.required ? 'required' : '';
                    const value = item ? (item[field.id] || (item[field.label] !== undefined ? item[field.label] : '')) : '';
                    modalFormFields.innerHTML += `
                        <div class="mb-4">
                            <label for="md-field-${field.id}" class="styled-label">${field.label}</label>
                            <input type="text" id="md-field-${field.id}" name="${field.id || field.label}" class="styled-input" value="${value}" ${isRequired}>
                        </div>
                    `;
                }
            });
            Styling.apply();
            UI.showModal(modal);
        }

        async function saveData() {
            UI.showSpinner();
            const id = modalIdField.value;
            const isEditing = !!id;
            
            const baseUrl = Config.get('xpiBaseUrl');
            // Use dynamic OData context based on URL, as per spec
            const odataContext = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}`; 

            const payload = {
                "@odata.context": odataContext
            };

            const formData = new FormData(modalForm);
            currentSchema.fields.forEach(field => {
                if (!field.readonly) {
                    payload[field.id || field.label] = formData.get(field.id || field.label);
                }
            });

            if (isEditing) {
                payload.id = id;
            }
            
            const url = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}`;
            const method = isEditing ? 'POST' : 'POST';            
            try {
                await Api.fetchWithLogs(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.getToken()}`
                    },
                    body: JSON.stringify(payload)
                });
                
                UI.showToast(`Record ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
                UI.hideModal(modal);
                loadData(); // Refresh table
                
            } catch (error) {
                console.error('Failed to save data:', error);
                UI.showToast('Failed to save record.', 'error');
            } finally {
                UI.hideSpinner();
            }
        }
        
        function showDeleteModal(id) {
            // Use closure to pass ID to confirm button
            deleteConfirmBtn.onclick = () => deleteData(id);
            UI.showModal(deleteModal);
        }
        
        async function deleteData(id) {
            UI.showSpinner();
            UI.hideModal(deleteModal);
            try {
                const baseUrl = Config.get('xpiBaseUrl');
                const url = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}/${id}`;
                
                await Api.fetchWithLogs(url, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
                });
                
                UI.showToast('Record deleted successfully!', 'success');
                loadData(); // Refresh table
                
            } catch (error) {
                console.error('Failed to delete data:', error);
                UI.showToast('Failed to delete record.', 'error');
            } finally {
                UI.hideSpinner();
            }
        }

        return { init };
    })();

    // --- App Entry Point ---
    document.addEventListener('DOMContentLoaded', init);

    // Public API (if needed)
    return {};

})();


