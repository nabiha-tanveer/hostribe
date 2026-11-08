

let activeModalEscapeHandler = null;

function openModal(html) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'active-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            ${html}
        </div>
    `;
    overlay.onclick = closeModal;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    if (typeof setupPasswordToggles === 'function') {
        setupPasswordToggles(overlay);
    }

    activeModalEscapeHandler = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeModal();
        }
    };
    document.addEventListener('keydown', activeModalEscapeHandler);
}

function closeModal() {

    if (state.newlyUploadedReceiptUrls && state.newlyUploadedReceiptUrls.length > 0) {
        const toClean = [...state.newlyUploadedReceiptUrls];
        state.newlyUploadedReceiptUrls = [];
        api.post('/expenses/delete-receipt', { receipt_urls: toClean }).catch(() => {});
    }
    state.currentExpenseReceiptUrls = [];

    const existing = document.getElementById('active-modal-overlay');
    if (existing) {
        existing.remove();
    }
    document.body.style.overflow = '';
    if (activeModalEscapeHandler) {
        document.removeEventListener('keydown', activeModalEscapeHandler);
        activeModalEscapeHandler = null;
    }
}

function showConfirmModal({ title = 'Are you sure?', message = '', confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">${escapeHtml(title)}</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <div style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6;">
            ${escapeHtml(message)}
        </div>
        <div class="modal-footer-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="button" id="confirm-modal-action-btn" class="btn ${confirmClass}">${escapeHtml(confirmText)}</button>
        </div>
    `);

    const btn = document.getElementById('confirm-modal-action-btn');
    if (btn) {
        btn.onclick = async () => {
            closeModal();
            if (typeof onConfirm === 'function') {
                await onConfirm();
            }
        };
    }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.showConfirmModal = showConfirmModal;

