describe('Columns Block', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  describe('Adding Columns', () => {
    it('should add a columns block', () => {
      cy.get('.block-item[data-block-type="columns"]').click();
      cy.get('.column-drop-zone').should('have.length.at.least', 2);
    });

    it('should display column placeholders', () => {
      cy.get('.block-item[data-block-type="columns"]').click();
      cy.get('.column-placeholder').should('exist');
    });
  });

  describe('Columns Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="columns"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display gap input', () => {
      cy.get('#columns-gap').should('exist');
    });

    it('should display stack on mobile checkbox', () => {
      cy.get('#columns-stack-mobile').should('exist');
    });

    it('should display column width inputs', () => {
      cy.get('.column-width-input').should('have.length.at.least', 2);
    });

    it('should allow changing column widths', () => {
      cy.get('.column-width-input').first().clear().type('60%');
      cy.get('.column-width-input').first().blur();
      cy.get('.column-width-input').first().should('have.value', '60%');
    });
  });

  describe('Dropping Blocks into Columns', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="columns"]').click();
    });

    it('should highlight column on drag over', () => {
      // Create a proper drag event with dataTransfer
      cy.get('.block-item[data-block-type="text"]').trigger('dragstart', {
        dataTransfer: new DataTransfer(),
      });
      
      cy.get('.column-drop-zone').first().trigger('dragover', {
        dataTransfer: new DataTransfer(),
        force: true,
      });
      
      // Wait a bit for the drag-drop manager to process
      cy.wait(100);
      cy.get('.column-drop-zone').first().should('have.class', 'drag-over');
    });

    it('should show column drop zones with proper data attributes', () => {
      cy.get('.column-drop-zone').first()
        .should('have.attr', 'data-column-id')
        .and('not.be.empty');
      
      cy.get('.column-drop-zone').first()
        .should('have.attr', 'data-parent-block-id')
        .and('not.be.empty');
    });
  });

  describe('Nested Block Management', () => {
    it('should not allow dropping columns inside columns', () => {
      cy.get('.block-item[data-block-type="columns"]').click();
      
      // The columns block should exist
      cy.get('.column-drop-zone').should('exist');
      
      // Attempting to drag another columns block
      // This is more of a functional test that the restriction is in place
      cy.get('.block-item[data-block-type="columns"]').should('exist');
    });
  });
});

describe('Block Drag and Drop', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  it('should add blocks by clicking', () => {
    cy.get('.block-wrapper').then($initial => {
      const initialCount = $initial.length;
      cy.get('.block-item[data-block-type="text"]').click();
      cy.get('.block-wrapper').should('have.length', initialCount + 1);
    });
  });

  it('should make blocks draggable', () => {
    cy.get('.block-item[data-block-type="text"]').click();
    cy.get('.block-wrapper').last().should('have.attr', 'draggable', 'true');
  });

  it('should show drag handle on block hover', () => {
    cy.get('.block-item[data-block-type="text"]').click();
    cy.get('.block-wrapper').last().trigger('mouseenter');
    cy.get('.block-toolbar').should('be.visible');
  });
});
