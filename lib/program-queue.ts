import type { ProgramSlug } from '@/types/content';

export const DEFAULT_QUEUE_ITEM_HEIGHT = 176;

export interface QueueItemLayout {
  height: number;
  y: number;
}

export function getQueueDropIndexFromDragDelta({
  fromIndex,
  dragDeltaY,
  itemLayouts,
  orderedSlugs,
}: {
  fromIndex: number;
  dragDeltaY: number;
  itemLayouts: Record<string, QueueItemLayout>;
  orderedSlugs: ProgramSlug[];
}) {
  if (fromIndex < 0 || fromIndex >= orderedSlugs.length) {
    return -1;
  }

  const activeSlug = orderedSlugs[fromIndex];
  const activeLayout = getQueueItemLayout(activeSlug, fromIndex, itemLayouts);
  const projectedItemCenterY = activeLayout.y + activeLayout.height / 2 + dragDeltaY;

  return getQueueDropIndexFromProjectedCenter({
    fromIndex,
    itemLayouts,
    orderedSlugs,
    projectedItemCenterY,
  });
}

export function getQueueTouchOffset({
  absoluteY,
  containerPageY,
  itemLayout,
}: {
  absoluteY: number;
  containerPageY: number;
  itemLayout: QueueItemLayout;
}) {
  return absoluteY - containerPageY - itemLayout.y;
}

export function getQueueDropIndexFromAbsoluteY({
  absoluteY,
  containerPageY,
  fromIndex,
  itemLayouts,
  orderedSlugs,
  touchOffsetWithinItem,
}: {
  absoluteY: number;
  containerPageY: number;
  fromIndex: number;
  itemLayouts: Record<string, QueueItemLayout>;
  orderedSlugs: ProgramSlug[];
  touchOffsetWithinItem?: number | null;
}) {
  if (fromIndex < 0 || fromIndex >= orderedSlugs.length) {
    return -1;
  }

  const activeSlug = orderedSlugs[fromIndex];
  const activeHeight = itemLayouts[activeSlug]?.height ?? DEFAULT_QUEUE_ITEM_HEIGHT;
  const offsetWithinItem =
    typeof touchOffsetWithinItem === 'number' && Number.isFinite(touchOffsetWithinItem)
      ? touchOffsetWithinItem
      : activeHeight / 2;
  const projectedItemCenterY = absoluteY - containerPageY - offsetWithinItem + activeHeight / 2;

  return getQueueDropIndexFromProjectedCenter({
    fromIndex,
    itemLayouts,
    orderedSlugs,
    projectedItemCenterY,
  });
}

export function reorderProgramQueue(
  orderedSlugs: ProgramSlug[],
  fromIndex: number,
  targetIndex: number
) {
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex >= orderedSlugs.length ||
    targetIndex >= orderedSlugs.length ||
    fromIndex === targetIndex
  ) {
    return orderedSlugs;
  }

  const nextQueue = [...orderedSlugs];
  const [movedProgram] = nextQueue.splice(fromIndex, 1);
  nextQueue.splice(targetIndex, 0, movedProgram);
  return nextQueue;
}

function getQueueDropIndexFromProjectedCenter({
  fromIndex,
  itemLayouts,
  orderedSlugs,
  projectedItemCenterY,
}: {
  fromIndex: number;
  itemLayouts: Record<string, QueueItemLayout>;
  orderedSlugs: ProgramSlug[];
  projectedItemCenterY: number;
}) {
  if (!Number.isFinite(projectedItemCenterY)) {
    return fromIndex;
  }

  let targetIndex = 0;

  orderedSlugs.forEach((slug, index) => {
    if (index === fromIndex) {
      return;
    }

    const layout = getQueueItemLayout(slug, index, itemLayouts);
    const centerY = layout.y + layout.height / 2;

    if (projectedItemCenterY > centerY) {
      targetIndex += 1;
    }
  });

  return Math.min(Math.max(targetIndex, 0), Math.max(orderedSlugs.length - 1, 0));
}

function getQueueItemLayout(
  slug: ProgramSlug,
  index: number,
  itemLayouts: Record<string, QueueItemLayout>
) {
  const measuredLayout = itemLayouts[slug];

  if (measuredLayout) {
    return measuredLayout;
  }

  return {
    y: index * DEFAULT_QUEUE_ITEM_HEIGHT,
    height: DEFAULT_QUEUE_ITEM_HEIGHT,
  };
}
