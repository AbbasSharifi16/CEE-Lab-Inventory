// Global variables
let equipmentData = [];
let filteredData = [];

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const labSelect = document.getElementById('labSelect');
const statusFilter = document.getElementById('statusFilter');
const equipmentGrid = document.getElementById('equipmentGrid');
const resultCount = document.getElementById('resultCount');
const printBtn = document.getElementById('printBtn');
const addEquipmentBtn = document.getElementById('addEquipmentBtn');
const equipmentModal = document.getElementById('equipmentModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const printModal = document.getElementById('printModal');
const closePrintModal = document.getElementById('closePrintModal');
const printAllLabs = document.getElementById('printAllLabs');
const generateReport = document.getElementById('generateReport');
const addEquipmentModal = document.getElementById('addEquipmentModal');
const closeAddModal = document.getElementById('closeAddModal');
const addEquipmentForm = document.getElementById('addEquipmentForm');
const cancelAdd = document.getElementById('cancelAdd');
const equipmentImage = document.getElementById('equipmentImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImage = document.getElementById('removeImage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadEquipmentFromAPI();
    setupEventListeners();
      // Check QRCode library on page load
    console.log('🔍 Checking libraries...');
    
    // Check JsBarcode
    if (typeof JsBarcode !== 'undefined') {
        console.log('✅ JsBarcode library loaded');
    } else {
        console.log('❌ JsBarcode library NOT loaded');
    }
    
    // Check QRCode (main library)
    if (typeof QRCode !== 'undefined') {
        console.log('✅ QRCode library loaded');
        console.log('QRCode methods available:', Object.keys(QRCode));
    } else {
        console.log('❌ QRCode library NOT loaded');
    }
    
    // Check qrcode-generator (fallback)
    if (typeof qrcode !== 'undefined') {
        console.log('✅ qrcode-generator library loaded');
    } else {
        console.log('❌ qrcode-generator library NOT loaded');
    }
    
    // Check Canvas support
    if (typeof HTMLCanvasElement !== 'undefined') {
        console.log('✅ Canvas API supported');
    } else {
        console.log('❌ Canvas API NOT supported');
    }
    
    // Try to load QR library manually if needed
    if (typeof QRCode === 'undefined' && typeof qrcode === 'undefined') {
        console.log('🔄 Attempting to load QR library manually...');
        loadQRLibraryManually();
    }
});

// Manual library loading as fallback
function loadQRLibraryManually() {
    console.log('Attempting manual QR library load...');
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = function() {
        console.log('✅ QRCode library loaded manually');
        if (typeof QRCode !== 'undefined') {
            console.log('QRCode object:', QRCode);
        }
    };
    script.onerror = function() {
        console.log('❌ Failed to load QRCode library manually, trying alternative...');
        // Try alternative CDN
        const altScript = document.createElement('script');
        altScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
        altScript.onload = function() {
            console.log('✅ Alternative QR library (QRious) loaded');
        };
        altScript.onerror = function() {
            console.log('❌ All QR library loading attempts failed');
            console.log('Will use API-based QR generation as fallback');
        };
        document.head.appendChild(altScript);
    };
    document.head.appendChild(script);
}

// API Functions
async function loadEquipmentFromAPI() {
    try {
        showLoading();
        
        // Add cache busting parameter to force fresh data
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/equipment?_t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const freshData = await response.json();
        console.log('Fresh equipment data loaded:', freshData.length, 'items');
        
        // Force update of equipment data
        equipmentData = freshData;
        filteredData = [...equipmentData];
        
        renderEquipment();
        hideLoading();
    } catch (error) {
        console.error('Error loading equipment:', error);
        hideLoading();
        showNotification('Error loading equipment data. Please check if the server is running.', 'error');
    }
}

async function addEquipmentToAPI(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/equipment`, {
            method: 'POST',
            body: formData // FormData object with file upload
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const newEquipment = await response.json();
        return newEquipment;
    } catch (error) {
        console.error('Error adding equipment:', error);
        throw error;
    }
}

function showLoading() {
    equipmentGrid.innerHTML = `
        <div class="loading" style="grid-column: 1 / -1;">
            <span class="material-icons">refresh</span>
            Loading equipment...
        </div>
    `;
}

function hideLoading() {
    // Loading will be replaced by renderEquipment()
}

// Event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Check if elements exist
    console.log('addEquipmentBtn:', addEquipmentBtn);
    console.log('addEquipmentForm:', addEquipmentForm);
    
    searchInput.addEventListener('input', debounce(filterEquipment, 300));
    clearSearchBtn.addEventListener('click', clearSearch);
    labSelect.addEventListener('change', filterEquipment);
    statusFilter.addEventListener('change', filterEquipment);
    printBtn.addEventListener('click', showPrintModal);
    
    if (addEquipmentBtn) {
        addEquipmentBtn.addEventListener('click', showAddEquipmentModal);
        console.log('Add equipment button listener added');
    } else {
        console.error('addEquipmentBtn not found!');
    }
    
    closeModal.addEventListener('click', hideEquipmentModal);
    closePrintModal.addEventListener('click', hidePrintModal);
    
    if (closeAddModal) {
        closeAddModal.addEventListener('click', hideAddEquipmentModal);
    }
    if (cancelAdd) {
        cancelAdd.addEventListener('click', hideAddEquipmentModal);
    }
    
    printAllLabs.addEventListener('change', handlePrintAllLabs);
    generateReport.addEventListener('click', generateWordReport);
    
    if (addEquipmentForm) {
        addEquipmentForm.addEventListener('submit', handleAddEquipment);
        console.log('Add equipment form listener added');
    } else {
        console.error('addEquipmentForm not found!');
    }
    
    if (equipmentImage) {
        equipmentImage.addEventListener('change', handleImageUpload);
    }
    if (removeImage) {
        removeImage.addEventListener('click', removeImagePreview);
    }    // Close modals when clicking outside
    equipmentModal.addEventListener('click', function(e) {
        if (e.target === equipmentModal) {
            hideEquipmentModal();
        }
    });

    printModal.addEventListener('click', function(e) {
        if (e.target === printModal) {
            hidePrintModal();
        }
    });

    if (addEquipmentModal) {
        addEquipmentModal.addEventListener('click', function(e) {
            if (e.target === addEquipmentModal) {
                hideAddEquipmentModal();
            }
        });
    }
    
    console.log('All event listeners set up successfully');
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter equipment based on search and filters
async function filterEquipment() {
    try {
        const searchTerm = searchInput.value.trim();
        const selectedLab = labSelect.value;
        const selectedStatus = statusFilter.value;

        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedLab) params.append('lab', selectedLab);
        if (selectedStatus) params.append('status', selectedStatus);

        // Fetch filtered data from API
        const response = await fetch(`${API_BASE_URL}/equipment?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        filteredData = await response.json();
        renderEquipment();
    } catch (error) {
        console.error('Error filtering equipment:', error);
        // Fallback to local filtering if API fails
        const searchTerm = searchInput.value.toLowerCase();
        const selectedLab = labSelect.value;
        const selectedStatus = statusFilter.value;        filteredData = equipmentData.filter(item => {
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                (item.model && item.model.toLowerCase().includes(searchTerm)) ||
                item.serialNumber.toLowerCase().includes(searchTerm) ||
                (item.fiuId && item.fiuId.toLowerCase().includes(searchTerm)) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm));

            const matchesLab = !selectedLab || item.lab === selectedLab;
            const matchesStatus = !selectedStatus || item.status === selectedStatus;

            return matchesSearch && matchesLab && matchesStatus;
        });

        renderEquipment();
    }
}

