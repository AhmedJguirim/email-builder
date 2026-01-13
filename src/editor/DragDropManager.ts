import type { BlockType } from '../types/blocks';
import { createBlock, BLOCK_DEFINITIONS } from '../blocks/factory';
import { useEditorStore } from '../store';

export interface DragData {
  type: 'new-block' | 'existing-block';
  blockType?: BlockType;
  blockId?: string;
  sourceIndex?: number;
  sourceParentId?: string;
}

export interface DropTarget {
  blockId: string;
  index: number;
  position: 'before' | 'after' | 'inside';
  element: HTMLElement;
  parentId?: string; // Column ID for dropping inside columns
}

interface BlockRect {
  id: string;
  index: number;
  top: number;
  bottom: number;
  height: number;
  element: HTMLElement;
  parentId?: string; // Column ID if this block is inside a column
}

interface ColumnRect {
  id: string;
  parentBlockId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  element: HTMLElement;
  childRects: BlockRect[];
}

export class DragDropManager {
  private dragData: DragData | null = null;
  private ghostElement: HTMLElement | null = null;
  private currentTarget: DropTarget | null = null;
  private blockRects: BlockRect[] = [];
  private columnRects: ColumnRect[] = [];
  private canvas: HTMLElement | null = null;
  private rafId: number | null = null;
  private lastY: number = 0;
  private lastX: number = 0;

  constructor() {
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
  }

  setCanvas(canvas: HTMLElement): void {
    this.canvas = canvas;
  }

  startDrag(data: DragData, event: DragEvent): void {
    this.dragData = data;
    
    // Set drag image to transparent 1x1 pixel
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify(data));
      
