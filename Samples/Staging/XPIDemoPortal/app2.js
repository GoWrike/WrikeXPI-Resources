/*
 * XPI Portal Application Logic - Modules
 * app2.js
 */

// === Module: Admin ===
(function(App) {
    App.AdminModule = (function() {
        let dom = {};
        function init() {
            dom.form = document.getElementById('admin-form');
            dom.urlInput = document.getElementById('config-xpiBaseUrl');
            dom.resyncBtn = document.getElementById('resync-vault-keys-btn');
            
            dom.urlInput.value = App.Config.get('xpiBaseUrl');
            
            dom.form.addEventListener('submit', (e) => {
                e.preventDefault();
                App.Config.set('xpiBaseUrl', dom.urlInput.value);
                App.UI.showToast('Configuration saved successfully!', 'success');
            });

            dom.resyncBtn.addEventListener('click', handleResync);
        }

        async function handleResync() {
            App.UI.showSpinner();
            dom.resyncBtn.disabled = true;
            try {
                const baseUrl = App.Config.get('xpiBaseUrl');
                // The user request specifies the endpoint is /sync-secrets relative to the base URL.
                const url = new URL('sync-secrets', baseUrl).href;
                const token = App.Auth.getToken();

                const response = await App.Api.fetchWithLogs(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.success) {
                    App.UI.showToast(response.message, 'success');
                } else {
                    App.UI.showToast("There's some error, please contact Wrike Global team for assistant.", 'error');
                }
            } catch (error) {
                App.UI.showToast("There's some error, please contact Wrike Global team for assistant.", 'error');
            } finally {
                App.UI.hideSpinner();
                dom.resyncBtn.disabled = false;
            }
        }
        return { init };
    })();
})(App);

// === Module: Login ===
(function(App) {
    App.LoginModule = (function() {
        function init() {
            document.getElementById('login-btn').addEventListener('click', App.Auth.login);
        }
        return { init };
    })();
})(App);