function showCreateGroupModal() {
    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">Create New Group</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <form onsubmit="handleCreateGroupSubmit(event)">
            <div class="form-group">
                <label class="form-label">Group Name</label>
                <input type="text" id="new-group-name" class="form-control" placeholder="e.g. Hunza Trip 2026, Flat 402" required autofocus>
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Group</button>
            </div>
        </form>
    `);
}

async function handleCreateGroupSubmit(e) {
    e.preventDefault();
    const group_name = document.getElementById('new-group-name').value.trim();
    const currency = state.user?.default_currency || '';

    try {
        const res = await api.post('/groups/create', { group_name, currency });
        closeModal();
        showToast('Group created successfully!');
        window.location.hash = `#group/${res.group.id}`;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function handleLeaveGroup(groupId) {
    showConfirmModal({
        title: 'Leave Group',
        message: 'Are you sure you want to leave this group? Note that your net balance must be settled (0.00) before leaving.',
        confirmText: 'Leave Group',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            try {
                const res = await api.post(`/groups/${groupId}/leave`);
                showToast(res.message);
                window.location.hash = '#dashboard';
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    });
}

window.showCreateGroupModal = showCreateGroupModal;
window.handleCreateGroupSubmit = handleCreateGroupSubmit;
window.handleLeaveGroup = handleLeaveGroup;

function showAddExpenseModal() {
    state.expenseModalMode = 'create';
    state.editingExpenseId = null;
    state.currentExpenseReceiptUrls = [];
    state.newlyUploadedReceiptUrls = [];
    state.expenseSplitMode = 'EQUAL';
    state.exactSplits = {};
    renderExpenseModal();
}

function showEditExpenseModal(expenseId) {
    const exp = state.currentGroupExpenses.find(e => e.id === expenseId);
    if (!exp) return;

    state.expenseModalMode = 'edit';
    state.editingExpenseId = expenseId;
    state.currentExpenseReceiptUrls = exp.receipt_urls ? [...exp.receipt_urls] : (exp.receipt_url ? [exp.receipt_url] : []);
    state.newlyUploadedReceiptUrls = [];
    state.expenseSplitMode = exp.split_type || 'EQUAL';
    state.exactSplits = {};
    if (exp.splits) {
        exp.splits.forEach(s => {
            state.exactSplits[s.user_id] = s.amount;
        });
    }

    renderExpenseModal(exp);
}

function renderExpenseModal(existing = null) {
    const isEdit = state.expenseModalMode === 'edit';
    const group = state.currentGroup;
    const members = state.currentMembers;
    const today = new Date().toISOString().split('T')[0];

    const description = existing ? existing.description : '';
    const amount = existing ? existing.amount : '';
    const paidBy = existing ? existing.paid_by : state.user.id;
    const date = existing ? existing.expense_date : today;

    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Edit Expense' : 'Add Expense'}</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <form onsubmit="handleExpenseFormSubmit(event)">
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" id="expense-desc" class="form-control" placeholder="What was this expense for?" value="${escapeHtml(description)}" required>
            </div>

            <div style="display: grid; gap: 0.75rem;" class="expense-fields-grid">
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" step="0.01" min="0.01" id="expense-amount" class="form-control" placeholder="0.00" value="${amount}" oninput="updateExpenseSplitsPreview()" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Expense Date</label>
                    <input type="date" id="expense-date" class="form-control" value="${date}" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Paid By</label>
                <select id="expense-paid-by" class="form-control">
                    ${members.map(m => `
                        <option value="${m.id}" ${m.id === paidBy ? 'selected' : ''}>
                            ${escapeHtml(m.username)} ${m.id === state.user.id ? '(You)' : ''}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Split Mode</label>
                <div class="split-mode-selector">
                    <div class="split-pill ${state.expenseSplitMode === 'EQUAL' ? 'active' : ''}" data-mode="EQUAL" onclick="setSplitMode('EQUAL')">
                        Equal Split (Default)
                    </div>
                    <div class="split-pill ${state.expenseSplitMode === 'EXACT' ? 'active' : ''}" data-mode="EXACT" onclick="setSplitMode('EXACT')">
                        Exact Amounts
                    </div>
                </div>
            </div>

            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                    <label class="form-label" style="margin-bottom: 0;">Split Participants</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button type="button" id="distribute-exact-btn" class="btn btn-secondary btn-sm" onclick="distributeEvenlyToExact()" style="display: ${state.expenseSplitMode === 'EXACT' ? 'inline-flex' : 'none'}; font-size: 0.72rem; padding: 0.2rem 0.5rem;">
                            Distribute Evenly
                        </button>
                        <span id="split-mode-helper" style="font-size: 0.75rem; color: var(--primary); font-weight: 600;"></span>
                    </div>
                </div>

                <div class="split-members-list" id="expense-members-list">
                    ${members.map(m => {
                        const isChecked = existing && existing.splits ? existing.splits.some(s => s.user_id === m.id) : true;
                        const exactVal = state.exactSplits[m.id] !== undefined ? state.exactSplits[m.id] : '';
                        return `
                            <div class="split-member-row">
                                <label style="display: flex; align-items: center; gap: 0.5rem; flex: 1; cursor: pointer;">
                                    <input type="checkbox" value="${m.id}" class="member-split-cb" ${isChecked ? 'checked' : ''} onchange="updateExpenseSplitsPreview()">
                                    <span>${escapeHtml(m.username)} ${m.id === state.user.id ? '(You)' : ''}</span>
                                </label>
                                <div class="exact-amount-container" style="${state.expenseSplitMode === 'EXACT' ? 'display: block;' : 'display: none;'}">
                                    <input type="number" step="0.01" min="0" class="form-control exact-split-input" style="width: 105px; padding: 0.3rem 0.55rem; text-align: right; font-family: var(--font-mono);" data-userid="${m.id}" value="${exactVal}" placeholder="0.00" oninput="handleExactInputChange(${m.id}, this.value)">
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div id="exact-split-warning" style="display: none; color: var(--danger); background-color: var(--surface-secondary); border: 1px solid var(--danger); border-radius: var(--radius-sm); padding: 0.55rem 0.75rem; font-size: 0.8125rem; margin-bottom: 1rem;"></div>

            <div class="form-group" style="margin-top: 1rem;">
                <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Receipts &amp; Bills (Optional)</span>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">Upload one or more files | Max 10MB each</span>
                </label>
                <input type="file" id="expense-receipt-input" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" multiple style="display: none;" onchange="handleReceiptFileSelect(event)">
                <div id="receipt-upload-container">
                    ${renderReceiptPreviewArea(state.currentExpenseReceiptUrls)}
                </div>
            </div>

            <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" id="expense-submit-btn" class="btn btn-primary">${isEdit ? 'Update Expense' : 'Save Expense'}</button>
            </div>
        </form>
    `);

    updateExpenseSplitsPreview();
}

function setSplitMode(mode) {
    state.expenseSplitMode = mode;
    document.querySelectorAll('.split-pill').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-mode') === mode);
    });

    const exactContainers = document.querySelectorAll('.exact-amount-container');
    exactContainers.forEach(c => {
        c.style.display = mode === 'EXACT' ? 'block' : 'none';
    });

    const distBtn = document.getElementById('distribute-exact-btn');
    if (distBtn) {
        distBtn.style.display = mode === 'EXACT' ? 'inline-flex' : 'none';
    }

    updateExpenseSplitsPreview();
}

function handleExactInputChange(userId, val) {
    state.exactSplits[userId] = parseFloat(val) || 0;
    updateExpenseSplitsPreview();
}

function distributeEvenlyToExact() {
    const amount = parseFloat(document.getElementById('expense-amount')?.value) || 0;
    const checked = Array.from(document.querySelectorAll('.member-split-cb:checked')).map(cb => parseInt(cb.value, 10));
    if (amount <= 0 || checked.length === 0) return;

    const count = checked.length;
    const baseShare = Math.floor((amount / count) * 100) / 100;
    const remainder = parseFloat((amount - (baseShare * count)).toFixed(2));

    checked.forEach((uid, index) => {
        const val = index === 0 ? parseFloat((baseShare + remainder).toFixed(2)) : baseShare;
        state.exactSplits[uid] = val;
        const input = document.querySelector(`.exact-split-input[data-userid="${uid}"]`);
        if (input) input.value = val.toFixed(2);
    });

    updateExpenseSplitsPreview();
}

function updateExpenseSplitsPreview() {
    const amount = parseFloat(document.getElementById('expense-amount')?.value) || 0;
    const checked = Array.from(document.querySelectorAll('.member-split-cb:checked')).map(cb => parseInt(cb.value, 10));
    const helper = document.getElementById('split-mode-helper');
    const warning = document.getElementById('exact-split-warning');
    const submitBtn = document.getElementById('expense-submit-btn');

    document.querySelectorAll('.split-member-row').forEach(row => {
        const cb = row.querySelector('.member-split-cb');
        const input = row.querySelector('.exact-split-input');
        if (cb && input) {
            input.disabled = !cb.checked;
            input.style.opacity = cb.checked ? '1' : '0.35';
        }
    });

    if (!helper) return;

    if (checked.length === 0) {
        helper.textContent = 'Select at least 1 person';
        helper.style.color = 'var(--color-coral)';
        if (submitBtn) submitBtn.disabled = true;
        return;
    }

    helper.style.color = 'var(--color-teal)';

    if (state.expenseSplitMode === 'EQUAL') {
        if (warning) warning.style.display = 'none';
        if (submitBtn) submitBtn.disabled = (amount <= 0);

        const count = checked.length;
        if (count > 0 && amount > 0) {
            const each = (amount / count).toFixed(2);
            helper.textContent = `${each} each (${count} member${count > 1 ? 's' : ''})`;
        } else {
            helper.textContent = `0.00 each`;
        }
    } else {

        let sum = 0;
        checked.forEach(uid => {
            const input = document.querySelector(`.exact-split-input[data-userid="${uid}"]`);
            const val = input ? parseFloat(input.value) || 0 : 0;
            sum += val;
        });

        sum = parseFloat(sum.toFixed(2));
        const diff = parseFloat((amount - sum).toFixed(2));
        helper.textContent = `Allocated: ${sum.toFixed(2)} / ${amount.toFixed(2)}`;

        if (amount <= 0) {
            if (warning) {
                warning.textContent = 'Please enter a total expense amount greater than 0.';
                warning.style.display = 'block';
            }
            if (submitBtn) submitBtn.disabled = true;
        } else if (Math.abs(diff) > 0.01) {
            if (warning) {
                if (diff > 0) {
                    warning.textContent = `Remaining to allocate: ${diff.toFixed(2)} (Sum: ${sum.toFixed(2)} of ${amount.toFixed(2)})`;
                } else {
                    warning.textContent = `Over-allocated by ${Math.abs(diff).toFixed(2)} (Sum: ${sum.toFixed(2)} of ${amount.toFixed(2)})`;
                }
                warning.style.display = 'block';
            }
            if (submitBtn) submitBtn.disabled = true;
        } else {
            if (warning) warning.style.display = 'none';
            if (submitBtn) submitBtn.disabled = false;
        }
    }
}

async function handleExpenseFormSubmit(e) {
    e.preventDefault();
    const group_id = state.currentGroup.id;
    const description = document.getElementById('expense-desc').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const expense_date = document.getElementById('expense-date').value;
    const paid_by = parseInt(document.getElementById('expense-paid-by').value, 10);
    const split_type = state.expenseSplitMode;

    const checkedMembers = Array.from(document.querySelectorAll('.member-split-cb:checked')).map(cb => parseInt(cb.value, 10));
    if (checkedMembers.length === 0) {
        showToast('Please select at least one member for split', 'error');
        return;
    }

    let splits = [];
    if (split_type === 'EQUAL') {
        splits = checkedMembers.map(uid => ({ user_id: uid }));
    } else {
        splits = checkedMembers.map(uid => {
            const input = document.querySelector(`.exact-split-input[data-userid="${uid}"]`);
            return {
                user_id: uid,
                amount: input ? parseFloat(input.value) || 0 : 0
            };
        });
    }

    try {
        const payload = {
            description, amount, paid_by, expense_date, split_type, splits,
            receipt_urls: state.currentExpenseReceiptUrls,
            receipt_url: state.currentExpenseReceiptUrls[0] || null
        };

        if (state.expenseModalMode === 'edit') {
            await api.put(`/expenses/${state.editingExpenseId}`, payload);
            showToast('Expense updated successfully');
        } else {
            payload.group_id = group_id;
            await api.post('/expenses', payload);
            showToast('Expense added successfully');
        }
        state.newlyUploadedReceiptUrls = [];
        closeModal();
        if (typeof renderGroupView === 'function') {
            await renderGroupView(group_id);
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderReceiptPreviewArea(receiptUrls = []) {
    const list = Array.isArray(receiptUrls) ? receiptUrls : (receiptUrls ? [receiptUrls] : []);

    if (list.length === 0) {
        return `
            <div class="receipt-dropzone" id="receipt-dropzone" onclick="document.getElementById('expense-receipt-input').click()" ondragover="handleReceiptDragOver(event)" ondragleave="handleReceiptDragLeave(event)" ondrop="handleReceiptDrop(event)">
                <div class="receipt-dropzone-icon">${ICONS.receipt}</div>
                <div class="receipt-dropzone-title">Upload Receipts or Invoices</div>
                <div class="receipt-dropzone-subtitle">Click to browse or drag &amp; drop images/PDFs here</div>
                <div class="receipt-dropzone-meta">Supports multiple PNG, JPG, WEBP, GIF, PDF files (Max 10MB each)</div>
            </div>
        `;
    }

    return `
        <div class="receipt-files-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);">Attached Receipts (${list.length})</span>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('expense-receipt-input').click()" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                    ${ICONS.plus} Add More Files
                </button>
            </div>
            <div class="receipt-files-grid">
                ${list.map((url, idx) => {
                    const isPdf = url.toLowerCase().endsWith('.pdf');
                    const filename = url.split('/').pop();
                    return `
                        <div class="receipt-file-item">
                            <div class="receipt-file-thumb-wrap" onclick="openReceiptLightbox(state.currentExpenseReceiptUrls, ${idx}, 'Receipt Preview')">
                                ${isPdf ? `
                                    <div class="receipt-pdf-thumb">${ICONS.fileText} <span>PDF</span></div>
                                ` : `
                                    <img src="${escapeHtml(url)}" alt="Receipt thumbnail" class="receipt-file-thumb" />
                                `}
                            </div>
                            <div class="receipt-file-meta" onclick="openReceiptLightbox(state.currentExpenseReceiptUrls, ${idx}, 'Receipt Preview')">
                                <div class="receipt-file-name" title="${escapeHtml(filename)}">${escapeHtml(filename)}</div>
                                <div class="receipt-file-sub">${isPdf ? 'PDF Invoice' : 'Image'} #${idx + 1}</div>
                            </div>
                            <div class="receipt-file-actions">
                                <button type="button" class="btn btn-secondary btn-sm receipt-action-btn" onclick="openReceiptLightbox(state.currentExpenseReceiptUrls, ${idx}, 'Receipt Preview')" title="Preview file">
                                    ${ICONS.eye}
                                </button>
                                <button type="button" class="btn btn-danger btn-sm receipt-action-btn" onclick="removeAttachedReceipt(${idx})" title="Remove file">
                                    ${ICONS.trash}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="receipt-dropzone-compact" onclick="document.getElementById('expense-receipt-input').click()" ondragover="handleReceiptDragOver(event)" ondragleave="handleReceiptDragLeave(event)" ondrop="handleReceiptDrop(event)">
                <span>${ICONS.plus} Drop more files here or click to browse</span>
            </div>
        </div>
    `;
}

async function handleReceiptFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processMultipleReceiptUploads(files);
}

function handleReceiptDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('receipt-dropzone');
    if (dropzone) dropzone.classList.add('dragover');
    const compact = document.querySelector('.receipt-dropzone-compact');
    if (compact) compact.classList.add('dragover');
}

function handleReceiptDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('receipt-dropzone');
    if (dropzone) dropzone.classList.remove('dragover');
    const compact = document.querySelector('.receipt-dropzone-compact');
    if (compact) compact.classList.remove('dragover');
}

async function handleReceiptDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('receipt-dropzone');
    if (dropzone) dropzone.classList.remove('dragover');
    const compact = document.querySelector('.receipt-dropzone-compact');
    if (compact) compact.classList.remove('dragover');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processMultipleReceiptUploads(Array.from(e.dataTransfer.files));
    }
}

async function processMultipleReceiptUploads(files) {
    if (!files || files.length === 0) return;

    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
    ];

    const validFiles = [];
    for (const f of files) {
        if (f.size > 10 * 1024 * 1024) {
            showToast(`${f.name} exceeds 10MB limit and was skipped`, 'error');
            continue;
        }
        if (!allowedTypes.includes(f.type) && !f.name.match(/\.(jpe?g|png|webp|gif|pdf)$/i)) {
            showToast(`${f.name} is not a supported image or PDF file`, 'error');
            continue;
        }
        validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    const container = document.getElementById('receipt-upload-container');
    if (container) {
        container.innerHTML = `
            <div class="receipt-uploading-card">
                <div class="receipt-spinner"></div>
                <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.5rem;">Uploading ${validFiles.length} file(s)...</div>
            </div>
        `;
    }

    const formData = new FormData();
    validFiles.forEach(f => {
        formData.append('receipts[]', f);
    });

    try {
        const res = await api.post('/expenses/upload', formData);
        const newUrls = res.receipt_urls || (res.receipt_url ? [res.receipt_url] : []);

        const activeContainer = document.getElementById('receipt-upload-container');
        if (!activeContainer) {
            if (newUrls.length > 0) {
                api.post('/expenses/delete-receipt', { receipt_urls: newUrls }).catch(() => {});
            }
            return;
        }

        state.currentExpenseReceiptUrls = [...state.currentExpenseReceiptUrls, ...newUrls];
        state.newlyUploadedReceiptUrls = [...(state.newlyUploadedReceiptUrls || []), ...newUrls];
        if (container) {
            container.innerHTML = renderReceiptPreviewArea(state.currentExpenseReceiptUrls);
        }
        showToast(`Added ${newUrls.length} file(s) successfully!`, 'success');
    } catch (err) {
        showToast(err.message || 'Failed to upload receipts', 'error');
        if (container) {
            container.innerHTML = renderReceiptPreviewArea(state.currentExpenseReceiptUrls);
        }
    }

    const fileInput = document.getElementById('expense-receipt-input');
    if (fileInput) fileInput.value = '';
}

async function removeAttachedReceipt(index) {
    if (index >= 0 && index < state.currentExpenseReceiptUrls.length) {
        const removedUrl = state.currentExpenseReceiptUrls[index];
        state.currentExpenseReceiptUrls.splice(index, 1);

        if (state.newlyUploadedReceiptUrls) {
            const nIdx = state.newlyUploadedReceiptUrls.indexOf(removedUrl);
            if (nIdx !== -1) {
                state.newlyUploadedReceiptUrls.splice(nIdx, 1);
            }
        }

        if (removedUrl) {
            api.post('/expenses/delete-receipt', { receipt_url: removedUrl }).catch(err => {
                console.warn('Could not remove uncommitted receipt from server:', err);
            });
        }
    }
    const container = document.getElementById('receipt-upload-container');
    if (container) {
        container.innerHTML = renderReceiptPreviewArea(state.currentExpenseReceiptUrls);
    }
    const fileInput = document.getElementById('expense-receipt-input');
    if (fileInput) fileInput.value = '';
    showToast('File removed', 'info');
}

window.addEventListener('pagehide', () => {
    if (state.newlyUploadedReceiptUrls && state.newlyUploadedReceiptUrls.length > 0) {
        const payload = JSON.stringify({ receipt_urls: state.newlyUploadedReceiptUrls });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/expenses/delete-receipt', blob);
    }
});

let activeLightboxEscapeHandler = null;

function openReceiptLightbox(urls, startIndex = 0, title = 'Attached Receipt') {
    if (!urls) return;
    const urlList = Array.isArray(urls) ? urls : [urls];
    if (urlList.length === 0) return;

    let currentIndex = Math.max(0, Math.min(startIndex, urlList.length - 1));

    closeReceiptLightbox();

    const overlay = document.createElement('div');
    overlay.id = 'receipt-lightbox-overlay';
    overlay.className = 'receipt-lightbox-overlay';

    function renderContent() {
        const url = urlList[currentIndex];
        const isPdf = url.toLowerCase().endsWith('.pdf');
        const filename = url.split('/').pop();
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex < urlList.length - 1;

        overlay.innerHTML = `
            <div class="receipt-lightbox-backdrop" onclick="closeReceiptLightbox()"></div>
            <div class="receipt-lightbox-card" onclick="event.stopPropagation()">
                <div class="receipt-lightbox-header">
                    <div class="receipt-lightbox-title-wrap">
                        <span class="receipt-lightbox-title">${escapeHtml(title)}</span>
                        ${urlList.length > 1 ? `
                            <span class="receipt-lightbox-counter">${currentIndex + 1} of ${urlList.length}</span>
                        ` : ''}
                    </div>
                    <button type="button" class="receipt-lightbox-close" onclick="closeReceiptLightbox()" aria-label="Close preview">x</button>
                </div>

                <div class="receipt-lightbox-content">
                    ${isPdf ? `
                        <div class="receipt-lightbox-pdf-view">
                            <div class="receipt-lightbox-pdf-icon">${ICONS.fileText}</div>
                            <div class="receipt-lightbox-pdf-name">${escapeHtml(filename)}</div>
                            <div class="receipt-lightbox-pdf-sub">PDF Document Invoice / Receipt</div>
                            <a href="${escapeHtml(url)}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 1rem;">
                                ${ICONS.download} Open PDF Document in New Tab
                            </a>
                        </div>
                    ` : `
                        <div class="receipt-lightbox-img-wrap">
                            <img src="${escapeHtml(url)}" alt="Receipt preview" class="receipt-lightbox-img" />
                        </div>
                    `}

                    ${urlList.length > 1 ? `
                        <button type="button" class="receipt-nav-btn receipt-nav-prev" ${hasPrev ? '' : 'disabled'} onclick="lightboxPrev(event)" title="Previous image">
                            Previous
                        </button>
                        <button type="button" class="receipt-nav-btn receipt-nav-next" ${hasNext ? '' : 'disabled'} onclick="lightboxNext(event)" title="Next image">
                            Next
                        </button>
                    ` : ''}
                </div>

                ${urlList.length > 1 ? `
                    <div class="receipt-lightbox-thumbs-strip">
                        ${urlList.map((u, i) => {
                            const uPdf = u.toLowerCase().endsWith('.pdf');
                            return `
                                <div class="receipt-thumb-dot ${i === currentIndex ? 'active' : ''}" onclick="lightboxGoTo(${i}, event)" title="View file ${i + 1}">
                                    ${uPdf ? `<span style="font-size: 0.65rem; font-weight: bold; color: var(--danger);">PDF</span>` : `<img src="${escapeHtml(u)}" alt="" />`}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                <div class="receipt-lightbox-footer">
                    <span class="receipt-lightbox-filename" title="${escapeHtml(filename)}">${escapeHtml(filename)}</span>
                    <div class="receipt-lightbox-footer-actions">
                        <a href="${escapeHtml(url)}" target="_blank" download class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                            ${ICONS.download} Open Original
                        </a>
                        <button type="button" class="btn btn-primary btn-sm" onclick="closeReceiptLightbox()">Close</button>
                    </div>
                </div>
            </div>
        `;

        const activeDot = overlay.querySelector('.receipt-thumb-dot.active');
        if (activeDot && typeof activeDot.scrollIntoView === 'function') {
            try {
                activeDot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } catch (err) {}
        }
    }

    window.lightboxPrev = (e) => {
        if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
        if (currentIndex > 0) {
            currentIndex--;
            renderContent();
        }
    };

    window.lightboxNext = (e) => {
        if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
        if (currentIndex < urlList.length - 1) {
            currentIndex++;
            renderContent();
        }
    };

    window.lightboxGoTo = (idx, e) => {
        if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
        if (idx >= 0 && idx < urlList.length) {
            currentIndex = idx;
            renderContent();
        }
    };

    activeLightboxEscapeHandler = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            e.preventDefault();
            e.stopPropagation();
            closeReceiptLightbox();
        } else if (e.key === 'ArrowLeft') {
            window.lightboxPrev(e);
        } else if (e.key === 'ArrowRight') {
            window.lightboxNext(e);
        }
    };

    document.addEventListener('keydown', activeLightboxEscapeHandler, true);

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    overlay.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }
    }, { passive: true });

    overlay.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            const elapsed = Date.now() - touchStartTime;

            if (elapsed < 650 && Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
                if (diffX < 0) {
                    window.lightboxNext(e);
                } else {
                    window.lightboxPrev(e);
                }
            }
        }
    }, { passive: true });

    renderContent();
    document.body.appendChild(overlay);
}