// Clear search input
function clearSearch() {
    searchInput.value = '';
    filterEquipment();
}

// Render equipment cards
function renderEquipment() {
    updateResultCount();

    if (filteredData.length === 0) {
        equipmentGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="material-icons">search_off</span>
                <h3>No equipment found</h3>
                <p>Try adjusting your search criteria or filters</p>
            </div>
        `;
        return;
    }    equipmentGrid.innerHTML = filteredData.map(item => `
        <div class="equipment-card" onclick="showEquipmentDetails(${item.id})">
            <div class="equipment-image">
                ${item.image ? 
                    `<img src="${item.image.startsWith('http') ? item.image : 'http://localhost:3000' + item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="placeholder" style="display:none;"><span class="material-icons">devices</span></div>` :
                    `<div class="placeholder"><span class="material-icons">devices</span></div>`
                }
            </div>
            <div class="equipment-info">
                <div class="equipment-name">${item.name}</div>                <div class="equipment-details">
                    <div><strong>Brand:</strong> ${item.category}</div>
                    ${item.model ? `<div><strong>Model:</strong> ${item.model}</div>` : ''}
                    <div><strong>Serial:</strong> ${item.serialNumber}</div>
                    ${item.fiuId ? `<div><strong>FIU ID:</strong> ${item.fiuId}</div>` : ''}
                    <div><strong>Quantity:</strong> ${item.quantity}</div>
                    <div><strong>Age:</strong> ${item.age}</div>
                </div>
                <div class="equipment-lab">${item.lab}</div>
                <div class="equipment-status status-${item.status.toLowerCase().replace(/[\s\/]/g, '-').replace(/[^a-z0-9-]/g, '')}">
                    <span class="material-icons">${getStatusIcon(item.status)}</span>
                    ${item.status}
                </div>
            </div>
        </div>
    `).join('');
}

// Get status icon based on status
function getStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'active / in use': return 'play_circle';
        case 'stored / in storage': return 'inventory_2';
        case 'surplus': return 'sell';
        case 'obsolete / outdated': return 'history';
        case 'broken / non-functional': return 'error';
        case 'troubleshooting': return 'warning';
        case 'under maintenance': return 'build';
        case 'to be disposed': return 'delete';
        default: return 'help';
    }
}

// Update result count
function updateResultCount() {
    const count = filteredData.length;
    resultCount.textContent = `${count} item${count !== 1 ? 's' : ''} found`;
}

// Show equipment details modal
async function showEquipmentDetails(equipmentId) {
    try {
        console.log('Showing details for equipment ID:', equipmentId);
        
        // First try to find in current data
        let equipment = equipmentData.find(item => item.id == equipmentId);
        
        // If not found, fetch from API
        if (!equipment) {
            console.log('Equipment not found in local data, fetching from API...');
            const response = await fetch(`${API_BASE_URL}/equipment/${equipmentId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            equipment = await response.json();
        }
        
        if (!equipment) {
            showNotification('Equipment not found', 'error');
            return;
        }        modalTitle.textContent = `Edit: ${equipment.name}`;
        modalBody.innerHTML = `
            <form id="editEquipmentForm" class="equipment-edit-form">
                <div class="detail-grid">
                    ${equipment.image ? `
                        <div class="detail-image">
                            <img src="${equipment.image.startsWith('http') ? equipment.image : 'http://localhost:3000' + equipment.image}" 
                                 alt="${equipment.name}" 
                                 onerror="this.style.display='none';">
                            <div class="image-edit-overlay" onclick="openImageUploader(${equipment.id})">
                                <span class="material-icons">edit</span>
                            </div>
                        </div>
                    ` : `
                        <div class="detail-image no-image" onclick="openImageUploader(${equipment.id})">
                            <div class="placeholder">
                                <span class="material-icons">add_photo_alternate</span>
                                <p>Click to add image</p>
                            </div>
                        </div>
                    `}
                      <div class="form-row">
                        <div class="form-group">
                            <label for="editEquipmentName">Equipment Name *</label>
                            <input type="text" id="editEquipmentName" name="name" value="${equipment.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="editEquipmentCategory">Brand *</label>
                            <input type="text" id="editEquipmentCategory" name="category" value="${equipment.category}" required>
                        </div>
                    </div>                    <div class="form-row">
                        <div class="form-group">
                            <label for="editEquipmentModel">Model</label>
                            <input type="text" id="editEquipmentModel" name="model" value="${equipment.model || ''}" placeholder="Equipment model number">
                        </div>                        <div class="form-group">
                            <label for="editEquipmentFiuId">FIU ID</label>
                            <input type="text" id="editEquipmentFiuId" name="fiuId" value="${equipment.fiuId || ''}" placeholder="FIU identification number" onchange="generateBarcode('${equipment.id}')">
                            ${equipment.fiuId ? `
                                <div class="fiu-barcode-section">
                                    <div class="barcode-container">
                                        <svg id="barcode-${equipment.id}"></svg>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editEquipmentLab">Lab Number *</label>
                            <select id="editEquipmentLab" name="lab" required>
                                <option value="EC3625" ${equipment.lab === 'EC3625' ? 'selected' : ''}>EC3625</option>
                                <option value="EC3630" ${equipment.lab === 'EC3630' ? 'selected' : ''}>EC3630</option>
                                <option value="EC3760" ${equipment.lab === 'EC3760' ? 'selected' : ''}>EC3760</option>
                                <option value="EC3765" ${equipment.lab === 'EC3765' ? 'selected' : ''}>EC3765</option>
                                <option value="OU107" ${equipment.lab === 'OU107' ? 'selected' : ''}>OU107</option>
                                <option value="OU106" ${equipment.lab === 'OU106' ? 'selected' : ''}>OU106</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editEquipmentSerial">Serial Number *</label>
                            <input type="text" id="editEquipmentSerial" name="serialNumber" value="${equipment.serialNumber}" required>
                        </div>
                    </div>                    <div class="form-row">
                        <div class="form-group">
                            <label for="editEquipmentDate">Buying Date</label>
                            <input type="date" id="editEquipmentDate" name="buyingDate" value="${equipment.buyingDate || ''}">
                        </div>
                        <div class="form-group">
                            <label for="editEquipmentQuantity">Quantity *</label>
                            <input type="number" id="editEquipmentQuantity" name="quantity" value="${equipment.quantity}" min="1" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editEquipmentPrice">Price ($)</label>
                            <input type="number" id="editEquipmentPrice" name="price" value="${equipment.price ? parseFloat(equipment.price) : ''}" step="0.01" min="0" placeholder="Enter price if known">
                        </div>
                        <div class="form-group">
                            <label for="editEquipmentStatus">Status *</label>                            <select id="editEquipmentStatus" name="status" required>
                                <option value="Active / In Use" ${equipment.status === 'Active / In Use' ? 'selected' : ''}>Active / In Use</option>
                                <option value="Stored / In Storage" ${equipment.status === 'Stored / In Storage' ? 'selected' : ''}>Stored / In Storage</option>
                                <option value="Surplus" ${equipment.status === 'Surplus' ? 'selected' : ''}>Surplus</option>
                                <option value="Obsolete / Outdated" ${equipment.status === 'Obsolete / Outdated' ? 'selected' : ''}>Obsolete / Outdated</option>
                                <option value="Broken / Non-Functional" ${equipment.status === 'Broken / Non-Functional' ? 'selected' : ''}>Broken / Non-Functional</option>
                                <option value="Troubleshooting" ${equipment.status === 'Troubleshooting' ? 'selected' : ''}>Troubleshooting</option>
                                <option value="Under Maintenance" ${equipment.status === 'Under Maintenance' ? 'selected' : ''}>Under Maintenance</option>
                                <option value="To be Disposed" ${equipment.status === 'To be Disposed' ? 'selected' : ''}>To be Disposed</option>
                            </select>
                        </div>
                    </div>                    <div class="form-group full-width">
                        <label for="editEquipmentNotes">Notes</label>
                        <textarea id="editEquipmentNotes" name="notes" rows="3" placeholder="Additional notes about the equipment...">${equipment.notes || ''}</textarea>
                    </div>                    <div class="form-group full-width">
                        <label for="editEquipmentManualLink">Manual Link</label>
                        <div class="input-with-button">
                            <input type="url" id="editEquipmentManualLink" name="manualLink" value="${equipment.manualLink || ''}" placeholder="https://example.com/manual.pdf or link to manual">
                            <button type="button" onclick="testQRGeneration('${equipment.id}')" class="btn-test-qr" title="Test QR Generation">
                                <span class="material-icons">qr_code_scanner</span>
                            </button>
                        </div>
                        <small class="form-help">Link to equipment manual, PDF, or documentation</small>
                    </div>

                    ${equipment.created_at ? `
                        <div class="info-row">
                            <span><strong>Added:</strong> ${formatDate(equipment.created_at)}</span>
                            ${equipment.updated_at && equipment.updated_at !== equipment.created_at ? 
                                `<span><strong>Last Updated:</strong> ${formatDate(equipment.updated_at)}</span>` : ''}
                        </div>
                    ` : ''}

                    <div class="form-actions">
                        <button type="button" onclick="hideEquipmentModal()" class="btn-secondary">
                            <span class="material-icons">cancel</span>
                            Cancel
                        </button>
                        <button type="submit" class="btn-primary">
                            <span class="material-icons">save</span>
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        `;        // Add form submit event listener
        const editForm = document.getElementById('editEquipmentForm');
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEditEquipment(equipment.id, editForm);
        });

        // Generate barcode if FIU ID exists
        if (equipment.fiuId) {
            setTimeout(() => {
                generateBarcode(equipment.id);
            }, 100);
        }        // Generate QR code if manual link exists
        if (equipment.manualLink) {
            setTimeout(() => {
                console.log('Adding QR section for existing manual link:', equipment.manualLink);
                addQRSection(equipment.id, equipment.manualLink);
            }, 200);
        }

        // Add event listener for manual link changes
        const manualLinkInput = document.getElementById('editEquipmentManualLink');
        if (manualLinkInput) {
            console.log('Adding manual link input listener');
            
            manualLinkInput.addEventListener('input', function() {
                const manualLink = this.value.trim();
                console.log('Manual link input changed:', manualLink);
                
                if (manualLink && isValidUrl(manualLink)) {
                    console.log('Valid manual link, adding QR section');
                    addQRSection(equipment.id, manualLink);
                } else {
                    console.log('Invalid or empty manual link, removing QR section');
                    removeQRSection(equipment.id);
                }
            });
            
            manualLinkInput.addEventListener('blur', function() {
                const manualLink = this.value.trim();
                console.log('Manual link blur event:', manualLink);
                
                if (manualLink && isValidUrl(manualLink)) {
                    addQRSection(equipment.id, manualLink);
                }
            });
        } else {
            console.error('Manual link input not found in DOM');
        }

        equipmentModal.classList.add('active');
        console.log('Equipment details modal shown');
        
    } catch (error) {
        console.error('Error showing equipment details:', error);
        showNotification('Error loading equipment details', 'error');
    }
}

// Hide equipment details modal
function hideEquipmentModal() {
    equipmentModal.classList.remove('active');
    
    // Clean up any temporary image inputs
    const tempInputs = document.querySelectorAll('[id^="tempImageInput_"]');
    tempInputs.forEach(input => {
        if (input.parentNode) {
            input.parentNode.removeChild(input);
        }
    });
}

// Show status change controls
function showStatusChange(equipmentId) {
    const statusChangeDiv = document.getElementById(`statusChange-${equipmentId}`);
    statusChangeDiv.style.display = statusChangeDiv.style.display === 'none' ? 'block' : 'none';
}

// Update equipment status
function updateStatus(equipmentId, newStatus) {
    const equipment = equipmentData.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.status = newStatus;
        // Update the modal display
        showEquipmentDetails(equipmentId);
        // Re-render the equipment grid if needed
        filterEquipment();
        
        // Show success message
        showNotification(`Status updated to "${newStatus}" successfully!`, 'success');
    }
}

// Toggle admin mode
function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    adminToggle.classList.toggle('active', isAdminMode);
    adminToggle.innerHTML = isAdminMode ? 
        '<span class="material-icons">admin_panel_settings</span> Admin Mode (ON)' :
        '<span class="material-icons">admin_panel_settings</span> Admin Mode';
    
    showNotification(isAdminMode ? 'Admin mode enabled' : 'Admin mode disabled', 'info');
}

// Show print modal
function showPrintModal() {
    printModal.classList.add('active');
}

// Hide print modal
function hidePrintModal() {
    printModal.classList.remove('active');
}

// Handle print all labs checkbox
function handlePrintAllLabs() {
    const labCheckboxes = document.querySelectorAll('.lab-checkbox');
    const isChecked = printAllLabs.checked;
    
    labCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// Generate Word report
async function generateWordReport() {
    const selectedLabs = getSelectedLabs();
    if (selectedLabs.length === 0) {
        showNotification('Please select at least one lab to include in the report.', 'warning');
        return;
    }

    try {
        showNotification('Generating Word document...', 'info');
        
        // Filter data based on selected labs
        const reportData = equipmentData.filter(item => selectedLabs.includes(item.lab));
        
        // Group data by lab
        const groupedData = {};
        selectedLabs.forEach(lab => {
            groupedData[lab] = reportData.filter(item => item.lab === lab);
        });

        // Create HTML content for Word document
        const htmlContent = createHtmlReportContent(groupedData);
        
        // Create a blob with HTML content that Word can open
        const blob = new Blob([htmlContent], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const fileName = `CEE_Lab_Equipment_Report_${new Date().toISOString().split('T')[0]}.doc`;
        
        // Use FileSaver to download
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, fileName);
        } else {
            // Fallback download method
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
        
        showNotification('Word document generated successfully!', 'success');
        hidePrintModal();
        
    } catch (error) {
        console.error('Error generating Word document:', error);
        showNotification('Error generating Word document. Please try again.', 'error');
    }
}

// Create HTML content for Word document
function createHtmlReportContent(groupedData) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>CEE Lab Equipment Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #1976d2; text-align: center; margin-bottom: 30px; }
                h2 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px; margin-top: 30px; }
                .report-info { text-align: center; margin-bottom: 40px; color: #666; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }                th { background-color: #f5f5f5; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .status-active-in-use { color: #388e3c; font-weight: bold; }
                .status-stored-in-storage { color: #1976d2; font-weight: bold; }
                .status-surplus { color: #795548; font-weight: bold; }
                .status-obsolete-outdated { color: #9e9e9e; font-weight: bold; }
                .status-broken-non-functional { color: #d32f2f; font-weight: bold; }
                .status-troubleshooting { color: #f57c00; font-weight: bold; }
                .status-under-maintenance { color: #9c27b0; font-weight: bold; }
                .status-to-be-disposed { color: #424242; font-weight: bold; }
                .lab-summary { margin-bottom: 20px; padding: 10px; background-color: #f0f7ff; border-left: 4px solid #1976d2; }
            </style>
        </head>
        <body>
            <h1>CEE Lab Equipment Report</h1>
            <div class="report-info">Generated on: ${currentDate}</div>
    `;    Object.keys(groupedData).forEach(lab => {
        const equipment = groupedData[lab];
        const totalValue = equipment.reduce((sum, item) => {
            const price = item.price ? parseFloat(item.price) : 0;
            return sum + (price * item.quantity);
        }, 0);
        
        htmlContent += `
            <h2>Lab ${lab}</h2>
            <div class="lab-summary">
                <strong>Total Equipment Items:</strong> ${equipment.length} | 
                <strong>Total Value:</strong> $${totalValue.toFixed(2)}
            </div>
        `;

        if (equipment.length > 0) {
            htmlContent += `
                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%;">Equipment Name</th>
                            <th style="width: 12%;">Category</th>
                            <th style="width: 12%;">Serial Number</th>
                            <th style="width: 10%;">Buying Date</th>
                            <th style="width: 8%;">Age</th>
                            <th style="width: 6%;">Qty</th>
                            <th style="width: 8%;">Price</th>
                            <th style="width: 10%;">Status</th>
                            <th style="width: 19%;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            equipment.forEach(item => {
                const statusClass = `status-${item.status.toLowerCase().replace(/[\s\/]/g, '-').replace(/[^a-z0-9-]/g, '')}`;
                htmlContent += `
                    <tr>                        <td><strong>${item.name}</strong></td>
                        <td>${item.category}</td>
                        <td>${item.serialNumber}</td>
                        <td>${formatDate(item.buyingDate)}</td>
                        <td>${item.age}</td>
                        <td>${item.quantity}</td>
                        <td>${formatPrice(item.price)}</td>
                        <td><span class="${statusClass}">${item.status}</span></td>
                        <td>${item.notes}</td>
                    </tr>
                `;
            });

            htmlContent += `
                    </tbody>
                </table>
            `;
        } else {
            htmlContent += `<p><em>No equipment found in this lab.</em></p>`;
        }
    });    // Add summary statistics
    const allEquipment = Object.values(groupedData).flat();
    const totalItems = allEquipment.length;
    const totalValue = allEquipment.reduce((sum, item) => {
        const price = item.price ? parseFloat(item.price) : 0;
        return sum + (price * item.quantity);
    }, 0);
    const statusCounts = allEquipment.reduce((counts, item) => {
        counts[item.status] = (counts[item.status] || 0) + 1;
        return counts;
    }, {});

    htmlContent += `
            <h2>Report Summary</h2>
            <table style="width: 50%;">
                <tr><th>Total Equipment Items</th><td>${totalItems}</td></tr>
                <tr><th>Total Equipment Value</th><td>$${totalValue.toFixed(2)}</td></tr>
                <tr><th>Labs Included</th><td>${Object.keys(groupedData).join(', ')}</td></tr>
            </table>
            
            <h3>Equipment Status Overview</h3>
            <table style="width: 40%;">
    `;

    Object.keys(statusCounts).forEach(status => {
        const statusClass = `status-${status.toLowerCase().replace(/[\s\/]/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        htmlContent += `<tr><th><span class="${statusClass}">${status}</span></th><td>${statusCounts[status]}</td></tr>`;
    });

    htmlContent += `
            </table>
        </body>
        </html>
    `;

    return htmlContent;
}

// Get selected labs for printing
function getSelectedLabs() {
    const labCheckboxes = document.querySelectorAll('.lab-checkbox:checked');
    return Array.from(labCheckboxes).map(checkbox => checkbox.value);
}

// Helper function to format price display
function formatPrice(price) {
    if (price === null || price === undefined || price === '') {
        return 'Not specified';
    }
    
    try {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
            return 'Not specified';
        }
        return '$' + numPrice.toFixed(2);
    } catch (error) {
        console.error('Error formatting price:', price, error);
        return 'Not specified';
    }
}

// Format date for display
function formatDate(dateString) {
    // Handle null, undefined, or empty dates
    if (!dateString || dateString === '' || dateString === null) {
        return 'Not specified';
    }
    
    try {
        const date = new Date(dateString);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return 'Not specified';
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return 'Not specified';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="material-icons">${getNotificationIcon(type)}</span>
        <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 10000;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles to document if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check_circle';
        case 'error': return 'error';
        case 'warning': return 'warning';
        case 'info': return 'info';
        default: return 'info';
    }
}

// Get notification color based on type
function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#388e3c';
        case 'error': return '#d32f2f';
        case 'warning': return '#f57c00';
        case 'info': return '#1976d2';
        default: return '#1976d2';
    }
}

// Show add equipment modal
function showAddEquipmentModal() {
    console.log('showAddEquipmentModal called');
    const modal = document.getElementById('addEquipmentModal');
    if (modal) {
        modal.classList.add('active');
        console.log('Modal shown');
        const form = document.getElementById('addEquipmentForm');
        if (form) {
            form.reset();
        }
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
    } else {
        console.error('addEquipmentModal not found!');
    }
}

// Hide add equipment modal
function hideAddEquipmentModal() {
    const modal = document.getElementById('addEquipmentModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('addEquipmentForm');
        if (form) {
            form.reset();
        }
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
    }
}

// Handle image upload preview
function handleImageUpload(event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file && imagePreview && previewImg) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Remove image preview
function removeImagePreview() {
    const equipmentImage = document.getElementById('equipmentImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (equipmentImage) equipmentImage.value = '';
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewImg) previewImg.src = '';
}

// Handle add equipment form submission
async function handleAddEquipment(event) {
    event.preventDefault();
    
    try {
        showNotification('Adding equipment...', 'info');
        
        // Create FormData object for file upload
        const formData = new FormData(addEquipmentForm);
        
        // Debug: Log the form data being sent
        console.log('Add equipment form data:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        // Add equipment via API
        const newEquipment = await addEquipmentToAPI(formData);
        
        // Reload equipment data to get fresh list
        await loadEquipmentFromAPI();
        
        // Close modal and show success message
        hideAddEquipmentModal();
        showNotification('Equipment added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding equipment:', error);
        showNotification(error.message || 'Error adding equipment. Please try again.', 'error');
    }
}

// Handle edit equipment form submission
async function handleEditEquipment(equipmentId, form) {
    try {
        showNotification('Updating equipment...', 'info');
        
        // Create FormData object for the update
        const formData = new FormData(form);
        
        // Debug: Log the form data being sent
        console.log('=== EDIT EQUIPMENT DEBUG ===');
        console.log('Equipment ID:', equipmentId);
        console.log('Form data being sent:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: "${value}"`);
        }
        
        // Specifically check for model and fiuId
        const modelValue = formData.get('model');
        const fiuIdValue = formData.get('fiuId');
        console.log('Model value extracted:', modelValue);
        console.log('FIU ID value extracted:', fiuIdValue);
        
        // Check if there's a pending image upload
        const imageInput = document.getElementById(`tempImageInput_${equipmentId}`);
        if (imageInput && imageInput.files.length > 0) {
            // Add the new image file
            formData.append('image', imageInput.files[0]);
            formData.append('keepImage', 'false'); // Replace existing image
            console.log('Adding new image to form data');
        } else {
            // Keep existing image
            formData.append('keepImage', 'true');
            const equipment = equipmentData.find(item => item.id == equipmentId);
            if (equipment && equipment.image) {
                formData.append('currentImage', equipment.image);
            }
            console.log('Keeping existing image');
        }
        
        // Send PUT request to update equipment
        const response = await fetch(`${API_BASE_URL}/equipment/${equipmentId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
          const updatedEquipment = await response.json();
        console.log('Server response:', updatedEquipment);
        
        // Update local data
        const index = equipmentData.findIndex(item => item.id == equipmentId);
        if (index !== -1) {
            console.log('Updating local data at index:', index);
            console.log('Old equipment data:', equipmentData[index]);
            equipmentData[index] = updatedEquipment;
            console.log('New equipment data:', equipmentData[index]);
        }
        
        // Clean up temporary image input
        if (imageInput) {
            imageInput.remove();
        }
        
        // Refresh the equipment list
        await loadEquipmentFromAPI();
        
        // Close modal and show success message
        hideEquipmentModal();
        showNotification('Equipment updated successfully!', 'success');
        
    } catch (error) {
        console.error('=== ERROR UPDATING EQUIPMENT ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        showNotification(error.message || 'Error updating equipment. Please try again.', 'error');
    }
}

// Test QR code generation
function testQRGeneration(equipmentId) {
    console.log('Testing QR code generation...');
    
    // Check available QR libraries
    const libraries = {
        'QRCode (main)': typeof QRCode !== 'undefined',
        'qrcode-generator': typeof qrcode !== 'undefined',
        'Canvas API': typeof CanvasRenderingContext2D !== 'undefined'
    };
    
    console.log('Available libraries:', libraries);
    
    let hasAnyQRLibrary = false;
    for (const [name, available] of Object.entries(libraries)) {
        if (available && name !== 'Canvas API') {
            hasAnyQRLibrary = true;
            console.log(`✅ ${name} is available`);
        } else if (!available && name !== 'Canvas API') {
            console.log(`❌ ${name} is NOT available`);
        }
    }
    
    if (!hasAnyQRLibrary) {
        console.log('⚠️ No QR libraries loaded, will use API fallback');
        showNotification('QR libraries not loaded, using fallback method...', 'warning');
    } else {
        console.log('✅ At least one QR library is available');
    }
    
    // Test with a simple URL
    const testUrl = 'https://www.example.com/test-manual.pdf';
    
    // Add test QR section
    addQRSection(equipmentId, testUrl);
    
    if (hasAnyQRLibrary) {
        showNotification('Test QR code generated!', 'success');
    } else {
        showNotification('Test QR using fallback method!', 'info');
    }
}

// Utility function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        // Also accept relative URLs or simple formats
        if (string.startsWith('http://') || string.startsWith('https://') || string.startsWith('www.') || string.includes('.')) {
            return true;
        }
        return false;
    }
}

// Dynamic QR section management
function addQRSection(equipmentId, manualLink) {
    console.log('addQRSection called:', equipmentId, manualLink);
    
    // Check if QR section already exists
    let existingSection = document.querySelector(`#qr-section-${equipmentId}`);
    if (existingSection) {
        console.log('QR section already exists, updating...');
        const urlSpan = existingSection.querySelector('.manual-url');
        if (urlSpan) {
            urlSpan.textContent = manualLink;
        }
        generateManualQR(equipmentId, manualLink);
        return;
    }
    
    // Find the manual link input
    const manualLinkInput = document.getElementById('editEquipmentManualLink');
    if (!manualLinkInput) {
        console.error('Manual link input not found');
        return;
    }
    
    // Create QR section HTML
    const qrSectionHTML = `
        <div class="manual-section" id="qr-section-${equipmentId}">
            <div class="manual-info">
                <h4>📖 Equipment Manual</h4>
                <div class="manual-actions">
                    <a href="${manualLink}" target="_blank" class="btn-manual">
                        <span class="material-icons">description</span>
                        Open Manual
                    </a>
                    <button type="button" onclick="printManualQR('${equipmentId}')" class="btn-manual">
                        <span class="material-icons">qr_code</span>
                        Print QR Code
                    </button>
                </div>
            </div>
            <div class="qr-code-container">
                <div class="qr-info">
                    <span class="qr-label">QR Code for Manual:</span>
                    <span class="manual-url">${manualLink}</span>
                </div>
                <div class="qr-display">
                    <canvas id="qr-canvas-${equipmentId}"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Insert after the manual link input group
    const formGroup = manualLinkInput.closest('.form-group');
    if (formGroup) {
        formGroup.insertAdjacentHTML('afterend', qrSectionHTML);
        console.log('QR section added to DOM');
        
        // Generate QR code after DOM insertion
        setTimeout(() => {
            generateManualQR(equipmentId, manualLink);
        }, 100);
    } else {
        console.error('Form group not found for manual link input');
    }
}

function removeQRSection(equipmentId) {
    console.log('removeQRSection called:', equipmentId);
    
    const qrSection = document.querySelector(`#qr-section-${equipmentId}`);
    if (qrSection) {
        qrSection.remove();
        console.log('QR section removed');
    }
}

// Update manual link in existing QR section
function updateManualLink(equipmentId, newLink) {
    console.log('updateManualLink called:', equipmentId, newLink);
    
    const qrSection = document.querySelector(`#qr-section-${equipmentId}`);
    if (qrSection) {
        // Update the manual URL display
        const urlSpan = qrSection.querySelector('.manual-url');
        if (urlSpan) {
            urlSpan.textContent = newLink;
        }
        
        // Update the open manual link
        const openLink = qrSection.querySelector('a.btn-manual');
        if (openLink) {
            openLink.href = newLink;
        }
        
        // Regenerate QR code
        generateManualQR(equipmentId, newLink);
    }
}

// QR Code generation and management for manual links
function generateManualQR(equipmentId, manualLink) {
    console.log('generateManualQR called:', equipmentId, manualLink);
    
    const canvas = document.getElementById(`qr-canvas-${equipmentId}`);
    console.log('Canvas element found:', !!canvas);
    
    if (canvas && manualLink) {
        try {
            console.log('Attempting to generate QR code for:', manualLink);
            
            // Try multiple QR code libraries/methods
            if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
                console.log('Using QRCode.toCanvas method');
                // Generate QR code using QRCode library
                QRCode.toCanvas(canvas, manualLink, {
                    width: 120,
                    height: 120,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, function (error) {
                    if (error) {
                        console.error('Error generating QR code:', error);
                        fallbackQRGeneration(canvas, manualLink);
                    } else {
                        console.log('QR code generated successfully for:', manualLink);
                    }
                });
            } else if (typeof qrcode !== 'undefined') {
                console.log('Using qrcode-generator library');
                fallbackQRGenerator(canvas, manualLink);
            } else {
                console.log('No QR library found, using API fallback');
                apiQRGeneration(canvas, manualLink);
            }
        } catch (error) {
            console.error('Error creating QR code:', error);
            fallbackQRGeneration(canvas, manualLink);
        }
    } else {
        console.log('Missing canvas or manual link:', { canvas: !!canvas, manualLink: !!manualLink });
    }
}

// Fallback QR generation using qrcode-generator library
function fallbackQRGenerator(canvas, manualLink) {
    try {
        console.log('Trying qrcode-generator fallback');
        const qr = qrcode(0, 'M');
        qr.addData(manualLink);
        qr.make();
        
        const ctx = canvas.getContext('2d');
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        
        const modules = qr.getModuleCount();
        const tileSize = size / modules;
        
        // Clear canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Draw QR code
        ctx.fillStyle = '#000000';
        for (let row = 0; row < modules; row++) {
            for (let col = 0; col < modules; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                }
            }
        }
        
        console.log('QR code generated using qrcode-generator');
    } catch (error) {
        console.error('qrcode-generator fallback failed:', error);
        apiQRGeneration(canvas, manualLink);
    }
}

// API-based QR generation as last resort
function apiQRGeneration(canvas, manualLink) {
    try {
        console.log('Using API-based QR generation');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(manualLink)}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const ctx = canvas.getContext('2d');
            canvas.width = 120;
            canvas.height = 120;
            ctx.drawImage(img, 0, 0, 120, 120);
            console.log('QR code generated using API');
        };
        img.onerror = function() {
            console.error('API QR generation failed');
            textQRFallback(canvas, manualLink);
        };
        img.src = qrUrl;
    } catch (error) {
        console.error('API QR generation error:', error);
        textQRFallback(canvas, manualLink);
    }
}

// Text fallback when all QR methods fail
function textQRFallback(canvas, manualLink) {
    console.log('Using SimpleQRCode fallback');
    
    // Try our simple QR code generator first
    if (typeof SimpleQRCode !== 'undefined') {
        try {
            const simpleQR = new SimpleQRCode(manualLink, 120);
            simpleQR.drawToCanvas(canvas);
            console.log('Simple QR code generated successfully');
            return;
        } catch (error) {
            console.error('SimpleQRCode failed:', error);
        }
    }
    
    console.log('Using text pattern fallback');
    const ctx = canvas.getContext('2d');
    canvas.width = 120;
    canvas.height = 120;
    
    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 120, 120);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 116, 116);
    
    // Draw QR placeholder text
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', 60, 30);
    ctx.fillText('SCAN WITH', 60, 45);
    ctx.fillText('PHONE', 60, 60);
    
    // Draw URL
    ctx.font = '8px Arial';
    const shortUrl = manualLink.length > 15 ? manualLink.substring(0, 12) + '...' : manualLink;
    ctx.fillText(shortUrl, 60, 85);
    
    // Draw simplified QR pattern
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            if ((i + j) % 2 === 0) {
                ctx.fillRect(25 + i * 12, 90 + j * 4, 10, 3);
            }
        }
    }
    
    console.log('Text QR fallback complete');
}