// === Module: Submit Wrike Campaign ===
(function(App) {
    App.SubmitWrikeCampaign = (function() {
        let dom = {};
        let tags = ['Twitter']; // Default tag
        let pendingPrefillData = null;

        function init(prefilledData) {
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

            // Store prefill data to be applied after dropdowns are loaded
            if (prefilledData) {
                pendingPrefillData = prefilledData;
            }
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
            App.Styling.apply(); // Style new tags
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
            App.UI.showSpinner();
            try {
                const baseUrl = App.Config.get('xpiBaseUrl');
                const token = App.Auth.getToken();
                const headers = { 'Authorization': `Bearer ${token}` };
                
                const [clients, debtors, agencies] = await Promise.all([
                    App.Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/v1.0/value/clients-grm-mys`, { headers }),
                    App.Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/v1.0/value/debtors-grm-mys`, { headers }),
                    App.Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/v1.0/value/agencies`, { headers })
                ]);

                populateSelect(dom.clientSelect, clients.value);
                populateSelect(dom.debtorSelect, debtors.value);
                populateSelect(dom.agencySelect, agencies.value);

                // Now that dropdowns are loaded, apply any pending prefill data
                if (pendingPrefillData) {
                    prefillForm();
                    // Once all fields have been prefilled, clear the pending data
                    pendingPrefillData = null;

                    // Automatically trigger the submission
                    console.log('Prefill complete. Automatically submitting campaign...');
                    dom.submitBtn.click();
                }
                
                // Set default values from form if they exist in the loaded data
                // Example: dom.clientSelect.value = 'Adidas Group'; (if it exists)
                
            } catch (error) {
                console.error('Failed to load dropdowns:', error);
                App.UI.showToast('Failed to load form data. Please refresh.', 'error');
            } finally {
                App.UI.hideSpinner();
            }
        }

        function prefillForm() {
            if (!pendingPrefillData) return; // Should not happen with new logic, but good practice

            const fieldMap = {
                'campaign-name': 'campaignname',
                'client': 'client',
                'debtor': 'debtor',
                'brand': 'brand',
                'campaign-objective': 'campaignobjective',
                'campaign-start-date': 'campaignstartdate',
                'campaign-end-date': 'campaignenddate',
                'agency': 'agency'
            };

            for (const [jsonKey, formName] of Object.entries(fieldMap)) {
                if (pendingPrefillData[jsonKey] && dom.form.elements[formName]) {
                    dom.form.elements[formName].value = pendingPrefillData[jsonKey];
                }
            }
        }
        
        function populateSelect(selectEl, data) {
            if (!data || !Array.isArray(data)) return;
            // Keep the first option if it's "Loading..." or "Select..."
            const firstOption = selectEl.querySelector('option');
            firstOption.textContent = "Select an option...";
            firstOption.value = "";
            
            data.forEach(item => {
                selectEl.innerHTML += `<option value="${item.value}">${item.value}</option>`;
            });
        }

        async function handleSubmit(e) {
            e.preventDefault();
            dom.submitBtn.disabled = true;
            dom.submitBtn.textContent = 'Submitting...';
            dom.resultPre.classList.add('hidden');
            App.UI.showSpinner();

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
                
                payload.fields.selectedchannels = tags;
                
                const baseUrl = App.Config.get('xpiBaseUrl');
                const token = App.Auth.getToken();
                
                const response = await App.Api.fetchWithLogs(`${baseUrl}api/v1/wrikexpi/campaign`, {
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
                App.UI.showToast('Campaign submitted successfully!', 'success');
                dom.form.reset(); // Clear form
                tags = [];
                renderTags();

            } catch (error) {
                dom.resultPre.textContent = JSON.stringify(error, null, 2);
                dom.resultPre.className = 'styled-pre-error mt-6';
                dom.resultPre.classList.remove('hidden');
                App.UI.showToast('Submission failed. Please check details.', 'error');
            } finally {
                dom.submitBtn.disabled = false;
                dom.submitBtn.textContent = 'Submit Campaign';
                App.UI.hideSpinner();
            }
        }
        
        return { init };
    })();
})(App);

// === Module: Master Data ===
(function(App) {
    App.MasterData = (function() {
        let currentSlug = null;
        let currentSchema = null;
        let masterDataType = 'record'; // Default to 'record'
        let currentData = [];
        let dom = {};
        let currentInstance = null; // The cloned template node
        
        // Modal DOM
        let modal, modalTitle, modalForm, modalFormFields, modalIdField, modalCancelBtn;
        
        // Delete Modal DOM
        let deleteModal, deleteCancelBtn, deleteConfirmBtn;
        
        function cacheModalDOMElements() {
            modal = document.getElementById('modal-master-data');
            modalTitle = document.getElementById('master-data-modal-title');
            modalForm = document.getElementById('master-data-form');
            modalFormFields = document.getElementById('master-data-form-fields');
            modalIdField = document.getElementById('master-data-id');
            modalCancelBtn = document.getElementById('master-data-cancel-btn');
            
            deleteModal = document.getElementById('modal-delete-confirm');
            deleteCancelBtn = document.getElementById('delete-cancel-btn');
            deleteConfirmBtn = document.getElementById('delete-confirm-btn');
        }


        function init(slug) {
            if (currentSlug === slug && currentInstance) return; // Already initialized with this slug
             currentSlug = slug;
            currentSchema = App.MASTER_DATA_SCHEMAS[slug];
            masterDataType = currentSchema.type || 'record';
            if (!currentSchema) {
                console.error(`No schema found for slug: ${slug}`);
                return;
            }
            
            // Cache modal DOM elements if not already cached
            if (!modal) {
                cacheModalDOMElements();
            }
            
            const container = document.getElementById('module-master-data');
            container.innerHTML = '';
            const template = document.getElementById('master-data-template');
            currentInstance = template.content.cloneNode(true);
            
            dom.title = currentInstance.querySelector('[data-template-id="title"]');
            dom.loadBtn = currentInstance.querySelector('[data-template-id="load-btn"]');
            dom.createBtn = currentInstance.querySelector('[data-template-id="create-btn"]');
            dom.tableHead = currentInstance.querySelector('[data-template-id="table-head"]');
            dom.tableBody = currentInstance.querySelector('[data-template-id="table-body"]');
            dom.noData = currentInstance.querySelector('[data-template-id="no-data"]');
            
            dom.title.textContent = currentSchema.title;
            
            dom.tableHead.innerHTML = ''; // Clear existing content
            currentSchema.fields.forEach(field => {
                dom.tableHead.innerHTML += `<th class="styled-table-th">${field.label}</th>`;
            });
            dom.tableHead.innerHTML += `<th class="styled-table-th text-right">Actions</th>`;
            
            dom.loadBtn.addEventListener('click', loadData);
            dom.createBtn.addEventListener('click', () => showEditModal(null));
            modalForm.onsubmit = (e) => { e.preventDefault(); saveData(); };
            modalCancelBtn.onclick = () => App.UI.hideModal(modal);
            deleteCancelBtn.onclick = () => App.UI.hideModal(deleteModal);

            container.appendChild(currentInstance);
            App.Styling.apply();
            
            loadData();
        }

        async function loadData() {
            App.UI.showSpinner();
            dom.noData.classList.add('hidden');
            try {
                const baseUrl = App.Config.get('xpiBaseUrl');
                const token = App.Auth.getToken();
                const url = `${baseUrl}api/v1/wrikexpi/v1.0/${masterDataType}/${currentSlug}`;
                
                const response = await App.Api.fetchWithLogs(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                currentData = response.value || [];
                renderTable();
                
            } catch (error) {
                console.error('Failed to load master data:', error);
                App.UI.showToast('Failed to load data.', 'error');
                dom.tableBody.innerHTML = '';
                dom.noData.classList.remove('hidden');
            } finally {
                App.UI.hideSpinner();
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
                    const value = item[field.id] || (item[field.label] !== undefined ? item[field.label] : null);
                    rowHtml += `<td class="styled-table-td">${value || 'N/A'}</td>`;
                });
                
                rowHtml += `
                    <td class="styled-table-td space-x-2 text-right">
                        <button class="styled-btn-secondary !px-2 !py-1 text-xs" data-id="${item.id}">Edit</button>
                        <button class="styled-btn-danger !px-2 !py-1 text-xs" data-id="${item.id}">Delete</button>
                    </td>
                `;
                tr.innerHTML = rowHtml;
                
                tr.querySelector('.styled-btn-secondary').addEventListener('click', (e) => {
                    const itemToEdit = currentData.find(d => d.id === e.target.dataset.id);
                    showEditModal(itemToEdit);
                });
                tr.querySelector('.styled-btn-danger').addEventListener('click', (e) => {
                    showDeleteModal(e.target.dataset.id);
                });
                
                dom.tableBody.appendChild(tr);
            });
            App.Styling.apply();
        }

        function showEditModal(item) {
            modalTitle.textContent = item ? `Edit ${currentSchema.title}` : `Create ${currentSchema.title}`;
            modalIdField.value = item ? item.id : '';
            
            modalFormFields.innerHTML = '';
            currentSchema.fields.forEach(field => {
                if (field.readonly && item) {
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
            App.Styling.apply();
            App.UI.showModal(modal);
        }

        async function saveData() {
            App.UI.showSpinner();
            const id = modalIdField.value;
            const isEditing = !!id;
            
            const baseUrl = App.Config.get('xpiBaseUrl');
            const odataContext = `${baseUrl}api/v1/wrikexpi/v1.0/${masterDataType}/${currentSlug}`; 

            const payload = {
                "@odata.context": odataContext
            };

            const formData = new FormData(modalForm);
            currentSchema.fields.forEach(field => {
                if (!field.readonly) {
                    payload[field.id || field.label] = formData.get(field.id || field.label);
                }
            });

            // For create, use POST; for edit, use PATCH
            let method = 'POST';
            let url = `${baseUrl}api/v1/wrikexpi/v1.0/${masterDataType}/${currentSlug}`;

            if (isEditing) {
                //payload.id = id;
                url += `/${id}`;
                method = 'PATCH';
            }
            
            try {
                await App.Api.fetchWithLogs(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${App.Auth.getToken()}`
                    },
                    body: JSON.stringify(payload)
                });
                
                App.UI.showToast(`Record ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
                App.UI.hideModal(modal);
                loadData();
                
            } catch (error) {
                console.error('Failed to save data:', error);
                App.UI.showToast('Failed to save record.', 'error');
            } finally {
                App.UI.hideSpinner();
            }
        }
        
        function showDeleteModal(id) {
            deleteConfirmBtn.onclick = () => deleteData(id);
            App.UI.showModal(deleteModal);
        }
        
        async function deleteData(id) {
            App.UI.showSpinner();
            App.UI.hideModal(deleteModal);
            try {
                const baseUrl = App.Config.get('xpiBaseUrl');
                const url = `${baseUrl}api/v1/wrikexpi/v1.0/${masterDataType}/${currentSlug}/${id}`;
                
                await App.Api.fetchWithLogs(url, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${App.Auth.getToken()}` }
                });
                
                App.UI.showToast('Record deleted successfully!', 'success');
                loadData();
                
            } catch (error) {
                console.error('Failed to delete data:', error);
                App.UI.showToast('Failed to delete record.', 'error');
            } finally {
                App.UI.hideSpinner();
            }
        }

        return { init };
    })();
})(App);