function closeReceiptLightbox() {
    const existing = document.getElementById('receipt-lightbox-overlay');
    if (existing) {
        existing.remove();
    }
    if (activeLightboxEscapeHandler) {
        document.removeEventListener('keydown', activeLightboxEscapeHandler, true);
        activeLightboxEscapeHandler = null;
    }
}
window.openReceiptLightbox = openReceiptLightbox;
window.closeReceiptLightbox = closeReceiptLightbox;

function openExpenseReceiptLightbox(expenseId, fileIndex = 0) {
    const exp = (state.currentGroupExpenses || []).find(e => e.id === Number(expenseId));
    if (!exp) return;
    const urls = exp.receipt_urls && exp.receipt_urls.length > 0 
        ? exp.receipt_urls 
        : (exp.receipt_url ? [exp.receipt_url] : []);
    if (urls.length === 0) return;
    openReceiptLightbox(urls, fileIndex, exp.description || 'Attached Receipt');
}
window.openExpenseReceiptLightbox = openExpenseReceiptLightbox;

function openReceiptModal(url, title = 'Attached Receipt') {
    openReceiptLightbox(url, 0, title);
}
window.openReceiptModal = openReceiptModal;

async function exportGroupCSV(groupId) {
    if (!groupId) {
        if (state.currentGroup) groupId = state.currentGroup.id;
        else return;
    }
    try {
        showToast('Preparing CSV export...', 'info');
        const res = await fetch(`/api/groups/${groupId}/export`, {
            credentials: 'same-origin'
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to export CSV');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        let filename = `hostribe_group_${groupId}_expenses.csv`;
        const disposition = res.headers.get('Content-Disposition');
        if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename="?([^"]+)"?/.exec(disposition);
            if (matches && matches[1]) filename = matches[1];
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 1000);
        showToast('CSV downloaded successfully!', 'success');
    } catch (err) {
        showToast(err.message || 'CSV export failed', 'error');
    }
}
window.exportGroupCSV = exportGroupCSV;

