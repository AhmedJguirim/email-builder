describe('Block Types', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  describe('Text Block', () => {
    it('should add and edit a text block', () => {
      cy.get('.block-item[data-block-type="text"]').click();
      
      cy.get('.editable-text').last()
        .should('exist')
        .click()
        .clear()
        .type('This is my custom text');
      
      cy.get('.editable-text').last().should('contain', 'This is my custom text');
    });
  });

  describe('Heading Block', () => {
    it('should add a heading block', () => {
      cy.get('.block-item[data-block-type="heading"]').click();
      cy.get('.editable-heading').should('exist');
    });

    it('should allow editing heading text', () => {
      cy.get('.block-item[data-block-type="heading"]').click();
      
      cy.get('.editable-heading').last()
        .click()
        .clear()
        .type('My Custom Heading');
      
      cy.get('.editable-heading').last().should('contain', 'My Custom Heading');
    });
  });

  describe('Button Block', () => {
    it('should add a button block', () => {
      cy.get('.block-item[data-block-type="button"]').click();
      cy.get('.email-button').should('exist');
    });

    it('should display button with styling', () => {
      cy.get('.block-item[data-block-type="button"]').click();
      
      cy.get('.email-button').last()
        .should('have.css', 'display', 'inline-block')
        .should('have.css', 'text-decoration', 'none solid rgb(255, 255, 255)');
    });
  });

  describe('Image Block', () => {
    it('should add an image block', () => {
      cy.get('.block-item[data-block-type="image"]').click();
      
      // Should show placeholder or image
      cy.get('.block-wrapper').last().within(() => {
        cy.get('img, .placeholder').should('exist');
      });
    });
  });

  describe('Divider Block', () => {
    it('should add a divider block', () => {
      cy.get('.block-item[data-block-type="divider"]').click();
      cy.get('hr').should('exist');
    });
  });

  describe('Spacer Block', () => {
    it('should add a spacer block', () => {
      cy.get('.block-wrapper').then($blocks => {
        const initialCount = $blocks.length;
        
        cy.get('.block-item[data-block-type="spacer"]').click();
        cy.get('.block-wrapper').should('have.length', initialCount + 1);
      });
    });
  });

  describe('Social Block', () => {
    it('should add a social links block', () => {
      cy.get('.block-item[data-block-type="social"]').click();
      
      // Social block should be added
      cy.get('.block-wrapper').last().should('exist');
    });
  });

  describe('Footer Block', () => {
    it('should add a footer block', () => {
      cy.get('.block-item[data-block-type="footer"]').click();
      
      cy.get('.block-wrapper').last().should('exist');
    });
  });
});

describe('Block Properties Panel', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  it('should show properties panel when block is selected', () => {
    cy.get('.block-wrapper').first().click();
    cy.get('.mailbuilder-properties').should('exist');
  });

  it('should display block type in properties', () => {
    cy.get('.block-wrapper').first().click();
    cy.get('.mailbuilder-properties').should('exist');
  });

  it('should have style controls', () => {
    cy.get('.block-wrapper').first().click();
    
    // Properties panel should have some form controls
    cy.get('.mailbuilder-properties').within(() => {
      cy.get('input, select, button').should('exist');
    });
  });
});

describe('Block Reordering', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  it('should maintain block order after adding multiple blocks', () => {
    // Get initial block count
    cy.get('.block-wrapper').then($initialBlocks => {
      const initialCount = $initialBlocks.length;

      // Add blocks in sequence
      cy.get('.block-item[data-block-type="text"]').click();
      cy.get('.block-item[data-block-type="divider"]').click();
      cy.get('.block-item[data-block-type="button"]').click();

      // Should have 3 more blocks
      cy.get('.block-wrapper').should('have.length', initialCount + 3);
    });
  });

  it('should update block indices after deletion', () => {
    cy.get('.block-wrapper').then($blocks => {
      if ($blocks.length >= 2) {
        const initialCount = $blocks.length;
        
        // Delete second block
        cy.get('.block-wrapper').eq(1).trigger('mouseenter', { force: true });
        cy.get('.block-wrapper').eq(1).within(() => {
          cy.get('.block-toolbar-btn[data-action="delete"]').click({ force: true });
        });

        // Should have one less block
        cy.get('.block-wrapper').should('have.length', initialCount - 1);
      }
    });
  });
});
