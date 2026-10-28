import Konva from 'konva';
import { jsPDF } from 'jspdf';
import plantumlEncoder from 'plantuml-encoder';
import { createShape } from './shapes/shapeFactory.js';

// راه‌اندازی استیج Canvas
const container = document.getElementById('canvas-container');
const stage = new Konva.Stage({
  container: 'canvas-container',
  width: container.offsetWidth,
  height: container.offsetHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

// ترنسفورمر برای تغییر سایز و انتخاب المان‌ها
const tr = new Konva.Transformer();
layer.add(tr);

// قابلیت انتخاب شکل با کلیک
stage.on('click tap', (e) => {
  if (e.target === stage) {
    tr.nodes([]);
    layer.draw();
    return;
  }
  const group = e.target.findAncestor('Group') || e.target;
  tr.nodes([group]);
  layer.draw();
});

// درگ و دراپ شکل‌ها از سایدبار روی بوم
let draggedShapeType = null;

document.querySelectorAll('.shape-item').forEach((item) => {
  item.addEventListener('dragstart', (e) => {
    draggedShapeType = e.target.getAttribute('data-shape') || e.target.closest('.shape-item').getAttribute('data-shape');
  });
});

container.addEventListener('dragover', (e) => e.preventDefault());

container.addEventListener('drop', (e) => {
  e.preventDefault();
  stage.setPointersPositions(e);
  const pos = stage.getPointerPosition();

  if (draggedShapeType) {
    const shape = createShape(draggedShapeType, pos.x, pos.y);
    layer.add(shape);
    tr.nodes([shape]);
    layer.draw();
  }
});

// ۱. خروجی باکیفیت بالا PNG (تنظیم روی PixelRatio = 3 برای کیفیت شفاف)
document.getElementById('btn-export-png').addEventListener('click', () => {
  tr.nodes([]); // حذف کادر انتخاب قبل از خروجی
  layer.draw();
  const dataURL = stage.toDataURL({ pixelRatio: 3 });
  const link = document.createElement('a');
  link.download = 'silentplan-diagram.png';
  link.href = dataURL;
  link.click();
});

// ۲. خروجی PDF
document.getElementById('btn-export-pdf').addEventListener('click', () => {
  tr.nodes([]);
  layer.draw();
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const pdf = new jsPDF('landscape', 'px', [stage.width(), stage.height()]);
  pdf.addImage(dataURL, 'PNG', 0, 0, stage.width(), stage.height());
  pdf.save('silentplan-diagram.pdf');
});

// ۳. تبدیل به کد PlantUML و قابلیت باز شدن در ادیتور آنلاین PlantUML
document.getElementById('btn-export-plantuml').addEventListener('click', () => {
  const nodes = layer.find('.diagram-node');
  let plantCode = '@startuml\n';

  nodes.forEach((node, idx) => {
    const type = node.attrs.shapeType;
    const name = `node_${idx}`;
    if (type === 'actor') plantCode += `actor "${type}" as ${name}\n`;
    else if (type === 'cloud') plantCode += `cloud "${type}" as ${name}\n`;
    else if (type === 'database') plantCode += `database "${type}" as ${name}\n`;
    else plantCode += `rectangle "${type}" as ${name}\n`;
  });

  plantCode += '@enduml';

  // ساخت هش فشرده PlantUML
  const encodedUrl = plantumlEncoder.encode(plantCode);
  const targetUrl = `https://editor.plantuml.com/uml/${encodedUrl}`;

  const confirmOpen = confirm("کد پلنت تولید شد!\nآیا می‌خواهید مستقیماً در ادیتور PlantUML باز شود؟\n\nکد:\n" + plantCode);
  if (confirmOpen) {
    window.open(targetUrl, '_blank');
  }
});

window.addEventListener('resize', () => {
  stage.width(container.offsetWidth);
  stage.height(container.offsetHeight);
  layer.draw();
});
