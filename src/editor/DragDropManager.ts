import type { Block, BlockType } from '../types/blocks';
import { createBlock } from '../blocks/factory';
import { useEditorStore } from '../store';

export interface DragData {
  type: 'new-block' | 'existing-block';
  blockType?: BlockType;
  blockId?: string;
}

export interface DropZone {
  id: string;
  parentId?: string;
  index: number;
  rect: DOMRect;
}

export class DragDropManager {
  private dragData: DragData | null = null;
  private dropZones: DropZone[] = [];
  private currentDropZone: DropZone | null = null;
  private ghostElement: HTMLElement | null = null;

  constructor() {
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }

  startDrag(data: DragData, event: DragEvent): void {
    this.dragData = data;
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(data));
    }

    if (data.blockId) {
      useEditorStore.getState().setDrag(data.blockId);
    }

    this.createGhostElement(event);
    
    document.addEventListener('dragover', this.handleDragOver);
    document.addEventListener('drop', this.handleDrop);
    document.addEventListener('dragend', this.handleDragEnd);
  }

  private createGhostElement(event: DragEvent): void {
    this.ghostElement = document.createElement('div');
    this.ghostElement.className = 'drag-ghost';
    this.ghostElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      opacity: 0.9;
    `;
    
    if (this.dragData?.type === 'new-block') {
      this.ghostElement.textContent = `Add ${this.dragData.blockType}`;
    } else {
      this.ghostElement.textContent = 'Move block';
    }
    
    document.body.appendChild(this.ghostElement);
    this.updateGhostPosition(event);
  }

  private updateGhostPosition(event: DragEvent | MouseEvent): void {
    if (this.ghostElement) {
      this.ghostElement.style.left = `${event.clientX + 10}px`;
      this.ghostElement.style.top = `${event.clientY + 10}px`;
    }
  }

  registerDropZone(zone: DropZone): void {
    this.dropZones.push(zone);
  }

  unregisterDropZone(id: string): void {
    this.dropZones = this.dropZones.filter(zone => zone.id !== id);
  }

  clearDropZones(): void {
    this.dropZones = [];
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.updateGhostPosition(event);
    
    const dropZone = this.findDropZone(event.clientX, event.clientY);
    
    if (dropZone !== this.currentDropZone) {
      this.currentDropZone = dropZone;
      
      if (dropZone) {
        useEditorStore.getState().setDrag(
          this.dragData?.blockId || null,
          dropZone.id,
          this.getDropPosition(event, dropZone)
        );
      } else {
        useEditorStore.getState().setDrag(this.dragData?.blockId || null, null, null);
      }
    }
  }

  private findDropZone(x: number, y: number): DropZone | null {
    for (const zone of this.dropZones) {
      if (
        x >= zone.rect.left &&
        x <= zone.rect.right &&
        y >= zone.rect.top &&
        y <= zone.rect.bottom
      ) {
        return zone;
      }
    }
    return null;
  }

  private getDropPosition(event: DragEvent, zone: DropZone): 'before' | 'after' | 'inside' {
    const rect = zone.rect;
    const midY = rect.top + rect.height / 2;
    
    if (event.clientY < midY) {
      return 'before';
    }
    return 'after';
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    
    if (!this.dragData || !this.currentDropZone) {
      this.cleanup();
      return;
    }

    const store = useEditorStore.getState();
    const position = this.getDropPosition(event, this.currentDropZone);
    let targetIndex = this.currentDropZone.index;
    
    if (position === 'after') {
      targetIndex += 1;
    }

    if (this.dragData.type === 'new-block' && this.dragData.blockType) {
      const newBlock = createBlock(this.dragData.blockType);
      store.addBlock(newBlock, targetIndex, this.currentDropZone.parentId);
    } else if (this.dragData.type === 'existing-block' && this.dragData.blockId) {
      if (this.dragData.blockId !== this.currentDropZone.id) {
        store.moveBlock(this.dragData.blockId, targetIndex, this.currentDropZone.parentId);
      }
    }

    this.cleanup();
  }

  private handleDragEnd(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
    
    this.dragData = null;
    this.currentDropZone = null;
    
    useEditorStore.getState().setDrag(null, null, null);
    
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('drop', this.handleDrop);
    document.removeEventListener('dragend', this.handleDragEnd);
  }

  getDragData(): DragData | null {
    return this.dragData;
  }

  isDragging(): boolean {
    return this.dragData !== null;
  }
}

export const dragDropManager = new DragDropManager();
