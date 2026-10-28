/**
 * DiagramCraft Studio Pro - Core Architecture Engine
 */

// مدیریت وضعیت کلی (State Management)
const state = {
    nodes: [],
    connections: [],
    isConnectMode: false,
    selectedNodeId: null,
    connectSourceNodeId: null,
    globalAnimationActive: true
};

const canvas = document.getElementById('canvas');
const svgLayer = document.getElementById('svg-connections');
const pumlCodeOutput = document.getElementById('puml-code');
const btnConnectMode = document.getElementById('btn-connect-mode');

// بازرس (Inspector)
const inspectorForm = document.getElementById('inspector-form');
const inspectorEmpty = document.getElementById('inspector-empty');
const insName = document.getElementById('ins-name');
const insShape = document.getElementById('ins-shape');
const insAnim = document.getElementById('ins-anim');
const insBody = document.getElementById('ins-body');
const insCustomCss = document.getElementById('ins-custom-css');

// =========================================================
// ۱. ایجاد و ساختاربندی نودها
// =========================================================

document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
        const shape = card.getAttribute('data-shape');
        const type = card.getAttribute('data-type');
        createNode({
            shape: shape,
            type: type,
            name: `${shape}_${state.nodes.length + 1}`,
            details: shape === 'class' ? '+ id: int\n+ execute(): void' : 'توضیحات یا نیازمندی',
            animation: 'anim-none',
            color: '#0284c7',
            customCss: '',
            x: 100 + Math.random() * 200,
            y: 80 + Math.random() * 200
        });
    });
});

function createNode(options) {
    const node = {
        id: 'node_' + Date.now(),
        shape: options.shape || 'class',
        type: options.type || 'class',
        name: options.name || 'Component',
        details: options.details || '',
        animation: options.animation || 'anim-none',
        color: options.color || '#0284c7',
        customCss: options.customCss || '',
        x: options.x || 120,
        y: options.y || 120
    };

    state.nodes.push(node);
    renderNodeDOM(node);
    generatePlantUML();
    selectNode(node.id);
}

// ساخت المان در بوم DOM
function renderNodeDOM(node) {
    const el = document.createElement('div');
    el.className = `uml-node shape-${node.shape} ${node.animation}`;
    el.id = node.id;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.setProperty('--node-color', node.color);
    
    if (node.customCss) {
        el.style.cssText += ';' + node.customCss;
    }

    // طراحی ساختار درونی بر اساس شکل
    let innerHTML = '';
    if (node.shape === 'class') {
        innerHTML = `
            <div class="node-header">&lt;&lt;${node.type}&gt;&gt; ${node.name}</div>
            <div class="node-body">${node.details}</div>
        `;
    } else if (node.shape === 'actor') {
        innerHTML = `
            <div style="font-size:24px;">👤</div>
            <div class="node-header">${node.name}</div>
        `;
    } else {
        innerHTML = `
            <div class="node-header">${node.name}</div>
            <div class="node-body">${node.details}</div>
        `;
    }

    el.innerHTML = innerHTML;

    // رویدادهای انتخاب و جابجایی نود
    setupNodeEvents(el, node);

    canvas.appendChild(el);
    renderConnections();
}

// =========================================================
// ۲. مدیریت جابجایی (Drag) و کلیک نودها
// =========================================================

function setupNodeEvents(el, node) {
    let isDragging = false;
    let startX, startY;

    el.addEventListener('mousedown', (e) => {
        if (state.isConnectMode) {
            handleConnectModeClick(node);
            return;
        }

        selectNode(node.id);
        isDragging = true;
        startX = e.clientX - el.offsetLeft;
        startY = e.clientY - el.offsetTop;
        el.style.zIndex = 1000;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        node.x = Math.max(10, e.clientX - startX);
        node.y = Math.max(10, e.clientY - startY);
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        renderConnections();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            el.style.zIndex = 'auto';
        }
    });
}

// =========================================================
// ۳. پنل بازرس نود و تزریق CSS زنده
// =========================================================

function selectNode(id) {
    state.selectedNodeId = id;
    document.querySelectorAll('.uml-node').forEach(n => n.classList.remove('selected-node'));
    
    const nodeEl = document.getElementById(id);
    const node = state.nodes.find(n => n.id === id);
    if (!node || !nodeEl) return;

    nodeEl.classList.add('selected-node');

    // سوئیچ به تب بازرس و بارگذاری مشخصات
    inspectorEmpty.style.display = 'none';
    inspectorForm.style.display = 'block';

    insName.value = node.name;
    insShape.value = node.shape;
    insAnim.value = node.animation;
    insBody.value = node.details;
    insCustomCss.value = node.customCss;
    document.getElementById('ins-node-title').textContent = `تنظیمات نود: ${node.name}`;
}

