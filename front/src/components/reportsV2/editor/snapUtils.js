export const SNAP_THRESHOLD = 6;
export const ENABLE_CENTER_SNAP = true;

function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeGrid(grid) {
  const cols = Math.max(1, Math.round(toFiniteNumber(grid?.cols, 12)));
  const rowHeight = Math.max(1, toFiniteNumber(grid?.rowHeight, 28));
  const marginX = Math.max(0, toFiniteNumber(grid?.margin?.[0], 16));
  const marginY = Math.max(0, toFiniteNumber(grid?.margin?.[1], 16));
  const containerWidth = Math.max(1, toFiniteNumber(grid?.containerWidth, 1));
  const colWidth = Math.max(
    1,
    (containerWidth - marginX * Math.max(0, cols - 1)) / cols
  );
  return {
    cols,
    rowHeight,
    marginX,
    marginY,
    containerWidth,
    colWidth,
    totalWidth: cols * colWidth + Math.max(0, cols - 1) * marginX,
  };
}

function normalizeRect(rect, gridConfig) {
  const cols = gridConfig.cols;
  const w = Math.max(1, Math.round(toFiniteNumber(rect?.w, 1)));
  const h = Math.max(1, Math.round(toFiniteNumber(rect?.h, 1)));
  const maxX = Math.max(0, cols - w);
  return {
    x: clamp(Math.round(toFiniteNumber(rect?.x, 0)), 0, maxX),
    y: Math.max(0, Math.round(toFiniteNumber(rect?.y, 0))),
    w,
    h,
    minW: Math.max(1, Math.round(toFiniteNumber(rect?.minW, 1))),
    minH: Math.max(1, Math.round(toFiniteNumber(rect?.minH, 1))),
  };
}

function gridToPxX(x, gridConfig) {
  return x * (gridConfig.colWidth + gridConfig.marginX);
}

function gridToPxY(y, gridConfig) {
  return y * (gridConfig.rowHeight + gridConfig.marginY);
}

function spanToPxX(span, gridConfig) {
  return span * gridConfig.colWidth + Math.max(0, span - 1) * gridConfig.marginX;
}

function spanToPxY(span, gridConfig) {
  return span * gridConfig.rowHeight + Math.max(0, span - 1) * gridConfig.marginY;
}