      // Create invisible drag image
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      event.dataTransfer.setDragImage(img, 0, 0);
    }

    // Mark the dragged block
    if (data.blockId) {
      const draggedEl = document.querySelector(`[data-block-id="${data.blockId}"]`);
      if (draggedEl) {
        draggedEl.classList.add('is-dragging');
        // Store source index
        data.sourceIndex = parseInt(draggedEl.getAttribute('data-index') || '0', 10);
      }
    }

    // Cache block positions
    this.cacheBlockPositions();
    
    // Create ghost element
    this.createGhostElement(data, event);
    
    // Add canvas class
    if (this.canvas) {
      this.canvas.classList.add('canvas-drop-active');
    }

    document.addEventListener('dragover', this.handleDragOver, { passive: false });
    document.addEventListener('drop', this.handleDrop);
    document.addEventListener('dragend', this.handleDragEnd);
    document.addEventListener('dragleave', this.handleDragLeave);
  }

  private cacheBlockPositions(): void {
    this.blockRects = [];
    this.columnRects = [];
    
    // Cache top-level blocks (excluding those inside columns)
    const topLevelBlocks = document.querySelectorAll('.email-container > .block-wrapper[data-block-id]');
    
    topLevelBlocks.forEach((block, index) => {
      const rect = block.getBoundingClientRect();
      const id = block.getAttribute('data-block-id') || '';
      
      this.blockRects.push({
        id,
        index,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        element: block as HTMLElement,
      });
    });

    // Cache column drop zones
    const columnDropZones = document.querySelectorAll('.column-drop-zone[data-column-id]');
    columnDropZones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      const columnId = zone.getAttribute('data-column-id') || '';
      const parentBlockId = zone.getAttribute('data-parent-block-id') || '';
      
      // Get blocks inside this column
      const childBlocks = zone.querySelectorAll('.block-wrapper[data-block-id]');
      const childRects: BlockRect[] = [];
      
      childBlocks.forEach((child, idx) => {
        const childRect = child.getBoundingClientRect();
        childRects.push({
          id: child.getAttribute('data-block-id') || '',
          index: idx,
          top: childRect.top,
          bottom: childRect.bottom,
          height: childRect.height,
          element: child as HTMLElement,
          parentId: columnId,
        });
      });
      
      this.columnRects.push({
        id: columnId,
        parentBlockId,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        element: zone as HTMLElement,
        childRects,
      });
    });
  }

  private createGhostElement(data: DragData, event: DragEvent): void {
    this.ghostElement = document.createElement('div');
    this.ghostElement.className = 'drag-ghost';
    
    let label = 'Move block';
    if (data.type === 'new-block' && data.blockType) {
      const def = BLOCK_DEFINITIONS.find(b => b.type === data.blockType);
      label = def ? `+ ${def.label}` : `+ ${data.blockType}`;
    }
    
    // Add icon
    this.ghostElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;">
        <path d="M5 9l7 7 7-7"/>
      </svg>
      <span style="vertical-align: middle;">${label}</span>
    `;
    
    document.body.appendChild(this.ghostElement);
    this.updateGhostPosition(event.clientX, event.clientY);
  }

  private updateGhostPosition(x: number, y: number): void {
    if (this.ghostElement) {
      this.ghostElement.style.left = `${x}px`;
      this.ghostElement.style.top = `${y}px`;
    }
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const y = event.clientY;
    const x = event.clientX;
    this.lastY = y;
    this.lastX = x;

    // Throttle with RAF
    if (this.rafId) return;
    
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.updateGhostPosition(this.lastX, this.lastY);
      this.updateDropTarget(this.lastX, this.lastY);
    });
  }

  private updateDropTarget(x: number, y: number): void {
    // Clear all shifts first
    this.clearAllShifts();
    
    // First check if we're over a column drop zone
    const columnTarget = this.findColumnTarget(x, y);
    if (columnTarget) {
      this.currentTarget = columnTarget;
      this.highlightColumnDropZone(columnTarget);
      return;
    }

    // Clear column highlights
    document.querySelectorAll('.column-drop-zone').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    if (this.blockRects.length === 0) {
      // Empty canvas - show empty state indicator
      const emptyZone = document.querySelector('.empty-drop-zone');
      if (emptyZone) {
        emptyZone.classList.add('drag-over');
      }
      this.currentTarget = null;
      return;
    }

    // Remove empty zone highlight
    const emptyZone = document.querySelector('.empty-drop-zone');
    if (emptyZone) {
      emptyZone.classList.remove('drag-over');
    }

    // Find the target block and position
    let target: DropTarget | null = null;
    const draggedIndex = this.dragData?.sourceIndex ?? -1;

    for (let i = 0; i < this.blockRects.length; i++) {
      const rect = this.blockRects[i];
      const midY = rect.top + rect.height / 2;

      // Skip the block being dragged
      if (this.dragData?.blockId === rect.id) continue;

      if (y < rect.bottom) {
        const position = y < midY ? 'before' : 'after';
        target = {
          blockId: rect.id,
          index: rect.index,
          position,
          element: rect.element,
        };
        break;
      }
    }

    // If we're past all blocks, target the last one with 'after'
    if (!target && this.blockRects.length > 0) {
      const last = this.blockRects[this.blockRects.length - 1];
      if (this.dragData?.blockId !== last.id) {
        target = {
          blockId: last.id,
          index: last.index,
          position: 'after',
          element: last.element,
        };
      }
    }

    this.currentTarget = target;

    if (target) {
      // Show the drop indicator line
      this.showDropIndicator(target);
      
      // Animate blocks to shift
      this.animateBlockShift(target, draggedIndex);
    }
  }

  private findColumnTarget(x: number, y: number): DropTarget | null {
    for (const column of this.columnRects) {
      // Check if cursor is within column bounds
      if (x >= column.left && x <= column.right && y >= column.top && y <= column.bottom) {
        // Check if dropping on existing blocks in column
        for (let i = 0; i < column.childRects.length; i++) {
          const childRect = column.childRects[i];
          
          // Skip the block being dragged
          if (this.dragData?.blockId === childRect.id) continue;
          
          const midY = childRect.top + childRect.height / 2;
          if (y < childRect.bottom) {
            return {
              blockId: childRect.id,
              index: childRect.index,
              position: y < midY ? 'before' : 'after',
              element: childRect.element,
              parentId: column.id,
            };
          }
        }
        
        // If no child blocks or past all children, drop at end of column
        return {
          blockId: column.id,
          index: column.childRects.length,
          position: 'inside',
          element: column.element,
          parentId: column.id,
        };
      }
    }
    return null;
  }

  private highlightColumnDropZone(target: DropTarget): void {
    // Highlight the column
    if (target.parentId) {
      const columnEl = document.querySelector(`[data-column-id="${target.parentId}"]`);
      if (columnEl) {
        columnEl.classList.add('drag-over');
      }
    }
  }

  private showDropIndicator(target: DropTarget): void {
    // Remove existing indicators
    document.querySelectorAll('.drop-indicator-line').forEach(el => {
      el.classList.remove('visible');
    });

    // Find or create indicator for this block
    let indicator = target.element.querySelector(`.drop-indicator-line.${target.position === 'before' ? 'top' : 'bottom'}`) as HTMLElement;
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = `drop-indicator-line ${target.position === 'before' ? 'top' : 'bottom'}`;
      target.element.appendChild(indicator);
    }
    
    // Show with slight delay for smoother animation
    requestAnimationFrame(() => {
      indicator?.classList.add('visible');
    });
  }

  private animateBlockShift(target: DropTarget, draggedIndex: number): void {
    const targetIndex = target.index;
    const isMovingDown = draggedIndex >= 0 && draggedIndex < targetIndex;
    const isMovingUp = draggedIndex >= 0 && draggedIndex > targetIndex;

    this.blockRects.forEach((rect) => {
      // Skip the block being dragged
      if (this.dragData?.blockId === rect.id) return;

      const el = rect.element;
      
      if (target.position === 'before') {
        // Inserting before target - shift target and below down
        if (rect.index >= targetIndex) {
          if (isMovingDown && rect.index <= draggedIndex) {
            // When moving down, blocks between old and new position shift up
            el.classList.remove('shift-down');
            el.classList.add('shift-up');
          } else if (!isMovingDown) {
            el.classList.remove('shift-up');
            el.classList.add('shift-down');
          }
        }
      } else {
        // Inserting after target - shift below target down
        if (rect.index > targetIndex) {
          if (isMovingUp && rect.index >= draggedIndex) {
            // Don't shift blocks after the dragged one when moving up
          } else if (isMovingDown && rect.index <= draggedIndex) {
            el.classList.remove('shift-down');
            el.classList.add('shift-up');
          } else if (!isMovingDown && !isMovingUp) {
            el.classList.remove('shift-up');
            el.classList.add('shift-down');
          }
        }
      }
    });
  }

  private clearAllShifts(): void {
    document.querySelectorAll('.block-wrapper').forEach(el => {
      el.classList.remove('shift-up', 'shift-down');
    });
    document.querySelectorAll('.drop-indicator-line').forEach(el => {
      el.classList.remove('visible');
    });
  }

  private handleDragLeave(event: DragEvent): void {
    // Check if we're leaving the canvas entirely
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !this.canvas?.contains(relatedTarget)) {
      // Still keep the ghost, but clear visual indicators
      // this.clearAllShifts();
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.dragData) {
      this.cleanup();
      return;
    }

    const store = useEditorStore.getState();

    // Handle dropping into a column
    if (this.currentTarget?.parentId) {
      this.handleColumnDrop(store);
      this.cleanup();
      return;
    }

    if (this.blockRects.length === 0) {
      // Dropping on empty canvas
      if (this.dragData.type === 'new-block' && this.dragData.blockType) {
        const newBlock = createBlock(this.dragData.blockType);
        store.addBlock(newBlock, 0);
      }
      this.cleanup();
      return;
    }

    if (!this.currentTarget) {
      this.cleanup();
      return;
    }

    // Calculate target index
    let targetIndex = this.currentTarget.index;
    if (this.currentTarget.position === 'after') {
      targetIndex += 1;
    }

    // Adjust for dragging existing block
    if (this.dragData.type === 'existing-block' && this.dragData.blockId) {
      const sourceIndex = this.dragData.sourceIndex ?? -1;
      
      // Don't do anything if dropping in same position
      if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1 && this.currentTarget.position === 'after') {
        this.cleanup();
        return;
      }

      // If moving down, adjust index because source will be removed first
      if (sourceIndex >= 0 && sourceIndex < targetIndex) {
        targetIndex -= 1;
      }
      
      store.moveBlock(this.dragData.blockId, targetIndex);
    } else if (this.dragData.type === 'new-block' && this.dragData.blockType) {
      const newBlock = createBlock(this.dragData.blockType);
      store.addBlock(newBlock, targetIndex);
    }

    this.cleanup();
  }

  private handleColumnDrop(store: ReturnType<typeof useEditorStore.getState>): void {
    if (!this.currentTarget?.parentId || !this.dragData) return;

    const parentId = this.currentTarget.parentId;
    let targetIndex = this.currentTarget.index;
    
    if (this.currentTarget.position === 'after') {
      targetIndex += 1;
    }

    if (this.dragData.type === 'new-block' && this.dragData.blockType) {
      // Don't allow dropping columns inside columns
      if (this.dragData.blockType === 'columns') {
        return;
      }
      const newBlock = createBlock(this.dragData.blockType);
      store.addBlock(newBlock, targetIndex, parentId);
    } else if (this.dragData.type === 'existing-block' && this.dragData.blockId) {
      // Move existing block into column
      store.moveBlock(this.dragData.blockId, targetIndex, parentId);
    }
  }

  private handleDragEnd(): void {
    this.cleanup();
  }

  private cleanup(): void {
    // Cancel any pending RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Remove ghost
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
    
    // Remove dragging class
    document.querySelectorAll('.is-dragging').forEach(el => {
      el.classList.remove('is-dragging');
    });

    // Clear shifts with animation
    this.clearAllShifts();
    
    // Remove canvas highlight
    if (this.canvas) {
      this.canvas.classList.remove('canvas-drop-active');
    }

    // Remove empty zone highlight
    const emptyZone = document.querySelector('.empty-drop-zone');
    if (emptyZone) {
      emptyZone.classList.remove('drag-over');
    }

    // Remove column highlights
    document.querySelectorAll('.column-drop-zone').forEach(el => {
      el.classList.remove('drag-over');
    });

    // Remove all drop indicators
    document.querySelectorAll('.drop-indicator-line').forEach(el => el.remove());
    
    this.dragData = null;
    this.currentTarget = null;
    this.blockRects = [];
    this.columnRects = [];
    
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('drop', this.handleDrop);
    document.removeEventListener('dragend', this.handleDragEnd);
    document.removeEventListener('dragleave', this.handleDragLeave);
  }

  getDragData(): DragData | null {
    return this.dragData;
  }

  isDragging(): boolean {
    return this.dragData !== null;
  }
}

export const dragDropManager = new DragDropManager();
