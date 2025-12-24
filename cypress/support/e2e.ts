// Cypress E2E support file
import 'cypress-mochawesome-reporter/register';

// Custom commands
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('getBlockById', (blockId: string) => {
  return cy.get(`[data-block-id="${blockId}"]`);
});

Cypress.Commands.add('getBlockByIndex', (index: number) => {
  return cy.get(`[data-index="${index}"]`);
});

Cypress.Commands.add('dragBlock', (sourceSelector: string, targetSelector: string) => {
  const dataTransfer = new DataTransfer();
  
  cy.get(sourceSelector).trigger('dragstart', { dataTransfer });
  cy.get(targetSelector).trigger('dragover', { dataTransfer });
  cy.get(targetSelector).trigger('drop', { dataTransfer });
  cy.get(sourceSelector).trigger('dragend', { dataTransfer });
});

// Disable uncaught exception failures for this app
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  return false;
});

declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      getBlockById(blockId: string): Chainable<JQuery<HTMLElement>>;
      getBlockByIndex(index: number): Chainable<JQuery<HTMLElement>>;
      dragBlock(sourceSelector: string, targetSelector: string): Chainable<void>;
    }
  }
}

export {};