// گوش‌به‌زنگ‌های تغییرات بازرس (Realtime Bindings)
insName.addEventListener('input', (e) => {
    const node = getSelectedNode();
    if (!node) return;
    node.name = e.target.value.trim().replace(/\s+/g, '_');
    refreshNodeView(node);
    generatePlantUML();
});

insShape.addEventListener('change', (e) => {
    const node = getSelectedNode();
    if (!node) return;
    node.shape = e.target.value;
    refreshNodeView(node);
    generatePlantUML();
});

insAnim.addEventListener('change', (e) => {
    const node = getSelectedNode();
    if (!node) return;
    node.animation = e.target.value;
    refreshNodeView(node);
});

insBody.addEventListener('input', (e) => {
    const node = getSelectedNode();
    if (!node) return;
    node.details = e.target.value;
    refreshNodeView(node);
    generatePlantUML();
});

// تزریق CSS سفارشی لحظه‌ای
insCustomCss.addEventListener('input', (e) => {
    const node = getSelectedNode();
    if (!node) return;
    node.customCss = e.target.value;
    const el = document.getElementById(node.id);
    el.style.cssText = `left:${node.x}px; top:${node.y}px; --node-color:${node.color}; ${node.customCss}`;
});

// تغییر رنگ نود
document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const node = getSelectedNode();
        if (!node) return;
        node.color = dot.getAttribute('data-color');
        refreshNodeView(node);
    });
});

document.getElementById('btn-delete-node').addEventListener('click', () => {
    const node = getSelectedNode();
    if (!node) return;
    state.nodes = state.nodes.filter(n => n.id !== node.id);
    state.connections = state.connections.filter(c => c.from !== node.id && c.to !== node.id);
    document.getElementById(node.id)?.remove();
    inspectorForm.style.display = 'none';
    inspectorEmpty.style.display = 'block';
    renderConnections();
    generatePlantUML();
});

function getSelectedNode() {
    return state.nodes.find(n => n.id === state.selectedNodeId);
}

function refreshNodeView(node) {
    const el = document.getElementById(node.id);
    if (!el) return;
    el.className = `uml-node shape-${node.shape} ${node.animation} selected-node`;
    el.style.setProperty('--node-color', node.color);
    
    if (node.shape === 'class') {
        el.innerHTML = `
            <div class="node-header">&lt;&lt;${node.type}&gt;&gt; ${node.name}</div>
            <div class="node-body">${node.details}</div>
        `;
    } else if (node.shape === 'actor') {
        el.innerHTML = `
            <div style="font-size:24px;">👤</div>
            <div class="node-header">${node.name}</div>
        `;
    } else {
        el.innerHTML = `
            <div class="node-header">${node.name}</div>
            <div class="node-body">${node.details}</div>
        `;
    }
    renderConnections();
}

// =========================================================
// ۴. موتور اتصالات هوشمند (Connection Engine)
// =========================================================

btnConnectMode.addEventListener('click', () => {
    state.isConnectMode = !state.isConnectMode;
    btnConnectMode.classList.toggle('active', state.isConnectMode);
    document.getElementById('canvas-status').innerHTML = state.isConnectMode 
        ? '<span style="color:#10b981;">⚡ حالت اتصال فعال است: روی نود مبدا و سپس مقصد کلیک کنید</span>' 
        : '<i data-lucide="mouse-pointer"></i> روی بوم کلیک کنید';
    state.connectSourceNodeId = null;
    if (window.lucide) lucide.createIcons();
});

function handleConnectModeClick(node) {
    if (!state.connectSourceNodeId) {
        state.connectSourceNodeId = node.id;
        document.getElementById(node.id).classList.add('selected-node');
    } else {
        if (state.connectSourceNodeId !== node.id) {
            const relType = document.getElementById('relation-type').value;
            const animType = document.getElementById('relation-anim-type').value;
            state.connections.push({
                from: state.connectSourceNodeId,
                to: node.id,
                type: relType,
                animClass: animType
            });
            generatePlantUML();
            renderConnections();
        }
        document.getElementById(state.connectSourceNodeId)?.classList.remove('selected-node');
        state.connectSourceNodeId = null;
    }
}

