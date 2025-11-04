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
            
            dom.urlInput.value = App.Config.get('xpiBaseUrl');
            
            dom.form.addEventListener('submit', (e) => {
                e.preventDefault();
                App.Config.set('xpiBaseUrl', dom.urlInput.value);
                App.UI.showToast('Configuration saved successfully!', 'success');
            });
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

// === Module: Campaign Submission ===
(function(App) {
    App.CampaignModule = (function() {
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
                
                // Set default values from form if they exist in the loaded data
                // Example: dom.clientSelect.value = 'Adidas Group'; (if it exists)
                
            } catch (error) {
                console.error('Failed to load dropdowns:', error);
                App.UI.showToast('Failed to load form data. Please refresh.', 'error');
            } finally {
                App.UI.hideSpinner();
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
                const url = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}`;
                
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

            // For create, use POST; for edit, use PATCH
            let method = 'POST';
            let url = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}`;

            if (isEditing) {
                payload.id = id;
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
                const url = `${baseUrl}api/v1/wrikexpi/v1.0/record/${currentSlug}/${id}`;
                
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

// --- App Entry Point ---
// This listener in app2.js ensures all core and module scripts are loaded
// before starting the application.
document.addEventListener('DOMContentLoaded', App.init);
