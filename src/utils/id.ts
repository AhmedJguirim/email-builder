import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateBlockId(type: string): string {
  return `${type}_${uuidv4().slice(0, 8)}`;
}

export function generateShortId(): string {
  return uuidv4().slice(0, 8);
}
