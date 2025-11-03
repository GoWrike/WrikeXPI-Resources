/*
 * XPI Portal Application Logic
 * ===========================
 */
(function() {
    "use strict";

    /**
     * @typedef {Object} Module
     * @property {string} code
     * @property {string} name
     * @property {string} type
     * @property {Function} [factory]
     * @property {Object} [config]
     */

    const App = {
        // --- CONFIGURATION ---
        config: {
            modules: {
                'MOD.A': { code: 'MOD.A', name: 'Admin', type: 'Built-in' },
                'MOD.B': { code: 'MOD.B', name: 'Login', type: 'Built-in' },
                'MOD.C': { code: 'MOD.C', name: 'Campaign Submission', type: 'User-defined' },
                'MAS.DemoCient': { 
                    code: 'MAS.DemoCient', 
                    name: 'Demo Client', 
                    type: 'User-defined',
                    factory: 'masterData',
                    config: {
                        slug: 'demoxpiclients',
                        title: 'Demo Client Management',
                        fields: ['id', 'value', 'note', 'fincode', 'code']
                    }
                },
                'MAS.XPICFMapping': {
                    code: 'MAS.XPICFMapping',
                    name: 'XPI Field Mapping',
                    type: 'User-defined',
                    factory: 'masterData',
                    config: {
                        slug: 'xpicfmapping',
                        title: 'XPI Custom Field Mapping',
                        fields: ['id', 'value', 'CF Name']
                    }
                }
            },
            defaultModule: 'MOD.C', // Default module for logged-in users
            defaultBaseUrl: 'https://xpi-api.gowrike.space/',
            devLogKey: 'xpiDevLogs',
            configKey: 'xpiGlobalConfig'
        },

        // --- STATE ---
        state: {
            isNavCollapsed: false,
            initializedModules: new Set(),
            currentModule: null
        },

        // --- DOM ELEMENTS ---
        elements: {}, // Cache for frequently accessed elements

        // --- INITIALIZATION ---
        init: function() {
            // 1. Cache key DOM elements
            App.elements = {
                sidebar: document.getElementById('nav-sidebar'),
                navToggleBtn: document.getElementById('nav-toggle-btn'),
                navLinks: document.getElementById('nav-links'),
                userProfile: document.getElementById('user-profile'),
                mainContent: document.getElementById('main-content'),
                devToolToggle: document.getElementById('dev-tool-toggle'),
                globalSpinner: document.getElementById('global-spinner')
            };

            // 2. Apply dynamic Tailwind styles (MODERN THEME)
            App.theme.applyStyles();

            // 3. Initialize core components
            App.layout.init();
            App.devTool.init();
            
            // 4. Initialize router (this will trigger the first module load)
            App.router.init();
        },

        // =================================================================
        //  THEME & STYLING ENGINE (*** NEW MODERN STYLES ***)
        // =================================================================
        theme: {
            /**
             * applyStyles
             * Replaces placeholder CSS classes with full Tailwind strings.
             */
            applyStyles: function() {
                const styles = {
                    // Layout
                    'styled-form-container': 'bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto',
                    'styled-card': 'bg-gray-800 rounded-lg shadow-lg overflow-hidden',
                    'styled-sidebar': 'bg-gray-800 text-gray-200 w-64 border-r border-gray-700/50',
                    'styled-sidebar-header-title': 'opacity-100',
                    'styled-form-title': 'text-2xl font-semibold text-white mb-6 pb-2 border-b border-gray-700',
                    
                    // Buttons
                    'styled-btn-primary': 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg',
                    'styled-btn-secondary': 'bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md',
                    'styled-btn-danger': 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg',
                    'styled-icon-btn': 'p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800',
                    'styled-dev-tool-btn': 'bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                    'styled-tag': 'bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2',
                    'styled-tag-remove': 'cursor-pointer text-blue-100 hover:text-white font-bold transition-colors duration-150',

                    // Forms
                    'styled-label': 'block text-sm font-medium text-gray-400 mb-1.5',
                    'styled-input': 'bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 transition duration-200',
                    'styled-select': 'bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 transition duration-200 disabled:opacity-50',

                    // Tables
                    'styled-table': 'w-full text-sm text-left text-gray-300',
                    'styled-table-header': 'text-xs text-gray-400 uppercase bg-gray-700/50',
                    'styled-table-cell': 'px-6 py-4 whitespace-nowrap',
                    'styled-table-action-btn': 'font-medium text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-150',

                    // Modals
                    'styled-modal-backdrop': 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4',
                    'styled-modal-dialog': 'bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700',
                    'styled-modal-title': 'text-xl font-semibold text-white',
                    
                    // Misc
                    'styled-nav-link': 'flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'styled-nav-link-active': 'bg-blue-600 text-white shadow-inner',
                    'styled-pre': 'bg-gray-900 border border-gray-700 text-gray-200 p-4 rounded-lg overflow-auto text-sm',
                    'styled-pre-error': 'bg-red-900/20 border border-red-700/50 text-red-200 p-4 rounded-lg overflow-auto text-sm',
                    'styled-spinner': 'w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin'
                };

                for (const [placeholder, tailwindString] of Object.entries(styles)) {
                    document.querySelectorAll(`.${placeholder}`).forEach(el => {
                        // Preserve any existing non-placeholder classes
                        const existingClasses = Array.from(el.classList).filter(c => c !== placeholder);
                        // Apply new classes
                        el.className = [...existingClasses, ...tailwindString.split(' ')].join(' ');
                    });
                }
            }
        },
        
        // =================================================================
        //  STORAGE UTILITIES
        // =================================================================
        storage: {
            local: {
                get: (key) => localStorage.getItem(key),
                set: (key, value) => localStorage.setItem(key, value),
                remove: (key) => localStorage.removeItem(key),
                getObject: (key) => {
                    try {
                        return JSON.parse(localStorage.getItem(key));
                    } catch (e) {
                        console.warn('Could not parse local storage object:', key, e);
                        return null;
                    }
                },
                setObject: (key, value) => {
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                    } catch (e) {
                        console.error('Could not set local storage object:', key, e);
                    }
                }
            },
            session: {
                get: (key) => sessionStorage.getItem(key),
                set: (key, value) => sessionStorage.setItem(key, value),
                remove: (key) => sessionStorage.removeItem(key),
                getObject: (key) => {
                     try {
                        return JSON.parse(sessionStorage.getItem(key));
                    } catch (e) {
                        console.warn('Could not parse session storage object:', key, e);
                        return null;
                    }
                },
                setObject: (key, value) => {
                    try {
                        sessionStorage.setItem(key, JSON.stringify(value));
                    } catch (e) {
                        console.error('Could not set session storage object:', key, e);
                    }
                },
                clear: () => sessionStorage.clear()
            }
        },

        // =================================================================
        //  UI & LAYOUT
        // =================================================================
        layout: {
            init: function() {
                // --- Sidebar Toggle ---
                App.elements.navToggleBtn.addEventListener('click', () => {
                    App.state.isNavCollapsed = !App.state.isNavCollapsed;
                    if (App.state.isNavCollapsed) {
                        App.elements.sidebar.classList.add('w-16');
                        App.elements.sidebar.classList.remove('w-64');
                        App.elements.sidebar.querySelectorAll('.transition-opacity').forEach(el => {
                            el.classList.add('opacity-0', 'pointer-events-none');
                        });
                        App.elements.sidebar.querySelector('.styled-sidebar-header-title').classList.add('opacity-0');
                    } else {
                        App.elements.sidebar.classList.remove('w-16');
                        App.elements.sidebar.classList.add('w-64');
                        App.elements.sidebar.querySelectorAll('.transition-opacity').forEach(el => {
                            el.classList.remove('opacity-0', 'pointer-events-none');
                        });
                        App.elements.sidebar.querySelector('.styled-sidebar-header-title').classList.remove('opacity-0');
                    }
                });

                // --- Update Layout based on Auth ---
                this.updateLayout();
            },

            /**
             * updateLayout
             * Updates sidebar and user profile based on login state
             */
            updateLayout: function() {
                if (App.auth.isLoggedIn()) {
                    this.updateUserProfile();
                    this.updateSidebarNav();
                    App.elements.sidebar.classList.remove('hidden');
                } else {
                    App.elements.userProfile.innerHTML = '';
                    App.elements.navLinks.innerHTML = '';
                    App.elements.sidebar.classList.add('hidden');
                }
            },

            /**
             * updateUserProfile
             * Populates the user profile section in the sidebar
             */
            updateUserProfile: function() {
                const profile = App.auth.getUserProfile();
                if (!profile.firstName) {
                    App.elements.userProfile.innerHTML = '';
                    return;
                }
                
                App.elements.userProfile.innerHTML = `
                    <div class="flex items-center">
                        <img src="${profile.avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full" onerror="this.style.display='none'">
                        <div class="ml-3 transition-opacity duration-200">
                            <p class="text-sm font-medium text-white">${profile.firstName} ${profile.lastName}</p>
                            <a href="#" id="logout-link" class="text-xs text-blue-400 hover:text-blue-300">Logout</a>
                        </div>
                    </div>
                `;
                
                document.getElementById('logout-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    App.auth.logout();
                });
            },

            /**
             * updateSidebarNav
             * Populates the navigation links for User-defined modules
             */
            updateSidebarNav: function() {
                const links = [];
                for (const mod of Object.values(App.config.modules)) {
                    if (mod.type === 'User-defined') {
                        links.push(`
                            <a href="#${mod.code}" class="styled-nav-link" data-nav-link="${mod.code}">
                                <!-- Simple icon placeholder -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-file-earmark-text flex-shrink-0" viewBox="0 0 16 16">
                                    <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
                                    <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zM4 1a1 1 0 0 1 1-1h4.5v3.5A1.5 1.5 0 0 0 11 6V2.5L14 5.5V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1 1z"/>
                                </svg>
                                <span class="ml-3 transition-opacity duration-200">${mod.name}</span>
                            </a>
                        `);
                    }
                }
                App.elements.navLinks.innerHTML = links.join('');
            },
            
            /**
             * setActiveNav
             * Highlights the active navigation link
             */
            setActiveNav: function(moduleCode) {
                document.querySelectorAll('[data-nav-link]').forEach(link => {
                    link.classList.remove('styled-nav-link-active');
                    if (link.dataset.navLink === moduleCode) {
                        link.classList.add('styled-nav-link-active');
                    }
                });
            }
        },

        // =================================================================
        //  UI UTILITIES
        // =================================================================
        utils: {
            showSpinner: () => App.elements.globalSpinner.classList.remove('hidden'),
            hideSpinner: () => App.elements.globalSpinner.classList.add('hidden'),

            /**
             * showToast
             * Displays a non-blocking toast notification
             * @param {string} message - The message to display
             * @param {'success' | 'error'} type - Toast type
             */
            showToast: function(message, type = 'success') {
                const toastId = `toast-${Date.now()}`;
                const toast = document.createElement('div');
                toast.id = toastId;
                
                const colors = {
                    success: 'bg-green-600 text-white',
                    error: 'bg-red-600 text-white'
                };
                
                toast.className = `p-4 rounded-lg shadow-lg ${colors[type]}`;
                // Basic animation fallback
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                
                toast.innerHTML = `<p>${message}</p>`;
                
                document.getElementById('toast-container').appendChild(toast);
                
                // Fade in
                setTimeout(() => { 
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateX(0)';
                }, 10);
                
                // Fade out
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(100%)';
                    toast.addEventListener('transitionend', () => toast.remove());
                }, 3000);
            },

            /**
             * showModal
             * Displays a modal dialog
             * @param {string} modalId - The ID of the modal to show
             */
            showModal: function(modalId) {
                document.getElementById(modalId)?.classList.remove('hidden');
            },
            
            /**
             * hideModal
             * Hides a modal dialog
             * @param {string} modalId - The ID of the modal to hide
             */
            hideModal: function(modalId) {
                document.getElementById(modalId)?.classList.add('hidden');
            },
            
            /**
             * showConfirmModal
             * Awaits user confirmation
             * @param {string} title - The modal title
             * @param {string} body - The modal body text
             * @returns {Promise<boolean>} - Resolves true if confirmed, false if canceled
             */
            showConfirmModal: function(title, body) {
                return new Promise((resolve) => {
                    const modal = document.getElementById('confirm-modal');
                    document.getElementById('confirm-modal-title').textContent = title;
                    document.getElementById('confirm-modal-body').textContent = body;
                    
                    const okBtn = document.getElementById('confirm-modal-ok');
                    const cancelBtn = document.getElementById('confirm-modal-cancel');

                    // Use .cloneNode to remove old listeners
                    const okClone = okBtn.cloneNode(true);
                    okBtn.parentNode.replaceChild(okClone, okBtn);
                    
                    const cancelClone = cancelBtn.cloneNode(true);
                    cancelBtn.parentNode.replaceChild(cancelClone, cancelBtn);

                    okClone.addEventListener('click', () => {
                        App.utils.hideModal('confirm-modal');
                        resolve(true);
                    });
                    
                    cancelClone.addEventListener('click', () => {
                        App.utils.hideModal('confirm-modal');
                        resolve(false);
                    });
                    
                    App.utils.showModal('confirm-modal');
                });
            },
            
            /**
             * populateDropdown
             * Fills a <select> element with options from an API call
             * @param {string} selectId - The ID of the <select> element
             * @param {string} url - The API endpoint
             * @param {string} defaultOption - The placeholder text
             */
            populateDropdown: async function(selectId, url, defaultOption) {
                const select = document.getElementById(selectId);
                if (!select) {
                    console.error(`Dropdown element not found: ${selectId}`);
                    return;
                }
                try {
                    const data = await App.api.get(url);
                    if (data && data.value && Array.isArray(data.value)) {
                        select.innerHTML = `<option value="">${defaultOption}</option>`;
                        data.value.forEach(item => {
                            select.innerHTML += `<option value="${item.value}">${item.value}</option>`;
                        });
                    }
                    select.disabled = false;
                } catch (error) {
                    console.error(`Failed to load dropdown ${selectId}:`, error);
                    select.innerHTML = `<option value="">Error loading data</option>`;
                    select.disabled = true;
                }
            }
        },

        // =================================================================
        //  AUTHENTICATION
        // =================================================================
        auth: {
            isLoggedIn: () => !!App.storage.session.get('xpiToken'),
            
            getUserProfile: () => ({
                firstName: App.storage.session.get('xpiUserFirstName'),
                lastName: App.storage.session.get('xpiUserLastName'),
                avatarUrl: App.storage.session.get('xpiUserAvatar')
            }),

            logout: () => {
                App.storage.session.clear();
                App.layout.updateLayout();
                App.router.navigateTo('MOD.B');
            },

            /**
             * handleAuthRedirect
             * Generates clientId, stores it, and redirects to Wrike
             */
            handleAuthRedirect: async function() {
                try {
                    App.utils.showSpinner();
                    const timestamp = Date.now().toString();
                    const random = Math.random().toString();
                    const data = new TextEncoder().encode(timestamp + random);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    const clientId = hexHash.slice(-7);
                    
                    App.storage.session.set('clientId', clientId);
                    
                    const baseUrl = App.storage.local.get('xpiBaseUrl') || App.config.defaultBaseUrl;
                    const redirectUri = window.location.origin + window.location.pathname;
                    const authUrl = `${baseUrl}?accountId=3128883&redirectUri=${encodeURIComponent(redirectUri)}&client_id=${clientId}`;
                    
                    window.location.href = authUrl;
                } catch (error) {
                    console.error('Auth redirect failed:', error);
                    App.utils.showToast('Authentication initialization failed.', 'error');
                    App.utils.hideSpinner();
                }
            },

            /**
             * handleAuthCallback
             * Exchanges code for token, then verifies profile
             * @param {string} code - The auth code from the URL
             */
            handleAuthCallback: async function(code) {
                const clientId = App.storage.session.get('clientId');
                const view = App.elements.mainContent.querySelector('[data-module-id="MOD.B"]');
                const msgEl = view.querySelector('#login-callback-message');
                const errorEl = view.querySelector('#login-callback-error');
                const errorPre = errorEl.querySelector('pre');
                
                if (!code || !clientId) {
                    msgEl.textContent = 'Error: Missing authentication code or client ID.';
                    errorPre.textContent = 'Code or Client ID not found in session. Please start over.';
                    errorEl.classList.remove('hidden');
                    setTimeout(() => App.router.navigateTo('MOD.B'), 10000);
                    return;
                }

                try {
                    // 1. Exchange code for token
                    msgEl.textContent = 'Exchanging token...';
                    const tokenUrl = `api/v1/wrikexpi/token/exchange?code=${code}&client_id=${clientId}&grant_type=authorization_code`;
                    const tokenData = await App.api.get(tokenUrl);
                    
                    if (!tokenData.success || !tokenData.data.token) {
                        throw new Error(JSON.stringify(tokenData, null, 2));
                    }
                    
                    const { token, credentials } = tokenData.data;
                    App.storage.session.set('xpiToken', token);
                    
                    // 2. Verify profile with credentials (one-time use)
                    msgEl.textContent = 'Verifying user profile...';
                    const profile = await App.api.getProfile(credentials.username, credentials.password);
                    
                    if (!profile.success || !profile.data || profile.data.length === 0) {
                        throw new Error(JSON.stringify(profile, null, 2));
                    }
                    
                    const userData = profile.data[0];
                    App.storage.session.set('xpiUserFirstName', userData.firstName);
                    App.storage.session.set('xpiUserLastName', userData.lastName);
                    App.storage.session.set('xpiUserAvatar', userData.avatarUrl);
                    
                    // 3. Success
                    msgEl.textContent = `Welcome, ${userData.firstName} ${userData.lastName}! Login successful. Redirecting...`;
                    App.layout.updateLayout();
                    
                    // Redirect to default module
                    setTimeout(() => App.router.navigateTo(App.config.defaultModule), 2000);

                } catch (error) {
                    console.error('Callback failed:', error);
                    msgEl.textContent = 'Login failed. We were unable to verify your account.';
                    errorPre.textContent = error.message;
                    errorEl.classList.remove('hidden');
                }
            }
        },
        
        // =================================================================
        //  API WRAPPER (with Logging)
        // =================================================================
        api: {
            /**
             * getBaseUrl
             * Safely retrieves the base URL from storage
             */
            getBaseUrl: () => App.storage.local.get('xpiBaseUrl') || App.config.defaultBaseUrl,

            /**
             * fetch
             * The core fetch wrapper that handles auth, logging, and base URL
             */
            fetch: async function(url, options = {}) {
                const baseUrl = App.api.getBaseUrl();
                const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
                
                const reqOptions = { ...options };
                reqOptions.headers = { ...options.headers };

                // Add Auth token if not present
                const token = App.storage.session.get('xpiToken');
                if (token && !reqOptions.headers['Authorization']) {
                    reqOptions.headers['Authorization'] = `Bearer ${token}`;
                }
                
                const requestLog = {
                    url: fullUrl,
                    method: reqOptions.method || 'GET',
                    headers: { ...reqOptions.headers },
                    body: reqOptions.body
                };
                
                let responseLog = {};
                let errorLog = null;
                
                try {
                    const response = await fetch(fullUrl, reqOptions);
                    
                    const responseBody = await response.json().catch(() => response.text());
                    
                    responseLog = {
                        status: response.status,
                        statusText: response.statusText,
                        body: responseBody
                    };
                    
                    if (!response.ok) {
                        const errorMsg = typeof responseBody === 'object' 
                            ? (responseBody.message || JSON.stringify(responseBody)) 
                            : responseBody;
                        throw new Error(`HTTP ${response.status}: ${errorMsg}`);
                    }
                    
                    return responseBody;

                } catch (error) {
                    console.error('API Fetch Error:', error);
                    errorLog = { message: error.message, stack: error.stack };
                    throw error; // Re-throw for the module to handle
                } finally {
                    App.devTool.logRequest(requestLog, responseLog, errorLog);
                }
            },
            
            // --- Convenience Methods ---
            
            get: (url) => App.api.fetch(url, { method: 'GET' }),
            
            post: (url, data, odataContext) => {
                const payload = { ...data };
                if (odataContext) {
                    payload["@odata.context"] = odataContext;
                }
                return App.api.fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            },
            
            patch: (url, data, odataContext) => {
                const payload = { ...data };
                if (odataContext) {
                    payload["@odata.context"] = odataContext;
                }
                return App.api.fetch(url, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            },
            
            delete: (url) => App.api.fetch(url, { method: 'DELETE' }),

            /**
             * getProfile
             * Special API call for profile using Basic Auth (one-time)
             */
            getProfile: (username, password) => {
                const headers = {
                    'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                };
                return App.api.fetch('api/v1/wrikexpi/amoeba/wrikeapi/contacts?me', {
                    method: 'GET',
                    headers: headers
                });
            }
        },

        // =================================================================
        //  DEV TOOL
        // =================================================================
        devTool: {
            init: function() {
                App.elements.devToolToggle.addEventListener('click', () => this.toggle());
                document.getElementById('dev-tool-close').addEventListener('click', () => this.hide());
                document.getElementById('dev-tool-purge').addEventListener('click', () => this.purgeLogs());
                document.getElementById('payload-modal-close').addEventListener('click', () => App.utils.hideModal('payload-modal'));
            },

            toggle: () => {
                const modal = document.getElementById('dev-tool-modal');
                if (modal.classList.contains('hidden')) {
                    App.devTool.show();
                } else {
                    App.devTool.hide();
                }
            },
            
            show: () => {
                App.devTool.renderLogs();
                App.utils.showModal('dev-tool-modal');
            },
            
            hide: () => App.utils.hideModal('dev-tool-modal'),
            
            /**
             * logRequest
             * Safely logs a request/response pair to localStorage
             * @param {object} request - The request object
             * @param {object} response - The response object
             * @param {object} error - The error object (if any)
             */
            logRequest: function(request, response, error) {
                // **SECURITY**: Scrub Authorization header
                if (request.headers && request.headers['Authorization']) {
                    request.headers['Authorization'] = 'Bearer [REDACTED]';
                }
                
                const logs = App.storage.local.getObject(App.config.devLogKey) || [];
                logs.unshift({
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    request,
                    response,
                    error
                });
                
                // Keep logs to a reasonable size (e.g., 50)
                if (logs.length > 50) {
                    logs.pop();
                }
                
                App.storage.local.setObject(App.config.devLogKey, logs);
            },
            
            purgeLogs: () => {
                App.storage.local.remove(App.config.devLogKey);
                App.devTool.renderLogs();
            },
            
            /**
             * renderLogs
             * Renders the log table from localStorage
             */
            renderLogs: function() {
                const tbody = document.getElementById('dev-tool-log-body');
                tbody.innerHTML = '';
                const logs = App.storage.local.getObject(App.config.devLogKey) || [];
                
                if (logs.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" class="styled-table-cell text-center text-gray-400">No logs found.</td></tr>`;
                    return;
                }
                
                logs.forEach(log => {
                    try {
                        const row = document.createElement('tr');
                        row.className = 'border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-150';
                        
                        let status = 'N/A';
                        let statusClass = 'text-gray-400';
                        if (log.error) {
                            status = 'Error';
                            statusClass = 'text-red-400 font-bold';
                        } else if (log.response.status) {
                            status = log.response.status;
                            statusClass = log.response.status >= 400 ? 'text-red-400' : 'text-green-400';
                        }
                        
                        row.innerHTML = `
                            <td class="styled-table-cell text-xs">${new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td class="styled-table-cell font-mono ${statusClass}">${status}</td>
                            <td class="styled-table-cell font-mono">${log.request.method}</td>
                            <td class="styled-table-cell text-xs">${log.request.url.replace(App.api.getBaseUrl(), '/')}</td>
                            <td class="styled-table-cell">
                                <a href="#" class="styled-table-action-btn" data-log-id="${log.id}" data-log-type="request">View</a>
                            </td>
                            <td class="styled-table-cell">
                                <a href="#" class="styled-table-action-btn" data-log-id="${log.id}" data-log-type="response">View</a>
                            </td>
                        `;
                        tbody.appendChild(row);
                    } catch (e) {
                        console.error('Failed to render log entry:', e, log);
                        // Render an error row, as requested
                        const errRow = document.createElement('tr');
                        errRow.className = 'border-b border-gray-700 bg-red-900';
                        errRow.innerHTML = `<td colspan="6" class="styled-table-cell text-red-300">Failed to parse and render this log entry.</td>`;
                        tbody.appendChild(errRow);
                    }
                });

                // Add event listeners for "View" links
                tbody.querySelectorAll('.styled-table-action-btn').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const id = e.target.dataset.logId;
                        const type = e.target.dataset.logType;
                        const logEntry = logs.find(l => l.id == id);
                        
                        if (logEntry) {
                            if (type === 'request') {
                                App.devTool.showPayload('Request Payload', logEntry.request.body || 'No Body');
                            } else {
                                const content = logEntry.error ? logEntry.error : logEntry.response.body;
                                App.devTool.showPayload('Response / Error', content);
                            }
                        }
                    });
                });
            },
            
            /**
             * showPayload
             * Renders content in the payload modal
             */
            showPayload: function(title, content) {
                document.getElementById('payload-modal-title').textContent = title;
                const pre = document.getElementById('payload-modal-content');
                
                try {
                    if (typeof content === 'object') {
                        pre.textContent = JSON.stringify(content, null, 2);
                    } else if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                        // Try to parse stringified JSON
                        pre.textContent = JSON.stringify(JSON.parse(content), null, 2);
                    }
                    else {
                        pre.textContent = content;
                    }
                } catch (e) {
                     pre.textContent = content; // Fallback to raw text
                }
                
                App.utils.showModal('payload-modal');
            }
        },

        // =================================================================
        //  ROUTER
        // =================================================================
        router: {
            init: function() {
                window.addEventListener('hashchange', () => this.handleRoute());
                this.handleRoute(); // Handle initial route
            },
            
            /**
             * getRoute
             * Parses the current URL for hash and query params
             */
            getRoute: () => {
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(window.location.search);
                return {
                    hash: hash,
                    code: params.get('code')
                };
            },
            
            navigateTo: (moduleCode) => {
                window.location.hash = moduleCode;
            },

            /**
             * handleRoute
             * The main routing logic
             */
            handleRoute: function() {
                const { hash, code } = this.getRoute();
                const isLoggedIn = App.auth.isLoggedIn();
                let moduleCode = '';

                // Clear query string (for auth code) to prevent re-triggers
                if (code) {
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                }

                if (hash === 'admin' || hash === 'MOD.A') {
                    moduleCode = 'MOD.A';
                } else if (code) {
                    moduleCode = 'MOD.B';
                } else if (isLoggedIn) {
                    moduleCode = hash || App.config.defaultModule;
                } else {
                    moduleCode = 'MOD.B';
                }

                // Check if module exists
                if (!App.config.modules[moduleCode]) {
                    console.warn(`Module ${moduleCode} not found. Redirecting.`);
                    moduleCode = isLoggedIn ? App.config.defaultModule : 'MOD.B';
                }
                
                App.state.currentModule = moduleCode;
                App.layout.setActiveNav(moduleCode);
                
                // Load the module view
                const module = App.config.modules[moduleCode];
                let view = App.elements.mainContent.querySelector(`[data-module-id="${moduleCode}"]`);
                
                // --- LAZY LOADING ---
                if (!view) {
                    // It's a lazy-loaded module, let's initialize it
                    if (module.factory && App.modules[module.factory]) {
                        // Use the factory to create the module logic
                        App.modules[moduleCode] = App.modules[module.factory](module.config);
                    }
                    
                    if (App.modules[moduleCode] && App.modules[moduleCode].init) {
                        view = App.modules[moduleCode].init();
                    } else {
                        console.error(`Module ${moduleCode} has no init method!`);
                        return;
                    }
                }
                
                // Hide all other modules
                App.elements.mainContent.querySelectorAll('section[data-module-id]').forEach(s => s.classList.add('hidden'));
                
                // Show the target module
                view.classList.remove('hidden');

                // Special handling for login module modes
                if (moduleCode === 'MOD.B') {
                    App.modules['MOD.B'].handleMode(code);
                }
                
                // Trigger lazy data-loading if needed
                if (App.modules[moduleCode] && App.modules[moduleCode].onShow) {
                    App.modules[moduleCode].onShow();
                }
            }
        },

        // =================================================================
        //  MODULE DEFINITIONS
        // =================================================================
        modules: {
            
            // --- Admin Module (MOD.A) ---
            'MOD.A': {
                init: function() {
                    const template = document.getElementById('template-admin');
                    const view = template.content.cloneNode(true).firstElementChild;
                    App.elements.mainContent.appendChild(view);
                    
                    const form = view.querySelector('#admin-form');
                    const urlInput = view.querySelector('#xpiBaseUrl');
                    const suggestions = view.querySelector('#xpiBaseUrlSuggestions');

                    // Load current config
                    const config = App.storage.local.getObject(App.config.configKey) || {};
                    urlInput.value = config.xpiBaseUrl || App.config.defaultBaseUrl;

                    // Wire up suggestions
                    suggestions.addEventListener('change', (e) => {
                        if (e.target.value) {
                            urlInput.value = e.target.value;
                        }
                    });
                    
                    // Wire up save
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const newConfig = { xpiBaseUrl: urlInput.value };
                        App.storage.local.setObject(App.config.configKey, newConfig);
                        App.utils.showToast('Configuration saved successfully!', 'success');
                    });
                    
                    return view;
                }
            },
            
            // --- Login Module (MOD.B) ---
            'MOD.B': {
                view: null, // Cache the view
                init: function() {
                    // This module uses two templates. We clone them both.
                    const authTemplate = document.getElementById('template-login-auth');
                    const authView = authTemplate.content.cloneNode(true).firstElementChild;
                    authView.classList.add('hidden'); // Hide by default
                    authView.dataset.mode = 'auth';
                    App.elements.mainContent.appendChild(authView);
                    
                    const callbackTemplate = document.getElementById('template-login-callback');
                    const callbackView = callbackTemplate.content.cloneNode(true).firstElementChild;
                    callbackView.classList.add('hidden'); // Hide by default
                    callbackView.dataset.mode = 'callback';
                    App.elements.mainContent.appendChild(callbackView);

                    // Combine them into one "view" element for the router
                    // This element itself is never shown, it's just a container
                    this.view = document.createElement('section');
                    this.view.dataset.moduleId = 'MOD.B';
                    this.view.classList.add('hidden'); // This main container is always hidden
                    this.view.appendChild(authView);
                    this.view.appendChild(callbackView);
                    App.elements.mainContent.appendChild(this.view);

                    // Wire up listeners
                    authView.querySelector('#login-auth-btn').addEventListener('click', App.auth.handleAuthRedirect);
                    callbackView.querySelector('#login-start-over-btn').addEventListener('click', () => {
                        // Clear hash and reload to reset state
                        window.location.hash = '';
                        window.location.search = '';
                    });
                    
                    // This returns the container, but the router will hide/show it
                    // The handleMode function will show the *correct child*
                    return this.view;
                },
                
                handleMode: function(code) {
                    const authView = this.view.querySelector('[data-mode="auth"]');
                    const callbackView = this.view.querySelector('[data-mode="callback"]');

                    // The router shows/hides the main container (this.view)
                    // This function just toggles which *part* of the module is visible
                    
                    if (code) {
                        // Callback mode
                        authView.classList.add('hidden');
                        callbackView.classList.remove('hidden');
                        // Reset callback UI
                        callbackView.querySelector('#login-callback-message').textContent = 'Authenticating... Please wait.';
                        callbackView.querySelector('#login-callback-error').classList.add('hidden');
                        
                        App.auth.handleAuthCallback(code);
                    } else {
                        // Auth mode
                        authView.classList.remove('hidden');
                        callbackView.classList.add('hidden');
                    }
                    
                    // Ensure the parent container is visible
                    this.view.classList.remove('hidden');
                }
            },
            
            // --- Campaign Submission Module (MOD.C) ---
            'MOD.C': {
                view: null,
                isInitialized: false,
                isDataLoaded: false,
                tags: new Set(['Twitter']), // Default tag
                
                init: function() {
                    const template = document.getElementById('template-campaign-submission');
                    this.view = template.content.cloneNode(true).firstElementChild;
                    App.elements.mainContent.appendChild(this.view);
                    
                    this.view.querySelector('#campaign-form').addEventListener('submit', (e) => this.handleSubmit(e));
                    
                    this.initTagInput();
                    this.isInitialized = true;
                    return this.view;
                },
                
                // Called by router when module is shown
                onShow: function() {
                    if (this.isInitialized && !this.isDataLoaded) {
                        this.loadDropdownData();
                    }
                },
                
                loadDropdownData: async function() {
                    this.isDataLoaded = true; // Attempt load only once
                    App.utils.showSpinner();
                    try {
                        await Promise.all([
                            App.utils.populateDropdown('client', 'api/v1/wrikexpi/v1.0/value/clients-grm-mys', 'Select a client...'),
                            App.utils.populateDropdown('debtor', 'api/v1/wrikexpi/v1.0/value/debtors-grm-mys', 'Select a debtor...'),
                            App.utils.populateDropdown('agency', 'api/v1/wrikexpi/v1.0/value/agencies', 'Select an agency...')
                        ]);
                        // Set default dropdown values
                        this.view.querySelector('#client').value = 'Adidas Group';
                        this.view.querySelector('#debtor').value = 'Adidas Malaysia Sdn Bhd';
                        this.view.querySelector('#agency').value = 'Eightbar';
                        
                    } catch (error) {
                        App.utils.showToast('Failed to load form dropdowns.', 'error');
                        console.error('Dropdown load failed:', error);
                    } finally {
                        App.utils.hideSpinner();
                    }
                },
                
                initTagInput: function() {
                    const input = this.view.querySelector('#selectedchannels-input');
                    
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const value = input.value.trim();
                            if (value) {
                                this.tags.add(value);
                                this.renderTags();
                                input.value = '';
                            }
                        }
                    });
                    
                    this.renderTags(); // Render default tags
                },
                
                renderTags: function() {
                    const container = this.view.querySelector('#selectedchannels-tags');
                    container.innerHTML = '';
                    this.tags.forEach(tag => {
                        const tagEl = document.createElement('span');
                        // Apply styles directly since it's dynamic
                        tagEl.className = 'styled-tag bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2';
                        tagEl.innerHTML = `
                            ${tag}
                            <span class="styled-tag-remove cursor-pointer text-blue-100 hover:text-white font-bold transition-colors duration-150" data-tag-value="${tag}">&times;</span>
                        `;
                        
                        tagEl.querySelector('.styled-tag-remove').addEventListener('click', (e) => {
                            const value = e.target.dataset.tagValue;
                            this.tags.delete(value);
                            this.renderTags();
                        });
                        
                        container.appendChild(tagEl);
                    });
                },
                
                handleSubmit: async function(e) {
                    e.preventDefault();
                    const form = e.target;
                    const submitBtn = form.querySelector('#campaign-submit-btn');
                    const resultEl = this.view.querySelector('#campaign-result');
                    const resultPre = resultEl.querySelector('pre');
                    
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                    resultEl.classList.add('hidden');
                    
                    try {
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        
                        // Construct the payload
                        const payload = {
                            type: data.type,
                            space: data.space,
                            entity: data.entity,
                            varientId: parseInt(data.varientId),
                            fields: {}
                        };
                        
                        // Populate 'fields' object
                        for (const key in data) {
                            if (!['type', 'space', 'entity', 'varientId'].includes(key)) {
                                payload.fields[key] = data[key];
                            }
                        }
                        
                        // Add tags
                        payload.fields.selectedchannels = Array.from(this.tags);
                        
                        // Make API call
                        const response = await App.api.post('api/v1/wrikexpi/campaign', payload);
                        
                        // Show success
                        resultPre.textContent = JSON.stringify(response, null, 2);
                        resultPre.classList.remove('styled-pre-error');
                        resultPre.classList.add('styled-pre');
                        resultEl.classList.remove('hidden');
                        App.utils.showToast('Campaign submitted successfully!', 'success');
                        
                    } catch (error) {
                        // Show error
                        resultPre.textContent = `Submission Failed:\n\n${error.message}`;
                        resultPre.classList.add('styled-pre-error');
                        resultPre.classList.remove('styled-pre');
                        resultEl.classList.remove('hidden');
                        App.utils.showToast('Campaign submission failed.', 'error');
                        
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Campaign';
                    }
                }
            },
            
            // --- Master Data Factory (Template) ---
            /**
             * masterData
             * A factory function that creates a Master Data module
             * @param {object} config - The module-specific config
             * @param {string} config.slug - The API slug (e.g., 'demoxpiclients')
             * @param {string} config.title - The module title
             * @param {string[]} config.fields - The fields to display
             * @returns {object} - A module object with init()
             */
            masterData: function(config) {
                let view;
                let modal;
                let form;
                
                const API_URL = `api/v1/wrikexpi/v1.0/record/${config.slug}`;
                const ODATA_CONTEXT = `https://api.wrikexpi.groupm.com/api/v1/v1.0/${config.slug}`;

                // --- Private Methods ---

                const fetchData = async () => {
                    const tbody = view.querySelector('#master-data-tbody');
                    tbody.innerHTML = `<tr><td colspan="${config.fields.length + 1}" class="styled-table-cell text-center"><div class="styled-spinner mx-auto"></div></td></tr>`;
                    
                    try {
                        const data = await App.api.get(API_URL);
                        if (data && data.value) {
                            renderTable(data.value);
                        } else {
                            tbody.innerHTML = `<tr><td colspan="${config.fields.length + 1}" class="styled-table-cell text-center text-gray-400">No data found.</td></tr>`;
                        }
                    } catch (error) {
                        App.utils.showToast(`Failed to load data: ${error.message}`, 'error');
                        tbody.innerHTML = `<tr><td colspan="${config.fields.length + 1}" class="styled-table-cell text-center text-red-400">Error: ${error.message}</td></tr>`;
                    }
                };

                const renderTable = (records) => {
                    const tbody = view.querySelector('#master-data-tbody');
                    tbody.innerHTML = '';
                    
                    if (records.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="${config.fields.length + 1}" class="styled-table-cell text-center text-gray-400">No records found.</td></tr>`;
                        return;
                    }
                    
                    records.forEach(record => {
                        const row = document.createElement('tr');
                        row.className = 'hover:bg-gray-700/50 transition-colors duration-150';
                        
                        let cells = '';
                        config.fields.forEach(field => {
                            cells += `<td class="styled-table-cell">${record[field] || 'N/A'}</td>`;
                        });
                        
                        cells += `
                            <td class="styled-table-cell text-right">
                                <button class="styled-table-action-btn" data-id="${record.id}">Edit</button>
                                <button class="styled-table-action-btn text-red-400 hover:text-red-300" data-id="${record.id}">Delete</button>
                            </td>
                        `;
                        row.innerHTML = cells;
                        
                        // Wire up buttons
                        row.querySelector('button[data-id][class*="text-blue-400"]').addEventListener('click', () => openModal('edit', record));
                        row.querySelector('button[data-id][class*="text-red-400"]').addEventListener('click', () => openDeleteConfirm(record.id));
                        
                        tbody.appendChild(row);
                    });
                };

                const openModal = (mode, record = null) => {
                    form.reset();
                    const modalTitle = modal.querySelector('#master-data-modal-title');
                    const idInput = form.querySelector('#master-data-id');
                    
                    if (mode === 'create') {
                        modalTitle.textContent = `Create New ${config.title}`;
                        idInput.value = '';
                    } else {
                        modalTitle.textContent = `Edit ${config.title}`;
                        idInput.value = record.id;
                        // Populate form fields
                        config.fields.forEach(field => {
                            if (field !== 'id') {
                                const input = form.querySelector(`[name="${field}"]`);
                                if (input) input.value = record[field] || '';
                            }
                        });
                    }
                    App.utils.showModal(modal.id);
                };
                
                const closeModal = () => {
                    App.utils.hideModal(modal.id);
                };

                const handleSubmit = async (e) => {
                    e.preventDefault();
                    const saveBtn = form.querySelector('#master-data-modal-save');
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                    
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    const recordId = data.id;
                    
                    // Remove 'id' from data if it's for POST
                    if (!recordId) {
                        delete data.id;
                    }

                    try {
                        if (recordId) {
                            // Update (PATCH)
                            await App.api.patch(`${API_URL}`, data, ODATA_CONTEXT);
                            App.utils.showToast('Record updated successfully!', 'success');
                        } else {
                            // Create (POST)
                            await App.api.post(API_URL, data, ODATA_CONTEXT);
                            App.utils.showToast('Record created successfully!', 'success');
                        }
                        closeModal();
                        fetchData(); // Refresh table
                    } catch (error) {
                        App.utils.showToast(`Error: ${error.message}`, 'error');
                    } finally {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Save Changes';
                    }
                };
                
                const openDeleteConfirm = async (id) => {
                    const confirmed = await App.utils.showConfirmModal(
                        'Confirm Deletion',
                        'Are you sure you want to delete this record? This action cannot be undone.'
                    );
                    
                    if (confirmed) {
                        App.utils.showSpinner();
                        try {
                            await App.api.delete(`${API_URL}/${id}`);
                            App.utils.showToast('Record deleted successfully!', 'success');
                            fetchData(); // Refresh table
                        } catch (error) {
                            App.utils.showToast(`Error: ${error.message}`, 'error');
                        } finally {
                            App.utils.hideSpinner();
                        }
                    }
                };

                // --- Public init() Method ---
                return {
                    init: function() {
                        const template = document.getElementById('template-master-data');
                        view = template.content.cloneNode(true).firstElementChild;
                        
                        // Find the module code for the dataset attribute
                        const moduleCode = Object.keys(App.config.modules).find(key => App.config.modules[key].config?.slug === config.slug);
                        view.dataset.moduleId = moduleCode || config.slug;
                        
                        // Configure title
                        view.querySelector('#master-data-title').textContent = config.title;
                        
                        // Configure table header
                        const thead = view.querySelector('#master-data-thead');
                        let ths = config.fields.map(f => `<th class="styled-table-cell">${f}</th>`).join('');
                        ths += `<th class="styled-table-cell text-right">Actions</th>`;
                        thead.innerHTML = `<tr>${ths}</tr>`;
                        
                        // Configure modal form fields
                        const formFields = view.querySelector('#master-data-form-fields');
                        formFields.innerHTML = config.fields.map(field => {
                            if (field === 'id') return ''; // 'id' is in a hidden input
                            
                            // 'value' is mandatory
                            const isRequired = field === 'value' ? 'required' : '';
                            const isReadonly = field === 'id' ? 'readonly' : '';
                            const label = field.charAt(0).toUpperCase() + field.slice(1);
                            
                            return `
                                <div>
                                    <label for="md-field-${config.slug}-${field}" class="styled-label">${label} ${isRequired ? '*' : ''}</label>
                                    <input type="text" id="md-field-${config.slug}-${field}" name="${field}" 
                                           class="styled-input w-full" 
                                           ${isRequired} ${isReadonly}>
                                </div>
                            `;
                        }).join('');
                        
                        // Cache modal & form
                        modal = view.querySelector('#master-data-modal');
                        modal.id = `master-data-modal-${config.slug}`; // Unique ID
                        form = view.querySelector('#master-data-form');

                        // Wire up main buttons
                        view.querySelector('#master-data-load').addEventListener('click', fetchData);
                        view.querySelector('#master-data-create').addEventListener('click', () => openModal('create'));
                        
                        // Wire up modal buttons
                        modal.querySelector('#master-data-modal-close').addEventListener('click', closeModal);
                        modal.querySelector('#master-data-modal-cancel').addEventListener('click', closeModal);
                        form.addEventListener('submit', handleSubmit);
                        
                        App.elements.mainContent.appendChild(view);
                        return view;
                    },
                    // onShow: () => { } // No auto-load, user must click "Load Data"
                };
            }
            
            // --- Specific Master Data modules are defined in App.router ---
        }
    };

    // --- Start the app ---
    document.addEventListener('DOMContentLoaded', App.init);

})();