// === Module: Campaigns ===
(function(App) {
    App.CampaignsModule = (function() {
        // --- Constants and State ---
        const CAMPAIGN_STORAGE_KEY = 'xpi_campaigns';
        let campaigns = [];
        let currentEditCampaignId = null;
        let dom = {};

        // --- Modal Elements (shared) ---
        let modal, modalTitle, modalForm, modalFormFields, modalCancelBtn;
        let deleteModal, deleteConfirmBtn, deleteCancelBtn;

        function cacheDOMElements() {
            // Cache page-specific elements
            dom.moduleContainer = document.getElementById('module-campaign');
            modal = document.getElementById('modal-master-data');
            modalTitle = document.getElementById('master-data-modal-title');
            modalForm = document.getElementById('master-data-form');
            modalFormFields = document.getElementById('master-data-form-fields');
            modalCancelBtn = document.getElementById('master-data-cancel-btn');
            deleteModal = document.getElementById('modal-delete-confirm');
            deleteConfirmBtn = document.getElementById('delete-confirm-btn');
            deleteCancelBtn = document.getElementById('delete-cancel-btn');
        }

        // --- Initialization ---
        function init() {
            cacheDOMElements();
            seedSampleData();
            loadCampaigns();
            renderCampaignListView();
            setupModalEventListeners(); // Setup listeners once when the module is initialized
        }

        function loadCampaigns() {
            campaigns = App.Storage.local.getObject(CAMPAIGN_STORAGE_KEY) || [];
        }

        function saveCampaigns() {
            App.Storage.local.setObject(CAMPAIGN_STORAGE_KEY, campaigns);
        }

        // --- UI Rendering ---
        function renderCampaignListView() {
            const template = document.getElementById('master-data-template').content.cloneNode(true);
            const currentInstance = template;

            currentInstance.querySelector('[data-template-id="title"]').textContent = 'Campaigns';
            currentInstance.querySelector('p').textContent = 'Manage marketing campaigns and their channels.';

            const tableHead = currentInstance.querySelector('[data-template-id="table-head"]');
            const headers = ['Campaign Name', 'Client', 'Start Date', 'End Date', 'Budget', 'Actions'];
            tableHead.innerHTML = headers.map(h => `<th class="styled-table-th">${h}</th>`).join('');
            const tableBody = currentInstance.querySelector('[data-template-id="table-body"]');
            tableBody.innerHTML = '';

            if (campaigns.length > 0) {
                campaigns.forEach(campaign => {
                    const row = document.createElement('tr');
                    row.className = 'styled-table-row';
                    row.innerHTML = `
                        <td class="styled-table-td">${campaign.campaignName || ''}</td>
                        <td class="styled-table-td">${campaign.client || ''}</td>
                        <td class="styled-table-td">${campaign.campaignStartDate || ''}</td>
                        <td class="styled-table-td">${campaign.campaignEndDate || ''}</td>
                        <td class="styled-table-td">${campaign.campaignCurrency || ''} ${campaign.budget || ''}</td>
                        <td class="styled-table-td">
                            <div class="flex items-center gap-2">
                                <button class="styled-btn-icon edit-btn" data-id="${campaign.id}" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>
                                </button>
                                <button class="styled-btn-icon !text-red-400 hover:!text-red-300 delete-btn" data-id="${campaign.id}" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                currentInstance.querySelector('[data-template-id="no-data"]').classList.remove('hidden');
            }

            dom.moduleContainer.innerHTML = '';
            dom.moduleContainer.appendChild(currentInstance);
            // Add event listeners
            dom.moduleContainer.querySelector('[data-template-id="create-btn"]').addEventListener('click', handleCreateClick);
            dom.moduleContainer.querySelector('[data-template-id="load-btn"]').addEventListener('click', init);
            dom.moduleContainer.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
            dom.moduleContainer.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));
            App.Styling.apply();
        }

        function renderCampaignForm(campaign = {}) {
            currentEditCampaignId = campaign.id || null;
            modalTitle.textContent = campaign.id ? 'Edit Campaign' : 'Create New Campaign';

            const fields = [
                // The user request specifies the endpoint is /sync-secrets relative to the base URL.
                { id: 'campaignName', label: 'Campaign Name', required: true, value: campaign.campaignName },
                { id: 'campaignObjective', label: 'Campaign Objective', value: campaign.campaignObjective },
                { id: 'campaignStartDate', label: 'Campaign Start Date', type: 'date', value: campaign.campaignStartDate },
                { id: 'campaignEndDate', label: 'Campaign End Date', type: 'date', value: campaign.campaignEndDate },
                { id: 'client', label: 'Client', value: campaign.client },
                { id: 'brand', label: 'Brand', value: campaign.brand },
                { id: 'debtor', label: 'Debtor', value: campaign.debtor },
                { id: 'agency', label: 'Agency', value: campaign.agency },
                { id: 'campaignCurrency', label: 'Campaign Currency', value: campaign.campaignCurrency || 'USD' },
                { id: 'budget', label: 'Budget', type: 'number', value: campaign.budget },
            ];

            modalFormFields.innerHTML = fields.map(f => `
                <div>
                    <label for="campaign-form-${f.id}" class="styled-label">${f.label}</label>
                    <input type="${f.type || 'text'}" id="campaign-form-${f.id}" name="${f.id}" class="styled-input" value="${f.value || ''}" ${f.required ? 'required' : ''}>
                </div>
            `).join('');

            // --- Channels Section ---
            const channelsContainer = document.createElement('div');
            channelsContainer.className = 'md:col-span-2 border-t border-gray-700 mt-6 pt-6';
            channelsContainer.innerHTML = `
                <h4 class="text-lg font-semibold text-white mb-4">Channels</h4>
                <div id="channels-list" class="space-y-3 mb-4"></div>
                <button type="button" id="add-channel-btn" class="styled-btn-secondary">Add Channel</button>
            `;
            modalFormFields.appendChild(channelsContainer);

            renderChannels(campaign.channels || []);

            document.getElementById('add-channel-btn').addEventListener('click', () => {
                const channelsList = document.getElementById('channels-list');
                const newChannel = { id: `new_${Date.now()}`, name: '', type: 'Biddable', budget: 0 };
                channelsList.appendChild(createChannelInputRow(newChannel));
                App.Styling.apply(); // Apply styles to the newly added row
            });

            // Make modal wider for this specific form
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) modalContent.style.maxWidth = '70vw';

            App.Styling.apply();
            App.UI.showModal(modal);
        }

        function createChannelInputRow(channel) {
            const div = document.createElement('div');
            div.className = 'grid grid-cols-10 gap-2 items-center channel-row';
            div.dataset.channelId = channel.id;
            div.innerHTML = `
                <div class="col-span-4">
                    <input type="text" placeholder="Channel Name" class="styled-input channel-name" value="${channel.name || ''}">
                </div>
                <div class="col-span-3">
                    <select class="styled-select channel-type">
                        <option value="Biddable" ${channel.type === 'Biddable' ? 'selected' : ''}>Biddable</option>
                        <option value="Non-Biddable" ${channel.type === 'Non-Biddable' ? 'selected' : ''}>Non-Biddable</option>
                    </select>
                </div>
                <div class="col-span-2">
                    <input type="number" placeholder="Budget" class="styled-input channel-budget" value="${channel.budget || ''}">
                </div>
                <div class="col-span-1 text-right">
                    <button type="button" class="styled-btn-icon !text-red-400 hover:!text-red-300 remove-channel-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>
                    </button>
                </div>
            `;
            div.querySelector('.remove-channel-btn').addEventListener('click', () => div.remove());
            return div;
        }

        function renderChannels(channels = []) {
            const channelsList = document.getElementById('channels-list');
            channelsList.innerHTML = '';
            channels.forEach(channel => {
                channelsList.appendChild(createChannelInputRow(channel));
            });
        }

        // --- Event Handlers ---
        function handleCreateClick() {
            renderCampaignForm();
        }

        function handleEditClick(e) {
            const campaignId = e.currentTarget.dataset.id;
            const campaign = campaigns.find(c => c.id === campaignId);
            if (campaign) {
                renderCampaignForm(campaign);
            }
        }

        function handleDeleteClick(e) {
            const campaignId = e.currentTarget.dataset.id;
            showDeleteModal(() => {
                campaigns = campaigns.filter(c => c.id !== campaignId);
                saveCampaigns();
                init();
                App.UI.hideModal(deleteModal);
                App.UI.showToast('Campaign deleted successfully.', 'success');
            });
        }

        function handleFormSubmit(e) {
            e.preventDefault();
            const formData = new FormData(modalForm);
            const campaignData = Object.fromEntries(formData.entries());

            // Collect channel data
            const channelRows = modalForm.querySelectorAll('.channel-row');
            campaignData.channels = Array.from(channelRows).map(row => ({
                id: row.dataset.channelId.startsWith('new_') ? crypto.randomUUID() : row.dataset.channelId,
                name: row.querySelector('.channel-name').value,
                type: row.querySelector('.channel-type').value,
                budget: parseFloat(row.querySelector('.channel-budget').value) || 0,
            }));

            if (currentEditCampaignId) {
                const index = campaigns.findIndex(c => c.id === currentEditCampaignId);
                if (index !== -1) {
                    campaigns[index] = { ...campaigns[index], ...campaignData, id: currentEditCampaignId };
                }
            } else {
                campaignData.id = crypto.randomUUID();
                campaigns.push(campaignData);
            }

            saveCampaigns();
            init();
            App.UI.hideModal(modal);
            App.UI.showToast(`Campaign ${currentEditCampaignId ? 'updated' : 'created'} successfully.`, 'success');

            // Reset modal width
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) modalContent.style.maxWidth = '';
        }

        function setupModalEventListeners() {
            // These listeners are now scoped to the Campaigns module and won't conflict.
            // They are set up once on init.
            modalForm.addEventListener('submit', handleFormSubmit);
            modalCancelBtn.addEventListener('click', () => {
                App.UI.hideModal(modal);
                // Reset modal width
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) modalContent.style.maxWidth = '';
            });
            deleteCancelBtn.addEventListener('click', () => { App.UI.hideModal(deleteModal); });
        }

        function showDeleteModal(onConfirm) {
            App.UI.showModal(deleteModal);
            // Clone and replace to remove old listeners
            const newConfirmBtn = deleteConfirmBtn.cloneNode(true);
            deleteConfirmBtn.parentNode.replaceChild(newConfirmBtn, deleteConfirmBtn);
            deleteConfirmBtn = newConfirmBtn; // Update reference
            newConfirmBtn.addEventListener('click', onConfirm);
        }

        // --- Sample Data Seeding ---
        function seedSampleData() {
            if (!App.Storage.local.getObject(CAMPAIGN_STORAGE_KEY)) {
                const sampleCampaigns = [
                    {
                        id: crypto.randomUUID(),
                        campaignName: 'Summer Sale 2026', campaignObjective: 'Increase Sales', campaignStartDate: '2026-06-01', campaignEndDate: '2026-08-31',
                        client: 'Global Retail Inc.', brand: 'SunSeeker Apparel', debtor: 'Global Retail Finance', agency: 'Creative Solutions',
                        campaignCurrency: 'USD', budget: 50000,
                        channels: [
                            { id: crypto.randomUUID(), name: 'Facebook Ads', type: 'Biddable', budget: 15000 },
                            { id: crypto.randomUUID(), name: 'Google Search', type: 'Biddable', budget: 25000 },
                            { id: crypto.randomUUID(), name: 'Content Marketing', type: 'Non-Biddable', budget: 10000 }
                        ]
                    },
                    {
                        id: crypto.randomUUID(),
                        campaignName: 'Product Launch Q4', campaignObjective: 'Brand Awareness', campaignStartDate: '2026-10-01', campaignEndDate: '2026-12-31',
                        client: 'Tech Innovators LLC', brand: 'GadgetPro', debtor: 'Tech Innovators Finance', agency: 'Future Forward Agency',
                        campaignCurrency: 'EUR', budget: 120000,
                        channels: [
                            { id: crypto.randomUUID(), name: 'YouTube Pre-roll', type: 'Biddable', budget: 60000 },
                            { id: crypto.randomUUID(), name: 'Influencer Outreach', type: 'Non-Biddable', budget: 40000 }
                        ]
                    }
                ];
                App.Storage.local.setObject(CAMPAIGN_STORAGE_KEY, sampleCampaigns);
            }
        }

        return { init };
    })();
})(App);

// --- App Entry Point ---
// This listener in app2.js ensures all core and module scripts are loaded
// before starting the application.
document.addEventListener('DOMContentLoaded', App.init);