// General fallback function
function fallbackQRGeneration(canvas, manualLink) {
    console.log('Running general QR fallback');
    apiQRGeneration(canvas, manualLink);
}

// Print QR code with equipment info
function printManualQR(equipmentId) {
    const equipment = equipmentData.find(item => item.id == equipmentId);
    if (!equipment || !equipment.manualLink) {
        showNotification('No manual link available for printing', 'warning');
        return;
    }
    
    console.log('Printing QR for equipment:', equipment.name, 'Manual:', equipment.manualLink);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Equipment Manual QR Code - ${equipment.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    margin: 0;
                    background: white;
                }
                .qr-print {
                    border: 2px solid #333;
                    padding: 20px;
                    margin: 20px auto;
                    width: 350px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .equipment-info {
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .equipment-name {
                    font-weight: bold;
                    font-size: 18px;
                    margin-bottom: 8px;
                    color: #1976d2;
                }
                .info-line {
                    margin: 4px 0;
                    color: #333;
                }
                .manual-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #333;
                    margin: 15px 0 10px 0;
                }
                .manual-url {
                    font-size: 10px;
                    color: #666;
                    word-break: break-all;
                    margin-top: 10px;
                    padding: 8px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
                .qr-container {
                    margin: 15px 0;
                    padding: 10px;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .instructions {
                    font-size: 12px;
                    color: #555;
                    margin-top: 10px;
                    font-style: italic;
                }
                #print-qr {
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                }
                .loading-text {
                    color: #999;
                    font-style: italic;
                    margin: 20px 0;
                }
                @media print {
                    body { 
                        margin: 0; 
                        padding: 10px; 
                    }
                    .qr-print { 
                        border: 2px solid #333; 
                        margin: 0; 
                        box-shadow: none;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="qr-print">
                <div class="equipment-info">
                    <div class="equipment-name">${equipment.name}</div>
                    <div class="info-line"><strong>Brand:</strong> ${equipment.category}</div>
                    <div class="info-line"><strong>Lab:</strong> ${equipment.lab}</div>
                    <div class="info-line"><strong>Serial:</strong> ${equipment.serialNumber}</div>
                    ${equipment.model ? `<div class="info-line"><strong>Model:</strong> ${equipment.model}</div>` : ''}
                    ${equipment.fiuId ? `<div class="info-line"><strong>FIU ID:</strong> ${equipment.fiuId}</div>` : ''}
                </div>
                <div class="manual-title">📖 Equipment Manual</div>
                <div class="qr-container">
                    <div class="loading-text">Generating QR Code...</div>
                    <canvas id="print-qr" width="150" height="150"></canvas>
                </div>
                <div class="manual-url">${equipment.manualLink}</div>
                <div class="instructions">
                    Scan QR code with phone camera to access equipment manual
                </div>
                <div class="no-print" style="margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </div>
            
            <!-- Load QR Code libraries -->
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
            
            <script>
                console.log('Print window loaded, generating QR code...');
                const manualLink = "${equipment.manualLink}";
                const canvas = document.getElementById('print-qr');
                const loadingText = document.querySelector('.loading-text');
                
                function generateQRCode() {
                    console.log('Attempting to generate QR code for:', manualLink);
                    
                    // Try method 1: QRCode library
                    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
                        console.log('Using QRCode.toCanvas');
                        QRCode.toCanvas(canvas, manualLink, {
                            width: 150,
                            height: 150,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        }, function (error) {
                            if (error) {
                                console.error('QRCode.toCanvas failed:', error);
                                tryAlternativeMethod();
                            } else {
                                console.log('QR code generated successfully');
                                loadingText.style.display = 'none';
                                setTimeout(() => {
                                    window.print();
                                }, 1000);
                            }
                        });
                    } else {
                        tryAlternativeMethod();
                    }
                }
                
                function tryAlternativeMethod() {
                    console.log('Trying alternative QR generation...');
                    
                    // Try method 2: qrcode-generator
                    if (typeof qrcode !== 'undefined') {
                        try {
                            console.log('Using qrcode-generator');
                            const qr = qrcode(0, 'M');
                            qr.addData(manualLink);
                            qr.make();
                            
                            const ctx = canvas.getContext('2d');
                            const size = 150;
                            canvas.width = size;
                            canvas.height = size;
                            
                            const modules = qr.getModuleCount();
                            const tileSize = size / modules;
                            
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, size, size);
                            
                            ctx.fillStyle = '#000000';
                            for (let row = 0; row < modules; row++) {
                                for (let col = 0; col < modules; col++) {
                                    if (qr.isDark(row, col)) {
                                        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                                    }
                                }
                            }
                            
                            loadingText.style.display = 'none';
                            console.log('Alternative QR generated');
                            setTimeout(() => {
                                window.print();
                            }, 1000);
                            
                        } catch (error) {
                            console.error('qrcode-generator failed:', error);
                            useAPIMethod();
                        }
                    } else {
                        useAPIMethod();
                    }
                }
                
                function useAPIMethod() {
                    console.log('Using API-based QR generation');
                    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(manualLink);
                    
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = function() {
                        const ctx = canvas.getContext('2d');
                        canvas.width = 150;
                        canvas.height = 150;
                        ctx.drawImage(img, 0, 0, 150, 150);
                        loadingText.style.display = 'none';
                        console.log('API QR generated');
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    };
                    img.onerror = function() {
                        console.error('All QR generation methods failed');
                        fallbackQR();
                    };
                    img.src = qrUrl;
                }
                
                function fallbackQR() {
                    console.log('Using fallback QR display');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 150;
                    canvas.height = 150;
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, 150, 150);
                    
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(2, 2, 146, 146);
                    
                    ctx.fillStyle = '#000000';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR CODE', 75, 40);
                    ctx.fillText('SCAN WITH', 75, 60);
                    ctx.fillText('PHONE', 75, 80);
                    
                    // Draw simplified pattern
                    for (let i = 0; i < 10; i++) {
                        for (let j = 0; j < 10; j++) {
                            if ((i + j) % 2 === 0) {
                                ctx.fillRect(25 + i * 10, 90 + j * 5, 8, 4);
                            }
                        }
                    }
                    
                    loadingText.style.display = 'none';
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                }
                
                // Start QR generation when page loads
                setTimeout(generateQRCode, 500);
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Download QR code as image
function downloadManualQR(equipmentId) {
    const equipment = equipmentData.find(item => item.id == equipmentId);
    if (!equipment || !equipment.manualLink) {
        showNotification('No manual link available for download', 'warning');
        return;
    }
    
    // Create a temporary canvas for QR code generation
    const canvas = document.createElement('canvas');
    
    try {
        QRCode.toCanvas(canvas, equipment.manualLink, {
            width: 300,
            height: 300,
            margin: 4,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) {
                console.error('Error generating QR code for download:', error);
                showNotification('Error creating QR code for download', 'error');
            } else {
                // Download the canvas as PNG
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Manual_QR_${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showNotification('Manual QR code downloaded successfully!', 'success');
                });
            }
        });
    } catch (error) {
        console.error('Error creating QR code for download:', error);
        showNotification('Error creating QR code for download', 'error');
    }
}