function handleDeleteExpense(expenseId) {
    showConfirmModal({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense? This action will permanently remove it and recalculate all group balances.',
        confirmText: 'Delete Expense',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            try {
                await api.delete(`/expenses/${expenseId}`);
                showToast('Expense deleted');
                if (typeof renderGroupView === 'function') {
                    await renderGroupView(state.currentGroup.id);
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    });
}

function toggleExpenseDetails(expenseId) {
    const box = document.getElementById(`split-box-${expenseId}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }
}

window.showAddExpenseModal = showAddExpenseModal;
window.showEditExpenseModal = showEditExpenseModal;
window.renderExpenseModal = renderExpenseModal;
window.setSplitMode = setSplitMode;
window.handleExactInputChange = handleExactInputChange;
window.distributeEvenlyToExact = distributeEvenlyToExact;
window.updateExpenseSplitsPreview = updateExpenseSplitsPreview;
window.handleExpenseFormSubmit = handleExpenseFormSubmit;
window.handleDeleteExpense = handleDeleteExpense;
window.toggleExpenseDetails = toggleExpenseDetails;

function showSettlementModal(payerId, payeeId, amount) {
    const members = state.currentMembers;
    const currency = state.currentGroup.currency;

    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">Record Payment / Settlement</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <form onsubmit="handleSettlementSubmit(event)">
            <div class="form-group">
                <label class="form-label">Payer (Who Paid)</label>
                <select id="settle-payer" class="form-control">
                    ${members.map(m => `
                        <option value="${m.id}" ${m.id === payerId ? 'selected' : ''}>
                            ${escapeHtml(m.username)} ${m.id === state.user.id ? '(You)' : ''}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Payee (Who Received)</label>
                <select id="settle-payee" class="form-control">
                    ${members.map(m => `
                        <option value="${m.id}" ${m.id === payeeId ? 'selected' : ''}>
                            ${escapeHtml(m.username)} ${m.id === state.user.id ? '(You)' : ''}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Amount</label>
                <input type="number" step="0.01" min="0.01" id="settle-amount" class="form-control" value="${amount ? amount.toFixed(2) : ''}" required>
            </div>

            <div class="form-group">
                <label class="form-label">Notes (Optional)</label>
                <input type="text" id="settle-notes" class="form-control" placeholder="e.g. Bank transfer, Cash, Raast">
            </div>

            <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Record Settlement</button>
            </div>
        </form>
    `);
}

function showCustomSettlementModal() {
    showSettlementModal(state.user.id, state.currentMembers[0]?.id || state.user.id, 0);
}

async function handleSettlementSubmit(e) {
    e.preventDefault();
    const group_id = state.currentGroup.id;
    const payer_id = parseInt(document.getElementById('settle-payer').value, 10);
    const payee_id = parseInt(document.getElementById('settle-payee').value, 10);
    const amount = parseFloat(document.getElementById('settle-amount').value);
    const notes = document.getElementById('settle-notes').value.trim();

    if (payer_id === payee_id) {
        showToast('Payer and Payee cannot be the same person', 'error');
        return;
    }

    try {
        await api.post('/settlements', { group_id, payer_id, payee_id, amount, notes });
        closeModal();
        showToast('Settlement recorded successfully!');
        if (typeof renderGroupView === 'function') {
            await renderGroupView(group_id);
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.showSettlementModal = showSettlementModal;
window.showCustomSettlementModal = showCustomSettlementModal;
window.handleSettlementSubmit = handleSettlementSubmit;

function showInviteMemberModal() {
    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">Invite Member to Group</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <form onsubmit="handleInviteMemberSubmit(event)">
            <div class="form-group">
                <label class="form-label">Member's Email Address</label>
                <input type="email" id="invite-email" class="form-control" placeholder="friend@example.com" required>
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Send Invitation</button>
            </div>
        </form>
    `);
}

async function handleInviteMemberSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('invite-email').value.trim();
    const group_id = state.currentGroup.id;

    try {
        const res = await api.post(`/groups/${group_id}/invite`, { email });
        closeModal();
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function showInvitesModal() {
    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">Pending Invitations (${state.pendingInvites.length})</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <div>
            ${state.pendingInvites.length === 0 ? `
                <p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No pending invitations.</p>
            ` : `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${state.pendingInvites.map(inv => `
                        <div class="invite-modal-row">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.45rem;">
                                    <span style="font-weight: 700; color: var(--text-primary);">${escapeHtml(inv.group_name)}</span>
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">
                                    Invited by ${escapeHtml(inv.inviter_name)} | ${new Date(inv.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div class="invite-modal-actions">
                                <button class="btn btn-primary btn-sm" onclick="respondToInvite(${inv.id}, 'accept')">
                                    Accept
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="respondToInvite(${inv.id}, 'ignore')">
                                    Ignore
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `);
}

async function respondToInvite(inviteId, action) {
    try {
        const res = await api.post(`/invites/${inviteId}/respond`, { action });
        closeModal();
        showToast(res.message);
        await loadPendingInvites();
        if (action === 'accept' && res.group_id) {
            window.location.hash = `#group/${res.group_id}`;
        } else {
            if (typeof renderDashboardView === 'function') {
                await renderDashboardView();
            }
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadPendingInvites() {
    if (!state.user) return;
    try {
        const res = await api.get('/invites/pending');
        state.pendingInvites = res.invitations || [];
        if (typeof updateNavUser === 'function') {
            updateNavUser();
        }
    } catch (e) {
        state.pendingInvites = [];
    }
}

async function handleEmailInviteAction(hashString) {
    const params = new URLSearchParams(hashString.replace('#', ''));
    const action = params.get('invite_action');
    const token = params.get('token');

    if (!token || !action) {
        showToast('Invalid invitation link', 'error');
        window.location.hash = '#dashboard';
        return;
    }

    if (!state.user) {
        showToast('Please log in to respond to this invitation', 'error');
        window.location.hash = '#login';
        return;
    }

    try {
        const res = await api.post('/invites/token-respond', { token, action });
        showToast(res.message, 'success');
        if (action === 'accept' && res.group_id) {
            window.location.hash = `#group/${res.group_id}`;
        } else {
            window.location.hash = '#dashboard';
        }
        await loadPendingInvites();
    } catch (err) {
        showToast(err.message, 'error');
        window.location.hash = '#dashboard';
    }
}

window.showInviteMemberModal = showInviteMemberModal;
window.handleInviteMemberSubmit = handleInviteMemberSubmit;
window.showInvitesModal = showInvitesModal;
window.respondToInvite = respondToInvite;
window.loadPendingInvites = loadPendingInvites;
window.handleEmailInviteAction = handleEmailInviteAction;

function showProfileModal() {
    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">Profile Settings</h3>
            <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">x</button>
        </div>
        <form onsubmit="handleProfileUpdateSubmit(event)">
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="profile-email" class="form-control" value="${escapeHtml(state.user?.email || '')}" required autocomplete="email">
            </div>

            <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" id="profile-current-password" class="form-control" autocomplete="current-password">
            </div>

            <div class="form-group">
                <label class="form-label">Change Password</label>
                <div class="password-input-wrapper">
                    <input type="password" id="profile-password" class="form-control" value="" placeholder="Enter new password (optional)" minlength="6" autocomplete="new-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
                <span style="display: block; font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.35rem;">Leave empty to keep your current password.</span>
            </div>

            <div class="form-group" id="profile-confirm-group" style="display: none;">
                <label class="form-label">Confirm New Password</label>
                <div class="password-input-wrapper">
                    <input type="password" id="profile-confirm-password" class="form-control" value="" placeholder="Confirm your new password" minlength="6" autocomplete="new-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
            </div>

            <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Profile</button>
            </div>
        </form>
    `);

    const pwdInput = document.getElementById('profile-password');
    const confirmGroup = document.getElementById('profile-confirm-group');
    if (pwdInput && confirmGroup) {
        pwdInput.addEventListener('input', () => {
            confirmGroup.style.display = pwdInput.value.trim().length > 0 ? 'block' : 'none';
        });
    }
}

async function handleProfileUpdateSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('profile-email').value.trim();
    const password = document.getElementById('profile-password').value;
    const currentPassword = document.getElementById('profile-current-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password')?.value || '';

    const payload = { email };
    if (password) {
        if (password.length < 6) {
            showToast('New password must be at least 6 characters long', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('New password and confirmation do not match', 'error');
            return;
        }
        if (!currentPassword) {
            showToast('Enter your current password', 'error');
            return;
        }
        payload.password = password;
        payload.current_password = currentPassword;
    }

    try {
        const res = await api.post('/auth/update-profile', payload);
        state.user = res.user;
        if (typeof updateNavUser === 'function') {
            updateNavUser();
        }
        closeModal();
        showToast(res.message);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.showProfileModal = showProfileModal;
window.handleProfileUpdateSubmit = handleProfileUpdateSubmit;