function rectToPx(rect, gridConfig) {
  const left = gridToPxX(rect.x, gridConfig);
  const top = gridToPxY(rect.y, gridConfig);
  const width = spanToPxX(rect.w, gridConfig);
  const height = spanToPxY(rect.h, gridConfig);
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

function pxToGridX(leftPx, rectW, gridConfig) {
  const step = gridConfig.colWidth + gridConfig.marginX;
  const maxX = Math.max(0, gridConfig.cols - rectW);
  return clamp(Math.round(leftPx / step), 0, maxX);
}

function pxToGridY(topPx, gridConfig) {
  const step = gridConfig.rowHeight + gridConfig.marginY;
  return Math.max(0, Math.round(topPx / step));
}

function pxToSpanX(widthPx, minW, x, gridConfig) {
  const step = gridConfig.colWidth + gridConfig.marginX;
  const raw = Math.round((widthPx + gridConfig.marginX) / step);
  const maxW = Math.max(1, gridConfig.cols - x);
  return clamp(raw, Math.max(1, minW), maxW);
}

function pxToSpanY(heightPx, minH, gridConfig) {
  const step = gridConfig.rowHeight + gridConfig.marginY;
  const raw = Math.round((heightPx + gridConfig.marginY) / step);
  return Math.max(Math.max(1, minH), raw);
}

function findBestSnap(target, candidates, thresholdPx) {
  let best = null;
  for (const candidate of candidates) {
    const distance = Math.abs(target - candidate.value);
    if (distance > thresholdPx) continue;
    if (!best || distance < best.distance) {
      best = {
        value: candidate.value,
        distance,
      };
    }
  }
  return best;
}

function buildCandidates(staticRectsPx, axis, includeCenter, gridConfig) {
  const values = [];
  if (axis === "x") {
    values.push({ value: 0 }, { value: gridConfig.totalWidth });
    staticRectsPx.forEach((rect) => {
      values.push({ value: rect.left }, { value: rect.right });
      if (includeCenter) values.push({ value: rect.centerX });
    });
    return values;
  }
  values.push({ value: 0 });
  staticRectsPx.forEach((rect) => {
    values.push({ value: rect.top }, { value: rect.bottom });
    if (includeCenter) values.push({ value: rect.centerY });
  });
  return values;
}

export function computeSnapPosition(
  movingRect,
  staticRects,
  grid,
  threshold = SNAP_THRESHOLD
) {
  const gridConfig = normalizeGrid(grid);
  const rect = normalizeRect(movingRect, gridConfig);
  const operation = movingRect?.operation === "resize" ? "resize" : "drag";
  const movingPx = rectToPx(rect, gridConfig);
  const staticRectsPx = (Array.isArray(staticRects) ? staticRects : [])
    .map((item) => normalizeRect(item, gridConfig))
    .map((item) => rectToPx(item, gridConfig));
  const thresholdPx = Math.max(0, toFiniteNumber(threshold, SNAP_THRESHOLD));
  const includeCenter = ENABLE_CENTER_SNAP;

  const verticalCandidates = buildCandidates(
    staticRectsPx,
    "x",
    includeCenter,
    gridConfig
  );
  const horizontalCandidates = buildCandidates(
    staticRectsPx,
    "y",
    includeCenter,
    gridConfig
  );

  let snappedX = rect.x;
  let snappedY = rect.y;
  let snappedW = rect.w;
  let snappedH = rect.h;
  let guideX;
  let guideY;

  if (operation === "resize") {
    const rightSnap = findBestSnap(movingPx.right, verticalCandidates, thresholdPx);
    if (rightSnap) {
      const targetWidthPx = Math.max(gridConfig.colWidth, rightSnap.value - movingPx.left);
      snappedW = pxToSpanX(targetWidthPx, rect.minW, rect.x, gridConfig);
      guideX = rightSnap.value;
    }

    const bottomSnap = findBestSnap(movingPx.bottom, horizontalCandidates, thresholdPx);
    if (bottomSnap) {
      const targetHeightPx = Math.max(
        gridConfig.rowHeight,
        bottomSnap.value - movingPx.top
      );
      snappedH = pxToSpanY(targetHeightPx, rect.minH, gridConfig);
      guideY = bottomSnap.value;
    }
  } else {
    const verticalOptions = [
      {
        target: movingPx.left,
        resolveLeft: (value) => value,
      },
      {
        target: movingPx.right,
        resolveLeft: (value) => value - movingPx.width,
      },
    ];
    if (includeCenter) {
      verticalOptions.push({
        target: movingPx.centerX,
        resolveLeft: (value) => value - movingPx.width / 2,
      });
    }

    let bestVertical = null;
    verticalOptions.forEach((option) => {
      const candidate = findBestSnap(option.target, verticalCandidates, thresholdPx);
      if (!candidate) return;
      if (!bestVertical || candidate.distance < bestVertical.distance) {
        bestVertical = {
          distance: candidate.distance,
          guide: candidate.value,
          leftPx: option.resolveLeft(candidate.value),
        };
      }
    });

    if (bestVertical) {
      snappedX = pxToGridX(bestVertical.leftPx, rect.w, gridConfig);
      guideX = bestVertical.guide;
    }

    const horizontalOptions = [
      {
        target: movingPx.top,
        resolveTop: (value) => value,
      },
      {
        target: movingPx.bottom,
        resolveTop: (value) => value - movingPx.height,
      },
    ];
    if (includeCenter) {
      horizontalOptions.push({
        target: movingPx.centerY,
        resolveTop: (value) => value - movingPx.height / 2,
      });
    }

    let bestHorizontal = null;
    horizontalOptions.forEach((option) => {
      const candidate = findBestSnap(option.target, horizontalCandidates, thresholdPx);
      if (!candidate) return;
      if (!bestHorizontal || candidate.distance < bestHorizontal.distance) {
        bestHorizontal = {
          distance: candidate.distance,
          guide: candidate.value,
          topPx: option.resolveTop(candidate.value),
        };
      }
    });

    if (bestHorizontal) {
      snappedY = pxToGridY(bestHorizontal.topPx, gridConfig);
      guideY = bestHorizontal.guide;
    }
  }

  return {
    snappedX,
    snappedY,
    snappedW,
    snappedH,
    guides: {
      ...(Number.isFinite(guideX) ? { vertical: guideX } : {}),
      ...(Number.isFinite(guideY) ? { horizontal: guideY } : {}),
    },
  };
}