// Barcode generation for FIU ID
function generateBarcode(equipmentId) {
    const fiuIdInput = document.getElementById('editEquipmentFiuId');
    const barcodeElement = document.getElementById(`barcode-${equipmentId}`);
    
    if (fiuIdInput && barcodeElement && fiuIdInput.value.trim()) {
        try {
            // Generate barcode using Code128 format
            JsBarcode(barcodeElement, fiuIdInput.value.trim(), {
                format: "CODE128",
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 12,
                textAlign: "center",
                textPosition: "bottom",
                textMargin: 2,
                background: "#ffffff",
                lineColor: "#000000"
            });
        } catch (error) {
            console.error('Error generating barcode:', error);
        }
    }
}

// Print barcode
function printBarcode(equipmentId) {
    const equipment = equipmentData.find(item => item.id == equipmentId);
    if (!equipment || !equipment.fiuId) {
        showNotification('No FIU ID available for printing', 'warning');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>FIU Barcode - ${equipment.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    margin: 0;
                }
                .barcode-print {
                    border: 1px solid #ccc;
                    padding: 20px;
                    margin: 20px auto;
                    width: 300px;
                    background: white;
                }
                .equipment-info {
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .equipment-name {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 5px;
                }
                .fiu-id {
                    font-size: 18px;
                    font-weight: bold;
                    color: #1976d2;
                    margin-bottom: 10px;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .barcode-print { border: none; margin: 0; }
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
            <div class="barcode-print">
                <div class="equipment-info">
                    <div class="equipment-name">${equipment.name}</div>
                    <div>Lab: ${equipment.lab}</div>
                    <div>Serial: ${equipment.serialNumber}</div>
                </div>
                <div class="fiu-id">FIU ID: ${equipment.fiuId}</div>
                <svg id="print-barcode"></svg>
            </div>
            <script>
                JsBarcode("#print-barcode", "${equipment.fiuId}", {
                    format: "CODE128",
                    width: 2,
                    height: 80,
                    displayValue: true,
                    fontSize: 14,
                    textAlign: "center",
                    textPosition: "bottom",
                    textMargin: 2,
                    background: "#ffffff",
                    lineColor: "#000000"
                });
                
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Download barcode as image
function downloadBarcode(equipmentId) {
    const equipment = equipmentData.find(item => item.id == equipmentId);
    if (!equipment || !equipment.fiuId) {
        showNotification('No FIU ID available for download', 'warning');
        return;
    }
    
    // Create a temporary canvas for barcode generation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;
    
    // Create SVG for barcode
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    try {
        JsBarcode(tempSvg, equipment.fiuId, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 16,
            textAlign: "center",
            textPosition: "bottom",
            textMargin: 2,
            background: "#ffffff",
            lineColor: "#000000"
        });
        
        // Convert SVG to image and download
        const svgData = new XMLSerializer().serializeToString(tempSvg);
        const img = new Image();
        
        img.onload = function() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add equipment info
            ctx.fillStyle = 'black';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${equipment.name} - Lab ${equipment.lab}`, canvas.width / 2, 20);
            ctx.fillText(`FIU ID: ${equipment.fiuId}`, canvas.width / 2, 40);
            
            // Draw barcode
            ctx.drawImage(img, (canvas.width - img.width) / 2, 60);
            
            // Download
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `FIU_Barcode_${equipment.fiuId}_${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showNotification('Barcode downloaded successfully!', 'success');
            });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        
    } catch (error) {
        console.error('Error creating barcode for download:', error);
        showNotification('Error creating barcode for download', 'error');
    }
}

// Image upload functionality for equipment details
function openImageUploader(equipmentId) {
    // Create hidden file input with unique ID
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = `tempImageInput_${equipmentId}`;
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Preview the image immediately
            previewNewImage(equipmentId, file);
            // Keep the input in DOM for later use by save button
            document.body.appendChild(fileInput);
        }
    };
    
    // Trigger file picker
    fileInput.click();
}