// محاسبه دقیق مرکز هندسی نودها برای رسم خطوط
function renderConnections() {
    svgLayer.innerHTML = '';
    state.connections.forEach(conn => {
        const fromNode = state.nodes.find(n => n.id === conn.from);
        const toNode = state.nodes.find(n => n.id === conn.to);
        const fromEl = document.getElementById(conn.from);
        const toEl = document.getElementById(conn.to);
        if (!fromNode || !toNode || !fromEl || !toEl) return;

        // محاسبه مرکز نود بر اساس ابعاد واقعی در DOM
        const x1 = fromNode.x + fromEl.offsetWidth / 2;
        const y1 = fromNode.y + fromEl.offsetHeight / 2;
        const x2 = toNode.x + toEl.offsetWidth / 2;
        const y2 = toNode.y + toEl.offsetHeight / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', `relation-line ${state.globalAnimationActive ? conn.animClass : ''}`);

        svgLayer.appendChild(line);
    });
}

// =========================================================
// ۵. تولید کد استاندارد و تصحیح جهت متن PlantUML (LTR Fix)
// =========================================================

function generatePlantUML() {
    let puml = '@startuml\n';
    puml += 'skinparam roundcorner 12\n';
    puml += 'skinparam monochrome false\n';
    puml += 'skinparam shadowing true\n\n';

    state.nodes.forEach(n => {
        if (n.shape === 'class') {
            puml += `class ${n.name} {\n`;
            if (n.details) {
                n.details.split('\n').forEach(line => {
                    if (line.trim()) puml += `  ${line.trim()}\n`;
                });
            }
            puml += `}\n`;
        } else if (n.shape === 'actor') {
            puml += `:User: as ${n.name}\n`;
        } else if (n.shape === 'usecase') {
            puml += `(${n.name})\n`;
        } else if (n.shape === 'cylinder') {
            puml += `database ${n.name}\n`;
        } else if (n.shape === 'cloud') {
            puml += `cloud ${n.name}\n`;
        }
    });

    puml += '\n';

    state.connections.forEach(c => {
        const f = state.nodes.find(n => n.id === c.from);
        const t = state.nodes.find(n => n.id === c.to);
        if (f && t) {
            puml += `${f.name} ${c.type} ${t.name}\n`;
        }
    });

    puml += '\n@enduml';
    pumlCodeOutput.value = puml;

    // ساخت پیوند ادیتور آنلاین
    const encoded = encodeURIComponent(puml);
    document.getElementById('btn-open-plantuml').href = `https://editor.plantuml.com/uml/${encoded}`;
}

// =========================================================
// ۶. مدیریت تب‌ها، پویانمایی سراسری و حافظه
// =========================================================

document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
});

document.getElementById('btn-toggle-all-anim').addEventListener('click', () => {
    state.globalAnimationActive = !state.globalAnimationActive;
    renderConnections();
});

document.getElementById('btn-copy-code').addEventListener('click', () => {
    navigator.clipboard.writeText(pumlCodeOutput.value);
    alert('کد استاندارد با فرمت چپ‌به‌راست (LTR) کپی شد!');
});

document.getElementById('btn-save').addEventListener('click', () => {
    localStorage.setItem('diagramcraft_v2', JSON.stringify(state));
    alert('پروژه شما با تمام تنظیمات بصری و CSS در حافظه محلی ذخیره شد.');
});

document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "diagramcraft_project_v2.json");
    dl.click();
});

document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            canvas.querySelectorAll('.uml-node').forEach(el => el.remove());
            state.nodes = data.nodes || [];
            state.connections = data.connections || [];
            state.nodes.forEach(n => renderNodeDOM(n));
            renderConnections();
            generatePlantUML();
        } catch (err) {
            alert('فایل JSON معتبر نیست.');
        }
    };
    reader.readAsText(file);
});

document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('کل دیاگرام پاکسازی شود؟')) {
        state.nodes = [];
        state.connections = [];
        canvas.querySelectorAll('.uml-node').forEach(el => el.remove());
        renderConnections();
        generatePlantUML();
        localStorage.removeItem('diagramcraft_v2');
    }
});

// بازخوانی ذخیره‌ها
window.addEventListener('load', () => {
    if (window.lucide) lucide.createIcons();
    const saved = localStorage.getItem('diagramcraft_v2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.nodes = data.nodes || [];
            state.connections = data.connections || [];
            state.nodes.forEach(n => renderNodeDOM(n));
            renderConnections();
            generatePlantUML();
        } catch (e) { console.error(e); }
    }
});