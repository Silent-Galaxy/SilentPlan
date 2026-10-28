import Konva from 'konva';

export function createShape(type, x, y) {
  const group = new Konva.Group({
    x: x,
    y: y,
    draggable: true,
    name: 'diagram-node',
    shapeType: type
  });

  let visualElement;

  if (type === 'rect') {
    visualElement = new Konva.Rect({
      width: 120,
      height: 60,
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 2,
      cornerRadius: 6,
      shadowBlur: 5,
      shadowOpacity: 0.2
    });
  } else if (type === 'cloud') {
    visualElement = new Konva.Path({
      data: 'M 25,60 a 20,20 1 0,0 0,40 h 50 a 20,20 1 0,0 0,-40 a 10,10 1 0,0 -15,-15 a 15,15 1 0,0 -35,15 z',
      fill: '#06b6d4',
      stroke: '#0891b2',
      strokeWidth: 2,
      scale: { x: 1.2, y: 1.2 }
    });
  } else if (type === 'actor') {
    visualElement = new Konva.Path({
      data: 'M20,10 A8,8 0 1,1 20,26 A8,8 0 1,1 20,10 M20,26 L20,50 M10,35 L30,35 M20,50 L10,75 M20,50 L30,75',
      stroke: '#f59e0b',
      strokeWidth: 3,
      lineCap: 'round',
      lineJoin: 'round'
    });
  } else if (type === 'database') {
    visualElement = new Konva.Path({
      data: 'M 10 20 C 10 10, 70 10, 70 20 L 70 60 C 70 70, 10 70, 10 60 Z M 10 35 C 10 45, 70 45, 70 35 M 10 50 C 10 60, 70 60, 70 50',
      fill: '#8b5cf6',
      stroke: '#6d28d9',
      strokeWidth: 2
    });
  }

  const text = new Konva.Text({
    text: type.toUpperCase(),
    fontSize: 13,
    fontFamily: 'sans-serif',
    fill: '#ffffff',
    y: 70,
    width: 120,
    align: 'center'
  });

  group.add(visualElement);
  group.add(text);

  return group;
}