// Preview the newly selected image
function previewNewImage(equipmentId, file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        // Find the image element in the modal and update it
        const imageElement = document.querySelector('.detail-image img');
        const noImageDiv = document.querySelector('.detail-image.no-image');
        const imageContainer = document.querySelector('.detail-image');
        
        if (imageContainer) {
            // Update existing image or create new one
            imageContainer.innerHTML = `
                <img src="${e.target.result}" 
                     alt="New image preview" 
                     style="width: 100%; height: 200px; object-fit: cover;">
                <div class="image-edit-overlay" onclick="openImageUploader(${equipmentId})">
                    <span class="material-icons">edit</span>
                </div>
                <div class="image-preview-badge">
                    <span class="material-icons">schedule</span>
                    New image (unsaved)
                </div>
            `;
            
            // Remove no-image class if it exists
            imageContainer.classList.remove('no-image');
        }
    };
    reader.readAsDataURL(file);
}

// Upload image for specific equipment
async function uploadEquipmentImage(equipmentId, file) {
    try {
        showNotification('Uploading image...', 'info');
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('keepImage', 'false'); // Replace existing image
        
        // Get current equipment data to preserve other fields
        const equipment = equipmentData.find(item => item.id == equipmentId);
        if (!equipment) {
            throw new Error('Equipment not found');
        }
        
        // Add all existing data to FormData
        formData.append('name', equipment.name);
        formData.append('category', equipment.category);
        formData.append('lab', equipment.lab);
        formData.append('buyingDate', equipment.buyingDate);
        formData.append('serialNumber', equipment.serialNumber);
        formData.append('quantity', equipment.quantity);
        formData.append('price', equipment.price);
        formData.append('status', equipment.status);
        formData.append('notes', equipment.notes || '');
        
        // Send PUT request to update equipment with new image
        const response = await fetch(`${API_BASE_URL}/equipment/${equipmentId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const updatedEquipment = await response.json();
        
        // Update local data
        const index = equipmentData.findIndex(item => item.id == equipmentId);
        if (index !== -1) {
            equipmentData[index] = updatedEquipment;
        }
        
        // Refresh the modal with updated data
        await showEquipmentDetails(equipmentId);
        
        // Refresh the equipment grid
        await loadEquipmentFromAPI();
        
        showNotification('Image updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification(error.message || 'Error uploading image. Please try again.', 'error');
    }
}

// Force refresh equipment data
function forceRefreshData() {
    console.log('Force refreshing equipment data...');
    
    // Clear existing data
    equipmentData = [];
    filteredData = [];
    
    // Reload from API with fresh data
    loadEquipmentFromAPI();
    
    showNotification('Equipment data refreshed', 'success');
}
