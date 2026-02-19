/**
 * Módulo de gráfica simple usando Canvas API nativo.
 * Renderiza una gráfica de líneas para la evolución de tensión arterial.
 */

/**
 * Renderiza una gráfica de líneas en un canvas.
 * @param {HTMLCanvasElement} canvas - El elemento canvas donde renderizar
 * @param {Array} measurements - Array de mediciones ordenadas por fecha
 */
export function renderChart(canvas, measurements) {
  if (!canvas || measurements.length < 2) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth * 2; // Retina display
  const height = canvas.height = 600; // Fixed height for better aspect ratio
  
  // Escalado para pantallas retina
  ctx.scale(2, 2);
  const displayWidth = width / 2;
  const displayHeight = height / 2;

  // Limpiar canvas
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  // Márgenes
  const margin = { top: 30, right: 30, bottom: 50, left: 50 };
  const chartWidth = displayWidth - margin.left - margin.right;
  const chartHeight = displayHeight - margin.top - margin.bottom;

  // Ordenar mediciones por fecha ascendente (más antigua primero)
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt) - new Date(b.measuredAt)
  );

  // Extraer datos
  const systolicValues = sorted.map(m => m.systolic);
  const diastolicValues = sorted.map(m => m.diastolic);
  const dates = sorted.map(m => {
    const d = new Date(m.measuredAt);
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  });

  // Calcular rangos
  const allValues = [...systolicValues, ...diastolicValues];
  const minValue = Math.floor(Math.min(...allValues) / 10) * 10 - 10;
  const maxValue = Math.ceil(Math.max(...allValues) / 10) * 10 + 10;
  const valueRange = maxValue - minValue;

  // Funciones de escala
  const scaleX = (index) => margin.left + (chartWidth / (sorted.length - 1)) * index;
  const scaleY = (value) => margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Fondo del gráfico
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // Grid horizontal
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const value = minValue + (valueRange / gridSteps) * i;
    const y = scaleY(value);
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + chartWidth, y);
    ctx.stroke();

    // Etiquetas del eje Y
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(value), margin.left - 8, y + 4);
  }

  // Función para dibujar una línea
  const drawLine = (values, color, fillColor) => {
    // Línea
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    values.forEach((value, i) => {
      const x = scaleX(i);
      const y = scaleY(value);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Área debajo de la línea
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(values[0]));
      values.forEach((value, i) => {
        ctx.lineTo(scaleX(i), scaleY(value));
      });
      ctx.lineTo(scaleX(values.length - 1), margin.top + chartHeight);
      ctx.lineTo(scaleX(0), margin.top + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Puntos
    ctx.fillStyle = color;
    values.forEach((value, i) => {
      const x = scaleX(i);
      const y = scaleY(value);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Dibujar líneas (diastólica primero para que sistólica quede encima)
  drawLine(diastolicValues, '#3b82f6', 'rgba(59, 130, 246, 0.1)');
  drawLine(systolicValues, '#ef4444', 'rgba(239, 68, 68, 0.1)');

  // Etiquetas del eje X
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  
  // Mostrar solo algunas etiquetas si hay muchos puntos
  const maxLabels = 10;
  const step = Math.ceil(dates.length / maxLabels);
  dates.forEach((date, i) => {
    if (i % step === 0 || i === dates.length - 1) {
      const x = scaleX(i);
      const y = margin.top + chartHeight + 20;
      ctx.fillText(date, x, y);
    }
  });

  // Leyenda
  const legendY = 15;
  const legendX = displayWidth - margin.right - 150;
  
  // Sistólica
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(legendX, legendY - 4, 12, 12);
  ctx.fillStyle = '#1f2937';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Sistólica', legendX + 18, legendY + 6);

  // Diastólica
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(legendX + 80, legendY - 4, 12, 12);
  ctx.fillStyle = '#1f2937';
  ctx.fillText('Diastólica', legendX + 98, legendY + 6);

  // Etiqueta del eje Y
  ctx.save();
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(15, displayHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('mmHg', 0, 0);
  ctx.restore();
}
